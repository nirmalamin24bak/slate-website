// The per-dish image card (design "Number first"): what the card shows, as HTML, and the alt text that
// describes it. Shared by scripts/build-cards.mjs (renders the PNGs) and scripts/build.mjs (links them),
// so the picture, the alt text and the page can never disagree. No dependencies.
//
// Each card is 1200x630: the dish name top left, the headline portion's calories as one big number with
// "calories" and the portion's label beside it, then up to three hairline rows of other portions: the
// ones the page title names first, then the page's order. The Slate mark and writeonslate.com sit top
// right. Light only, the site's tokens (bg #F7F7F5, ink #111214, mute #6E6F74, hairline #E3E3DF),
// Inter Tight from assets/fonts embedded, so the render needs no network.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CARDS_DIR = "assets/cards";
export const MANIFEST_PATH = `${CARDS_DIR}/manifest.json`;
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
// The headline portion plus this many rows.
const PORTIONS_ON_CARD = 4;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (v) => Number(v).toLocaleString("en-IN");

// The portions a card shows, in order: the headline portion, then the portions (or meals) the page title
// names, then the rest of the page's portions table (plain portions first, then the combos). Every number
// is one the page shows, read from the computed fields build.mjs writes into data/foods.json.
export function pickPortions(food, count = PORTIONS_ON_CARD) {
  const find = (id) => food.portions.find((p) => p.id === id) || (food.meals || []).find((m) => m.id === id);
  const refs = [...String(food.title).matchAll(/\{\{kcal:([\w-]+)\}\}/g)].map((m) => m[1]);
  const out = [];
  const seen = new Set();
  const take = (p) => { if (p && !seen.has(p.id)) { seen.add(p.id); out.push(p); } };
  for (const id of [food.headlinePortion, ...refs]) take(find(id));
  for (const p of [...food.portions.filter((p) => !p.combo), ...food.portions.filter((p) => p.combo)]) {
    if (out.length >= count) break;
    take(p);
  }
  const picked = out.slice(0, count);
  for (const p of picked) if (p.kcal == null) throw new Error(`${food.slug}/${p.id}: no computed kcal (run scripts/build.mjs first)`);
  return picked;
}

// "Aloo paratha calories: 190 for 1 aloo paratha, 440 for 2 aloo parathas with curd, ..."
export function cardAlt(food) {
  const [hero, ...rest] = pickPortions(food);
  return `${food.name} calories: ${fmt(hero.kcal)} for ${hero.label}${rest.map((p) => `, ${fmt(p.kcal)} for ${p.label}`).join("")}.`;
}

// What the card depends on, in one string: changes to the name, the picked portions or their numbers change it.
export function cardKey(food) {
  return JSON.stringify({ name: food.name, portions: pickPortions(food).map((p) => [p.label, p.kcal]) });
}

let fontCss = null;
function fonts() {
  if (fontCss) return fontCss;
  const face = (w) => `@font-face{font-family:"Inter Tight";font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${readFileSync(join(ROOT, `assets/fonts/inter-tight-latin-${w}-normal.woff2`)).toString("base64")}) format("woff2")}`;
  return (fontCss = [400, 500, 700, 800].map(face).join(""));
}

let markSvg = null;
// The Slate mark, from assets/favicon.svg (the same artwork as the app icon).
const mark = () => (markSvg ??= readFileSync(join(ROOT, "assets/favicon.svg"), "utf8").replace(/width="64" height="64"/, 'width="100%" height="100%"'));

const CSS = `
:root{--bg:#F7F7F5;--ink:#111214;--mute:#6E6F74;--hair:#E3E3DF}
*{box-sizing:border-box}
html,body{margin:0;width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;overflow:hidden;background:var(--bg);color:var(--ink);font-family:"Inter Tight",sans-serif;font-feature-settings:"tnum";-webkit-font-smoothing:antialiased}
.card{position:relative;width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;padding:56px 72px}
.num{font-variant-numeric:tabular-nums}
.name{font-size:56px;font-weight:700;letter-spacing:-0.01em;line-height:1.1;white-space:nowrap;max-width:720px;overflow:hidden}
.foot{position:absolute;right:72px;top:60px;display:flex;align-items:center;gap:16px;color:var(--mute);font-size:30px;font-weight:500;letter-spacing:-0.01em;white-space:nowrap}
.mark{width:52px;height:52px;border-radius:12px;overflow:hidden;border:1px solid var(--hair);flex:none}
.mark svg{display:block}
.hero{display:flex;align-items:center;gap:28px;margin-top:4px}
.hero .big{font-size:208px;font-weight:800;letter-spacing:-0.035em;line-height:1;margin-left:-8px;flex:none;white-space:nowrap}
.hero .side{display:flex;flex-direction:column;gap:6px;padding-top:12px;flex:1;min-width:0}
.hero .unit{font-size:42px;font-weight:400;color:var(--mute);line-height:1.1}
.hero .per{font-size:48px;font-weight:500;letter-spacing:-0.01em;line-height:1.15}
.rows{margin-top:26px;width:800px}
.row{display:flex;justify-content:space-between;align-items:baseline;gap:24px;padding:12px 0;border-top:1px solid var(--hair);font-size:36px;line-height:1.2}
.row .l{font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row .n{font-weight:500;flex:none}
`;

// The card as a self-contained page. build-cards.mjs renders it; its hash is the card's version.
export function cardHtml(food) {
  const [hero, ...rest] = pickPortions(food);
  const rows = rest.map((p) => `<div class="row"><span class="l" data-full="${esc(p.label)}">${esc(p.label)}</span><span class="n num">${fmt(p.kcal)}</span></div>`).join("");
  return `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><title>${esc(food.name)} calories</title><style>${fonts()}${CSS}</style></head><body><div class="card">
<div class="name">${esc(food.name)}</div>
<div class="hero"><div class="big num">${fmt(hero.kcal)}</div><div class="side"><div class="unit">calories</div><div class="per">${esc(hero.label)}</div></div></div>
<div class="rows">${rows}</div>
<div class="foot"><div class="mark">${mark()}</div><span>writeonslate.com</span></div>
</div></body></html>`;
}

export const cardHash = (html) => createHash("sha256").update(html).digest("hex");

export const readManifest = () => (existsSync(join(ROOT, MANIFEST_PATH)) ? JSON.parse(readFileSync(join(ROOT, MANIFEST_PATH), "utf8")) : { cards: {} });

// The card build.mjs links for a dish: its path with the ?v= from the manifest, and its alt text. Fails when the
// card was never rendered or was rendered from other numbers, so a page never links a stale or missing picture.
export function cardFor(food, manifest) {
  const entry = manifest.cards[food.slug];
  const key = cardKey(food);
  const file = join(ROOT, CARDS_DIR, `${food.slug}.png`);
  if (!entry || entry.key !== key || !existsSync(file)) {
    throw new Error(`${food.slug}: its image card is ${entry ? "out of date" : "missing"}. Run build-cards first (see README), then build again.`);
  }
  return { path: `/${CARDS_DIR}/${food.slug}.png?v=${entry.version}`, alt: cardAlt(food), width: CARD_WIDTH, height: CARD_HEIGHT };
}
