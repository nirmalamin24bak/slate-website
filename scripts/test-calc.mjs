// Golden tests for the meal calculator's parser (assets/calc/parse.js) against the data the build writes
// (assets/calc/data.js). Run by scripts/check.mjs, or on its own:
//
//   node scripts/test-calc.mjs
//
// Expected calories are worked out from the same data (portion.kcal x qty / count, rounded to 5), plus a few
// absolute values that must match the dish pages' own meal rows. Exit 1 on any failure.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fakeWindow = {};
new Function("window", readFileSync(join(ROOT, "assets/calc/data.js"), "utf8"))(fakeWindow);
const data = fakeWindow.SLATE_CALC;
const { parseMeal } = await import(pathToFileURL(join(ROOT, "assets/calc/parse.js")).href);
const foods = JSON.parse(readFileSync(join(ROOT, "data/foods.json"), "utf8")).foods;

const r5 = (x) => Math.round(x / 5) * 5;
const dish = (id) => data.dishes.find((d) => d.id === id);
const portion = (id, pid) => dish(id).portions.find((p) => p.id === pid);
const addon = (id) => data.addons.find((a) => a.id === id);
const pageValue = (slug, id) => { const f = foods.find((x) => x.slug === slug); return (f.portions.find((p) => p.id === id) || f.meals.find((m) => m.id === id)).kcal; };

let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL ${msg}`); };
const ok = (cond, msg) => { if (!cond) fail(msg); };

// expect: [{ id, qty, portion?, addons?: { curd: grams }, assumption?: true }] in order; status for unmatched rows.
function check(text, expect, { total, note } = {}) {
  let out;
  try { out = parseMeal(text, data); } catch (e) { return fail(`"${text}" threw ${e.message}`); }
  if (expect.length !== out.lines.length) return fail(`"${text}": ${out.lines.length} lines, expected ${expect.length}: ${out.lines.map((l) => l.dish?.id || l.status).join(", ")}`);
  let sum = 0;
  expect.forEach((e, i) => {
    const l = out.lines[i];
    const where = `"${text}" line ${i + 1}`;
    if (e.status) {
      ok(l.status === e.status, `${where}: status ${l.status}, expected ${e.status}`);
      ok(l.kcal === 0 && l.dish === null, `${where}: unmatched line must count 0 and have no dish`);
      if (e.suggest) for (const s of e.suggest) ok(l.suggestions.some((x) => x.id === s), `${where}: suggestions ${l.suggestions.map((x) => x.id).join(", ")} lack ${s}`);
      return;
    }
    ok(l.status === "ok" && l.dish?.id === e.id, `${where}: got ${l.dish?.id || l.status}, expected ${e.id}`);
    if (!l.dish) return;
    ok(l.qty === e.qty, `${where}: qty ${l.qty}, expected ${e.qty}`);
    if (e.portion) ok(l.portionId === e.portion, `${where}: portion ${l.portionId}, expected ${e.portion}`);
    if (e.assumption) ok(!!l.assumption, `${where}: expected an assumption line`);
    if (l.row) { ok(l.kcal === pageValue(e.id, l.portionId), `${where}: row ${l.portionId} ${l.kcal}, page ${pageValue(e.id, l.portionId)}`); sum += l.kcal; return; }
    const p = portion(e.id, l.portionId);
    let raw = p ? p.kcal * l.factor : 0;
    for (const [id, g] of Object.entries(e.addons || {})) {
      const a = l.addons.find((x) => x.id === id);
      ok(a && a.g === g, `${where}: add-on ${id} ${a?.g} g, expected ${g} g`);
      raw += addon(id).per100g.kcal * g / 100;
    }
    ok(l.kcal === r5(raw), `${where}: ${l.kcal} kcal, expected ${r5(raw)} from ${l.portionId} x ${l.factor}`);
    sum += l.kcal;
  });
  if (total != null) ok(out.total.kcal === total, `"${text}": total ${out.total.kcal}, expected ${total}${note ? ` (${note})` : ""}`);
  ok(out.total.kcal === r5(sum) || expect.some((e) => e.status), `"${text}": total ${out.total.kcal} is not the sum of its lines ${sum}`);
  return out;
}

check("2 roti, dal, chai", [{ id: "roti", qty: 2, portion: "two" }, { id: "dal-tadka", qty: 1, portion: "k200", assumption: true }, { id: "masala-chai", qty: 1, portion: "cup2", assumption: true }]);
check("2 aloo paratha with curd, 1 chai", [{ id: "aloo-paratha", qty: 2, portion: "two", addons: { curd: 100 } }, { id: "masala-chai", qty: 1, portion: "cup2" }],
  { total: pageValue("aloo-paratha", "two_curd") + pageValue("masala-chai", "cup2"), note: "two_curd on /calories/aloo-paratha/ plus a cup of chai" });
const ap = check("2 aloo paratha with curd", [{ id: "aloo-paratha", qty: 2, portion: "two", addons: { curd: 100 } }], { total: pageValue("aloo-paratha", "two_curd") });
ok(ap?.lines[0].kcal === 440, `"2 aloo paratha with curd" is ${ap?.lines[0].kcal}, the page says 440`);
check("do roti aur ek katori dal", [{ id: "roti", qty: 2, portion: "two" }, { id: "dal-tadka", qty: 1, portion: "k200" }], { total: pageValue("roti", "two_dal"), note: "two_dal meal on /calories/roti/" });
check("half plate chicken biryani", [{ id: "chicken-biryani", qty: 0.5, portion: "plate" }]);
check("idli sambar", [{ id: "idli", qty: 1, portion: "medium" }, { id: "sambar", qty: 1, portion: "k200" }]);
check("chai bina cheeni", [{ id: "masala-chai", qty: 1, portion: "cup0" }]);
check("100 g paneer butter masala", [{ id: "paneer-butter-masala", qty: 100, portion: "g100" }]);
check("२ रोटी", [{ id: "roti", qty: 2, portion: "two" }]);
check("samosa x2", [{ id: "samosa", qty: 2, portion: "two" }]);
check("pizza", [{ status: "unmatched" }]);
check("3 parathe", [{ id: "plain-paratha", qty: 3, portion: "one", assumption: true }]);
check("1 small katori rajma", [{ id: "rajma", qty: 1, portion: "k150" }]);
// "dal chawal" is a meal row on /calories/plain-rice/ word for word, so it is that row, at the page's number.
const dc = check("dal chawal", [{ id: "plain-rice", qty: 1, portion: "dal_chawal" }], { total: 275, note: "dal_chawal meal on /calories/plain-rice/" });
ok(dc?.lines[0].row === true, '"dal chawal" should be the page\'s meal row');
check("dal aur chawal", [{ id: "dal-tadka", qty: 1, portion: "k200", assumption: true }, { id: "plain-rice", qty: 1, portion: "k200", assumption: true }], { total: 275 });
ok(pageValue("plain-rice", "dal_chawal") === 275, "the plain-rice page's dal chawal meal is no longer 275; update the test and the calculator copy");
check("biryani", [{ status: "ambiguous", suggest: ["veg-biryani", "chicken-biryani"] }]);
check("paneer", [{ status: "ambiguous", suggest: ["paneer-butter-masala", "palak-paneer"] }]);
check("", []);
check("2 roti with ghee", [{ id: "roti", qty: 2, portion: "medium_ghee" }], { total: pageValue("roti", "two_ghee"), note: "two_ghee on /calories/roti/" });
check("chai with 1 sugar", [{ id: "masala-chai", qty: 1, portion: "cup1" }]);
check("kam cheeni wali chai", [{ id: "masala-chai", qty: 1, portion: "cup1", assumption: true }]);
check("1 big katori dal fry", [{ id: "dal-fry", qty: 1, portion: "k250" }]);
check("300 ml chaas", [{ id: "chaas", qty: 300, portion: "k250" }]);
check("dahi", [{ id: "curd", qty: 1, portion: "k200" }]);
check("2 idlis", [{ id: "idli", qty: 2, portion: "two" }]);
check("aloo paratha with 1 tbsp butter", [{ id: "aloo-paratha", qty: 1, portion: "one", addons: { butter: 15 } }]);
check("roti\ndal\nrice", [{ id: "roti", qty: 1, portion: "medium" }, { id: "dal-tadka", qty: 1 }, { id: "plain-rice", qty: 1 }]);
check("Rotis 2 & ek cup chai", [{ id: "roti", qty: 2, portion: "two" }, { id: "masala-chai", qty: 1, portion: "cup2" }]);

// Garbage never throws and never grows past the caps.
const garbage = "x".repeat(200) + ", ".repeat(300) + "!!!@@@###" + "\u0000".repeat(50) + "pizza, ".repeat(60);
try {
  const g = parseMeal(garbage, data);
  ok(g.lines.length <= 20, `garbage gave ${g.lines.length} lines`);
  ok(g.total.kcal === 0, `garbage counted ${g.total.kcal} kcal`);
  for (const bad of [null, undefined, 42, {}, [], "\n\n,,,", "with with with", "2 2 2", "½ ¼ ¾"]) parseMeal(bad, data);
} catch (e) { fail(`garbage threw ${e.message}`); }

// Every combo and meal row on every dish page, typed back in plain words, must give exactly the page's numbers,
// and so must every plain portion typed as its label. The calculator never shows a number the page doesn't.
let roundTrip = 0;
for (const f of foods) {
  for (const row of [...f.portions.filter((p) => p.combo), ...(f.meals || [])]) {
    const words = row.label.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    const out = parseMeal(words, data);
    roundTrip++;
    ok(out.total.kcal === row.kcal && out.total.protein === row.protein && out.total.carbs === row.carbs && out.total.fat === row.fat && out.lines.every((l) => l.status === "ok"),
      `${f.slug}/${row.id} "${words}": ${out.total.kcal} kcal, P ${out.total.protein} C ${out.total.carbs} F ${out.total.fat} vs page ${row.kcal}, P ${row.protein} C ${row.carbs} F ${row.fat} (${out.lines.map((l) => `${l.dish?.id || l.status} ${l.portionLabel}`).join(" | ")})`);
  }
}
// The headline portion of every dish, typed as "1 <dish>" or by its unit, shows the page's number for that portion.
for (const d of data.dishes) {
  const p = d.portions.find((x) => x.id === d.headline);
  const out = parseMeal(d.name.toLowerCase(), data);
  roundTrip++;
  ok(out.lines.length === 1 && out.lines[0].portionId === p.id && out.total.kcal === p.page.kcal && out.total.protein === p.page.protein && out.total.carbs === p.page.carbs && out.total.fat === p.page.fat,
    `${d.id} "${d.name.toLowerCase()}": ${out.total.kcal} via ${out.lines[0]?.portionId} vs page ${p.page.kcal} for ${p.id}`);
}
console.log(`${roundTrip} page rows typed back and compared with their page.`);

if (failures) { console.log(`\n${failures} calculator test(s) failed.`); process.exit(1); }
console.log("Calculator tests passed.");
