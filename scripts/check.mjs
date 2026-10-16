// Checks every HTML page on the site against the voice and SEO rules.
//
//   node scripts/check.mjs
//
// Fails (exit 1) on: banned words, exclamation marks, em dashes, emoji, broken
// internal links, missing or over-long titles and descriptions, duplicate
// titles, not exactly one h1, invalid JSON-LD, and FAQPage schema that doesn't
// match the visible FAQ word for word. On dish pages, also: a title that carries a number (the calorie count
// searchers click on) within 60 characters and shared with no other page, an answer-first lead of 40 to 65 words
// with no dash or exclamation mark, the byline under the h1, the WebPage's author @id, datePublished (not after
// dateModified) and citation list, and a method section of exactly one paragraph of 120 to 180 words. Runs the
// meal calculator's parser tests (scripts/test-calc.mjs).

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["_preview", "node_modules", ".git", ".vercel", "docs", "research"]);

// docs/BRAND.md §4.1 plus the content brief.
const BANNED = ["just", "healthy", "journey", "great job", "cheat", "cheat day", "guilt-free", "guilt free", "crush", "smash",
  "transform", "burn fat", "detox", "superfood", "clean eating", "junk food", "sinful", "indulge", "earn your food"];
const TITLE_MAX = 60;
const DESC_MAX = 155;
// A dish page's answer-first lead: a self-contained answer of the length answer engines quote (build.mjs foodPage).
const ANSWER_WORDS = [40, 65];
// A dish page's "How were these numbers worked out?" prose: one self-contained paragraph of the length answer
// engines lift whole (build.mjs methodSection), with the range note in a card and the recipe table beside it.
const METHOD_WORDS = [120, 180];
const SITE = "https://writeonslate.com";
const NOT_EMOJI = new Set(["©", "®", "™", "↻", "✓"]);

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const p = join(dir, name);
    return statSync(p).isDirectory() ? htmlFiles(p) : name.endsWith(".html") ? [p] : [];
  });
}

const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&mdash;/g, "—");
const text = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<!--[\s\S]*?-->/g, " ").replace(/<\/?(?:a|span|strong|em|b|i)\b[^>]*>/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
const attr = (html, re) => (html.match(re) || [])[1];

const problems = [];
const titles = new Map();
const files = htmlFiles(ROOT);
const site = JSON.parse(readFileSync(join(ROOT, "data/site.json"), "utf8"));
const foods = JSON.parse(readFileSync(join(ROOT, "data/foods.json"), "utf8")).foods;

// Every combo portion and meal a dish page lists must be answered somewhere in that page's prose or FAQ, through a
// token ({{kcal:two_curd}}), so a row never exists only in a table.
for (const f of foods) {
  const prose = [f.answer, f.description, ...(f.intro || []), ...(f.changes || []), ...[].concat(f.method || []), ...(f.faq || []).flatMap((q) => [q.q, q.a])].join(" ");
  for (const row of [...f.portions.filter((p) => p.combo), ...(f.meals || [])]) {
    if (!prose.includes(`:${row.id}}}`)) problems.push(`data/foods.json: ${f.slug} ${f.meals?.includes(row) ? "meal" : "combo"} "${row.id}" is not named in any FAQ or prose token`);
  }
}

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join("/");
  const html = readFileSync(file, "utf8");
  const fail = (msg) => problems.push(`${rel}: ${msg}`);
  const isNotFound = rel === "404.html";

  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const ldText = ld.join(" ");
  const visible = text(html);
  const words = `${visible} ${decode(attr(html, /<title>([^<]*)<\/title>/) || "")} ${decode(attr(html, /<meta name="description" content="([^"]*)"/) || "")} ${ldText}`;

  for (const w of BANNED) {
    const re = new RegExp(`\\b${w.replace(/[-\s]/g, "[-\\s]")}\\b`, "i");
    const m = words.match(re);
    if (m) fail(`banned word "${w}" in "...${words.slice(Math.max(0, m.index - 40), m.index + 40)}..."`);
  }
  // "Lose It!" is another app's trademark, written as its owner writes it on the /compare/ pages.
  const prose = `${visible} ${decode(attr(html, /<title>([^<]*)<\/title>/) || "")}`.replace(/<!/g, "").replace(/Lose It!/g, "Lose It");
  if (/!/.test(prose)) fail(`exclamation mark in "...${prose.slice(Math.max(0, prose.indexOf("!") - 40), prose.indexOf("!") + 10)}..."`);
  if (/—|&mdash;/.test(html)) fail("em dash");
  // Prose tokens ({{kcal:k200}} and the like) are filled at build time; any left over leaked into a page.
  const token = html.match(/\{\{[^}]*\}\}/);
  if (token) fail(`unresolved template token ${token[0]}`);
  for (const ch of words.match(/\p{Extended_Pictographic}/gu) || []) if (!NOT_EMOJI.has(ch)) fail(`emoji ${ch}`);

  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  if (!title) fail("missing <title>");
  else {
    const t = decode(title);
    if (t.length > TITLE_MAX) fail(`title is ${t.length} characters (max ${TITLE_MAX}): ${t}`);
    if (!isNotFound) titles.set(t, [...(titles.get(t) || []), rel]);
  }
  if (!desc && !isNotFound) fail("missing meta description");
  else if (desc && decode(desc).length > DESC_MAX) fail(`description is ${decode(desc).length} characters (max ${DESC_MAX})`);
  if (!/<html lang="en-IN">/.test(html)) fail('missing <html lang="en-IN">');
  // Once the app has an id, every page carries the Smart App Banner meta (build.mjs head() and syncLaunchMeta()).
  if (site.cta.appId && !html.includes(`<meta name="apple-itunes-app" content="app-id=${site.cta.appId}">`)) fail("missing apple-itunes-app meta");
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(`${h1s} h1 elements`);

  // Dish pages: the title's number, the answer-first lead's length and punctuation, the byline under the h1, and
  // the WebPage's author. (The title's 60-character limit and uniqueness are checked above for every page; head()
  // appends no site suffix, so the <title> text is what Google sees.)
  if (/^calories\/(?!calculator\/)[^/]+\/index\.html$/.test(rel)) {
    if (title && !/\d/.test(decode(title))) fail(`dish title has no number: ${decode(title)}`);
    const lead = attr(html, /<p class="answer-first">([\s\S]*?)<\/p>/);
    if (!lead) fail("missing answer-first lead");
    else {
      const t = text(lead).trim();
      const n = t.split(/\s+/).length;
      if (n < ANSWER_WORDS[0] || n > ANSWER_WORDS[1]) fail(`answer-first lead is ${n} words (${ANSWER_WORDS[0]} to ${ANSWER_WORDS[1]}): ${t}`);
      if (/[—–!]/.test(t)) fail("answer-first lead has an em dash, en dash or exclamation mark");
    }
    if (!html.includes(`<p class="meta-line mute">By <a href="/about/">${site.author.name}</a>. Checked on `)) fail("missing byline under the h1");
    const authorId = `${SITE}/about/#${site.author.id}`;
    let webpage = null;
    try { webpage = (JSON.parse(ld[0] || "{}")["@graph"] || []).find((n) => n["@type"] === "WebPage"); } catch {}
    if (webpage?.author?.["@id"] !== authorId) fail(`WebPage JSON-LD author is not { "@id": "${authorId}" }`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(webpage?.datePublished || "")) fail("WebPage JSON-LD has no datePublished");
    else if (webpage.datePublished > webpage.dateModified) fail(`WebPage datePublished ${webpage.datePublished} is after dateModified ${webpage.dateModified}`);
    if (!Array.isArray(webpage?.citation) || !webpage.citation.length) fail("WebPage JSON-LD has no citation list");

    // The dish's image card: og:image and twitter:image point to its own card, the file exists, the alt text names
    // the headline number, and the JSON-LD carries the ImageObject the WebPage points to as its primary image.
    const slug = rel.split("/")[1];
    const cardUrl = attr(html, /<meta property="og:image" content="([^"]*)"/) || "";
    const cardRe = new RegExp(`^${SITE}/assets/cards/${slug}\\.png\\?v=[0-9a-f]+$`);
    if (!cardRe.test(cardUrl)) fail(`og:image is not this dish's card: ${cardUrl}`);
    else {
      if (!existsSync(join(ROOT, "assets/cards", `${slug}.png`))) fail(`card file assets/cards/${slug}.png is missing`);
      if (attr(html, /<meta name="twitter:image" content="([^"]*)"/) !== cardUrl) fail("twitter:image is not the og:image");
      const alt = decode(attr(html, /<meta property="og:image:alt" content="([^"]*)"/) || "");
      const headline = decode(title || "").match(/\d[\d,]*/)?.[0];
      if (!alt) fail("og:image:alt is empty");
      else if (headline && !alt.includes(headline)) fail(`og:image:alt does not carry the headline number ${headline}: ${alt}`);
      const img = attr(html, /<figure class="dish-card"><img src="([^"]*)"/);
      if (SITE + (img || "") !== cardUrl) fail(`in-page card <img> is ${img || "missing"}, not the og:image`);
      if (!html.includes(`<figure class="dish-card"><img src="${img}" width="1200" height="630" alt="${attr(html, /<meta property="og:image:alt" content="([^"]*)"/)}"`)) fail("in-page card <img> lacks width, height or the same alt text");
      let imageObject = null;
      try { imageObject = (JSON.parse(ld[0] || "{}")["@graph"] || []).find((n) => n["@type"] === "ImageObject"); } catch {}
      if (imageObject?.url !== cardUrl || imageObject?.width !== 1200 || imageObject?.height !== 630 || imageObject?.caption !== alt) fail("ImageObject JSON-LD missing or not the card");
      else if (webpage?.primaryImageOfPage?.["@id"] !== imageObject["@id"]) fail("WebPage primaryImageOfPage does not point to the ImageObject");
    }

    // The method section: exactly one prose paragraph (outside its tables and the range card), 120 to 180 words.
    const section = attr(html, /<section aria-labelledby="method">([\s\S]*?)<\/section>/);
    if (!section) fail("missing method section");
    else {
      const prose = section.replace(/<div class="table-wrap">[\s\S]*?<\/table><\/div>/g, " ").replace(/<div class="card note">[\s\S]*?<\/div>/g, " ");
      const paras = [...prose.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => text(m[1]).trim());
      if (paras.length !== 1) fail(`method section has ${paras.length} paragraphs, not 1`);
      else {
        const n = paras[0].split(/\s+/).length;
        if (n < METHOD_WORDS[0] || n > METHOD_WORDS[1]) fail(`method paragraph is ${n} words (${METHOD_WORDS[0]} to ${METHOD_WORDS[1]})`);
        if (/[—–!]/.test(paras[0])) fail("method paragraph has an em dash, en dash or exclamation mark");
      }
    }
  }

  // The method page: the author's byline and a publication date, like the dish pages it is cited from.
  if (rel === "how-slate-counts/index.html") {
    if (!html.includes(`<p class="meta-line mute">By <a href="/about/">${site.author.name}</a>. Updated `)) fail("missing byline under the h1");
    let webpage = null;
    try { webpage = (JSON.parse(ld[0] || "{}")["@graph"] || []).find((n) => n["@type"] === "WebPage"); } catch {}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(webpage?.datePublished || "")) fail("WebPage JSON-LD has no datePublished");
    if (!Array.isArray(webpage?.citation) || !webpage.citation.length) fail("WebPage JSON-LD has no citation list");
  }

  for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = m[1].split("#")[0].split("?")[0];
    if (!href) continue;
    const target = join(ROOT, href);
    const ok = href.endsWith("/") ? existsSync(join(target, "index.html")) : existsSync(target);
    if (!ok) fail(`broken internal link ${m[1]}`);
  }

  for (const block of ld) {
    let data;
    try { data = JSON.parse(block); } catch (e) { fail(`invalid JSON-LD: ${e.message}`); continue; }
    const nodes = data["@graph"] || [data];
    const faq = nodes.find((n) => n["@type"] === "FAQPage");
    if (faq) {
      const shown = [...html.matchAll(/<details><summary>([\s\S]*?)<\/summary><p class="answer">([\s\S]*?)<\/p><\/details>/g)]
        .map((d) => [text(d[1]).trim(), text(d[2]).trim()]);
      const schema = faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
      const shownSet = new Set(shown.map((x) => x.join("\u0000")));
      for (const q of schema) if (!shownSet.has(q.join("\u0000"))) fail(`FAQPage question not shown word for word: ${q[0]}`);
      const asked = schema.map((q) => q[0].toLowerCase().replace(/\s+/g, " ").trim());
      const repeated = asked.find((q, i) => asked.indexOf(q) !== i);
      if (repeated) fail(`FAQ question asked twice: ${repeated}`);
    }
    for (const n of nodes) if (!n["@type"]) fail("JSON-LD node without @type");
  }
}

for (const [t, where] of titles) if (where.length > 1) problems.push(`duplicate title "${t}": ${where.join(", ")}`);

// The calculator's parser against the data the build wrote.
const calc = spawnSync(process.execPath, [join(ROOT, "scripts/test-calc.mjs")], { encoding: "utf8" });
if (calc.status !== 0) problems.push(`scripts/test-calc.mjs failed:
${(calc.stdout + calc.stderr).trim()}`);

if (problems.length) {
  console.log(problems.join("\n"));
  console.log(`\n${problems.length} problem(s) in ${files.length} pages.`);
  process.exit(1);
}
console.log(`${files.length} pages checked. No problems.`);
