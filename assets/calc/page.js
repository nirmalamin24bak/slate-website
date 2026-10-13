// The meal calculator page (/calories/calculator/): reads the box, runs assets/calc/parse.js on the dishes in
// assets/calc/data.js and draws the table. Everything happens in the browser: no requests after the page loads,
// nothing typed is sent or stored, and the URL is never written to.

const results = document.getElementById("calc-results");
const input = document.getElementById("calc-input");
const countButton = document.getElementById("calc-count");
const copyButton = document.getElementById("calc-copy");
const copy = JSON.parse(results.dataset.copy);
const data = window.SLATE_CALC;
const version = new URL(import.meta.url).searchParams.get("v");

const fmt = (n) => Number(n).toLocaleString("en-IN");
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function render(parseMeal) {
  const text = input.value.trim();
  results.replaceChildren();
  copyButton.hidden = !text;
  if (!text) { results.append(el("p", "mute calc-empty", copy.empty)); return; }
  const { lines, total } = parseMeal(text, data);
  const table = el("table", "nutri calc-table");
  const thead = el("thead"), hr = el("tr");
  copy.columns.forEach((c, i) => { const th = el("th", i >= 2 ? "n" : "", c); th.scope = "col"; hr.append(th); });
  thead.append(hr); table.append(thead);
  const tbody = el("tbody");
  for (const line of lines) {
    const tr = el("tr", line.status === "ok" ? "" : "calc-unmatched");
    tr.append(el("td", "", line.input));
    const what = el("td", "calc-what");
    if (line.status === "ok") {
      if (line.dish.page) { const a = el("a", "", line.dish.name); a.href = line.dish.page; what.append(a); } else what.append(el("span", "", line.dish.name));
      what.append(el("span", "calc-sub mute small", line.portionLabel));
      if (line.assumption) what.append(el("span", "calc-sub mute small", line.assumption));
    } else {
      what.append(el("span", "", `↻ ${line.status === "ambiguous" ? copy.ambiguous : copy.unmatched}`));
      if (line.suggestions.length) {
        const row = el("span", "calc-suggest");
        if (line.status !== "ambiguous") row.append(el("span", "mute small", `${copy.didYouMean} `));
        for (const s of line.suggestions) {
          const b = el("button", "chip", s.name.toLowerCase());
          b.type = "button";
          b.addEventListener("click", () => { replaceItem(line.input, s.name.toLowerCase()); render(parseMeal); });
          row.append(b);
        }
        what.append(row);
      }
    }
    tr.append(what);
    for (const k of ["kcal", "protein", "carbs", "fat"]) tr.append(el("td", "n", k === "kcal" ? fmt(line[k]) : `${fmt(line[k])} g`));
    tbody.append(tr);
  }
  table.append(tbody);
  const tfoot = el("tfoot"), tf = el("tr", "calc-total");
  const th = el("th", "", copy.total); th.scope = "row"; th.colSpan = 2; tf.append(th);
  for (const k of ["kcal", "protein", "carbs", "fat"]) tf.append(el("td", "n", k === "kcal" ? fmt(total[k]) : `${fmt(total[k])} g`));
  tfoot.append(tf); table.append(tfoot);
  const wrap = el("div", "table-wrap");
  wrap.append(table);
  results.append(wrap);
}

// Swaps one typed item for a suggestion, keeping the rest of the line as it is.
function replaceItem(item, name) {
  const value = input.value;
  const at = value.toLowerCase().indexOf(item);
  input.value = at === -1 ? `${value}, ${name}` : value.slice(0, at) + name + value.slice(at + item.length);
}

async function copyMeal() {
  const text = input.value.trim();
  if (!text) return;
  try { await navigator.clipboard.writeText(text); } catch { input.select(); try { document.execCommand("copy"); } catch {} }
  copyButton.textContent = copy.copied;
  setTimeout(() => { copyButton.textContent = copy.copyButton; }, 1500);
}

import(`./parse.js${version ? `?v=${encodeURIComponent(version)}` : ""}`).then(({ parseMeal }) => {
  countButton.addEventListener("click", () => render(parseMeal));
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); render(parseMeal); } });
  copyButton.addEventListener("click", copyMeal);
  for (const chip of document.querySelectorAll("[data-example]")) chip.addEventListener("click", () => { input.value = chip.dataset.example; render(parseMeal); input.focus(); });
  const q = new URLSearchParams(location.search).get("q");
  if (q) { input.value = q.slice(0, 500); render(parseMeal); }
});
