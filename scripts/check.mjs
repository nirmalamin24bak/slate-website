// Checks every HTML page on the site against the voice and SEO rules.
//
//   node scripts/check.mjs
//
// Fails (exit 1) on: banned words, exclamation marks, em dashes, emoji, broken
// internal links, missing or over-long titles and descriptions, duplicate
// titles, not exactly one h1, invalid JSON-LD, and FAQPage schema that doesn't
// match the visible FAQ word for word. Also runs the meal calculator's parser tests (scripts/test-calc.mjs).

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
  const prose = [f.answer, f.description, ...(f.intro || []), ...(f.changes || []), ...(f.method || []), ...(f.faq || []).flatMap((q) => [q.q, q.a])].join(" ");
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
