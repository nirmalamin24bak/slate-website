// Builds the /calories/ pages from data/foods.json and data/ingredients.json.
//
//   node scripts/build.mjs
//
// Every number on a food page is worked out here from a recipe in grams and
// per-100 g ingredient values, so fixing one value in data/ updates every page.
// Writes: calories/index.html, calories/<slug>/index.html, the computed fields
// in data/foods.json, research/food-sources.md, the <url> entries in sitemap.xml and llms.txt.
// Each dish page links its image card from assets/cards/ (rendered first by scripts/build-cards.mjs).
// No dependencies: Node 18 or later.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { cardFor, readManifest } from "./cards-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://writeonslate.com";
const CSS_VERSION = 3;
// assets/demo/demo.css (the tokens) and assets/pages.css (every page's frame and light look). Bump with the file;
// the hand-written pages (index, privacy, terms, support, 404) carry the same numbers.
const DEMO_CSS_VERSION = 1;
const PAGES_CSS_VERSION = 7;
// The site-wide social image, for every page but the dishes (which have their own cards, below).
const OG_IMAGE = { url: `${SITE}/assets/og.png?v=2`, width: 1200, height: 630, alt: "Slate. A calorie journal that gets out of the way." };
// `node scripts/build.mjs --data-only` computes and writes data/foods.json, then stops: what scripts/build-cards.mjs
// runs first, so the cards show the numbers the pages will.
const DATA_ONLY = process.argv.includes("--data-only");
// The per-dish image cards (assets/cards/<slug>.png, rendered by scripts/build-cards.mjs): each page links its own
// by the version in assets/cards/manifest.json, and the build fails if a card is missing or out of date.
const cardManifest = readManifest();
const RANGE_LIMIT = 0.15; // sources further apart than this must show a range
// The meal calculator (/calories/calculator/): its page copy's date for the sitemap, and the katori size it assumes.
const CALC_PATH = "/calories/calculator/";
const CALC_UPDATED = "2026-10-14";
const CALC_KATORI_ML = 200;

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const write = (p, s) => {
  mkdirSync(dirname(join(ROOT, p)), { recursive: true });
  writeFileSync(join(ROOT, p), s.replace(/\r\n/g, "\n"), "utf8");
};

const ingredients = read("data/ingredients.json");
const foodsFile = read("data/foods.json");
const foods = foodsFile.foods;
// Dishes the iPhone app has and the site has no page for (see scripts/export-app.mjs): worked out and
// checked the same way, logged in research/app-food-sources.md, with no pages.
const appFoodsFile = existsSync(join(ROOT, "data/app-foods.json")) ? read("data/app-foods.json") : null;
const appFoods = appFoodsFile ? appFoodsFile.foods : [];
const site = read("data/site.json");
// Each dish's computed totals, portions and outside range, by slug (filled in under Run, read by the sums).
const results = {};
const appResults = {};

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
    // Unrounded values for sums, so "4 cups" is rounded once, like the calculator. Not enumerable: never saved.
    Object.defineProperty(p, "raw", { value: c.raw, configurable: true });
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
//   {{rg@slug:ingId}} {{ingkcal@slug:ingId}}                    grams of an ingredient in a dish's recipe, and its kcal
//   {{rawkcal@slug}} {{rawkcal@slug:id}}                        unrounded kcal of the whole recipe, or of a portion (1 decimal)
//   {{sum:2*roti:medium+dal-tadka:k200}}                        total kcal of several portions, rounded to 5
// A portion id in a token may also name one of the dish's meals (food.meals, below), which carry the same four numbers.
const portionOrMeal = (f, id) => f.portions.find((x) => x.id === id) || (f.meals || []).find((x) => x.id === id);

// The terms of a sum expression, "2*roti:medium+dal-tadka:k200": { n, slug, id }. A term's dish may be one of the
// app-only dishes (data/app-foods.json); its id may be outLo or outHi, that dish's outside range end.
function sumTerms(food, expr) {
  return expr.split("+").map((term) => {
    const [, n, slug, id] = term.trim().match(/^(?:(\d+(?:\.\d+)?)\*)?([\w-]+):([\w-]+)$/) || [];
    const f = foods.find((x) => x.slug === slug) || appFoods.find((x) => x.slug === slug);
    if (!f) throw new Error(`${food.slug}: sum term "${term}" names an unknown dish`);
    return { n: n ? Number(n) : 1, slug, id, f, hasPage: foods.includes(f) };
  });
}

// Adds up portions of several dishes from their unrounded values, so a meal is rounded once, the way a single
// portion is, and the calculator gives the same number. Every term must already be computed.
function sumRaw(food, expr) {
  const total = zero();
  for (const t of sumTerms(food, expr)) {
    if (t.id === "outLo" || t.id === "outHi") {
      const o = results[t.slug]?.outside;
      if (!o) throw new Error(`${food.slug}: sum term "${t.slug}:${t.id}" but "${t.slug}" has no outside range`);
      add(total, o[t.id === "outLo" ? "lo" : "hi"], t.n);
      continue;
    }
    const p = t.f.portions.find((x) => x.id === t.id);
    if (!p || p.kcal == null) throw new Error(`${food.slug}: sum term "${t.slug}:${t.id}" not found or not yet computed`);
    if (p.combo) throw new Error(`${food.slug}: sum term "${t.slug}:${t.id}" is itself a combo`);
    add(total, p.raw || p, t.n);
  }
  return total;
}
const sumPortions = (food, expr) => rounded(sumRaw(food, expr));
const sumToken = (food, expr) => fmt(sumPortions(food, expr).kcal);
// The same expression with its terms in a fixed order, so "a+b" and "b+a" compare equal.
const normExpr = (expr) => expr.split("+").map((t) => t.trim().replace(/^1\*/, "")).sort().join("+");

// Cross-dish meals ("2 rotis and a katori of dal") on a dish's page: { id, label, expr, page? }, worked out after
// every dish's portions, and stored in data/foods.json like the portions' numbers. page names a composite dish page
// for the same plate (rajma-chawal): the row's label links there, and the calculator sends the phrase there too.
function computeMeals(food) {
  for (const m of food.meals || []) {
    if (food.portions.some((p) => p.id === m.id)) throw new Error(`${food.slug}: meal "${m.id}" clashes with a portion id`);
    if (m.page && !foods.some((f) => f.slug === m.page && f.composite)) throw new Error(`${food.slug}: meal "${m.id}" points to "${m.page}", which is not a composite dish`);
    Object.assign(m, sumPortions(food, m.expr));
  }
}

// Composite dishes (rajma chawal, idli sambar): a plate made of other dishes' portions. No recipe of their own:
// every portion is an expr over the parents' portions (plus add-ons such as a teaspoon of ghee), summed unrounded
// and rounded once, so the numbers always equal the parents' pages. The outside range is a pair of exprs over the
// parents' outside ranges. Worked out after every other dish, before the meals.
function computeComposite(food) {
  if (food.recipe.ingredients.length || food.recipe.cookedYieldG) throw new Error(`${food.slug}: a composite dish has no recipe of its own`);
  const portions = {};
  for (const p of food.portions) {
    if (!p.expr) throw new Error(`${food.slug}/${p.id}: a composite portion needs an expr`);
    const raw = sumRaw(food, p.expr);
    for (const extra of p.add || []) add(raw, of(extra.id, extra.g, `${food.slug}/${p.id}`));
    p.cookedGrams = null;
    Object.assign(p, rounded(raw));
    Object.defineProperty(p, "raw", { value: raw, configurable: true });
    portions[p.id] = { grams: null, share: null, raw, p };
  }
  let outside = null;
  if (food.outside) {
    const o = food.outside;
    if (!portions[o.portionId]) throw new Error(`${food.slug}: outside.portionId "${o.portionId}" not found`);
    const lo = sumRaw(food, o.lo), hi = sumRaw(food, o.hi);
    outside = { lo, hi };
    o.kcalRange = [r5(lo.kcal), r5(hi.kcal)];
    o.fatRange = [rg(lo.fat), rg(hi.fat)];
  }
  food.per100gCooked = null;
  for (const cc of food.crossCheck || []) {
    const ours = cc.portionId && portions[cc.portionId]?.raw.kcal;
    if (ours == null || cc.kcal == null) throw new Error(`${food.slug}: cross-check "${cc.source}" needs a portionId and kcal`);
    cc.ours = Math.round(ours);
    cc.differencePct = Math.round(((cc.kcal - ours) / ours) * 100);
    if (Math.abs(cc.kcal - ours) / ours > RANGE_LIMIT && !food.range) throw new Error(`${food.slug}: ${cc.source} differs by ${cc.differencePct}% and no range is stated`);
  }
  return { totals: null, portions, outside, per100: null };
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
    if (key === "rg" || key === "ingkcal") {
      const items = f.recipe.ingredients.filter((i) => i.id === id);
      if (!items.length) throw new Error(`${food.slug}: token ${m} names no ingredient "${id}" in "${f.slug}"`);
      const g = items.reduce((s, i) => s + i.g, 0);
      return key === "rg" ? fmt(g) : fmt(Math.round(of(id, g, f.slug).kcal));
    }
    if (key === "rawkcal") {
      if (!id) return fmt(Math.round(results[f.slug].totals.total.kcal));
      const p = portionOrMeal(f, id);
      if (!p?.raw) throw new Error(`${food.slug}: token ${m} has no computed portion "${id}"`);
      return p.raw.kcal.toFixed(1);
    }
    const p = portionOrMeal(f, id);
    if (!p) throw new Error(`${food.slug}: token ${m} has no portion or meal "${id}"`);
    if (p.kcal == null) throw new Error(`${food.slug}: token ${m} used before "${f.slug}" meals were computed`);
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

function head({ title, description, path, jsonld, scripts = [], ogType = "website", image = OG_IMAGE }) {
  const url = SITE + path;
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${appMeta()}<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Slate">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image.url}">
<meta property="og:image:width" content="${image.width}">
<meta property="og:image:height" content="${image.height}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${esc(image.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image.url}">
<meta name="twitter:image:alt" content="${esc(image.alt)}">
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="/assets/favicon.svg?v=2" type="image/svg+xml">
<link rel="icon" href="/assets/favicon.png?v=2" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=2">
<link rel="preload" href="/assets/fonts/inter-tight-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-tight-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/demo/demo.css?v=${DEMO_CSS_VERSION}">
<link rel="stylesheet" href="/assets/style.css?v=${CSS_VERSION}">
<link rel="stylesheet" href="/assets/pages.css?v=${PAGES_CSS_VERSION}">
${scripts.map((s) => (typeof s === "string" ? `<script src="${s}" defer></script>\n` : `<script type="module" src="${s.src}"></script>\n`)).join("")}<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

${PAGE_HEADER}
`;
}

// The one header every page uses (the home, legal and 404 pages carry the same markup by hand), so the
// app icon and "Slate" sit in the same place on every page. Styled by assets/pages.css.
const PAGE_HEADER = `<header class="page-header">
  <a href="/" class="page-brand">
    <img src="/assets/demo/assets/app-icon.png?v=2" alt="" width="28" height="28" class="page-brand-icon">
    <span class="page-brand-name">Slate</span>
    <span class="page-brand-label">Try it</span>
  </a>
</header>`;

// The short footer's two link rows, from data/site.json: the site's pages, then the legal pages and email.
const LEGAL_PATHS = new Set(["/privacy/", "/terms/", "/support/"]);
function footerRows() {
  const links = site.footerLinks.filter((l) => l.href.startsWith("mailto:") || pageExists(l.href));
  const row = (list) => list.map((l) => `    <a href="${l.href}">${esc(l.label)}</a>`).join("\n");
  return {
    pages: row(links.filter((l) => !l.href.startsWith("mailto:") && !LEGAL_PATHS.has(l.href))),
    legal: row(links.filter((l) => l.href.startsWith("mailto:") || LEGAL_PATHS.has(l.href))),
  };
}

function footer() {
  const rows = footerRows();
  return `
<footer class="legal-footer">
  <nav class="footer-pages" aria-label="Pages">
${rows.pages}
  </nav>
  <nav aria-label="Legal">
${rows.legal}
  </nav>
  <div>Sonal Systems Private Limited · A-3, Mehsana Nagar, Nizampura, Vadodara 390002, Gujarat, India · CIN U62099GJ2026PTC179785</div>
  <div>© 2026 Sonal Systems Private Limited. Apple and iPhone are trademarks of Apple Inc. Slate is not affiliated with Apple.</div>
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

// The author of the dish and method pages, by reference: the Person node itself lives on /about/ (infoPage below).
const authorRef = () => ({ "@id": `${SITE}/about/#${site.author.id}` });

function breadcrumbLd(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.name,
      ...(i < trail.length - 1 ? { item: SITE + c.path } : {}),
    })),
  };
}

// ---------- App Store links ----------
// Nothing until launch (no "Coming soon"). Once data/site.json has the app's id (and the App Store Connect provider
// token for campaign links) or a plain App Store URL, every page gets the link. ct names the part of the site the
// tap came from (site-home, site-cal-dish, site-cal-hub, site-for, site-compare, site-blog ...), at most 30 characters.
function storeUrl(ct) {
  const { appId, providerToken, appStoreUrl } = site.cta;
  if (ct.length > 30) throw new Error(`campaign token "${ct}" is over 30 characters`);
  if (appId && providerToken) return `https://apps.apple.com/app/apple-store/id${appId}?pt=${providerToken}&ct=${ct}&mt=8`;
  return appStoreUrl || "";
}
// The App Store link without a campaign, for llms.txt and JSON-LD.
const plainStoreUrl = () => site.cta.appStoreUrl || (site.cta.appId ? `https://apps.apple.com/app/id${site.cta.appId}` : "");
// Smart App Banner on Safari, once the app has an id.
const appMeta = () => (site.cta.appId ? `<meta name="apple-itunes-app" content="app-id=${esc(site.cta.appId)}">\n` : "");

const badge = (href) => `<a class="app-badge" href="${esc(href)}"><img src="/assets/app-store-badge.svg" alt="Download on the App Store" width="120" height="40"></a>`;

// The line a dish page uses as its example: its first combo or meal, else its headline portion without any bracketed note.
function dishExample(food) {
  const first = food.portions.find((p) => p.combo) || (food.meals || [])[0];
  const label = (first ? first.label : food.portions.find((p) => p.id === food.headlinePortion).label.replace(/\s*\([^)]*\)/g, "").replace(/,.*$/, "")).replace(/\s*\([^)]*\)/g, "");
  // "1 katori" or "1 glass" needs the dish's name after it; "1 medium roti" doesn't.
  const lower = label.toLowerCase();
  return lower.includes(food.nameLower) || lower.includes(food.nameLower.split(" ").pop()) ? label : `${label} of ${food.nameLower}`;
}

function cta(ct, food) {
  const href = storeUrl(food?.campaignToken || ct);
  if (!href) return "";
  const line = food ? site.cta.dishLine.replace("{example}", dishExample(food)) : site.cta.line;
  return `
    <div class="page-cta">
      <p class="cta-line">${esc(line)}</p>
      <div class="actions">${badge(href)}</div>
    </div>`;
}

// One line under a dish's portions table.
function tableLink(ct, food) {
  const href = storeUrl(food.campaignToken || ct);
  return href ? `\n      <p class="table-link"><a href="${esc(href)}">${esc(site.cta.tableLink)} →</a></p>` : "";
}

// Content pages (/for/, /compare/, /blog/) come from data/pages.json when it exists.
const contentSections = existsSync(join(ROOT, "data/pages.json")) ? read("data/pages.json").sections : [];

// The about and how-Slate-counts pages come from data/info.json.
const infoPages = existsSync(join(ROOT, "data/info.json")) ? read("data/info.json").pages : [];

// Generated and hand-written pages that exist, so links to pages not built yet are left out.
const builtPaths = new Set(["/", "/privacy/", "/terms/", "/support/", "/calories/", CALC_PATH, ...foods.map((f) => `/calories/${f.slug}/`),
  ...infoPages.map((p) => `/${p.slug}/`),
  ...contentSections.flatMap((s) => [s.path, ...s.pages.map((p) => `${s.path}${p.slug}/`)])]);
function pageExists(href) {
  if (builtPaths.has(href)) return true;
  return existsSync(join(ROOT, href, "index.html"));
}

// ---------- Food page ----------

function nutriTable(food, rows, caption) {
  // A meal row for a plate that has its own composite page links there.
  const label = (p) => (p.page ? `<a href="/calories/${p.page}/">${esc(p.label)}</a>` : esc(p.label));
  const body = rows.map((p) => `<tr><td>${label(p)}${p.cookedGrams == null ? "" : `<br><span class="mute small">about ${fmt(p.cookedGrams)} g</span>`}</td>` +
    `<td class="n">${fmt(p.kcal)}</td><td class="n">${p.protein} g</td><td class="n">${p.carbs} g</td><td class="n">${p.fat} g</td></tr>`).join("\n");
  return `<div class="table-wrap"><table class="nutri">
<caption>${esc(caption)}</caption>
<thead><tr><th scope="col">Portion</th><th scope="col" class="n">Cals</th><th scope="col" class="n">Protein</th><th scope="col" class="n">Carbs</th><th scope="col" class="n">Fat</th></tr></thead>
<tbody>
${body}
</tbody></table></div>`;
}

// Combos (portions of this dish with something on the side) and meals (this dish with other dishes), the way people
// search: "2 aloo paratha with curd". Only on dishes that have any.
function mealsSection(food) {
  const rows = [...food.portions.filter((p) => p.combo), ...(food.meals || [])];
  if (!rows.length) return "";
  if (!food.mealsCaption) throw new Error(`${food.slug}: combos or meals need a mealsCaption naming the add-on sizes`);
  // One line under the table, not a link in every row: the calculator opens with the first meal typed in, to change.
  const q = encodeURIComponent(mealWords(rows[0].label));
  return `
    <section aria-labelledby="meals">
      <h2 id="meals">${esc(food.mealsHeading || `Calories in ${food.nameLower} as a meal`)}</h2>
      ${nutriTable(food, rows, food.mealsCaption)}
      <p class="table-link"><a href="${CALC_PATH}?q=${q}">${esc(site.calculator.mealsLink)} →</a></p>
    </section>
`;
}

// A composite dish's parts: the headline portion's terms, each linked to the dish it comes from, with its page number.
function partsTable(food) {
  const headline = food.portions.find((p) => p.id === food.headlinePortion);
  const rows = sumTerms(food, headline.expr).map((t) => {
    const p = t.f.portions.find((x) => x.id === t.id);
    const name = t.hasPage ? `<a href="/calories/${t.slug}/">${esc(t.f.name)}</a>` : `${esc(t.f.name)}<br><span class="mute small">as the Slate app counts it, no page of its own</span>`;
    const qty = t.n === 1 ? p.label : `${fmt(t.n)} × ${p.label}`;
    return `<tr><td>${name}</td><td>${esc(qty)}</td><td class="n">${fmt(r5(p.kcal * t.n))}</td></tr>`;
  }).join("\n");
  return `<div class="table-wrap"><table class="nutri">
<caption>${esc(food.recipe.label)}.</caption>
<thead><tr><th scope="col">Dish</th><th scope="col">Portion</th><th scope="col" class="n">Cals</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>`;
}

const METHOD_LINK = `Every dish on Slate is worked out the same way: <a href="/how-slate-counts/">how Slate counts calories</a>.`;

// The WebPage's citation list, from a page's sources: another page on this site is a WebPage reference by @id (the
// parents of a composite plate), anything else a CreativeWork with its title and url.
function citationLd(sources) {
  return sources.map((s) => {
    const m = s.url.match(new RegExp(`^${SITE}(/.*/)$`));
    return m ? { "@type": "WebPage", "@id": `${s.url}#webpage`, url: s.url, name: s.title } : { "@type": "CreativeWork", name: s.title, url: s.url };
  });
}

function methodSection(food, calc) {
  const rows = food.recipe.ingredients.map((item) => {
    const ing = ingredient(item.id, food.slug);
    return `<tr><td>${esc(ing.name)}${item.note ? `<br><span class="mute small">${esc(item.note)}</span>` : ""}</td><td class="n">${fmt(item.g)} g</td><td>${esc(ing.sourceShort)}</td></tr>`;
  }).join("\n");
  // The range note sits in a card so the section's prose is one paragraph (checked by scripts/check.mjs).
  const range = food.range ? `<div class="card note"><p>${inline(food, food.range.text)}</p></div>` : "";
  const sources = food.sources.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a>${s.note ? `. ${esc(s.note)}` : ""}</li>`).join("\n");
  // One self-contained paragraph (about 130 to 170 words rendered) that answers the question for this dish on its
  // own, ending with the one sentence every dish shares: the link to the method page.
  const method = [].concat(food.method).join(" ");
  const table = food.composite ? partsTable(food) : `<div class="table-wrap"><table class="nutri">
<caption>${esc(food.recipe.label)}.${food.recipe.cookedYieldG ? ` Cooked weight about ${fmt(food.recipe.cookedYieldG)} g.` : ""}</caption>
<thead><tr><th scope="col">Ingredient</th><th scope="col" class="n">Raw</th><th scope="col">Values from</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>`;
  return `
    <section aria-labelledby="method">
      <h2 id="method">How were these numbers worked out?</h2>
      <p>${inline(food, method)} ${METHOD_LINK}</p>
      ${table}
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
  // The title carries the headline numbers ("Kadhi calories: 100 per katori, 360 with pakora") through the same
  // tokens as the prose, so it can never show a number the data doesn't.
  const title = plain(food, food.title);
  const description = plain(food, food.description);
  const faqLd = {
    "@type": "FAQPage", "@id": `${SITE}${path}#faq`,
    mainEntity: food.faq.map((f) => ({ "@type": "Question", name: plain(food, f.q), acceptedAnswer: { "@type": "Answer", text: plain(food, f.a) } })),
  };
  // The dish's own image card: the page's social image, its primary image and a figure under the answer.
  const card = cardFor(food, cardManifest);
  const image = { url: SITE + card.path, width: card.width, height: card.height, alt: card.alt };
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${SITE}${path}#webpage`, url: SITE + path, name: title,
        description, isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#organization` },
        author: authorRef(), inLanguage: "en-IN", datePublished: food.published, dateModified: food.updated,
        primaryImageOfPage: { "@id": `${SITE}${path}#primaryimage` },
        citation: citationLd(food.sources) },
      { "@type": "ImageObject", "@id": `${SITE}${path}#primaryimage`, url: image.url, contentUrl: image.url,
        width: image.width, height: image.height, caption: image.alt, inLanguage: "en-IN" },
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
    <p class="meta-line mute">By <a href="/about/">${esc(site.author.name)}</a>. Checked on ${longDate(food.updated)}.</p>
    <p class="answer-first">${inline(food, food.answer)}</p>
    <figure class="dish-card"><img src="${card.path}" width="${card.width}" height="${card.height}" alt="${esc(card.alt)}" decoding="async"></figure>
    ${food.intro.map((p) => `<p class="para">${inline(food, p)}</p>`).join("\n    ")}
    <div class="card note"><p>${esc(site.foodNote)}</p></div>

    <section aria-labelledby="portions">
      <h2 id="portions">How many calories are in ${esc(food.nameLower)}?</h2>
      ${nutriTable(food, food.portions.filter((p) => !p.combo), food.portionsCaption)}${tableLink("site-cal-dish", food)}${food.composite ? `
      <p class="table-link"><a href="${CALC_PATH}?q=${encodeURIComponent(food.nameLower)}">${esc(site.calculator.mealsLink)} →</a></p>` : ""}
    </section>

${o ? `    <section aria-labelledby="outside">
      <h2 id="outside">How does home ${esc(food.nameLower)} compare with outside?</h2>
      ${o.text.map((p) => `<p>${inline(food, p)}</p>`).join("\n      ")}
      <div class="table-wrap"><table class="nutri">
<caption>${esc(o.caption)}</caption>
<thead><tr><th scope="col">Version</th><th scope="col" class="n">Cals</th><th scope="col" class="n">Fat</th></tr></thead>
<tbody>
<tr><td>Home</td><td class="n">${fmt(food.portions.find((p) => p.id === o.portionId).kcal)}</td><td class="n">${food.portions.find((p) => p.id === o.portionId).fat} g</td></tr>
<tr><td>${esc(o.label)}</td><td class="n">${fmt(o.kcalRange[0])} to ${fmt(o.kcalRange[1])}</td><td class="n">${o.fatRange[0]} to ${o.fatRange[1]} g</td></tr>
</tbody></table></div>
    </section>
` : "    <!-- No outside range: the dish is the same outside as at home (see its judgement notes). -->\n"}
${mealsSection(food)}
    <section aria-labelledby="changes">
      <h2 id="changes">What changes the calories in ${esc(food.nameLower)}?</h2>
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
${cta("site-cal-dish", food)}
  </div>
</main>
`;
  return head({ title, description, path, jsonld, image }) + body + footer();
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
    <p class="table-link hub-calc"><a href="${CALC_PATH}">${esc(site.calculator.hubLink)} →</a></p>
    <div class="card note"><p>${esc(site.foodNote)}</p></div>
    <div class="hub-search" hidden>
      <label class="sr-only" for="hub-filter">Find a dish</label>
      <input id="hub-filter" type="search" placeholder="Find a dish: roti, dal, chai" autocomplete="off" spellcheck="false">
    </div>
    <p class="hub-empty mute" id="hub-empty" hidden>Nothing here by that name yet.</p>
${groups}
${cta("site-cal-hub")}
  </div>
</main>
`;
  return head({ title: site.hub.title, description: site.hub.description, path, jsonld, scripts: ["/assets/hub.js?v=1"] }) + body + footer();
}

// ---------- Meal calculator: /calories/calculator/ ----------
//
// assets/calc/data.js carries every dish (the site's and the app-only ones) with its aliases and plain portions,
// each tagged with the household unit it stands for (piece, katori with its ml, plate, cup, glass, grams) and the
// extras in its label (ghee, butter, no sugar ...), so assets/calc/parse.js can turn "2 roti with ghee" into the
// right portion. Combos and anything with curd or another dish in it are left out: the parser composes those.

// Dishes the app has and the site has no page for carry no aliases of their own; these are the spellings people use.
const CALC_EXTRA_ALIASES = {
  "aloo-gobi": ["aloo gobhi", "alu gobi", "gobi aloo", "gobhi aloo", "aloo gobi sabzi", "आलू गोभी"],
  "aloo-shimla-mirch": ["aloo capsicum", "shimla mirch aloo", "capsicum aloo", "aloo shimla", "shimla mirch"],
  "methi-aloo": ["aloo methi", "methi alu", "aloo methi sabzi"],
  "jeera-aloo": ["zeera aloo", "jeera alu", "cumin potatoes", "jeera aloo sabzi"],
  "aloo-matar": ["aloo mutter", "alu matar", "matar aloo", "aloo matar sabzi"],
  "boiled-egg": ["boiled eggs", "ubla anda", "uble ande", "boiled anda", "hard boiled egg", "egg boiled"],
  "omelette": ["omelet", "omlet", "omlette", "anda omelette", "egg omelette", "masala omelette"],
  "egg-bhurji": ["anda bhurji", "egg bhurjee", "anda burji", "egg burji", "scrambled egg", "scrambled eggs"],
  "curd": ["dahi", "plain curd", "yogurt", "yoghurt", "dahin", "दही", "દહીં"],
  "raita": ["cucumber raita", "kheera raita", "boondi raita", "mixed raita", "रायता", "રાયતું"],
  "dal-thick": ["thick dal", "gaadhi dal"],
  "gujarati-dal": ["gujarati daal", "khatti meethi dal"],
  "chole-bhature": ["chhole bhature", "chole bhatura", "chana bhatura"],
  "tandoori-roti": ["tandoori chapati", "tandoor roti", "tandoori rotis"],
  "bhakri": ["bhakhri", "ભાખરી"],
  "khandvi": ["khandavi", "ખાંડવી"],
  "paneer-bhurji": ["paneer burji", "paneer bhurjee", "paneer ki bhurji"],
  "lauki-sabzi": ["lauki", "lauki ki sabzi", "doodhi", "dudhi", "ghiya", "ghiya sabzi", "bottle gourd", "dudhi nu shaak", "लौकी"],
  "turai-sabzi": ["turai", "turai ki sabzi", "ridge gourd", "turiya", "turiya nu shaak", "तुरई"],
  "indori-poha": ["indori pohe", "indore poha"],
  "maggi": ["maggi noodles", "maggie"],
  "dahi-puri": ["dahi poori", "dahi batata puri"],
  "banana": ["kela", "kele", "bananas", "केला", "કેળું"],
  "apple": ["seb", "apples", "सेब", "સફરજન"],
  "orange": ["santra", "narangi", "oranges", "संतरा", "નારંગી"],
  "mango": ["aam", "keri", "mangoes", "आम", "કેરી"],
  "guava": ["amrood", "amrud", "jamfal", "अमरूद", "જામફળ"],
  "watermelon": ["tarbooz", "tarbuj", "तरबूज", "તરબૂચ"],
  "papaya": ["papita", "papaiya", "पपीता", "પપૈયું"],
  "mixed-veg": ["mixed veg", "mix sabzi", "mixed sabzi", "veg sabzi"],
  "plain-rice": ["chaval", "sada bhaat"],
};
// Aliases that name two dishes at once ("rajma chawal" on the rajma page): the parser composes them instead.
const CALC_DROP_ALIASES = {
  bhatura: ["chole bhature", "chhole bhature", "chana bhatura"],
  "medu-vada": ["sambar vada"], jalebi: ["jalebi rabri"], "toor-dal": ["gujarati dal"], "mixed-veg": ["aloo gobi matar", "gobhi aloo matar"],
  "vada-pav": ["batata vada"],
};
// Generic words with a stated default. Words that could mean dishes far apart (biryani, paneer, egg) are not here:
// the parser asks which one and counts 0 until told.
const CALC_GENERIC = {
  "dal-tadka": { note: "counted as dal tadka", words: ["dal", "daal", "dhal", "dal sabzi", "दाल", "દાળ"] },
  "mixed-veg": { note: "counted as mixed veg sabzi", words: ["sabzi", "sabji", "subzi", "shaak", "sabzee", "सब्जी", "શાક"] },
  "plain-rice": { note: "counted as plain rice", words: ["rice", "chawal", "chaval", "bhaat", "bhat"] },
  "masala-chai": { note: "counted as masala chai", words: ["chai", "tea", "cha", "chaha", "चाय", "ચા"] },
  "plain-dosa": { note: "counted as plain dosa", words: ["dosa", "dosai", "dose", "डोसा", "ઢોસા"] },
  "plain-paratha": { note: "counted as plain paratha", words: ["paratha", "parantha", "parotha", "parotta", "पराठा", "परांठा", "પરોઠા"] },
  roti: { note: "counted as a medium roti", words: ["chapati", "chapatti", "chappathi", "rotli", "रोटी", "चपाती", "રોટલી"] },
  "filter-coffee": { note: "counted as filter coffee", words: ["coffee", "kaapi", "kofi"] },
  "besan-ladoo": { note: "counted as besan ladoo", words: ["ladoo", "laddu", "laddoo", "ladoos", "laddus", "लड्डू", "લાડુ"] },
  "gajar-halwa": { note: "counted as gajar halwa", words: ["halwa", "halva", "हलवा"] },
};
// Portions that are a second dish or a special version the parser can't ask for.
const CALC_SKIP = new Set(["poha/big", "toor-dal/gujarati", "masala-dosa/plain", "nimbu-pani/textbook", "pav-bhaji/plate1", "pav-bhaji/plate4",
  "pav-bhaji/pav", "phulka/one_half_ghee", "butter-naan/textbook", "rasam/rasam_rice", "kachori/with_sabzi", "kuttu-puri/four_sabzi",
  "besan-chilla/paneer", "sev-puri/dahi", "chole-bhature/half", "roti/phulka", "kaju-katli/one", "egg-bhurji/pav", "maggi/egg", "maggi/veg",
  "omelette/three"]);
// Side add-ons, from data/ingredients.json: a teaspoon or a 100 g katori, the sizes the dish pages use.
const CALC_ADDONS = [
  { id: "curd", ing: "curd", name: "Curd", unit: "katori", katoriG: 100, tspG: 5, aliases: ["dahi", "yogurt", "yoghurt", "दही", "દહીં"] },
  { id: "ghee", ing: "ghee", name: "Ghee", unit: "tsp", tspG: 5, katoriG: 100, aliases: ["ghi", "घी", "ઘી"] },
  { id: "butter", ing: "butter", name: "Butter", unit: "tsp", tspG: 5, katoriG: 100, aliases: ["makkhan", "makhan", "amul", "मक्खन", "માખણ"] },
  { id: "sugar", ing: "sugar", name: "Sugar", unit: "tsp", tspG: 4, katoriG: 100, aliases: ["cheeni", "chini", "shakkar", "sakar", "चीनी", "ખાંડ"] },
  { id: "oil", ing: "oil", name: "Oil", unit: "tsp", tspG: 4.5, katoriG: 100, aliases: ["tel", "तेल", "તેલ"] },
  { id: "honey", ing: "honey", name: "Honey", unit: "tsp", tspG: 7, katoriG: 100, aliases: ["shahad", "madh", "शहद", "મધ"] },
];
const CALC_TAGS = [
  [/no sugar/, "no_sugar"], [/1 tsp sugar/, "sugar1"], [/2 tsp sugar/, "sugar2"], [/honey/, "honey"], [/no oil/, "no_oil"],
  [/\b1 tsp oil/, "oil1"], [/2 tsp oil/, "oil2"], [/1 tbsp oil/, "oil_tbsp"], [/no ghee/, "no_ghee"], [/ghee/, "ghee"],
  [/1 tbsp butter/, "butter_tbsp"], [/2 tsp butter/, "butter2"], [/butter/, "butter"], [/toned/, "toned"], [/buffalo/, "buffalo"],
  [/cream/, "cream"], [/malai/, "malai"], [/syrup/, "syrup"], [/no tadka/, "no_tadka"], [/pakora/, "pakora"], [/thick/, "thick"],
  [/cutting/, "cutting"], [/no pav|without pav/, "no_pav"], [/sweet-shop/, "shop"], [/less sugar/, "less_sugar"],
];

// The unit a portion stands for and how many of it, read from its label: "2 medium rotis" is 2 pieces,
// "1 katori (150 ml)" is 1 katori of 150 ml, "100 g" is 100 grams.
function calcPortionMeta(food, p, raw) {
  const text = p.label.toLowerCase();
  const clean = text.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  const tags = [];
  for (const [re, tag] of CALC_TAGS) if (re.test(clean) && !tags.includes(tag)) tags.push(tag);
  if (tags.includes("no_ghee")) tags.splice(tags.indexOf("ghee"), tags.includes("ghee") ? 1 : 0);
  if (tags.includes("butter_tbsp") || tags.includes("butter2")) tags.splice(tags.indexOf("butter"), 1);
  if (p.id === "less_sugar") tags.splice(0, tags.length, "less_sugar");
  const size = /\b(small|mini)\b/.test(clean) ? "small" : /\b(large|big|tall|very large)\b/.test(clean) ? "large" : /\bmedium\b/.test(clean) ? "medium" : null;
  let kind, count = 1, ml = p.ml || null;
  let g;
  if ((g = clean.match(/^(\d+(?:\.\d+)?) g\b/))) { kind = "g"; count = Number(g[1]); }
  else if (/katori/.test(clean)) kind = "katori";
  else if (/\bplate\b/.test(clean)) kind = "plate";
  else if (/\bbowl\b/.test(clean)) kind = "bowl";
  else if (/\bcup\b/.test(clean)) kind = "cup";
  else if (/tumbler|glass/.test(clean)) kind = "glass";
  else if (p.ml && food.category === "drinks") kind = "glass";
  else if (p.ml) kind = "katori";
  else kind = "piece";
  if (kind !== "g") {
    const n = clean.match(/^(\d+(?:\.\d+)?|½|¼|¾|half)\b/);
    count = !n ? 1 : n[1] === "½" || n[1] === "half" ? 0.5 : n[1] === "¼" ? 0.25 : n[1] === "¾" ? 0.75 : Number(n[1]);
  }
  if (kind !== "katori" && kind !== "glass") ml = null;
  const label = p.label.replace(/\s*\([^)]*\)/g, "").replace(/,?\s*textbook/i, "").replace(/\s+/g, " ").trim();
  // kcal, protein, carbs and fat are the unrounded values, so a line is rounded once, the way the page rounds it;
  // page holds the numbers the dish page shows, used as they are when a typed item is exactly this portion.
  return { id: p.id, label, kcal: raw.kcal, protein: raw.protein, carbs: raw.carbs, fat: raw.fat, page: { kcal: p.kcal, protein: p.protein, carbs: p.carbs, fat: p.fat },
    kind, count, ...(ml ? { ml } : {}), ...(size ? { size } : {}), tags };
}

const appMap = existsSync(join(ROOT, "data/app-map.json")) ? read("data/app-map.json") : { dishes: {} };

function calcDish(food, hasPage, computed) {
  const drop = new Set(CALC_DROP_ALIASES[food.slug] || []);
  const aliases = [...(food.aliases || []), ...(CALC_EXTRA_ALIASES[food.slug] || [])].filter((a) => !drop.has(a.toLowerCase()));
  const headline = food.headlinePortion || Object.values(appMap.dishes).find((d) => d.slug === food.slug)?.portion || food.portions[0].id;
  const portions = food.portions.filter((p) => !p.combo && !CALC_SKIP.has(`${food.slug}/${p.id}`) && !/curd|with a /i.test(p.label))
    .map((p) => calcPortionMeta(food, p, computed.portions[p.id].raw));
  if (!portions.some((p) => p.id === headline)) throw new Error(`${food.slug}: calculator headline portion "${headline}" was filtered out`);
  // Every combo and meal row the dish page shows, with the page's own numbers: typed back word for word, it is used as it is.
  // A meal row that has its own composite page is left out here: that page's rows carry the phrase (below).
  const rows = [...food.portions.filter((p) => p.combo), ...(food.meals || []).filter((m) => !m.page)].map((r) => ({ id: r.id, label: mealWords(r.label), kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat }));
  const per100 = computed.per100 ? { kcal: computed.per100.kcal, protein: computed.per100.protein, carbs: computed.per100.carbs, fat: computed.per100.fat } : null;
  if (food.composite) return calcComposite(food, headline, portions);
  return {
    id: food.slug, name: food.name, nameLower: food.nameLower || food.name.toLowerCase(), page: hasPage ? `/calories/${food.slug}/` : null,
    category: food.category, headline, aliases: [...new Set(aliases.map((a) => a.normalize("NFC").toLowerCase()))],
    per100, portions, rows,
  };
}

// A composite dish in the calculator: never matched by name (so "5 idli sambar" still counts 5 idlis and a katori
// of sambar through the parents), only by its rows, each a portion of the page typed in plain words: its label,
// the phrases listed on it (its name and aliases for the headline), and the words of every parent meal row that
// points to this page for the same plate. Each gives the page's own numbers, as one line linking to the page.
function calcComposite(food, headline, portions) {
  const rows = food.portions.map((p) => {
    const phrases = [...(p.typed || [])];
    if (p.id === headline) phrases.push(food.name, food.nameLower || food.name.toLowerCase(), ...(food.aliases || []));
    for (const f of foods) for (const m of f.meals || []) if (m.page === food.slug && normExpr(m.expr) === normExpr(p.expr) && !(p.add || []).length) phrases.push(mealWords(m.label));
    return { id: p.id, label: p.label, kcal: p.kcal, protein: p.protein, carbs: p.carbs, fat: p.fat, phrases: [...new Set(phrases.map((s) => s.normalize("NFC").toLowerCase()))] };
  });
  for (const f of foods) for (const m of f.meals || []) if (m.page === food.slug && !rows.some((r) => r.phrases.includes(mealWords(m.label).toLowerCase()))) throw new Error(`${f.slug}: meal "${m.id}" points to ${food.slug}, which has no portion for ${m.expr}`);
  return { id: food.slug, name: food.name, nameLower: food.nameLower || food.name.toLowerCase(), page: `/calories/${food.slug}/`, category: food.category,
    headline, composite: true, aliases: [], per100: null, portions, rows };
}

function calcData(results, appResults) {
  const dishes = [...foods.map((f) => calcDish(f, true, results[f.slug])), ...appFoods.map((f) => calcDish(f, false, appResults[f.slug]))];
  const generic = {};
  for (const [id, g] of Object.entries(CALC_GENERIC)) {
    if (!dishes.some((d) => d.id === id)) throw new Error(`calculator: generic default "${id}" is not a dish`);
    for (const w of g.words) generic[w] = { id, note: g.note };
  }
  const addons = CALC_ADDONS.map((a) => ({ ...a, per100g: (({ kcal, protein, carbs, fat }) => ({ kcal, protein, carbs, fat }))(ingredient(a.ing, "calculator").per100g) }));
  return { katoriMl: CALC_KATORI_ML, dishes, addons, generic };
}

// Writes assets/calc/data.js and returns the ?v= the page loads the calculator's files with: a hash of the data
// and the two scripts, so every change gets a fresh URL and nothing else does.
function writeCalcData(results, appResults) {
  const data = calcData(results, appResults);
  const body = `// Generated by scripts/build.mjs from data/foods.json, data/app-foods.json and data/ingredients.json. Do not edit.\nwindow.SLATE_CALC = ${JSON.stringify(data)};\n`;
  write("assets/calc/data.js", body);
  const hash = createHash("sha256");
  for (const f of ["assets/calc/data.js", "assets/calc/parse.js", "assets/calc/page.js"]) hash.update(readFileSync(join(ROOT, f)));
  return { data, version: hash.digest("hex").slice(0, 10) };
}

// A meal row's label in the words the calculator reads: "2 aloo parathas with curd".
const mealWords = (label) => label.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();

function calculatorPage(version) {
  const path = CALC_PATH;
  const c = site.calculator;
  const trail = [{ name: "Home", path: "/" }, { name: "Food calories", path: "/calories/" }, { name: "Calculator", path }];
  const faq = faqParts(path, c.faq);
  const jsonld = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": `${SITE}${path}#webpage`, url: SITE + path, name: c.title, description: c.description,
      isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#organization` }, inLanguage: "en-IN", dateModified: CALC_UPDATED,
      mainEntity: { "@id": `${SITE}${path}#app` } },
    breadcrumbLd(trail),
    { "@type": "WebApplication", "@id": `${SITE}${path}#app`, name: "Indian meal calorie calculator", url: SITE + path,
      applicationCategory: "HealthApplication", operatingSystem: "Any", browserRequirements: "Requires JavaScript", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" }, publisher: { "@id": `${SITE}/#organization` } },
    faq.ld,
  ] };
  const chips = c.examples.map((e) => `<button type="button" class="chip" data-example="${esc(e)}">${esc(e)}</button>`).join("\n        ");
  const body = `
<main id="main" class="legal">
  <div class="wrap-reading">
    ${crumbs(trail)}
    <h1>${esc(c.h1)}</h1>
    <p class="meta-line mute">Updated ${longDate(CALC_UPDATED)}.</p>
    <p class="answer-first">${esc(c.lede)}</p>
    <noscript><p class="note mute">${esc(c.noscript)} <a href="/calories/">Food calories</a>.</p></noscript>
    <section class="calc" aria-labelledby="calc-label">
      <label id="calc-label" for="calc-input" class="calc-label">${esc(c.label)}</label>
      <textarea id="calc-input" class="calc-input" rows="3" maxlength="500" placeholder="${esc(c.placeholder)}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"></textarea>
      <div class="calc-actions">
        <button type="button" id="calc-count" class="btn">${esc(c.button)}</button>
        <button type="button" id="calc-copy" class="btn btn-secondary" hidden>${esc(c.copyButton)}</button>
      </div>
      <div class="calc-examples">
        <span class="mute small">${esc(c.examplesLabel)}</span>
        ${chips}
      </div>
      <div id="calc-results" class="calc-results" aria-live="polite" data-copy="${esc(JSON.stringify({ columns: c.columns, total: c.total, empty: c.empty, unmatched: c.unmatched, ambiguous: c.ambiguous, didYouMean: c.didYouMean, copied: c.copied, copyButton: c.copyButton }))}"></div>
    </section>
    <div class="card note"><p>${esc(site.foodNote)}</p><p>${esc(c.notMedical)}</p></div>

    <section aria-labelledby="how">
      <h2 id="how">${esc(c.howHeading)}</h2>
      ${c.how.map((p) => `<p>${prose(path, p)}</p>`).join("\n      ")}
    </section>
${faq.html}
    <section aria-labelledby="related">
      <h2 id="related">Related</h2>
      <ul class="link-list">
        <li><a href="/calories/">Calories in Indian food, dish by dish</a></li>
        <li><a href="/how-slate-counts/">How Slate counts calories</a></li>
      </ul>
    </section>
${cta("site-calc")}
  </div>
</main>
`;
  return head({ title: c.title, description: c.description, path, jsonld, scripts: [`/assets/calc/data.js?v=${version}`, { src: `/assets/calc/page.js?v=${version}` }] }) + body + footer();
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
  const description = plainText(path, page.description);
  const webpage = { "@type": "WebPage", "@id": `${SITE}${path}#webpage`, url: SITE + path, name: page.title,
    description, isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#organization` },
    inLanguage: "en-IN", dateModified: page.updated };
  const graph = [webpage, breadcrumbLd(trail)];
  if (isBlog) {
    graph.push({ "@type": "BlogPosting", "@id": `${SITE}${path}#article`, headline: page.h1, description,
      mainEntityOfPage: { "@id": `${SITE}${path}#webpage` }, image: { "@type": "ImageObject", url: `${SITE}/assets/og.png?v=2`, width: 1200, height: 630 }, inLanguage: "en-IN",
      datePublished: page.published, dateModified: page.updated,
      author: { "@type": "Person", "@id": `${SITE}/about/#${site.author.id}`, url: `${SITE}/about/`, name: site.author.name, jobTitle: site.author.jobTitle, worksFor: { "@id": `${SITE}/#organization` } },
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
${cta(`site-${section.id}`)}
  </div>
</main>
`;
  return head({ title: page.title, description, path, jsonld: { "@context": "https://schema.org", "@graph": graph }, ogType: isBlog ? "article" : "website" }) + body + footer();
}

function contentHub(section) {
  const path = section.path;
  const trail = [{ name: "Home", path: "/" }, { name: section.crumb, path }];
  const h = section.hub;
  const pages = section.id === "blog" ? [...section.pages].sort((a, b) => b.published.localeCompare(a.published)) : section.pages;
  const items = pages.map((p) => `<li><a href="${path}${p.slug}/"><span class="hub-text"><span class="hub-name">${esc(p.linkLabel || p.h1)}</span><span class="hub-desc">${esc(plainText(`${path}${p.slug}/`, p.description))}</span></span></a></li>`).join("\n");
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
${h.footnote ? `    <p class="note mute">${prose(path, h.footnote)}</p>\n` : ""}${cta(`site-${section.id}`)}
  </div>
</main>
`;
  return head({ title: h.title, description: h.description, path, jsonld }) + body + footer();
}

// ---------- About and how-Slate-counts pages (data/info.json) ----------
// Same blocks as the content pages, at the top level (/about/, /how-slate-counts/). The about page also
// carries the people behind Slate, with the @ids the blog posts' author points to.

function infoPage(page) {
  const path = `/${page.slug}/`;
  const trail = [{ name: "Home", path: "/" }, { name: page.h1, path }];
  const description = plainText(path, page.description);
  const graph = [
    { "@type": page.type, "@id": `${SITE}${path}#webpage`, url: SITE + path, name: page.title, description,
      isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#organization` }, inLanguage: "en-IN",
      datePublished: page.published, dateModified: page.updated,
      ...(page.type === "AboutPage" ? { about: { "@id": `${SITE}/#organization` } } : { author: authorRef() }),
      ...(page.sources?.length ? { citation: citationLd(page.sources) } : {}) },
    breadcrumbLd(trail),
  ];
  if (page.type === "AboutPage") {
    graph.push({ "@type": "Person", "@id": `${SITE}/about/#${site.author.id}`, url: `${SITE}/about/`, name: site.author.name,
      jobTitle: site.author.jobTitle, worksFor: { "@id": `${SITE}/#organization` } });
    graph.push({ "@type": "Person", "@id": `${SITE}/about/#nehal-modi`, url: `${SITE}/about/`, name: "Nehal Modi", jobTitle: "Co-founder",
      worksFor: { "@id": `${SITE}/#organization` } });
  }
  const sections = page.body.map((s) => `
    <section aria-labelledby="${s.id}">
      <h2 id="${s.id}">${prose(path, s.h2)}</h2>
      ${blocks(path, s.content)}
    </section>`).join("");
  // The method page lists its primary sources the way the dish pages do; the about page has none.
  const sources = page.sources?.length ? `
    <section aria-labelledby="sources">
      <h2 id="sources">Sources</h2>
      <ol class="sources">
${page.sources.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a>${s.note ? `. ${esc(s.note)}` : ""}</li>`).join("\n")}
      </ol>
    </section>` : "";
  // The article pages carry the author's byline, as the dish pages do; the about page is about the company.
  const meta = page.type === "AboutPage" ? `Updated ${longDate(page.updated)}.`
    : `By <a href="/about/">${esc(site.author.name)}</a>. Updated ${longDate(page.updated)}.`;
  const body = `
<main id="main" class="legal">
  <div class="wrap-reading">
    ${crumbs(trail)}
    <h1>${esc(page.h1)}</h1>
    <p class="meta-line mute">${meta}</p>
    <p class="answer-first">${prose(path, page.lede)}</p>
${sections}${sources}
${cta(page.slug === "how-slate-counts" ? "site-method" : `site-${page.slug}`)}
  </div>
</main>
`;
  return head({ title: page.title, description, path, jsonld: { "@context": "https://schema.org", "@graph": graph } }) + body + footer();
}

// ---------- Research log ----------

function researchLog(list, results, { title, dataFile, pages }) {
  const n = (x, d = 1) => x.toFixed(d);
  let md = `# ${title}\n\nGenerated by \`node scripts/build.mjs\` from ${dataFile} and data/ingredients.json. Do not edit by hand: change the data and rebuild.\n\n`;
  md += `Energy per ingredient is IFCT 2017's own value (kJ converted at 4.184 kJ per kcal). Pure fats (oils, ghee) have no energy value in our IFCT copy, so they use IFCT's fat factor of 37 kJ per g (about 8.84 kcal per g). Ingredients not in IFCT use USDA FoodData Central or the maker's label, as listed.\n\n`;
  for (const food of list) {
    const { totals } = (pages ? results : appResults)[food.slug];
    md += `## ${food.name} (${pages ? `/calories/${food.slug}/` : `app dish ${food.slug}, no page`})\n\n${food.recipe.label}.\n\n`;
    if (food.composite) {
      md += `A composite dish: each portion is the sum of other dishes' portions, taken unrounded from their pages and rounded once (${food.recipe.yieldNote}).\n\nPortions:\n\n`;
      for (const p of food.portions) {
        const extra = (p.add || []).map((a) => ` + ${a.g} g ${ingredients[a.id].name}`).join("");
        md += `- ${p.label}: ${p.expr}${extra} = ${p.kcal} kcal, P ${p.protein} g, C ${p.carbs} g, F ${p.fat} g\n`;
      }
      if (food.outside) md += `\nOutside (${food.outside.label}): ${food.outside.lo} to ${food.outside.hi} = ${food.outside.kcalRange.join(" to ")} kcal. Basis: ${food.outside.basis}\n`;
      if (food.crossCheck?.length) { md += `\nCross-checks:\n\n`; for (const cc of food.crossCheck) md += `- ${cc.source}: ${cc.kcal} kcal per ${food.portions.find((p) => p.id === cc.portionId).short}, ours ${cc.ours} (${cc.differencePct > 0 ? "+" : ""}${cc.differencePct}%). ${cc.note || ""} ${cc.url}\n`; }
      if (food.judgement?.length) md += `\nJudgement calls:\n\n${food.judgement.map((j) => `- ${j}`).join("\n")}\n`;
      md += `\nSources:\n\n${food.sources.map((s) => `- ${s.title}. ${s.url} (accessed ${s.accessed})`).join("\n")}\n\n`;
      continue;
    }
    md += `| Ingredient | Raw g | kcal | Protein g | Carbs g | Fat g | Source |\n|---|---|---|---|---|---|---|\n`;
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
    if (food.meals?.length) {
      md += `\nMeals (sums of each dish's unrounded portion values, calories rounded to 5):\n\n`;
      for (const m of food.meals) md += `- ${m.label}: ${m.expr} = ${m.kcal} kcal, P ${m.protein} g, C ${m.carbs} g, F ${m.fat} g${m.page ? ` (its own page: /calories/${m.page}/)` : ""}\n`;
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

// Hand-kept entries (the home and legal pages) are read back as they are; the generated ones are rebuilt from the
// data, each dish page with its image card as an <image:image>.
function updateSitemap() {
  const xml = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
  const generatedRoots = ["/calories/", ...contentSections.map((s) => s.path), ...infoPages.map((p) => `/${p.slug}/`)];
  const keep = [...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>(?:<image:image>.*?<\/image:image>)*<\/url>/g)]
    .filter((m) => !generatedRoots.some((r) => m[1].startsWith(SITE + r)))
    .map((m) => ({ loc: m[1], lastmod: m[2] }));
  const hubDate = foods.map((f) => f.updated).sort().at(-1);
  const generated = [{ loc: `${SITE}/calories/`, lastmod: hubDate }, { loc: SITE + CALC_PATH, lastmod: CALC_UPDATED },
    ...foods.map((f) => ({ loc: `${SITE}/calories/${f.slug}/`, lastmod: f.updated, image: SITE + cardFor(f, cardManifest).path }))];
  for (const s of contentSections) {
    generated.push({ loc: SITE + s.path, lastmod: s.pages.map((p) => p.updated).sort().at(-1) });
    for (const p of s.pages) generated.push({ loc: `${SITE}${s.path}${p.slug}/`, lastmod: p.updated });
  }
  for (const p of infoPages) generated.push({ loc: `${SITE}/${p.slug}/`, lastmod: p.updated });
  const urls = [...keep, ...generated].map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod>${u.image ? `<image:image><image:loc>${u.image}</image:loc></image:image>` : ""}</url>`).join("\n");
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`);
}

// ---------- llms.txt ----------
// The plain-text guide for AI tools, listing every page from the same data as the sitemap so the two never drift.

function writeLlms() {
  const line = (path, title, description) => `- [${title}](${SITE}${path}): ${description}`;
  const parts = [
    `# Slate

> Slate is a calorie journal for iPhone, built for India, by Sonal Systems Private Limited (Vadodara, Gujarat). You type what you ate the way you'd say it, in English, Hinglish or Gujarati spellings ("2 roti aur ek katori dal"), and Slate puts a number next to it. No login. Data stored in Mumbai, India. Not related to Slate magazine (slate.com) or other products named Slate.

Slate is free forever. Slate Plus is optional: ₹399 a month or ₹2,999 a year in India (7 days free on yearly), $4.99 a month or $34.99 a year in the US, and £4.99 a month or £34.99 a year in the UK. It adds voice and photo logging, delivery orders, chat and more. iPhone only, iOS 18 or later. ${plainStoreUrl() ? `On the App Store: ${plainStoreUrl()}` : "Coming soon to the App Store."}

## Key pages

- [Home](${SITE}/): what Slate is, with a clickable demo of the app
${infoPages.map((p) => line(`/${p.slug}/`, p.title, plainText(`/${p.slug}/`, p.description))).join("\n")}
- [Privacy policy](${SITE}/privacy/)
- [Terms of use](${SITE}/terms/)
- [Support](${SITE}/support/): support@writeonslate.com`,
    `## Food calories

${[line("/calories/", site.hub.title, site.hub.description), line(CALC_PATH, site.calculator.title, site.calculator.description),
    ...foods.map((f) => line(`/calories/${f.slug}/`, plain(f, f.title), plain(f, f.description)))].join("\n")}`,
    ...contentSections.map((s) => `## ${s.crumb}

${[line(s.path, s.hub.title, s.hub.description), ...s.pages.map((p) => line(`${s.path}${p.slug}/`, p.title, plainText(`${s.path}${p.slug}/`, p.description)))].join("\n")}`),
    `## Facts

- Numbers are worked out from the Indian Food Composition Tables (IFCT 2017) and adjusted for your kitchen.
- AI only reads lines Slate doesn't recognise, spots dishes in photos, and powers chat. It never produces a calorie number. Your Slate isn't used to train AI models.
- Not medical advice. For anyone 18 or older.`,
  ];
  write("llms.txt", parts.join("\n\n") + "\n");
}

// ---------- Footer links on hand-written pages ----------
// Keeps the page-links row in the hand-written pages' footer (home, privacy, terms, support, 404) the same
// as the generated pages' (footerRows above).
function syncFooters() {
  const row = footerRows().pages;
  for (const file of ["index.html", "privacy/index.html", "terms/index.html", "support/index.html", "404.html"]) {
    const html = readFileSync(join(ROOT, file), "utf8");
    const next = html.replace(/(<nav class="footer-pages" aria-label="Pages">\n)[\s\S]*?(\n  <\/nav>)/, `$1${row}$2`);
    if (next === html && !html.includes(row)) throw new Error(`${file}: footer page links not found`);
    if (next !== html) write(file, next);
  }
}

// ---------- Launch details on hand-written pages ----------
// The hand-written pages (home, privacy, terms, support, 404) get the Smart App Banner meta, and the home gets the
// App Store badge under its intro and the download links in its JSON-LD, only while data/site.json has the app's id.
// With no id they are left exactly as they are.
function syncLaunchMeta() {
  const meta = appMeta();
  const home = storeUrl("site-home");
  for (const file of ["index.html", "privacy/index.html", "terms/index.html", "support/index.html", "404.html"]) {
    const html = readFileSync(join(ROOT, file), "utf8");
    let next = html.replace(/<meta name="apple-itunes-app" content="[^"]*">\n/, "");
    if (meta) next = next.replace(/(<meta name="viewport"[^>]*>\n)/, `$1${meta}`);
    if (file === "index.html") {
      next = next.replace(/\n    <!-- badge -->[\s\S]*?<!-- \/badge -->/, "");
      if (home) next = next.replace(/(\n  <\/section>\n  <div id="root")/, `\n    <!-- badge -->\n    <p class="home-badge">${badge(home)}</p>\n    <!-- /badge -->$1`);
      next = next.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (m, open, json, close) => {
        const data = JSON.parse(json);
        const app = data["@graph"].find((n) => n["@type"] === "MobileApplication");
        delete app.downloadUrl; delete app.installUrl;
        if (plainStoreUrl()) { app.downloadUrl = plainStoreUrl(); app.installUrl = plainStoreUrl(); }
        return open + JSON.stringify(data) + close;
      });
    }
    if (next !== html) write(file, next);
  }
}

// ---------- Run ----------

// Dishes with a recipe first (the site's, then the app-only ones), then the composites built from them, then the meals.
for (const food of foods) if (!food.composite) results[food.slug] = computeFood(food);
for (const food of appFoods) appResults[food.slug] = computeFood(food);
for (const food of foods) if (food.composite) results[food.slug] = computeComposite(food);
for (const food of foods) computeMeals(food);
// The computed numbers go back into the data first, so scripts/build-cards.mjs (which runs this with --data-only)
// renders the same numbers the pages show.
write("data/foods.json", JSON.stringify(foodsFile, null, 2) + "\n");
if (DATA_ONLY) { console.log(`Computed ${foods.length} dishes into data/foods.json.`); process.exit(0); }
for (const food of foods) write(`calories/${food.slug}/index.html`, foodPage(food, results[food.slug]));
write("calories/index.html", hubPage());
write("calories/calculator/index.html", calculatorPage(writeCalcData(results, appResults).version));
let contentCount = 0;
for (const s of contentSections) {
  write(`${s.path.slice(1)}index.html`, contentHub(s));
  for (const p of s.pages) { write(`${s.path.slice(1)}${p.slug}/index.html`, contentPage(s, p)); contentCount++; }
}
for (const p of infoPages) write(`${p.slug}/index.html`, infoPage(p));
write("research/food-sources.md", researchLog(foods, results, { title: "Food sources and arithmetic", dataFile: "data/foods.json", pages: true }));
if (appFoodsFile) {
  write("data/app-foods.json", JSON.stringify(appFoodsFile, null, 2) + "\n");
  write("research/app-food-sources.md", researchLog(appFoods, appResults, { title: "App-only dishes: sources and arithmetic", dataFile: "data/app-foods.json", pages: false }));
}
updateSitemap();
writeLlms();
syncFooters();
syncLaunchMeta();
console.log(`Built ${foods.length} food pages and the hub, and ${contentCount} content pages in ${contentSections.length} sections.`);
