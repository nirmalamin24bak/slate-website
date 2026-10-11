// Writes the Slate iPhone app's bundled food data from this site's data, so the app and the
// /calories/ pages work out every dish from the same recipe and the same IFCT 2017 values.
//
//   node scripts/build.mjs                                (first: computes data/foods.json and data/app-foods.json)
//   node scripts/export-app.mjs <path to the rork-slate-591 checkout>
//
// Reads data/foods.json, data/app-foods.json (dishes the app has and the site has no page for),
// data/ingredients.json, data/app-map.json and the app's current dishes.json, so dishes the app
// already had keep their ids, aliases and flags. Writes, in the checkout:
//   ios-slate/Slate/Resources/dishes.json and ingredients.json, supabase/seed_catalogue.sql
// and here: research/app-export.md (each dish against its page, and against the app's old value).
//
// The app's engine (NutritionEngine.swift) counts a dish as its ingredient grams for one unit,
// plus cooking fat in ml (0.92 g per ml, 9 kcal per g) that it scales by the kitchen's oil habit.
// So pure fats (oil, ghee) leave the ingredient list and become cooking_fat_ml. A katori is the
// kitchen's katori in ml times cooked_density_g_per_ml, scaled against the ingredient grams, so
// where the cooked weight is known a water line makes the ingredients add up to it.
// No dependencies: Node 18 or later.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = process.argv[2];
if (!APP || !existsSync(join(APP, "rork.json"))) {
  console.error("Usage: node scripts/export-app.mjs <path to the rork-slate-591 checkout>");
  process.exit(1);
}
const SITE = "https://writeonslate.com";
const RES = join(APP, "ios-slate/Slate/Resources");
const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const ingredients = read(join(ROOT, "data/ingredients.json"));
const appFoodsPath = join(ROOT, "data/app-foods.json");
const siteFoods = read(join(ROOT, "data/foods.json")).foods;
const appOnlyFoods = existsSync(appFoodsPath) ? read(appFoodsPath).foods : [];
const map = read(join(ROOT, "data/app-map.json"));
const oldDishes = read(join(RES, "dishes.json"));
const oldIngredients = read(join(RES, "ingredients.json"));
const oldSeed = readFileSync(join(APP, "supabase/seed_catalogue.sql"), "utf8");

// The engine's constants (NutritionEngine.swift).
const OIL_G_PER_ML = 0.92;
const OIL_KCAL_PER_G = 9;
const STANDARD_KATORI_ML = 200;
const MEDIUM_ROTI_FLOUR_G = 30;
const UNITS = new Set(["katori", "plate", "piece", "roti", "glass", "cup", "g"]);
// Pure fats: the engine counts these as cooking fat, not as ingredients.
const COOKING_FATS = new Set(["oil", "ghee", "coconut_oil", "mustard_oil", "vanaspati"]);

const appId = (siteId) => map.ingredientIds[siteId] ?? siteId;
const siteIdOf = Object.fromEntries(Object.keys(ingredients).map((id) => [appId(id), id]));
const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;
const problems = []; // stop the export
const notes = []; // listed in the report

// ---------- Ingredients ----------

const oldIngById = Object.fromEntries(oldIngredients.map((i) => [i.id, i]));
const outIngredients = Object.entries(ingredients).map(([siteId, ing]) => {
  const id = appId(siteId);
  const v = ing.per100g;
  return {
    id,
    name: ing.name,
    kcal_100g: r1(v.kcal),
    protein_100g: r2(v.protein),
    carbs_100g: r2(v.carbs),
    fat_100g: r2(v.fat),
    fiber_100g: r2(v.fiber),
    sugar_100g: r2(v.sugar),
    density_g_per_ml: ing.densityGPerMl ?? null,
    source: ing.sourceShort,
  };
});
for (const i of outIngredients) if (i.fiber_100g == null || Number.isNaN(i.fiber_100g)) problems.push(`ingredient ${i.id}: no fibre or sugar`);
// Cooked bases the app offers for custom recipes (cooked rice, thin dal): per 100 g of the site's own
// dish, worked out from its recipe and cooked weight, so they always match the page.
for (const [id, d] of Object.entries(map.derivedIngredients || {})) {
  const food = siteFoods.find((f) => f.slug === d.slug);
  const y = food?.recipe.cookedYieldG;
  if (!y) throw new Error(`derived ingredient ${id}: ${d.slug} has no cooked weight`);
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
  for (const item of food.recipe.ingredients) for (const k in t) t[k] += (ingredients[item.id].per100g[k] * item.g) / 100;
  for (const k in t) t[k] = (t[k] * 100) / y;
  outIngredients.push({
    id, name: d.name, kcal_100g: r1(t.kcal), protein_100g: r2(t.protein), carbs_100g: r2(t.carbs), fat_100g: r2(t.fat),
    fiber_100g: r2(t.fiber), sugar_100g: r2(t.sugar), density_g_per_ml: null, source: `IFCT 2017, as at ${SITE}/calories/${d.slug}/`,
  });
  siteIdOf[id] = null;
}
// Every id the app had stays, so custom recipes that use it keep working.
for (const old of oldIngredients) {
  if (!(old.id in siteIdOf)) problems.push(`ingredient ${old.id}: the app has it and data/ingredients.json doesn't`);
}

// ---------- Dishes ----------

const allFoods = [...siteFoods.map((f) => ({ ...f, hasPage: true })), ...appOnlyFoods.map((f) => ({ ...f, hasPage: false }))];
const oldDishById = Object.fromEntries(oldDishes.map((d) => [d.id, d]));

// The share of the recipe in one portion, its cooked grams when known, and its add-ons.
function portionOf(food, portionId) {
  const p = food.portions.find((x) => x.id === portionId);
  if (!p) throw new Error(`${food.slug}: no portion "${portionId}"`);
  const y = food.recipe.cookedYieldG;
  let share, grams = null;
  if (p.fraction != null) { share = p.fraction; grams = y ? p.fraction * y : null; }
  else if (p.grams != null) { share = p.grams / y; grams = p.grams; }
  else if (p.ml != null) { grams = p.ml * food.recipe.densityGPerMl; share = grams / y; }
  else throw new Error(`${food.slug}/${p.id}: portion needs fraction, grams or ml`);
  if (p.hideGrams) grams = null;
  return { p, share, grams };
}

function sourceLabel(lines) {
  const kinds = new Set();
  for (const { id } of lines) {
    const s = ingredients[siteIdOf[id]].sourceShort;
    if (s.startsWith("IFCT")) kinds.add("IFCT 2017");
    else if (s.startsWith("USDA")) kinds.add("USDA");
    else if (/label/i.test(s)) kinds.add("maker's labels");
  }
  const order = ["IFCT 2017", "USDA", "maker's labels"].filter((k) => kinds.has(k));
  return order.length > 1 ? `${order.slice(0, -1).join(", ")} and ${order.at(-1)}` : order[0];
}

function dishRecord(id, m) {
  const food = allFoods.find((f) => f.slug === m.slug);
  if (!food) throw new Error(`${id}: no food "${m.slug}" in data/foods.json or data/app-foods.json`);
  if (!UNITS.has(m.unit)) throw new Error(`${id}: unit "${m.unit}" isn't one the app knows`);
  const { p, share, grams } = portionOf(food, m.portion);
  const sums = new Map();
  const addLine = (siteId, g) => {
    if (!ingredients[siteId]) throw new Error(`${food.slug}: unknown ingredient "${siteId}"`);
    sums.set(siteId, (sums.get(siteId) ?? 0) + g);
  };
  for (const item of food.recipe.ingredients) addLine(item.id, item.g * share);
  let addedGrams = 0;
  for (const a of p.add || []) { addLine(a.id, a.g); if (!COOKING_FATS.has(a.id)) addedGrams += a.g; }
  let fatG = 0;
  const lines = [];
  for (const [siteId, g] of sums) {
    if (COOKING_FATS.has(siteId)) fatG += g;
    else lines.push({ id: appId(siteId), g });
  }
  // Where the cooked weight is known, water makes the ingredients add up to it (fat included,
  // so one katori computes as exactly one katori); otherwise raw water lines are left out.
  const nonWater = lines.filter((l) => l.id !== "water");
  let ingLines = nonWater;
  if (grams != null) {
    const target = grams + addedGrams;
    const water = target - nonWater.reduce((a, l) => a + l.g, 0);
    // Water lost in cooking: no water line. A katori still computes right (its density below is set
    // from these same raw grams); only a portion typed in grams counts low, by the share lost.
    if (water < -0.5) notes.push(`${id}: the raw ingredients weigh ${Math.round(-water)} g more than the cooked portion (water lost in cooking), so a portion typed in grams counts about ${Math.round((-water / (target - water)) * 100)}% low`);
    ingLines = water > 0.05 ? [...nonWater, { id: "water", g: water }] : nonWater;
  }
  const portionGrams = ingLines.reduce((a, l) => a + l.g, 0);
  let density = null;
  if (m.unit === "katori") {
    if (grams == null) throw new Error(`${id}: a katori unit needs a cooked weight for ${food.slug}/${p.id}`);
    density = r2(portionGrams / (p.ml ?? STANDARD_KATORI_ML));
  }
  if (m.unit === "roti" && !ingLines.some((l) => ["atta", "maida"].includes(l.id))) throw new Error(`${id}: a roti unit needs atta or maida`);
  const old = oldDishById[id];
  const claimed = new Set(Object.entries(oldDishById).filter(([k]) => k !== id).flatMap(([, d]) => d.aliases));
  const latin = (s) => /^[a-z0-9 '\-]+$/.test(s);
  const aliases = [...new Set([
    ...(old ? old.aliases : [food.name.toLowerCase(), ...(food.aliases || []).map((a) => a.toLowerCase())].filter((a) => latin(a) && !claimed.has(a))),
    ...(m.addAliases || []),
  ])].filter((a) => !(m.dropAliases || []).includes(a));
  if (!old) {
    const dropped = (food.aliases || []).map((a) => a.toLowerCase()).filter((a) => latin(a) && claimed.has(a));
    if (dropped.length) notes.push(`${id}: aliases already used by another dish, left out: ${dropped.join(", ")}`);
  }
  return {
    food, portion: p,
    record: {
      id,
      name: m.name ?? old?.name ?? food.name,
      region: old?.region ?? null,
      aliases,
      default_unit: m.unit,
      default_qty: old?.default_qty ?? m.qty ?? 1,
      is_home_cookable: m.home ?? old?.is_home_cookable ?? true,
      usually_outside: m.outside ?? old?.usually_outside ?? false,
      cooking_fat_ml: r1(fatG / OIL_G_PER_ML),
      cooked_density_g_per_ml: density,
      ingredients: ingLines.map((l) => ({ ingredient_id: l.id, grams: r2(l.g) })).filter((l) => l.grams > 0),
      source: sourceLabel(ingLines.length ? ingLines : [{ id: "water" }]) ?? "IFCT 2017",
      source_url: food.hasPage ? `${SITE}/calories/${food.slug}/` : m.page ? `${SITE}/calories/${m.page}/` : null,
    },
  };
}

// One unit at home, standard katori, medium roti, kitchen oil factor 1: the engine's arithmetic.
function engine(d, ingById) {
  const portionGrams = d.ingredients.reduce((a, r) => a + r.grams, 0);
  let factor = 1;
  if (d.default_unit === "katori") factor = (STANDARD_KATORI_ML * (d.cooked_density_g_per_ml ?? 1)) / Math.max(portionGrams, 1);
  if (d.default_unit === "roti") {
    const flour = d.ingredients.find((r) => ["atta", "maida", "flour"].includes(r.ingredient_id))?.grams ?? MEDIUM_ROTI_FLOUR_G;
    factor = MEDIUM_ROTI_FLOUR_G / Math.max(flour, 1);
  }
  const v = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const r of d.ingredients) {
    const i = ingById[r.ingredient_id];
    if (!i) continue;
    const g = r.grams * factor;
    v.kcal += (g * i.kcal_100g) / 100; v.protein += (g * i.protein_100g) / 100;
    v.carbs += (g * i.carbs_100g) / 100; v.fat += (g * i.fat_100g) / 100;
  }
  const oilG = d.cooking_fat_ml * factor * OIL_G_PER_ML;
  v.kcal += oilG * OIL_KCAL_PER_G; v.fat += oilG;
  return v;
}

const built = Object.entries(map.dishes).map(([id, m]) => ({ id, m, ...dishRecord(id, m) }));
const keptOld = oldDishes.filter((d) => !map.dishes[d.id]);
for (const d of keptOld) problems.push(`dish ${d.id}: the app has it and data/app-map.json doesn't map it; left as it was`);

const outDishes = [...built.map((b) => b.record), ...keptOld];
const ingById = Object.fromEntries(outIngredients.map((i) => [i.id, i]));
for (const d of outDishes) {
  for (const r of d.ingredients) if (!ingById[r.ingredient_id] && !oldIngById[r.ingredient_id]) throw new Error(`${d.id}: ingredient "${r.ingredient_id}" missing from ingredients.json`);
}
for (const old of oldIngredients) if (!ingById[old.id]) outIngredients.push(old);
const finalIngById = Object.fromEntries(outIngredients.map((i) => [i.id, i]));

// Check every exported dish against its page: same portion, same calories (the site rounds to 5,
// and the engine counts fat at 9 kcal per g where IFCT's fats come to about 8.84).
const rows = [];
for (const b of built) {
  if (b.m.beverage) { rows.push({ ...b, beverage: true }); continue; }
  const app = engine(b.record, finalIngById);
  const site = b.portion;
  const fatG = b.record.cooking_fat_ml * OIL_G_PER_ML;
  const tolerance = 3 + fatG * 0.2;
  const diff = app.kcal - site.kcal;
  if (Math.abs(diff) > tolerance) problems.push(`${b.id}: the app computes ${Math.round(app.kcal)} kcal, the page says ${site.kcal} for ${site.label}`);
  for (const n of ["protein", "carbs", "fat"]) if (Math.abs(app[n] - site[n]) > 1.5) problems.push(`${b.id}: ${n} ${app[n].toFixed(1)} g in the app, ${site[n]} g on the page`);
  const old = oldDishById[b.id];
  rows.push({ ...b, app, old: old ? engine(old, oldIngById) : null });
}

// ---------- Write ----------

const json = (x) => JSON.stringify(x, null, 2) + "\n";
writeFileSync(join(RES, "dishes.json"), json(outDishes));
writeFileSync(join(RES, "ingredients.json"), json(outIngredients));

const q = (s) => (s == null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);
const num = (n) => (n == null ? "NULL" : String(n));
const exercises = oldSeed.slice(oldSeed.indexOf("-- ", oldSeed.search(/^-- \d+ exercises/m)));
let sql = `-- Slate catalogue seed, generated by the website's scripts/export-app.mjs from the same\n`;
sql += `-- data as ios-slate/Slate/Resources/{ingredients,dishes}.json (IFCT 2017, with USDA and makers'\n`;
sql += `-- labels where IFCT has no entry). Exercises are unchanged.\n`;
sql += `-- Safe to re-run: ingredients and dishes upsert on id, and each dish's ingredient rows are\n`;
sql += `-- replaced, so an ingredient a recipe no longer uses doesn't linger.\n\nBEGIN;\n\n`;
sql += `-- ${outIngredients.length} ingredients\nINSERT INTO public.ingredients (id, name, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, sugar_100g, density_g_per_ml, source, updated_at) VALUES\n`;
sql += outIngredients.map((i) => `  (${q(i.id)}, ${q(i.name)}, ${i.kcal_100g}, ${i.protein_100g}, ${i.carbs_100g}, ${i.fat_100g}, ${i.fiber_100g}, ${i.sugar_100g}, ${num(i.density_g_per_ml)}, ${q(i.source)}, now())`).join(",\n");
sql += `\nON CONFLICT (id) DO UPDATE SET\n  name = EXCLUDED.name,\n  kcal_100g = EXCLUDED.kcal_100g,\n  protein_100g = EXCLUDED.protein_100g,\n  carbs_100g = EXCLUDED.carbs_100g,\n  fat_100g = EXCLUDED.fat_100g,\n  fiber_100g = EXCLUDED.fiber_100g,\n  sugar_100g = EXCLUDED.sugar_100g,\n  density_g_per_ml = EXCLUDED.density_g_per_ml,\n  source = EXCLUDED.source,\n  updated_at = EXCLUDED.updated_at;\n\n`;
sql += `-- ${outDishes.length} dishes\nINSERT INTO public.dishes (id, name, region, aliases, default_unit, default_qty, is_home_cookable, cooking_fat_ml, cooked_density_g_per_ml, source, updated_at) VALUES\n`;
sql += outDishes.map((d) => `  (${q(d.id)}, ${q(d.name)}, ${q(d.region)}, ARRAY[${d.aliases.map(q).join(",")}]::text[], ${q(d.default_unit)}, ${d.default_qty}, ${d.is_home_cookable}, ${d.cooking_fat_ml}, ${num(d.cooked_density_g_per_ml)}, ${q(d.source)}, now())`).join(",\n");
sql += `\nON CONFLICT (id) DO UPDATE SET\n  name = EXCLUDED.name,\n  region = EXCLUDED.region,\n  aliases = EXCLUDED.aliases,\n  default_unit = EXCLUDED.default_unit,\n  default_qty = EXCLUDED.default_qty,\n  is_home_cookable = EXCLUDED.is_home_cookable,\n  cooking_fat_ml = EXCLUDED.cooking_fat_ml,\n  cooked_density_g_per_ml = EXCLUDED.cooked_density_g_per_ml,\n  source = EXCLUDED.source,\n  updated_at = EXCLUDED.updated_at;\n\n`;
const dishRows = outDishes.flatMap((d) => d.ingredients.map((r) => `  (${q(d.id)}, ${q(r.ingredient_id)}, ${r.grams})`));
sql += `-- ${dishRows.length} dish ingredient rows\nDELETE FROM public.dish_ingredients WHERE dish_id IN (${outDishes.map((d) => q(d.id)).join(", ")});\n`;
sql += `INSERT INTO public.dish_ingredients (dish_id, ingredient_id, grams) VALUES\n${dishRows.join(",\n")}\nON CONFLICT (dish_id, ingredient_id) DO UPDATE SET\n  grams = EXCLUDED.grams;\n\n`;
sql += exercises.trimEnd() + "\n\nCOMMIT;\n";
writeFileSync(join(APP, "supabase/seed_catalogue.sql"), sql);

// ---------- Report ----------

let md = `# App export\n\nGenerated by \`node scripts/export-app.mjs\`. Do not edit by hand.\n\n`;
md += `Each row is one of the app's default units (standard 200 ml katori, medium roti, kitchen oil factor 1, made at home), computed the way the app's engine does, against the same portion on the site and the app's value before this export.\n\n`;
md += `| App dish | Unit | Site portion | Site kcal | App kcal | Before | Source |\n|---|---|---|---|---|---|---|\n`;
for (const r of rows) {
  const where = r.food.hasPage ? `[${r.food.slug}](${SITE}/calories/${r.food.slug}/)` : `${r.food.slug} (app only)`;
  if (r.beverage) { md += `| ${r.id} | ${r.m.unit} | ${where}: ${r.portion.label} | ${r.portion.kcal} | worked out by the app's chai and coffee formula | | ${r.record.source} |\n`; continue; }
  md += `| ${r.id} | ${r.m.unit} | ${where}: ${r.portion.label} | ${r.portion.kcal} | ${Math.round(r.app.kcal)} | ${r.old ? Math.round(r.old.kcal) : "new"} | ${r.record.source} |\n`;
}
md += `\n${problems.length ? `Problems:\n\n${problems.map((p) => `- ${p}`).join("\n")}\n` : "No problems.\n"}`;
if (notes.length) md += `\nNotes:\n\n${notes.map((n) => `- ${n}`).join("\n")}\n`;
writeFileSync(join(ROOT, "research/app-export.md"), md);

console.log(`Exported ${outDishes.length} dishes (${built.length} from this site's data) and ${outIngredients.length} ingredients.`);
if (problems.length) { console.log(`${problems.length} problems:`); for (const p of problems) console.log(`- ${p}`); process.exitCode = 1; }
