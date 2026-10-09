// Checks every HTML page on the site against the voice and SEO rules.
//
//   node scripts/check.mjs
//
// Fails (exit 1) on: banned words, exclamation marks, em dashes, emoji, broken
// internal links, missing or over-long titles and descriptions, duplicate
// titles, not exactly one h1, invalid JSON-LD, and FAQPage schema that doesn't
// match the visible FAQ word for word.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
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
  .replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
const attr = (html, re) => (html.match(re) || [])[1];

const problems = [];
const titles = new Map();
const files = htmlFiles(ROOT);

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
  if (/!/.test(visible.replace(/<!/g, ""))) fail(`exclamation mark in "...${visible.slice(Math.max(0, visible.indexOf("!") - 40), visible.indexOf("!") + 10)}..."`);
  if (/—|&mdash;/.test(html)) fail("em dash");
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

if (problems.length) {
  console.log(problems.join("\n"));
  console.log(`\n${problems.length} problem(s) in ${files.length} pages.`);
  process.exit(1);
}
console.log(`${files.length} pages checked. No problems.`);
