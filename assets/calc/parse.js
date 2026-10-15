// The meal calculator's parser: turns "2 aloo paratha with curd, 1 chai" into dish portions and a total,
// from the dishes in assets/calc/data.js (written by scripts/build.mjs). Pure: no DOM, no network, no storage.
//
//   parseMeal(text, data) -> { lines: [...], total: { kcal, protein, carbs, fat } }
//
// A line: { input, dish: { id, name, page } | null, status: "ok" | "ambiguous" | "unmatched", portionLabel, qty,
//   kcal, protein, carbs, fat, assumption: string | null, addons: [{ id, name, label, kcal, protein, carbs, fat }],
//   suggestions: [{ id, name }] }
// Anything it can't recognise counts as 0 and says so; it never guesses a number. Never throws.

const MAX_CHARS = 500;
const MAX_ITEMS = 20;
const NUTRIENTS = ["kcal", "protein", "carbs", "fat"];

const NUM_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  ek: 1, do: 2, teen: 3, tin: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, che: 6, saat: 7, aath: 8, nau: 9, das: 10,
  half: 0.5, aadha: 0.5, adha: 0.5, aadhi: 0.5, adhi: 0.5, quarter: 0.25, dedh: 1.5, dhai: 2.5, dhaai: 2.5, a: 1, an: 1,
};
const UNITS = {
  katori: "katori", katoris: "katori", katora: "katori", vati: "katori", vatki: "katori", bowl: "katori", bowls: "katori",
  plate: "plate", plates: "plate", thali: "plate",
  cup: "cup", cups: "cup", glass: "glass", glasses: "glass", gilas: "glass", tumbler: "glass",
  g: "g", gm: "g", gms: "g", gram: "g", grams: "g", ml: "ml",
  piece: "piece", pieces: "piece", pc: "piece", pcs: "piece", nos: "piece", pack: "piece", packet: "piece", packets: "piece",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp", spoon: "tsp", spoons: "tsp", chammach: "tsp", chamach: "tsp", chamcha: "tsp",
  tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
};
const SIZES = { small: "small", chhoti: "small", choti: "small", chota: "small", chhota: "small", mini: "small", big: "large", bada: "large", badi: "large", large: "large", moti: "large", mota: "large", medium: "medium" };
// Multi-word modifiers become one token before anything else is read.
const PHRASE_TAGS = [
  [/\b(?:bina|without|no|zero)\s+(?:cheeni|chini|shakkar|sugar|meetha)\b|\bsugar\s*free\b|\bsugarless\b/g, "__no_sugar__"],
  [/\b(?:kam|less|half)\s+(?:cheeni|chini|shakkar|sugar|meetha)\b/g, "__less_sugar__"],
  [/\b(\d)\s*(?:tsp\s+|spoon\s+|chammach\s+)?(?:sugar|cheeni|chini|shakkar)\b/g, "__sugar$1__"],
  [/\bek\s+(?:chammach\s+)?(?:cheeni|chini|shakkar|sugar)\b/g, "__sugar1__"],
  [/\b(?:bina|without|no|zero)\s+(?:tel|oil)\b/g, "__no_oil__"],
  [/\b(?:kam|less)\s+(?:tel|oil)\b/g, "__less_oil__"],
  [/\b(?:bina|without|no)\s+(?:tadka|tadke)\b/g, "__no_tadka__"],
  [/\b(?:bina|without|no)\s+pav\b/g, "__no_pav__"],
  [/\b(?:extra|zyada|jyada)\s+ghee\b/g, "ghee"],
  [/\b(?:ke\s+)?(?:saath|sath|sang)\b|\bwith\b|\bwid\b|\bplus\b/g, " __with__ "],
  [/\b(?:wali|wala|wale|waali|waala|waale)\b/g, " "],
];
const WORD_TAGS = { cutting: "cutting", malai: "malai", cream: "cream", toned: "toned", buffalo: "buffalo", bhains: "buffalo", thick: "thick", gaadhi: "thick", pakora: "pakora", pakoda: "pakora", pakore: "pakora", pakode: "pakora", syrup: "syrup", chashni: "syrup", tall: "large" };
const FILLERS = new Set(["of", "the", "some", "ka", "ki", "ke", "ne", "nu", "na", "ni", "full", "homemade", "home", "ghar", "ghar ka", "made", "fresh", "hot", "garam", "thoda", "little", "x", "times", "and", "aur", "ane"]);

const DEV0 = 0x966, GUJ0 = 0xae6;
function normalise(s) {
  return String(s).normalize("NFC").toLowerCase()
    .replace(/[०-९]/g, (c) => String(c.charCodeAt(0) - DEV0))
    .replace(/[૦-૯]/g, (c) => String(c.charCodeAt(0) - GUJ0))
    .replace(/×/g, " x").replace(/½/g, " 1/2 ").replace(/¼/g, " 1/4 ").replace(/¾/g, " 3/4 ")
    .replace(/-/g, " ").replace(/\.(?!\d)/g, ",")
    .replace(/[^\p{L}\p{M}\p{N}\s.,;+&/]/gu, " ");
}
const phraseKey = (s) => normalise(s).replace(/[.,;+&/]/g, " ").replace(/\s+/g, " ").trim();

const r5 = (x) => Math.round(x / 5) * 5;
const zero = () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
const addTo = (a, b, k = 1) => { for (const n of NUTRIENTS) a[n] += (b[n] || 0) * k; return a; };
const roundLine = (v) => ({ kcal: r5(v.kcal), protein: Math.round(v.protein), carbs: Math.round(v.carbs), fat: Math.round(v.fat) });

// ---------- Index (built once per data object) ----------

const indexes = new WeakMap();
function indexOf(data) {
  let idx = indexes.get(data);
  if (idx) return idx;
  const phrases = new Map(); // phrase -> [{ dish, byName }]
  const vocab = new Set();
  const dishes = data.dishes.map((d) => {
    // A composite dish (a plate of other dishes) is matched only through its rows below, never by name, so a
    // quantity in front of it still counts through the dishes it is made of.
    const names = d.composite ? [] : [d.name, d.nameLower || d.name.toLowerCase(), ...(d.aliases || [])].map(phraseKey).filter(Boolean);
    const words = new Set(names.flatMap((n) => n.split(" ")));
    for (const w of words) vocab.add(w);
    return { ...d, names: [...new Set(names)], words };
  });
  for (const d of dishes) d.names.forEach((n, i) => {
    const list = phrases.get(n) || [];
    if (!list.some((x) => x.dish === d)) list.push({ dish: d, byName: i < 2 });
    phrases.set(n, list);
  });
  const generic = new Map(Object.entries(data.generic || {}).map(([k, v]) => [phraseKey(k), v]));
  const addons = new Map();
  for (const a of data.addons || []) for (const w of [a.id, a.name, ...(a.aliases || [])]) addons.set(phraseKey(w), a);
  for (const w of addons.keys()) vocab.add(w);
  let maxWords = 1;
  for (const n of phrases.keys()) maxWords = Math.max(maxWords, n.split(" ").length);
  // A dish page's combo and meal rows, word for word (or by any of a row's listed phrases), with the page's own numbers.
  const rows = new Map();
  for (const d of dishes) for (const r of d.rows || []) for (const ph of [r.label, ...(r.phrases || [])]) if (!rows.has(phraseKey(ph))) rows.set(phraseKey(ph), { dish: d, row: r });
  idx = { dishes, byId: new Map(dishes.map((d) => [d.id, d])), phrases, vocab, generic, addons, maxWords, rows };
  indexes.set(data, idx);
  return idx;
}

// Plurals and Hinglish endings, only when the result is a word the data knows.
function singular(word, idx) {
  const tries = [];
  if (word.endsWith("iyan")) tries.push(word.slice(0, -4) + "i");
  if (word.endsWith("iya")) tries.push(word.slice(0, -3) + "i");
  if (word.endsWith("es")) tries.push(word.slice(0, -2));
  if (word.endsWith("s")) tries.push(word.slice(0, -1));
  if (word.endsWith("e")) tries.push(word.slice(0, -1) + "a");
  if (word.endsWith("oos")) tries.push(word.slice(0, -2));
  if (word.endsWith("in")) tries.push(word.slice(0, -1)); // dahin
  for (const t of tries) if (t.length > 2 && idx.vocab.has(t)) return t;
  return word;
}

// ---------- Splitting ----------

// Chunks between commas and newlines first (a dish page's meal row like "2 rotis and a katori of dal tadka" is
// matched whole), then the joining words inside each chunk.
const splitChunks = (text) => normalise(text.slice(0, MAX_CHARS)).split(/\n|,|;|\+|&/).map((s) => s.trim()).filter(Boolean);
const splitItems = (chunk) => chunk.split(/\s+(?:and|aur|ane|n|evam|tatha)\s+/).map((s) => s.trim()).filter(Boolean);

function tokenise(item) {
  let s = ` ${item} `;
  for (const [re, rep] of PHRASE_TAGS) s = s.replace(re, ` ${rep} `);
  return s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

// Reads the quantity, unit, size and tags out of a token list, leaving the words that may name a dish.
function readMeasure(tokens, idx) {
  const m = { qty: null, unit: null, size: null, tags: new Set(), notes: [], words: [] };
  const num = (w) => {
    let r;
    if ((r = w.match(/^(\d+(?:\.\d+)?)(?:\/(\d+))?$/))) return r[2] ? Number(r[1]) / Number(r[2]) : Number(r[1]);
    if ((r = w.match(/^(?:x(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)x)$/))) return Number(r[1] || r[2]);
    if ((r = w.match(/^(\d+(?:\.\d+)?)(g|gm|gms|ml|pc|pcs)$/))) { m.unit = m.unit || UNITS[r[2]]; return Number(r[1]); }
    return NUM_WORDS[w] ?? null;
  };
  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i];
    let t;
    if ((t = w.match(/^__(\w+?)__$/))) {
      const tag = t[1];
      if (tag === "less_oil") m.notes.push("less oil isn't counted here; Slate's kitchen settings do that");
      else m.tags.add(tag);
      continue;
    }
    const n = num(w);
    // "a"/"an"/"ek" count only at the start; "do" (2) only when a dish word follows.
    if (n != null && m.qty == null && !((w === "a" || w === "an") && i > 0) && !(w === "do" && i === tokens.length - 1)) { m.qty = n; continue; }
    if (UNITS[w] && m.unit == null && !idx.vocab.has(w)) { m.unit = UNITS[w]; continue; }
    if (UNITS[w] && m.unit == null && (i === 0 || num(tokens[i - 1]) != null || SIZES[tokens[i - 1]])) { m.unit = UNITS[w]; continue; }
    if (SIZES[w] && m.size == null) { m.size = SIZES[w]; continue; }
    if (WORD_TAGS[w]) {
      if (WORD_TAGS[w] === "large") m.size = "large"; else m.tags.add(WORD_TAGS[w]);
      // A tag word can also be part of a dish name ("cutting chai"): keep it for matching too.
      if (!idx.vocab.has(w)) continue;
    }
    m.words.push(w);
  }
  return m;
}

// ---------- Matching ----------

function matchDishes(words, idx) {
  const sing = words.map((w) => singular(w, idx));
  const found = []; // { dish | null, generic, phrase, ambiguous: [...] }
  const leftover = [];
  let i = 0;
  const lookup = (phrase, len) => {
    const g = idx.generic.get(phrase);
    if (g) return { len, dish: idx.byId.get(g.id), assumption: g.note, phrase };
    const list = idx.phrases.get(phrase);
    if (!list) return null;
    const byName = list.filter((x) => x.byName);
    if (list.length === 1 || byName.length === 1) return { len, dish: (byName[0] || list[0]).dish, assumption: null, phrase };
    return { len, dish: null, phrase, ambiguous: list.map((x) => x.dish) };
  };
  while (i < words.length) {
    let hit = null;
    for (let len = Math.min(idx.maxWords, words.length - i); len >= 1 && !hit; len--) {
      hit = lookup(words.slice(i, i + len).join(" "), len) || lookup(sing.slice(i, i + len).join(" "), len);
    }
    if (hit) { found.push(hit); i += hit.len; } else { leftover.push(sing[i]); i++; }
  }
  return { found, leftover };
}

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]; prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

// Dishes a phrase could mean: every dish whose name or alias contains all its words (ambiguous when
// there are several), else near spellings (edit distance up to 2) and aliases that contain the phrase.
function suggest(words, idx) {
  const ws = words.filter((w) => !FILLERS.has(w));
  if (!ws.length) return { ambiguous: false, list: [] };
  const phrase = ws.join(" ");
  const whole = idx.dishes.filter((d) => ws.every((w) => d.words.has(w)));
  if (whole.length) return { ambiguous: whole.length > 1, list: whole.slice(0, 4) };
  const scored = [];
  for (const d of idx.dishes) {
    let best = 9;
    for (const n of d.names) {
      if (phrase.length >= 4 && n.includes(phrase)) best = Math.min(best, 2.5);
      best = Math.min(best, editDistance(phrase, n));
      if (ws.length === 1) for (const nw of n.split(" ")) best = Math.min(best, editDistance(phrase, nw) + 1.5);
    }
    if (best <= 2.5) scored.push([best, d]);
  }
  scored.sort((a, b) => a[0] - b[0]);
  return { ambiguous: false, list: scored.slice(0, 3).map((x) => x[1]) };
}

// ---------- Portions ----------

const KATORI_ML = { small: 150, medium: 200, large: 250 };

function pick(dish, m, data) {
  const ports = dish.portions;
  const headline = ports.find((p) => p.id === dish.headline) || ports[0];
  const qty = m.qty ?? 1;
  const notes = [];
  const fallback = (why) => { notes.push(why); return { p: headline, factor: qty / headline.count, label: labelFor(headline, qty) }; };
  const unit = m.unit;
  if (unit === "g") {
    const g = ports.find((p) => p.kind === "g") || (dish.per100 ? { ...dish.per100, id: "per100", label: "100 g", kind: "g", count: 100, tags: [] } : null);
    if (!g) return { ...fallback(`no weight for ${dish.name.toLowerCase()} here, counted as ${headline.label}`), notes };
    return { p: g, factor: qty / g.count, label: `${fmtQty(qty)} g`, notes };
  }
  if (unit === "ml") {
    const p = ports.filter((p) => p.ml).sort((a, b) => Math.abs(a.ml - qty) - Math.abs(b.ml - qty))[0];
    if (!p) return { ...fallback(`no ml size for ${dish.name.toLowerCase()} here, counted as ${headline.label}`), notes };
    return { p, factor: qty / p.ml, label: `${fmtQty(qty)} ml`, notes };
  }
  if (unit === "katori" || (unit === "cup" && !ports.some((p) => p.kind === "cup") && ports.some((p) => p.kind === "katori"))) {
    const target = KATORI_ML[m.size || "medium"] || data.katoriMl;
    const ks = ports.filter((p) => p.kind === "katori" && p.ml);
    if (!ks.length) return { ...fallback(`no katori size for ${dish.name.toLowerCase()} here, counted as ${labelFor(headline, qty)}`), notes };
    if (unit === "cup") notes.push(`a cup counted as a ${target} ml katori`);
    const exact = ks.find((p) => p.ml === target);
    if (exact) return { p: exact, factor: qty, label: labelFor(exact, qty), notes };
    const near = ks.sort((a, b) => Math.abs(a.ml - target) - Math.abs(b.ml - target))[0];
    notes.push(`${target} ml katori scaled from the ${near.ml} ml one`);
    return { p: near, factor: (qty * target) / near.ml, label: `${qty === 1 ? "1" : `${fmtQty(qty)} ×`} ${target} ml katori`, notes };
  }
  const wantKind = unit === "plate" || unit === "cup" || unit === "glass" ? unit : unit === "piece" ? "piece" : headline.kind;
  if (unit && !ports.some((p) => p.kind === wantKind)) {
    return { ...fallback(`no ${unit} size for ${dish.name.toLowerCase()} here, counted as ${labelFor(headline, qty)}`), notes };
  }
  const want = [...m.tags].map((t) => (t === "less_sugar" && !ports.some((p) => p.tags.includes("less_sugar")) ? "sugar1" : t));
  const score = (p) => {
    const missing = want.filter((t) => !p.tags.includes(t)).length;
    const extra = p.tags.filter((t) => !want.includes(t)).length;
    const sizeBad = m.size ? (p.size || "medium") !== m.size : p.size && p.size !== "medium" && p.id !== headline.id;
    return (p.kind !== wantKind ? (unit ? 100 : 20) : 0) + missing * 50 + extra * 8 + (sizeBad ? 6 : 0) + (p.count === qty ? 0 : p.count === 1 ? 1 : 3) + (p.id === headline.id ? 0 : 0.5);
  };
  const best = [...ports].sort((a, b) => score(a) - score(b))[0];
  const missing = want.filter((t) => !best.tags.includes(t));
  for (const t of missing) notes.push(`${TAG_WORDS[t] || t.replace(/_/g, " ")}: no such version of ${dish.name.toLowerCase()} here, counted as usual`);
  if (want.includes("sugar1") && m.tags.has("less_sugar") && best.tags.includes("sugar1")) notes.push("less sugar counted as 1 tsp");
  if (m.size && (best.size || "medium") !== m.size && best.kind !== "katori") notes.push(`no ${m.size} size here, counted as ${best.label}`);
  return { p: best, factor: qty / best.count, label: labelFor(best, qty), notes };
}
const TAG_WORDS = { no_sugar: "without sugar", no_oil: "without oil", no_tadka: "without tadka", no_pav: "without pav", sugar1: "1 tsp sugar", sugar2: "2 tsp sugar", sugar3: "3 tsp sugar" };

function fmtQty(q) {
  if (q === 0.5) return "½"; if (q === 0.25) return "¼"; if (q === 0.75) return "¾"; if (q === 1.5) return "1½"; if (q === 2.5) return "2½";
  return String(Math.round(q * 100) / 100);
}
function labelFor(p, qty) {
  if (qty === p.count) return p.label;
  const bare = p.label.replace(/^(?:\d+(?:\.\d+)?|½|¼|¾|half a|half|a|an)\s+/i, "");
  return qty === 1 ? `1 ${bare}` : `${fmtQty(qty)} × ${bare}`;
}

// ---------- Add-ons ----------

function addonAmount(addon, m) {
  const qty = m.qty ?? 1;
  if (m.unit === "g") return { g: qty, label: `${fmtQty(qty)} g ${addon.name.toLowerCase()}` };
  if (m.unit === "tbsp") return { g: qty * addon.tspG * 3, label: `${fmtQty(qty)} tbsp ${addon.name.toLowerCase()}` };
  if (m.unit === "tsp" || (!m.unit && addon.unit === "tsp")) return { g: qty * addon.tspG, label: `${fmtQty(qty)} tsp ${addon.name.toLowerCase()}` };
  if (m.unit === "katori" || (!m.unit && addon.unit === "katori")) return { g: qty * addon.katoriG, label: `${qty === 1 ? "" : fmtQty(qty) + " × "}${addon.katoriG} g ${addon.name.toLowerCase()}` };
  return { g: qty * (addon.unit === "tsp" ? addon.tspG : addon.katoriG), label: `${fmtQty(qty)} ${addon.unit} ${addon.name.toLowerCase()}` };
}
const addonValue = (addon, g) => { const v = zero(); addTo(v, addon.per100g, g / 100); return { id: addon.id, name: addon.name, g, ...v }; };

// ---------- Lines ----------

function makeLine(input, dish, m, addons, idx, data) {
  const chosen = pick(dish, m, data);
  const raw = addTo(zero(), chosen.p, chosen.factor);
  const notes = [...m.notes, ...chosen.notes];
  const out = [];
  for (const a of addons) {
    // "with ghee" on a dish that has a ghee version: that version, per piece, instead of a flat spoon.
    const qty = m.qty ?? 1;
    const swap = (p) => { const again = addTo(zero(), p, qty / p.count); for (const n of NUTRIENTS) raw[n] = again[n]; chosen.p = p; chosen.factor = qty / p.count; chosen.label = labelFor(p, qty); };
    const tagged = !a.m.qty && !a.m.unit && !chosen.p.tags.includes(a.addon.id)
      && dish.portions.filter((p) => p.kind === chosen.p.kind && p.tags.includes(a.addon.id) && p.tags.length === chosen.p.tags.length + 1).sort((x, y) => (x.count === qty ? 0 : 1) - (y.count === qty ? 0 : 1))[0];
    if (tagged) { swap(tagged); continue; }
    if (a.addon.id === "sugar" && dish.portions.some((p) => p.tags.some((t) => t.startsWith("sugar")))) {
      const n = a.m.qty;
      const p = n && dish.portions.find((p) => p.tags.includes(`sugar${n}`) && p.kind === chosen.p.kind);
      if (p) { swap(p); continue; }
      if (!n) continue; // the cup already has its sugar
    }
    const amt = addonAmount(a.addon, a.m);
    if (!a.m.qty && !a.m.unit) notes.push(`${a.addon.name.toLowerCase()} counted as ${amt.label.replace(/\s*\S+$/, "")}`);
    const v = addonValue(a.addon, amt.g);
    addTo(raw, v);
    out.push({ ...v, label: amt.label });
  }
  // Exactly one of a listed portion and nothing added: the dish page's own number, as shown there.
  const r = chosen.factor === 1 && !out.length && chosen.p.page ? { ...chosen.p.page } : roundLine(raw);
  return {
    input, dish: { id: dish.id, name: dish.name, page: dish.page || null }, status: "ok", portionId: chosen.p.id, factor: chosen.factor,
    portionLabel: chosen.label + (out.length ? " + " + out.map((a) => a.label).join(" + ") : ""), qty: m.qty ?? 1,
    ...r, assumption: notes.length ? [...new Set(notes)].join(". ") : null, addons: out, suggestions: [],
  };
}

function addonLine(input, addon, m) {
  const amt = addonAmount(addon, m);
  const v = addonValue(addon, amt.g);
  const r = roundLine(v);
  return { input, dish: { id: addon.id, name: addon.name, page: null }, status: "ok", portionLabel: amt.label, qty: m.qty ?? 1, ...r, assumption: null, addons: [], suggestions: [] };
}

// A combo or meal row from a dish page, typed back word for word: the page's own numbers.
function rowLine(input, hit) {
  const { dish, row } = hit;
  return { input, dish: { id: dish.id, name: dish.name, page: dish.page || null }, status: "ok", portionId: row.id, factor: 1, row: true, portionLabel: row.label,
    qty: 1, kcal: row.kcal, protein: row.protein, carbs: row.carbs, fat: row.fat, assumption: null, addons: [], suggestions: [] };
}

function emptyLine(input, words, idx) {
  const s = suggest(words, idx);
  return { input, dish: null, status: s.ambiguous ? "ambiguous" : "unmatched", portionLabel: "", qty: 0, kcal: 0, protein: 0, carbs: 0, fat: 0,
    assumption: null, addons: [], suggestions: s.list.map((d) => ({ id: d.id, name: d.name })) };
}

function parseItem(item, idx, data) {
  const tokens = tokenise(item);
  const segs = [];
  let cur = [];
  for (const t of tokens) { if (t === "__with__") { segs.push(cur); cur = []; } else cur.push(t); }
  segs.push(cur);
  const lines = [];
  let last = null; // the line a "with ..." attaches to
  let pendingAddons = [];
  const flush = () => { if (last) { last.addons.push(...pendingAddons); } pendingAddons = []; };
  segs.forEach((seg, si) => {
    if (!seg.length) return;
    const m = readMeasure(seg, idx);
    const { found, leftover } = matchDishes(m.words, idx);
    const addons = [];
    const rest = [];
    for (const w of leftover) { const a = idx.addons.get(w); if (a) addons.push({ addon: a, m: { qty: null, unit: null } }); else if (!FILLERS.has(w) && !/^\d/.test(w)) rest.push(w); }
    // In a "with ..." tail, an add-on word is an add-on even when it is also a dish (curd).
    if (si > 0 && !addons.length && found.length === 1 && found[0].dish && idx.addons.has(found[0].phrase)) { addons.push({ addon: idx.addons.get(found[0].phrase), m: { qty: null, unit: null } }); found.length = 0; }
    // "chai with 1 sugar", "dal with less oil": a tail that is only a modifier belongs to the dish before it.
    if (si > 0 && !found.length && !addons.length && !rest.length && last && !last.line) {
      for (const t of m.tags) last.m.tags.add(t);
      if (m.size && !last.m.size) last.m.size = m.size;
      last.m.notes.push(...m.notes);
      return;
    }
    if (!found.length && addons.length) {
      // Only add-ons here: "with 2 tsp ghee" joins the dish before it; "butter" on its own is a line.
      for (const a of addons) a.m = { qty: m.qty, unit: m.unit };
      if (si > 0 && last) last.addons.push(...addons);
      else for (const a of addons) lines.push({ line: addonLine(seg.join(" "), a.addon, a.m) });
      return;
    }
    if (!found.length) { lines.push({ line: emptyLine(seg.join(" "), rest.length ? rest : seg.filter((w) => !/^__/.test(w)), idx) }); return; }
    found.forEach((f, fi) => {
      const mm = fi === 0 ? m : { ...m, qty: null, unit: null, size: null, tags: new Set(), notes: [] };
      if (!f.dish) { lines.push({ line: { ...emptyLine(f.phrase, f.phrase.split(" "), idx), status: "ambiguous", suggestions: f.ambiguous.map((d) => ({ id: d.id, name: d.name })) } }); return; }
      if (f.assumption) mm.notes = [...mm.notes, f.assumption];
      const entry = { dish: f.dish, m: mm, addons: fi === 0 ? addons : [], input: si === 0 ? item : seg.join(" ") };
      lines.push(entry);
      last = entry;
    });
  });
  flush();
  return lines.map((e) => e.line || makeLine(e.input, e.dish, e.m, e.addons, idx, data));
}

export function parseMeal(text, data) {
  const total = zero();
  let lines = [];
  try {
    const idx = indexOf(data);
    const whole = idx.rows.get(phraseKey(String(text ?? "")));
    if (whole) lines.push(rowLine(String(text).trim(), whole));
    else for (const chunk of splitChunks(String(text ?? "")).slice(0, MAX_ITEMS)) {
      const hit = idx.rows.get(phraseKey(chunk));
      if (hit) lines.push(rowLine(chunk, hit));
      else for (const item of splitItems(chunk)) lines.push(...parseItem(item, idx, data));
    }
    lines = lines.slice(0, MAX_ITEMS);
  } catch (e) {
    lines = [{ input: String(text ?? "").slice(0, 80), dish: null, status: "unmatched", portionLabel: "", qty: 0, kcal: 0, protein: 0, carbs: 0, fat: 0, assumption: null, addons: [], suggestions: [] }];
  }
  for (const l of lines) addTo(total, l);
  total.kcal = r5(total.kcal);
  return { lines, total };
}

if (typeof window !== "undefined") window.parseMeal = parseMeal;
