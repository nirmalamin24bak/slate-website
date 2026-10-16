# writeonslate.com

Marketing site for Slate, the calorie journal for iPhone. Static HTML, CSS and JavaScript, served as they are: Vercel runs no build step, and there are no third-party requests.

The build spec, design rules and brand rules live in [docs/](docs/): `WEBSITE-SPEC.md`, `DESIGN.md`, `BRAND.md`.

## Run locally

```
vercel dev
```

Opens at http://localhost:3000 with the same headers and routing as production (`vercel.json`).

## Deploy

Pushes to `main` deploy to production on Vercel. Before pushing, in this order:

1. `npx -y -p playwright-core@1.63.0 -p sharp@0.35.4 node scripts/build-cards.mjs` when a dish's name, portions or numbers changed (see Dish image cards below; it is quick to run anyway, an unchanged dish renders nothing).
2. `node scripts/build.mjs`.
3. `node scripts/check.mjs`, which checks every page and runs the meal calculator's parser tests (`scripts/test-calc.mjs`).

Commit the generated pages, `data/foods.json`, `sitemap.xml`, `llms.txt` and anything new under `assets/cards/` together.

After a deploy is live, run `node scripts/indexnow.mjs` to tell Bing (and the other IndexNow search engines) about every page in `sitemap.xml`. The key is the `<32 hex>.txt` file at the site root; keep it there.

When a page's content changes, update its `<lastmod>` date in `sitemap.xml`. Generated pages take theirs from the `updated` field in `data/` (`foods.json`, `pages.json`, `info.json`); `scripts/build.mjs` writes those entries, and `llms.txt` too. The about and how-Slate-counts pages come from `data/info.json`.

`style.css` and `demo.js` are cached by browsers for a year. When you change either one, bump its `?v=` number (for example `?v=1` to `?v=2`) in every HTML file that links it, or visitors keep the old file.

Images in `assets/` are cached for a week. The icons and the social image (`favicon.svg`, `favicon.png`, `apple-touch-icon.png`, `og.png`, `demo/assets/app-icon.png`) are linked with a `?v=` number for that reason: when you replace one, bump its number in `scripts/build.mjs` and in `index.html`, `privacy/`, `terms/`, `support/` and `404.html` (and in `assets/demo/ios/App.jsx` for the app icon, then rebuild the demo), and run `node scripts/build.mjs`.

## Dish image cards

Every dish page has its own 1200 by 630 image, `assets/cards/<slug>.png`: the dish name, the headline portion's calories as one big number, three more portions (the ones the page title names first, then the page's order), and the Slate mark. It is the page's `og:image` and `twitter:image`, its `ImageObject` in the JSON-LD, its `<image:image>` in `sitemap.xml`, and the figure under the answer-first paragraph. The alt text reads the same numbers: "Aloo paratha calories: 190 for 1 aloo paratha, 440 for 2 aloo parathas with curd, ...".

`scripts/build-cards.mjs` renders the cards, `scripts/cards-lib.mjs` holds what a card shows (shared with `build.mjs`, so the picture, the alt text and the page never disagree). Run it before `build.mjs` whenever `data/foods.json` changes a dish's name, portions or numbers:

```
npx -y -p playwright-core@1.63.0 -p sharp@0.35.4 node scripts/build-cards.mjs [--force] [slug ...]
```

It first runs `node scripts/build.mjs --data-only` (which computes and writes the numbers into `data/foods.json` and stops), hashes each card's HTML and renders only the cards whose hash changed, in Playwright's Chromium with the fonts embedded, then optimises each PNG to a palette with sharp (about 22 KB each, 96 cards in about 16 seconds from cold). It fails naming the dish if anything would be cut off. `assets/cards/manifest.json` records each card's hash and version; `build.mjs` links each page's card with `?v=<version>` (cached for a year by `vercel.json`) and fails with "run build-cards first" if a card is missing or was rendered from other numbers. Commit the PNGs and the manifest.

Nothing is installed in this repo: `npx -p` fetches the two pinned packages into npm's cache, or set `SLATE_TOOLS` to a `node_modules` folder that has `playwright-core` and `sharp`. Chromium is the one Playwright already has on the machine (`PLAYWRIGHT_BROWSERS_PATH` or the per-user `ms-playwright` folder, including the seo skill's copy); if none is found, run `npx -y playwright-core@1.63.0 install chromium` once.

## Meal calculator

`/calories/calculator/` is built by `calculatorPage()` in `scripts/build.mjs` from the copy in `data/site.json` (`calculator`). `writeCalcData()` writes `assets/calc/data.js` (every dish from `data/foods.json` and `data/app-foods.json` with its aliases and plain portions, plus the side add-ons from `data/ingredients.json`); `assets/calc/parse.js` turns a typed meal into portions and `assets/calc/page.js` draws the table. Everything runs in the browser: no requests after load, nothing typed is sent or stored. The three files are linked with a `?v=` hash of their contents, so the build bumps it on any change (`vercel.json` caches them for a year).

## Home page demo

The home page is a clickable app demo built with React. Its sources are in `assets/demo/` (`components/`, `ios/`, `tokens/`). After editing any of them, run `node scripts/build-demo.mjs`, which compiles them into `assets/demo/app.js` and `assets/demo/demo.css` (it fetches a pinned esbuild through npx; nothing is installed here). Commit both outputs, then bump their `?v=` numbers in `index.html`, `privacy/`, `terms/`, `support/` and `404.html`.

Every page shares one frame from `assets/pages.css`: the header (app icon, Slate, Try it), the short footer and the light, white look, on a 710px column with a 20px gutter so the header never moves between pages. The generated pages get it from `head()` and `footer()` in `scripts/build.mjs`; the hand-written pages (home, privacy, terms, support, 404) carry the same markup. When `pages.css` or `demo.css` changes, bump `PAGES_CSS_VERSION` or `DEMO_CSS_VERSION` in `scripts/build.mjs` and the same `?v=` in the hand-written pages, then rebuild. React and ReactDOM 18.3.1 are self-hosted in `assets/vendor/`, and the demo's icons are a small copy of the lucide glyphs it uses (`components/buttons/icons.js`), so the page still loads nothing from another domain.

## Before launch: TODO(launch)

These notes live here, not in the HTML, because HTML comments are public in the page source.

1. **App Store link.** Set `cta.appStoreUrl` in `data/site.json` (the generated pages then show the App Store link) and add Apple's official "Download on the App Store" badge to the home page's `.home-intro` in `index.html`. Replace "Coming soon to the App Store." in `writeLlms()` in `scripts/build.mjs` with the App Store URL; `llms.txt` is generated there on every build, so don't edit it by hand.
2. **Smart App Banner.** Add `<meta name="apple-itunes-app" content="app-id=...">` to the `<head>` of `index.html`, after the Twitter tags, once the app ID exists.
3. **Effective dates.** Set the `Effective 8 October 2026` line (`.legal-date`, under the h1) on `/privacy/` and `/terms/` to the App Store launch date.
4. **Grievance Officer.** Confirm the name in "Grievance Officer and contact" on `/privacy/` (currently Nirmal Amin).
5. **Counsel review.** `/privacy/` and `/terms/` are drafts. Have counsel review both before launch.
6. **App Store screenshots.** Optional: once real screenshots exist, add a section after the hero.
7. **Email forwarding.** Confirm support@writeonslate.com and privacy@writeonslate.com forward to the founders' inbox before the site goes live.
8. **Shared packet list.** When the shared packet list ships in the app, add this paragraph at the end of "What we don't collect" on `/privacy/`, after the barcode paragraph (counsel to review it first):

   ```html
   <p>If you scan a packet Slate doesn't know, the product's nutrition facts (barcode, name, brand and values per 100 g, never anything about you) are added to Slate's shared packet list so the next scan works.</p>
   ```

9. ~~**Domain.**~~ Done 9 October 2026: writeonslate.com is the primary domain, www.writeonslate.com redirects to it, and slate-website.vercel.app redirects to it (`vercel.json`).

## Fonts

Inter Tight is self-hosted in `assets/fonts/` (OFL licence alongside). The latin files cover the site's text. The `inter-tight-rupee-*` files are cut from Inter Tight's latin-ext subset down to the ₹ sign only, because ₹ is the only latin-ext character the site uses. If copy ever needs another latin-ext character, regenerate those files with `pyftsubset` and widen their `unicode-range` in `assets/style.css`.

## Security headers

`vercel.json` sets HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, a `Permissions-Policy` that turns off camera, microphone and geolocation, and a Content-Security-Policy that allows only this site's own files. Nothing is loaded from any other domain. Keep it that way: no fonts, scripts, analytics or embeds from third parties.
