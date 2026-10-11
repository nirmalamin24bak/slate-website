// Builds the /calories/ pages from data/foods.json and data/ingredients.json.
//
//   node scripts/build.mjs
//
// Every number on a food page is worked out here from a recipe in grams and
// per-100 g ingredient values, so fixing one value in data/ updates every page.
// Writes: calories/index.html, calories/<slug>/index.html, the computed fields
// in data/foods.json, research/food-sources.md and the <url> entries in sitemap.xml.
// No dependencies: Node 18 or later.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://writeonslate.com";
const CSS_VERSION = 3;
const RANGE_LIMIT = 0.15; // sources further apart than this must show a range

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const write = (p, s) => {
  mkdirSync(dirname(join(ROOT, p)), { recursive: true });
  writeFileSync(join(ROOT, p), s.replace(/\r\n/g, "\n"), "utf8");
};

const ingredients = read("data/ingredients.json");
const foodsFile = read("data/foods.json");
const foods = foodsFile.foods;
const site = read("data/site.json");

// ---------- Arithmetic ----------

const NUTRIENTS = ["kcal", "protein", "carbs", "fat"];
const zero = () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
const add = (a, b, k = 1) => { for (const n of NUTRIENTS) a[n] += b[n] * k; return a; };

function ingredient(id, where) {
  const ing = ingredients[id];
  if (!ing) throw new Error(`${where}: unknown ingredient "${id}"`);
  return ing;
}

// Nutrients in g grams of one ingredient.
function of(id, g, where) {
  const per = ingredient(id, where).per100g;
  return add(zero(), per, g / 100);
}

// Whole-recipe totals, plus the fat-source share used for outside versions.
function recipeTotals(food) {
  const total = zero();
  const fatPart = zero();
  for (const item of food.recipe.ingredients) {
    const v = of(item.id, item.g, food.slug);
    add(total, v);
    if (ingredient(item.id, food.slug).addedFat) add(fatPart, v);
  }
  return { total, fatPart };
}

// Share of the whole recipe in one portion, and its cooked grams when known.
// Dishes without a published cooked weight (cookedYieldG null) use fractions only.
function portionShare(food, p) {
  const y = food.recipe.cookedYieldG;
  if (p.fraction != null) return { share: p.fraction, grams: y ? p.fraction * y : null };
  if (!y) throw new Error(`${food.slug}/${p.id}: no cooked weight, so portions must use fraction`);
  if (p.grams != null) return { share: p.grams / y, grams: p.grams };
  if (p.ml != null) return { share: (p.ml * food.recipe.densityGPerMl) / y, grams: p.ml * food.recipe.densityGPerMl };
  throw new Error(`${food.slug}/${p.id}: portion needs grams, ml or fraction`);
}

function computePortion(food, totals, p) {
  const { share, grams } = portionShare(food, p);
  const v = add(zero(), totals.total, share);
  for (const extra of p.add || []) add(v, of(extra.id, extra.g, `${food.slug}/${p.id}`));
  return { grams, share, raw: v };
}

const r5 = (x) => Math.round(x / 5) * 5;
const rg = (x) => Math.round(x);
const rounded = (v) => ({ kcal: r5(v.kcal), protein: rg(v.protein), carbs: rg(v.carbs), fat: rg(v.fat) });

function computeFood(food) {
  const totals = recipeTotals(food);
  const portions = {};
  for (const p of food.portions) {
    const c = computePortion(food, totals, p);
    // hideGrams: the portion adds a lot of another food (pakoras, a katori of rice), so the dish's own weight would mislead.
    p.cookedGrams = c.grams == null || p.hideGrams ? null : Math.round(c.grams);
    Object.assign(p, rounded(c.raw));
    portions[p.id] = { ...c, p };
  }
  let outside = null;
  if (food.outside) {
    const o = food.outside;
    const base = portions[o.portionId];
    if (!base) throw new Error(`${food.slug}: outside.portionId "${o.portionId}" not found`);
    const variant = (i) => {
      const v = add(zero(), base.raw);
      add(v, totals.fatPart, base.share * (o.fatFactor[i] - 1));
      for (const n of NUTRIENTS) v[n] *= o.sizeFactor[i];
      for (const extra of o.extra || []) add(v, of(extra.id, extra.g[i], `${food.slug}/outside`));
      return v;
    };
    const lo = variant(0), hi = variant(1);
    outside = { lo, hi };
    o.kcalRange = [r5(lo.kcal), r5(hi.kcal)];
    o.fatRange = [rg(lo.fat), rg(hi.fat)];
  }
  const per100 = food.recipe.cookedYieldG ? add(zero(), totals.total, 100 / food.recipe.cookedYieldG) : null;
  food.per100gCooked = per100 ? rounded(per100) : null;
  // Cross-check: any credible source further than RANGE_LIMIT from our value needs a stated range.
  // A check is either per 100 g cooked (kcalPer100g) or per portion (kcal + portionId).
  for (const cc of food.crossCheck || []) {
    const ours = cc.portionId ? portions[cc.portionId]?.raw.kcal : per100?.kcal;
    const theirs = cc.portionId ? cc.kcal : cc.kcalPer100g;
    if (ours == null || theirs == null) throw new Error(`${food.slug}: cross-check "${cc.source}" has nothing to compare`);
    cc.ours = Math.round(ours);
    cc.differencePct = Math.round(((theirs - ours) / ours) * 100);
    if (Math.abs(theirs - ours) / ours > RANGE_LIMIT && !food.range) {
      throw new Error(`${food.slug}: ${cc.source} differs by ${cc.differencePct}% and no range is stated`);
    }
  }
  return { totals, portions, outside, per100 };
}

// ---------- Text helpers ----------

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (n) => n.toLocaleString("en-IN");

// Replaces tokens with computed values, so prose never carries a number the data doesn't:
//   {{kcal:id}} {{protein:id}} {{carbs:id}} {{fat:id}} {{g:id}}  a portion of this dish
//   {{kcal@slug:id}} {{per100@slug}}                           another dish
//   {{per100}} {{outLo}} {{outHi}} {{yield}}                    this dish
//   {{ing:id}}                                                  kcal per 100 g of an ingredient
//   {{sum:2*roti:medium+dal-tadka:k200}}                        total kcal of several portions, rounded to 5
function sumToken(food, expr) {
  let total = 0;
  for (const term of expr.split("+")) {
    const [, n, slug, id] = term.trim().match(/^(?:(\d+(?:\.\d+)?)\*)?([\w-]+):([\w-]+)$/) || [];
    const p = foods.find((f) => f.slug === slug)?.portions.find((x) => x.id === id);
    if (!p || p.kcal == null) throw new Error(`${food.slug}: sum term "${term}" not found`);
    total += (n ? Number(n) : 1) * p.kcal;
  }
  return fmt(r5(total));
}

function fill(food, text) {
  text = text.replace(/\{\{sum:([^}]+)\}\}/g, (m, expr) => sumToken(food, expr));
  return text.replace(/\{\{(\w+)(?:@([\w-]+))?(?::([\w-]+))?\}\}/g, (m, key, slug, id) => {
    if (key === "ing") return fmt(Math.round(ingredient(id, food.slug).per100g.kcal));
    const f = slug ? foods.find((x) => x.slug === slug) : food;
    if (!f || !f.portions) throw new Error(`${food.slug}: token ${m} names unknown dish "${slug}"`);
    if (f.portions[0].kcal == null) throw new Error(`${food.slug}: token ${m} used before "${slug}" was computed`);
    if (key === "outLo") return fmt(f.outside.kcalRange[0]);
    if (key === "outHi") return fmt(f.outside.kcalRange[1]);
    if (key === "per100") {
      if (!f.per100gCooked) throw new Error(`${food.slug}: token ${m} but "${f.slug}" has no cooked weight`);
      return fmt(f.per100gCooked.kcal);
    }
    if (key === "yield") return fmt(f.recipe.cookedYieldG);
    const p = f.portions.find((x) => x.id === id);
    if (!p) throw new Error(`${food.slug}: token ${m} has no portion "${id}"`);
    if (key === "g") return fmt(p.cookedGrams);
    if (NUTRIENTS.includes(key)) return fmt(p[key]);
    throw new Error(`${food.slug}: unknown token ${m}`);
  });
}

// Prose fields may hold simple inline markup: [text](/path/) links only.
function inline(food, text) {
  return esc(fill(food, text)).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, href) => `<a href="${href}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
const plain = (food, text) => fill(food, text).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");

// ---------- Page parts ----------

function head({ title, description, path, jsonld, scripts = [], ogType = "website" }) {
  const url = SITE + path;
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Slate">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Slate. A calorie journal that gets out of the way.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/assets/og.png">
<meta name="theme-color" content="#F7F7F5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0F11" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/favicon.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/inter-tight-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-tight-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v=${CSS_VERSION}">
${scripts.map((s) => `<script src="${s}" defer></script>\n`).join("")}<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
  <div class="wrap">
    <a class="wordmark" href="/">Slate</a>
    <nav class="site-nav" aria-label="Main">
      <ul>
        <li class="nav-kitchen"><a href="/#kitchen">Your kitchen</a></li>
        <li><a href="/#pricing">Pricing</a></li>
        <li><a href="/#promise">Our promise</a></li>
      </ul>
    </nav>
  </div>
</header>
`;
}

function footer() {
  const links = site.footerLinks.filter((l) => l.href.startsWith("mailto:") || pageExists(l.href));
  return `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <address class="footer-org">
        <a class="wordmark" href="/">Slate</a><br>
        <span class="org-name">Sonal Systems Private Limited</span><br>
        A-3, Mehsana Nagar, Nizampura, Vadodara 390002, Gujarat, India<br>
        CIN U62099GJ2026PTC179785
      </address>
      <nav class="footer-links" aria-label="Footer">
        <ul>
${links.map((l) => `          <li><a href="${l.href}">${esc(l.label)}</a></li>`).join("\n")}
        </ul>
      </nav>
    </div>
    <p class="footer-legal">© 2026 Sonal Systems Private Limited. Apple, the Apple logo, iPhone and Apple Watch are trademarks of Apple Inc. Swiggy and Zomato are trademarks of their owners. Slate is not affiliated with them.</p>
  </div>
</footer>
</body>
</html>
`;
}

function crumbs(trail) {
  const items = trail.map((c, i) =>
    i === trail.length - 1 ? `<li aria-current="page">${esc(c.name)}</li>` : `<li><a href="${c.path}">${esc(c.name)}</a></li>`);
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.join("")}</ol></nav>`;
}

function breadcrumbLd(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.name,
      ...(i < trail.length - 1 ? { item: SITE + c.path } : {}),
    })),
  };
}

function cta() {
  return `
    <div class="page-cta">
      <p class="cta-line">${esc(site.cta.line)}</p>
      <div class="actions">${site.cta.appStoreUrl
        ? `<a class="btn" href="${esc(site.cta.appStoreUrl)}">Download on the App Store</a>`
        : `<span class="btn btn-soon">Coming soon to iPhone</span>`}</div>
    </div>`;
}

// Content pages (/for/, /compare/, /blog/) come from data/pages.json when it exists.
const contentSections = existsSync(join(ROOT, "data/pages.json")) ? read("data/pages.json").sections : [];

// Generated and hand-written pages that exist, so links to pages not built yet are left out.
const builtPaths = new Set(["/", "/privacy/", "/terms/", "/support/", "/calories/", ...foods.map((f) => `/calories/${f.slug}/`),
  ...contentSections.flatMap((s) => [s.path, ...s.pages.map((p) => `${s.path}${p.slug}/`)])]);
function pageExists(href) {
  if (builtPaths.has(href)) return true;
  return existsSync(join(ROOT, href, "index.html"));
}

// ---------- Food page ----------

function nutriTable(food, rows, caption) {
  const body = rows.map((p) => `<tr><td>${esc(p.label)}${p.cookedGrams == null ? "" : `<br><span class="mute small">about ${fmt(p.cookedGrams)} g</span>`}</td>` +
    `<td class="n">${fmt(p.kcal)}</td><td class="n">${p.protein} g</td><td class="n">${p.carbs} g</td><td class="n">${p.fat} g</td></tr>`).join("\n");
  return `<div class="table-wrap"><table class="nutri">
<caption>${esc(caption)}</caption>
<thead><tr><th scope="col">Portion</th><th scope="col" class="n">Cals</th><th scope="col" class="n">Protein</th><th scope="col" class="n">Carbs</th><th scope="col" class="n">Fat</th></tr></thead>
<tbody>
${body}
</tbody></table></div>`;
}

function methodSection(food, calc) {
  const rows = food.recipe.ingredients.map((item) => {
    const ing = ingredient(item.id, food.slug);
    return `<tr><td>${esc(ing.name)}${item.note ? `<br><span class="mute small">${esc(item.note)}</span>` : ""}</td><td class="n">${fmt(item.g)} g</td><td>${esc(ing.sourceShort)}</td></tr>`;
  }).join("\n");
  const range = food.range ? `<p>${inline(food, food.range.text)}</p>` : "";
  const sources = food.sources.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a>${s.note ? `. ${esc(s.note)}` : ""}</li>`).join("\n");
  return `
    <section aria-labelledby="method">
      <h2 id="method">How these numbers were worked out</h2>
      ${food.method.map((p) => `<p>${inline(food, p)}</p>`).join("\n      ")}
      <div class="table-wrap"><table class="nutri">
<caption>${esc(food.recipe.label)}.${food.recipe.cookedYieldG ? ` Cooked weight about ${fmt(food.recipe.cookedYieldG)} g.` : ""}</caption>
<thead><tr><th scope="col">Ingredient</th><th scope="col" class="n">Raw</th><th scope="col">Values from</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
      <p>${food.per100gCooked ? `That works out to about ${fmt(food.per100gCooked.kcal)} calories per 100 g of cooked ${esc(food.nameLower)}. ` : ""}Calories are rounded to the nearest 5 and grams to the nearest whole number.</p>
      ${range}
      <h3>Sources</h3>
      <ol class="sources">
${sources}
      </ol>
    </section>`;
}

function foodPage(food, calc) {
  const path = `/calories/${food.slug}/`;
  const trail = [{ name: "Home", path: "/" }, { name: "Calories", path: "/calories/" }, { name: food.name, path }];
  const faqLd = {
    "@type": "FAQPage", "@id": `${SITE}${path}#faq`,
    mainEntity: food.faq.map((f) => ({ "@type": "Question", name: plain(food, f.q), acceptedAnswer: { "@type": "Answer", text: plain(food, f.a) } })),
  };
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${SITE}${path}#webpage`, url: SITE + path, name: food.title,
        description: food.description, isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#organization` },
        inLanguage: "en-IN", dateModified: food.updated },
      breadcrumbLd(trail),
      faqLd,
    ],
  };
  const o = food.outside;
  const related = food.related.map((slug) => foods.find((f) => f.slug === slug)).filter(Boolean)
    .map((f) => `<li><a href="/calories/${f.slug}/">${esc(f.name)} calories</a></li>`);
  if (food.useCase && pageExists(food.useCase.href)) related.push(`<li><a href="${food.useCase.href}">${esc(food.useCase.label)}</a></li>`);

  const body = `
<main id="main" class="legal">
  <div class="wrap-reading">
    ${crumbs(trail)}
    <h1>${esc(food.name)} calories</h1>
    <p class="answer-first">${inline(food, food.answer)}</p>
    ${food.intro.map((p) => `<p class="para">${inline(food, p)}</p>`).join("\n    ")}
    <div class="card note"><p>${esc(site.foodNote)}</p></div>

    <section aria-labelledby="portions">
      <h2 id="portions">Calories in common portions</h2>
      ${nutriTable(food, food.portions, food.portionsCaption)}
    </section>

    <section aria-labelledby="outside">
      <h2 id="outside">Home or outside</h2>
      ${o.text.map((p) => `<p>${inline(food, p)}</p>`).join("\n      ")}
      <div class="table-wrap"><table class="nutri">
<caption>${esc(o.caption)}</caption>
<thead><tr><th scope="col">Version</th><th scope="col" class="n">Cals</th><th scope="col" class="n">Fat</th></tr></thead>
<tbody>
<tr><td>Home</td><td class="n">${fmt(food.portions.find((p) => p.id === o.portionId).kcal)}</td><td class="n">${food.portions.find((p) => p.id === o.portionId).fat} g</td></tr>
<tr><td>${esc(o.label)}</td><td class="n">${fmt(o.kcalRange[0])} to ${fmt(o.kcalRange[1])}</td><td class="n">${o.fatRange[0]} to ${o.fatRange[1]} g</td></tr>
</tbody></table></div>
    </section>

    <section aria-labelledby="changes">
      <h2 id="changes">What changes the number</h2>
      <ul>
${food.changes.map((c) => `        <li>${inline(food, c)}</li>`).join("\n")}
      </ul>
    </section>
${methodSection(food, calc)}

    <section aria-labelledby="faq-title">
      <h2 id="faq-title">Questions people ask</h2>
      <div class="faq">
${food.faq.map((f) => `      <details><summary>${inline(food, f.q)}</summary><p class="answer">${inline(food, f.a)}</p></details>`).join("\n")}
      </div>
    </section>

    <section aria-labelledby="related">
      <h2 id="related">Related</h2>
      <ul class="link-list">
        ${related.join("\n        ")}
      </ul>
    </section>
${cta()}
  </div>
</main>
`;
  return head({ title: food.title, description: food.description, path, jsonld }) + body + footer();
}

// ---------- Hub ----------

function hubPage() {
  const path = "/calories/";
  const trail = [{ name: "Home", path: "/" }, { name: "Calories", path }];
  const groups = site.categories.map((cat) => {
    const items = foods.filter((f) => f.category === cat.id).sort((a, b) => a.name.localeCompare(b.name));
    if (!items.length) return "";
    const lis = items.map((f) => {
      const p = f.portions.find((x) => x.id === f.headlinePortion);
      const search = [f.name, ...f.aliases].join(" ").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
      return `<li data-search="${esc(search)}"><a href="/calories/${f.slug}/"><span class="hub-name">${esc(f.name)}</span><span class="hub-kcal">${fmt(p.kcal)} cals, ${esc(p.short)}</span></a></li>`;
    }).join("\n");
    return `
    <section aria-labelledby="cat-${cat.id}" data-hub-group>
      <h2 id="cat-${cat.id}">${esc(cat.name)}</h2>
      <ul class="hub-list">
${lis}
      </ul>
    </section>`;
  }).join("");
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${SITE}${path}#webpage`, url: SITE + path, name: site.hub.title,
        description: site.hub.description, isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#organization` },
        inLanguage: "en-IN",
        mainEntity: { "@type": "ItemList", itemListElement: foods.map((f, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/calories/${f.slug}/`, name: `${f.name} calories` })) } },
      breadcrumbLd(trail),
    ],
  };
  const body = `
<main id="main" class="legal">
  <div class="wrap-reading">
    ${crumbs(trail)}
    <h1>${esc(site.hub.h1)}</h1>
    ${site.hub.intro.map((p) => `<p class="lede legal-lede">${esc(p)}</p>`).join("\n    ")}
    <div class="card note"><p>${esc(site.foodNote)}</p></div>
    <div class="hub-search" hidden>
      <label class="sr-only" for="hub-filter">Find a dish</label>
      <input id="hub-filter" type="search" placeholder="Find a dish: roti, dal, chai" autocomplete="off" spellcheck="false">
    </div>
    <p class="hub-empty mute" id="hub-empty" hidden>Nothing here by that name yet.</p>
${groups}
${cta()}
  </div>
</main>
`;
  return head({ title: site.hub.title, description: site.hub.description, path, jsonld, scripts: ["/assets/hub.js?v=1"] }) + body + footer();
}

// ---------- Content pages: /for/, /compare/, /blog/ ----------
//
// Each page in data/pages.json has a lede (the answer first), sections of content blocks,
// an optional FAQ and related links. A content block is a paragraph string or one of
// { ul }, { ol }, { h3 }, { table: { caption, head, rows } } or { note }.
// Prose may hold [text](/path/) links and {{kcal@slug:id}}-style tokens from the food pages.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const pageCtx = (path) => ({ slug: path });
const prose = (path, text) => inline(pageCtx(path), text);
const plainText = (path, text) => plain(pageCtx(path), text);

function blocks(path, content) {
  return content.map((b) => {
    if (typeof b === "string") return `<p>${prose(path, b)}</p>`;
    if (b.ul) return `<ul>\n${b.ul.map((li) => `        <li>${prose(path, li)}</li>`).join("\n")}\n      </ul>`;
    if (b.ol) return `<ol>\n${b.ol.map((li) => `        <li>${prose(path, li)}</li>`).join("\n")}\n      </ol>`;
    if (b.h3) return `<h3>${prose(path, b.h3)}</h3>`;
    if (b.note) return `<div class="card note"><p>${prose(path, b.note)}</p></div>`;
    if (b.table) {
      const t = b.table;
      const head = t.head.map((h) => `<th scope="col">${esc(h)}</th>`).join("");
      const rows = t.rows.map((r) => `<tr>${r.map((c) => `<td>${prose(path, c)}</td>`).join("")}</tr>`).join("\n");
      return `<div class="table-wrap"><table class="nutri">\n<caption>${prose(path, t.caption)}</caption>\n<thead><tr>${head}</tr></thead>\n<tbody>\n${rows}\n</tbody></table></div>`;
    }
    throw new Error(`${path}: unknown content block ${JSON.stringify(b).slice(0, 80)}`);
  }).join("\n      ");
}

function faqParts(path, faq) {
  if (!faq?.length) return { html: "", ld: null };
  const html = `
    <section aria-labelledby="faq-title">
      <h2 id="faq-title">Questions people ask</h2>
      <div class="faq">
${faq.map((f) => `      <details><summary>${prose(path, f.q)}</summary><p class="answer">${prose(path, f.a)}</p></details>`).join("\n")}
      </div>
    </section>`;
  const ld = { "@type": "FAQPage", "@id": `${SITE}${path}#faq`,
    mainEntity: faq.map((f) => ({ "@type": "Question", name: plainText(path, f.q), acceptedAnswer: { "@type": "Answer", text: plainText(path, f.a) } })) };
  return { html, ld };
}

function contentPage(section, page) {
  const path = `${section.path}${page.slug}/`;
  const trail = [{ name: "Home", path: "/" }, { name: section.crumb, path: section.path }, { name: page.crumb || page.h1, path }];
  const isBlog = section.id === "blog";
  const faq = faqParts(path, page.faq);
  const webpage = { "@type": "WebPage", "@id": `${SITE}${path}#webpage`, url: SITE + path, name: page.title,
    description: page.description, isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#organization` },
    inLanguage: "en-IN", dateModified: page.updated };
  const graph = [webpage, breadcrumbLd(trail)];
  if (isBlog) {
    graph.push({ "@type": "BlogPosting", "@id": `${SITE}${path}#article`, headline: page.h1, description: page.description,
      mainEntityOfPage: { "@id": `${SITE}${path}#webpage` }, image: `${SITE}/assets/og.png`, inLanguage: "en-IN",
      datePublished: page.published, dateModified: page.updated,
      author: { "@type": "Person", name: site.author.name, jobTitle: site.author.jobTitle, worksFor: { "@id": `${SITE}/#organization` } },
      publisher: { "@id": `${SITE}/#organization` } });
  }
  if (faq.ld) graph.push(faq.ld);

  const meta = isBlog
    ? `<p class="meta-line mute">By ${esc(site.author.name)}, ${esc(site.author.org)}. Published ${longDate(page.published)}${page.updated !== page.published ? `, updated ${longDate(page.updated)}` : ""}.</p>`
    : page.checkedOn ? `<p class="meta-line mute">Checked on ${longDate(page.checkedOn)}.</p>` : "";
  const takeaways = page.takeaways?.length
    ? `<div class="card note"><p><strong>Key takeaways</strong></p><ul>\n${page.takeaways.map((t) => `        <li>${prose(path, t)}</li>`).join("\n")}\n      </ul></div>` : "";
  const sections = page.body.map((s, i) => {
    const id = s.id || `s${i + 1}`;
    return `
    <section aria-labelledby="${id}">
      <h2 id="${id}">${prose(path, s.h2)}</h2>
      ${blocks(path, s.content)}
    </section>`;
  }).join("");

  // Related links: the page's own, then its siblings, so every child links to the others.
  const seen = new Set([path]);
  const links = [...(page.related || []), ...section.pages.filter((p) => p.slug !== page.slug).map((p) => ({ href: `${section.path}${p.slug}/`, label: p.linkLabel || p.h1 }))]
    .filter((l) => !seen.has(l.href) && pageExists(l.href) && seen.add(l.href));
  const related = links.length ? `
    <section aria-labelledby="related">
      <h2 id="related">Related</h2>
      <ul class="link-list">
        ${links.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join("\n        ")}
      </ul>
    </section>` : "";
  const footnote = page.footnote ? `\n    <p class="note mute">${prose(path, page.footnote)}</p>` : "";

  const body = `
<main id="main" class="legal">
  <div class="wrap-reading">
    ${crumbs(trail)}
    <h1>${esc(page.h1)}</h1>
    ${meta}
    <p class="answer-first">${prose(path, page.lede)}</p>
    ${takeaways}
${sections}
${faq.html}
${related}${footnote}
${cta()}
  </div>
</main>
`;
  return head({ title: page.title, description: page.description, path, jsonld: { "@context": "https://schema.org", "@graph": graph }, ogType: isBlog ? "article" : "website" }) + body + footer();
}

function contentHub(section) {
  const path = section.path;
  const trail = [{ name: "Home", path: "/" }, { name: section.crumb, path }];
  const h = section.hub;
  const pages = section.id === "blog" ? [...section.pages].sort((a, b) => b.published.localeCompare(a.published)) : section.pages;
  const items = pages.map((p) => `<li><a href="${path}${p.slug}/"><span class="hub-name">${esc(p.linkLabel || p.h1)}</span></a></li>`).join("\n");
  const jsonld = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": `${SITE}${path}#webpage`, url: SITE + path, name: h.title, description: h.description,
      isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#organization` }, inLanguage: "en-IN",
      mainEntity: { "@type": "ItemList", itemListElement: pages.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}${path}${p.slug}/`, name: p.linkLabel || p.h1 })) } },
    breadcrumbLd(trail),
  ] };
  const body = `
<main id="main" class="legal">
  <div class="wrap-reading">
    ${crumbs(trail)}
    <h1>${esc(h.h1)}</h1>
    ${h.intro.map((p) => `<p class="lede legal-lede">${prose(path, p)}</p>`).join("\n    ")}
    <section aria-labelledby="list-title">
      <h2 id="list-title">${esc(h.listTitle)}</h2>
      <ul class="hub-list">
${items}
      </ul>
    </section>
${h.footnote ? `    <p class="note mute">${prose(path, h.footnote)}</p>\n` : ""}${cta()}
  </div>
</main>
`;
  return head({ title: h.title, description: h.description, path, jsonld }) + body + footer();
}

// ---------- Research log ----------

function researchLog(results) {
  const n = (x, d = 1) => x.toFixed(d);
  let md = `# Food sources and arithmetic\n\nGenerated by \`node scripts/build.mjs\` from data/foods.json and data/ingredients.json. Do not edit by hand: change the data and rebuild.\n\n`;
  md += `Energy per ingredient is IFCT 2017's own value (kJ converted at 4.184 kJ per kcal). Pure fats (oils, ghee) have no energy value in our IFCT copy, so they use IFCT's fat factor of 37 kJ per g (about 8.84 kcal per g). Ingredients not in IFCT use USDA FoodData Central or the maker's label, as listed.\n\n`;
  for (const food of foods) {
    const { totals } = results[food.slug];
    md += `## ${food.name} (/calories/${food.slug}/)\n\n${food.recipe.label}.\n\n| Ingredient | Raw g | kcal | Protein g | Carbs g | Fat g | Source |\n|---|---|---|---|---|---|---|\n`;
    for (const item of food.recipe.ingredients) {
      const v = of(item.id, item.g, food.slug);
      const ing = ingredients[item.id];
      md += `| ${ing.name} | ${item.g} | ${n(v.kcal)} | ${n(v.protein)} | ${n(v.carbs)} | ${n(v.fat)} | ${ing.sourceShort} |\n`;
    }
    const t = totals.total;
    md += `| **Total** | | **${n(t.kcal)}** | **${n(t.protein)}** | **${n(t.carbs)}** | **${n(t.fat)}** | |\n\n`;
    md += food.recipe.cookedYieldG
      ? `Cooked yield ${food.recipe.cookedYieldG} g (${food.recipe.yieldNote}). Per 100 g cooked: ${n(t.kcal * 100 / food.recipe.cookedYieldG)} kcal.`
      : `No cooked weight used (${food.recipe.yieldNote}). Portions are shares of the recipe.`;
    if (food.recipe.densityGPerMl) md += ` Katori density ${food.recipe.densityGPerMl} g per ml (${food.recipe.densityNote}).`;
    md += `\n\nPortions:\n\n`;
    for (const p of food.portions) {
      const extra = (p.add || []).map((a) => ` + ${a.g} g ${ingredients[a.id].name}`).join("");
      md += `- ${p.label}: ${p.cookedGrams == null ? `${p.fraction} of the recipe` : `${p.cookedGrams} g cooked`}${extra} = ${p.kcal} kcal, P ${p.protein} g, C ${p.carbs} g, F ${p.fat} g\n`;
    }
    if (food.outside) {
      const o = food.outside;
      md += `\nOutside (${o.label}): fat sources x ${o.fatFactor.join(" to ")}, portion x ${o.sizeFactor.join(" to ")}${(o.extra || []).map((e) => `, plus ${e.g.join(" to ")} g ${ingredients[e.id].name}`).join("")} = ${o.kcalRange.join(" to ")} kcal. Basis: ${o.basis}\n`;
    }
    if (food.crossCheck?.length) {
      md += `\nCross-checks:\n\n`;
      for (const cc of food.crossCheck) {
        const basis = cc.portionId ? `${cc.kcal} kcal per ${food.portions.find((p) => p.id === cc.portionId).short}` : `${cc.kcalPer100g} kcal per 100 g`;
        md += `- ${cc.source}: ${basis}, ours ${cc.ours} (${cc.differencePct > 0 ? "+" : ""}${cc.differencePct}%). ${cc.note || ""} ${cc.url}\n`;
      }
    }
    if (food.range) md += `\nRange shown on page: ${food.range.reason}\n`;
    if (food.judgement?.length) md += `\nJudgement calls:\n\n${food.judgement.map((j) => `- ${j}`).join("\n")}\n`;
    md += `\nSources:\n\n${food.sources.map((s) => `- ${s.title}. ${s.url} (accessed ${s.accessed})`).join("\n")}\n\n`;
  }
  return md;
}

// ---------- Sitemap ----------

function updateSitemap() {
  const xml = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
  const generatedRoots = ["/calories/", ...contentSections.map((s) => s.path)];
  const keep = [...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)]
    .filter((m) => !generatedRoots.some((r) => m[1].startsWith(SITE + r)))
    .map((m) => ({ loc: m[1], lastmod: m[2] }));
  const hubDate = foods.map((f) => f.updated).sort().at(-1);
  const generated = [{ loc: `${SITE}/calories/`, lastmod: hubDate }, ...foods.map((f) => ({ loc: `${SITE}/calories/${f.slug}/`, lastmod: f.updated }))];
  for (const s of contentSections) {
    generated.push({ loc: SITE + s.path, lastmod: s.pages.map((p) => p.updated).sort().at(-1) });
    for (const p of s.pages) generated.push({ loc: `${SITE}${s.path}${p.slug}/`, lastmod: p.updated });
  }
  const urls = [...keep, ...generated].map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n");
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
}

// ---------- Footer links on hand-written pages ----------
// Keeps the footer list of the home, legal, support and 404 pages the same as the generated pages'.
function syncFooters() {
  const links = site.footerLinks.filter((l) => l.href.startsWith("mailto:") || pageExists(l.href));
  const list = links.map((l) => `          <li><a href="${l.href}">${esc(l.label)}</a></li>`).join("\n");
  for (const file of ["index.html", "privacy/index.html", "terms/index.html", "support/index.html", "404.html"]) {
    const html = readFileSync(join(ROOT, file), "utf8");
    const next = html.replace(/(<nav class="footer-links" aria-label="Footer">\s*<ul>\n)[\s\S]*?(\n\s*<\/ul>)/, `$1${list}$2`);
    if (next === html && !html.includes(list)) throw new Error(`${file}: footer link list not found`);
    if (next !== html) write(file, next);
  }
}

// ---------- Run ----------

const results = {};
for (const food of foods) results[food.slug] = computeFood(food);
for (const food of foods) write(`calories/${food.slug}/index.html`, foodPage(food, results[food.slug]));
write("calories/index.html", hubPage());
let contentCount = 0;
for (const s of contentSections) {
  write(`${s.path.slice(1)}index.html`, contentHub(s));
  for (const p of s.pages) { write(`${s.path.slice(1)}${p.slug}/index.html`, contentPage(s, p)); contentCount++; }
}
write("data/foods.json", JSON.stringify(foodsFile, null, 2) + "\n");
write("research/food-sources.md", researchLog(results));
updateSitemap();
syncFooters();
console.log(`Built ${foods.length} food pages and the hub, and ${contentCount} content pages in ${contentSections.length} sections.`);
