// Renders one image card per dish (assets/cards/<slug>.png, 1200x630) from the numbers in data/foods.json.
//
//   npx -y -p playwright-core@1.63.0 -p sharp@0.35.4 node scripts/build-cards.mjs [--force] [slug ...]
//
// Run it before scripts/build.mjs whenever a dish's name, portions or numbers change: build.mjs links each
// page's card by the version in assets/cards/manifest.json and fails if a card is missing or out of date.
//
// What it does, in order:
//   1. node scripts/build.mjs --data-only, so data/foods.json carries every computed number first;
//   2. builds each card's HTML (scripts/cards-lib.mjs) and hashes it: a card whose hash is in the manifest
//      and whose PNG exists is skipped, so an unchanged dish never re-renders;
//   3. renders the rest in Playwright's Chromium at 1x, with the fonts embedded (no network), fitting the
//      headline label into two lines and shortening a row that would be cut, and fails naming the dish if
//      anything still overflows the card;
//   4. optimises each PNG to a palette with sharp and writes the manifest ({ key, hash, version, alt }).
//
// Nothing is installed in this repo: playwright-core and sharp come from npx's cache (the pinned versions
// above), or from the node_modules folder SLATE_TOOLS names. Chromium is the one Playwright already has
// (PLAYWRIGHT_BROWSERS_PATH, or the default per-user folder); failing that, any Chromium build under the
// seo skill's ms-playwright folder; failing that, run `npx -y playwright-core@1.63.0 install chromium` once.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname, delimiter } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { ROOT, CARDS_DIR, MANIFEST_PATH, CARD_WIDTH, CARD_HEIGHT, SAFE_WIDTH, cardHtml, cardHash, cardKey, cardAlt, readManifest } from "./cards-lib.mjs";

const PLAYWRIGHT = "playwright-core@1.63.0";
const SHARP = "sharp@0.35.4";

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = new Set(args.filter((a) => !a.startsWith("--")));

// ---------- Tools ----------

function loadTools() {
  const dirs = [];
  if (process.env.SLATE_TOOLS) dirs.push(process.env.SLATE_TOOLS);
  dirs.push(join(ROOT, "node_modules"));
  for (const bin of (process.env.PATH || "").split(delimiter)) if (/[\\/]_npx[\\/][^\\/]+[\\/]node_modules[\\/]\.bin$/.test(bin)) dirs.push(dirname(bin));
  for (const dir of dirs) {
    try {
      const req = createRequire(join(dir, "x.js"));
      return { chromium: req("playwright-core").chromium, sharp: req("sharp"), from: dir };
    } catch { /* try the next folder */ }
  }
  throw new Error(`playwright-core and sharp were not found. Run:\n  npx -y -p ${PLAYWRIGHT} -p ${SHARP} node scripts/build-cards.mjs\nor set SLATE_TOOLS to a node_modules folder that has both.`);
}

// Playwright's own Chromium when it is installed; else the newest Chromium build in the folders we know;
// else a clear instruction.
function chromiumPath(chromium) {
  try { const p = chromium.executablePath(); if (p && existsSync(p)) return p; } catch { /* not installed */ }
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), ".claude/skills/seo/ms-playwright"),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "ms-playwright"), join(homedir(), ".cache/ms-playwright"),
    join(homedir(), "Library/Caches/ms-playwright")].filter(Boolean);
  const found = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) {
      const m = name.match(/^chromium(_headless_shell)?-(\d+)$/);
      if (!m) continue;
      for (const rel of ["chrome-win64/chrome.exe", "chrome-win/chrome.exe", "chrome-headless-shell-win64/chrome-headless-shell.exe",
        "chrome-linux/chrome", "chrome-linux64/chrome", "chrome-headless-shell-linux64/chrome-headless-shell",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium"]) {
        const p = join(root, name, rel);
        if (existsSync(p)) found.push({ p, rev: Number(m[2]), shell: Boolean(m[1]) });
      }
    }
  }
  found.sort((a, b) => b.rev - a.rev || Number(a.shell) - Number(b.shell));
  if (found.length) return found[0].p;
  throw new Error(`No Chromium found. Run once:  npx -y ${PLAYWRIGHT} install chromium   (or set PLAYWRIGHT_BROWSERS_PATH to a folder that has one).`);
}

// ---------- Data ----------

// Every number the cards show is one build.mjs worked out and wrote back into data/foods.json.
const data = spawnSync(process.execPath, [join(ROOT, "scripts/build.mjs"), "--data-only"], { encoding: "utf8" });
if (data.status !== 0) { console.error((data.stdout + data.stderr).trim()); process.exit(1); }
const foods = JSON.parse(readFileSync(join(ROOT, "data/foods.json"), "utf8")).foods;
for (const slug of only) if (!foods.some((f) => f.slug === slug)) throw new Error(`no dish "${slug}" in data/foods.json`);
const list = only.size ? foods.filter((f) => only.has(f.slug)) : foods;

const manifest = readManifest();
mkdirSync(join(ROOT, CARDS_DIR), { recursive: true });

const jobs = [];
for (const food of list) {
  const html = cardHtml(food);
  const hash = cardHash(html);
  const entry = manifest.cards[food.slug];
  const file = join(ROOT, CARDS_DIR, `${food.slug}.png`);
  const fresh = entry && entry.hash === hash && existsSync(file);
  if (fresh && !force) { manifest.cards[food.slug] = { ...entry, key: cardKey(food), alt: cardAlt(food) }; continue; }
  jobs.push({ food, html, hash, file });
}

// ---------- Render ----------

// Runs in the page after the fonts load. The headline label shrinks (38 to 28px) until it sits in at most two
// lines and the column still fits the card's height; a row label that would be cut loses its bracketed note;
// then everything is measured, including that nothing leaves the centre column the square crops keep.
// Returns the problems found (none for a good card) and what was adjusted.
const fitAndMeasure = ({ width, height, safeWidth }) => {
  const problems = [];
  const adjusted = [];
  const card = document.querySelector(".card");
  const safe = document.querySelector(".safe");
  const name = document.querySelector(".name");
  const big = document.querySelector(".big");
  const per = document.querySelector(".per");
  const rowsBox = document.querySelector(".rows");
  const foot = document.querySelector(".foot");
  const lines = (el, size) => Math.round(el.getBoundingClientRect().height / (size * 1.15));
  const fitsHeight = () => safe.scrollHeight <= safe.clientHeight && rowsBox.getBoundingClientRect().bottom <= foot.getBoundingClientRect().top - 12;
  const fitLabel = () => {
    for (const size of [38, 36, 34, 32, 30, 28]) {
      per.style.fontSize = `${size}px`;
      if (lines(per, size) <= 2 && fitsHeight()) return true;
    }
    return false;
  };
  // A long label row that still cannot fit wraps to two lines (rows come before the headline's fit, which
  // then works with the height left).
  for (const l of document.querySelectorAll(".row .l")) {
    if (l.scrollWidth <= l.clientWidth) continue;
    const short = l.dataset.full.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    if (short !== l.dataset.full) { l.textContent = short; adjusted.push(`row "${l.dataset.full}" shown as "${short}"`); }
    for (const size of [28, 26]) {
      if (l.scrollWidth <= l.clientWidth) break;
      l.parentElement.style.fontSize = `${size}px`;
      adjusted.push(`row "${l.textContent}" at ${size}px`);
    }
    if (l.scrollWidth > l.clientWidth) {
      Object.assign(l.parentElement.style, { fontSize: "28px", lineHeight: "1.1", padding: "6px 0" });
      l.style.whiteSpace = "normal";
      adjusted.push(`row "${l.textContent}" in two lines`);
      if (Math.round(l.getBoundingClientRect().height / (28 * 1.1)) > 2) problems.push(`row label is cut: "${l.textContent}"`);
    }
  }
  // The headline label keeps its bracketed note when it fits; otherwise it goes, as on the rows.
  if (!fitLabel()) {
    const short = per.textContent.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    if (short !== per.textContent) { adjusted.push(`headline label "${per.textContent}" shown as "${short}"`); per.textContent = short; }
    // Still too tall: the big number steps down, the last thing to give.
    for (const size of [196, 184, 172]) {
      big.style.fontSize = `${size}px`;
      if (fitLabel()) { if (size !== 196) adjusted.push(`number at ${size}px`); break; }
    }
  }
  const perSize = parseFloat(per.style.fontSize);
  if (lines(per, perSize) > 2) problems.push(`headline label needs more than two lines at ${perSize}px: "${per.textContent}"`);
  if (perSize !== 38) adjusted.push(`headline label at ${perSize}px`);
  if (name.scrollWidth > name.clientWidth) problems.push(`dish name is cut: "${name.textContent}"`);
  if (document.documentElement.scrollWidth > width || card.scrollWidth > width) problems.push(`content is wider than ${width}px`);
  if (!fitsHeight()) problems.push("the rows run into the writeonslate.com mark, or the column is taller than the card");
  const footBox = foot.getBoundingClientRect();
  if (footBox.bottom > height - 24) problems.push(`content reaches ${Math.round(footBox.bottom)}px, past the ${height - 24}px bottom margin`);
  const left = (width - safeWidth) / 2 - 1, right = (width + safeWidth) / 2 + 1;
  for (const el of [name, big, per, rowsBox, foot, ...document.querySelectorAll(".row .l, .row .n")]) {
    const r = el.getBoundingClientRect();
    if (r.left < left || r.right > right) { problems.push(`"${el.textContent.slice(0, 30)}" leaves the centre ${safeWidth}px column`); break; }
  }
  const fontsOk = [400, 500, 700, 800].every((w) => document.fonts.check(`${w} 20px "Inter Tight"`));
  if (!fontsOk) problems.push("Inter Tight did not load");
  return { problems, adjusted };
};

const t0 = Date.now();
let rendered = 0;
const failures = [];
const notes = [];
if (jobs.length) {
  const { chromium, sharp, from } = loadTools();
  const executablePath = chromiumPath(chromium);
  console.log(`Tools from ${from}; Chromium at ${executablePath}`);
  const browser = await chromium.launch({ executablePath });
  try {
    const page = await browser.newPage({ viewport: { width: CARD_WIDTH, height: CARD_HEIGHT }, deviceScaleFactor: 1 });
    for (const job of jobs) {
      await page.setContent(job.html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const { problems, adjusted } = await page.evaluate(fitAndMeasure, { width: CARD_WIDTH, height: CARD_HEIGHT, safeWidth: SAFE_WIDTH });
      for (const a of adjusted) notes.push(`${job.food.slug}: ${a}`);
      if (problems.length) { failures.push(`${job.food.slug}: ${problems.join("; ")}`); continue; }
      const raw = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: CARD_WIDTH, height: CARD_HEIGHT } });
      const png = await sharp(raw).png({ palette: true, quality: 100, compressionLevel: 9, effort: 10 }).toBuffer();
      writeFileSync(job.file, png);
      manifest.cards[job.food.slug] = { key: cardKey(job.food), hash: job.hash, version: job.hash.slice(0, 10), alt: cardAlt(job.food) };
      rendered++;
    }
  } finally {
    await browser.close();
  }
}

// Cards for dishes that no longer exist are dropped from the manifest (their files stay until removed by hand).
const slugs = new Set(foods.map((f) => f.slug));
for (const slug of Object.keys(manifest.cards)) if (!slugs.has(slug)) delete manifest.cards[slug];
const sorted = Object.fromEntries(Object.keys(manifest.cards).sort().map((k) => [k, manifest.cards[k]]));
writeFileSync(join(ROOT, MANIFEST_PATH), JSON.stringify({ comment: "Generated by scripts/build-cards.mjs. Do not edit.", width: CARD_WIDTH, height: CARD_HEIGHT, cards: sorted }, null, 2) + "\n", "utf8");

for (const n of notes) console.log(`note  ${n}`);
const files = Object.keys(sorted).map((s) => join(ROOT, CARDS_DIR, `${s}.png`)).filter(existsSync);
const total = files.reduce((n, f) => n + statSync(f).size, 0);
const largest = files.map((f) => [statSync(f).size, f]).sort((a, b) => b[0] - a[0])[0];
console.log(`Rendered ${rendered} of ${list.length} cards in ${((Date.now() - t0) / 1000).toFixed(1)}s (${list.length - jobs.length} unchanged). ${files.length} files, ${Math.round(total / 1024)} KB; largest ${largest ? `${Math.round(largest[0] / 1024)} KB (${largest[1].split(/[\\/]/).pop()})` : "none"}.`);
if (failures.length) {
  console.error(`\n${failures.length} card(s) did not fit:\n${failures.join("\n")}`);
  process.exit(1);
}
