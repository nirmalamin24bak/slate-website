// Pre-compiles the home page demo so the site serves plain JavaScript and CSS.
//
//   node scripts/build-demo.mjs
//
// Writes assets/demo/app.js (the demo, minified) and assets/demo/demo.css (the design
// tokens, minified) from the sources in assets/demo/. Commit both outputs; the pages
// link them with a ?v= number, so bump that number in index.html, privacy/, terms/ and
// support/ whenever they change (vercel.json caches them for a year).
//
// It does at build time exactly what assets/demo/components/_load.js and the old inline
// script did in the browser, in the same order:
//   1. the icon map (components/buttons/icons.js), in place of lucide from a CDN;
//   2. each component in _load.js's FILES order, with its import and export lines
//      rewritten the same way, compiled, and put into the Slate namespace;
//   3. Object.assign(window, Slate);
//   4. each ios/ file in the inline script's order, compiled, with every top-level
//      const and function published on window;
//   5. ReactDOM.createRoot(#root).render(<App label="Try it" storageKey="slate-demo-screen" />),
//      plus the --demo-scale variable that fits the phone frame on small screens.
// React and ReactDOM are the UMD builds in assets/vendor/, loaded by the page before app.js.
//
// Compiles with a pinned esbuild fetched by npx into the npm cache; nothing is installed in
// this repo. No eval, new Function or Babel at run time.

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = join(ROOT, "assets/demo");
const ESBUILD = "esbuild@0.24.2";

// The ios/ files in the order the old inline script fetched them.
const IOS_FILES = ["data.js", "Phone.jsx", "OnboardingScreens.jsx", "JournalScreen.jsx", "SettingsScreens.jsx", "MoreScreens.jsx", "DetailScreens.jsx", "App.jsx"];

const read = (p) => readFileSync(join(DEMO, p), "utf8").replace(/\r\n/g, "\n");

// Component list from _load.js, so the two never drift.
const loader = read("components/_load.js");
const filesMatch = loader.match(/const FILES = \[([\s\S]*?)\];/);
if (!filesMatch) throw new Error("components/_load.js: FILES list not found");
const FILES = [...filesMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

const parts = [];
parts.push("/* Built by scripts/build-demo.mjs from assets/demo/. Do not edit; edit the sources and rebuild. */");

// 1. Icons.
parts.push(read("components/buttons/icons.js"));

// 2. Components: _load.js's rewrites, then the same function scope new Function('ns', 'React', ...) gave them.
parts.push("var Slate = window.Slate = {};");
for (const f of FILES) {
  const code = read(`components/${f}.jsx`)
    .replace(/^import React.*$/mg, "")
    .replace(/^import \{([^}]+)\} from .*$/mg, (m, names) => "const {" + names + "} = ns;")
    .replace(/export function (\w+)/g, "ns.$1 = $1; function $1");
  parts.push(`(function (ns, React) {\n${code}\n})(Slate, React);`);
}

// 3. Every component becomes a global, as the inline script did.
parts.push("Object.assign(window, Slate);");

// 4. Screens: one shared scope, every top-level const and function published on window.
const screens = [];
for (const f of IOS_FILES) {
  const src = read(`ios/${f}`);
  const names = [...src.matchAll(/^(?:const|function) (\w+)/mg)].map((m) => m[1]);
  screens.push(src + "\n" + names.map((n) => `window.${n} = ${n};`).join(""));
}

// 5. Mount, and fit the phone frame to narrow screens (pages.css reads --demo-scale).
const mount = `
var fit = function () {
  var s = Math.min(1, (document.documentElement.clientWidth - 32) / 422);
  document.documentElement.style.setProperty('--demo-scale', s.toFixed(4));
};
fit();
window.addEventListener('resize', fit);
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, { label: 'Try it', storageKey: 'slate-demo-screen' }));
`;
parts.push(`(function () {\n${screens.join("\n")}\n${mount}\n})();`);

const work = mkdtempSync(join(tmpdir(), "slate-demo-"));
try {
  const entry = join(work, "app.jsx");
  writeFileSync(entry, parts.join("\n"), "utf8");
  const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: "inherit", shell: true });
  run(`npx --yes ${ESBUILD} "${entry}" --minify --target=es2018 --legal-comments=none --log-level=warning --outfile="${join(DEMO, "app.js")}"`);
  run(`npx --yes ${ESBUILD} "${join(DEMO, "styles.css")}" --bundle --minify "--external:/assets/fonts/*" --legal-comments=none --log-level=warning --outfile="${join(DEMO, "demo.css")}"`);
} finally {
  rmSync(work, { recursive: true, force: true });
}

// Normalise line endings and add the header comment esbuild strips.
for (const [file, note] of [["app.js", "Built by scripts/build-demo.mjs from assets/demo/. Edit the sources, not this file."], ["demo.css", "Built by scripts/build-demo.mjs from assets/demo/styles.css and tokens/. Edit the sources, not this file."]]) {
  const p = join(DEMO, file);
  const out = `/* ${note} */\n` + readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  writeFileSync(p, out, "utf8");
}

// The names Icon.jsx can render; the build fails if a screen asks for one the map doesn't have.
const iconMap = new Set([...read("components/buttons/icons.js").matchAll(/^\s{2}(\w+):/mg)].map((m) => m[1]));
const sources = [...FILES.map((f) => read(`components/${f}.jsx`)), ...IOS_FILES.map((f) => read(`ios/${f}`))].join("\n");
const wanted = new Set([...sources.matchAll(/\b(?:name|icon)="([a-z0-9-]+)"/g)].map((m) => m[1].split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("")));
const missing = [...wanted].filter((k) => !iconMap.has(k));
if (missing.length) throw new Error(`icons.js is missing: ${missing.join(", ")}`);

const kb = (p) => `${Math.round(readFileSync(join(DEMO, p)).length / 1024)} KB`;
console.log(`Built assets/demo/app.js (${kb("app.js")}) and assets/demo/demo.css (${kb("demo.css")}); ${FILES.length} components, ${IOS_FILES.length} screen files, ${wanted.size} icons.`);
