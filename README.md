# writeonslate.com

Marketing site for Slate, the calorie journal for iPhone. Static HTML, CSS and JavaScript, served as they are: Vercel runs no build step, and there are no third-party requests.

The build spec, design rules and brand rules live in [docs/](docs/): `WEBSITE-SPEC.md`, `DESIGN.md`, `BRAND.md`.

## Run locally

```
vercel dev
```

Opens at http://localhost:3000 with the same headers and routing as production (`vercel.json`).

## Deploy

Pushes to `main` deploy to production on Vercel.

After a deploy is live, run `node scripts/indexnow.mjs` to tell Bing (and the other IndexNow search engines) about every page in `sitemap.xml`. The key is the `<32 hex>.txt` file at the site root; keep it there.

When a page's content changes, update its `<lastmod>` date in `sitemap.xml`. Generated pages take theirs from the `updated` field in `data/` (`foods.json`, `pages.json`, `info.json`); `scripts/build.mjs` writes those entries, and `llms.txt` too. The about and how-Slate-counts pages come from `data/info.json`.

`style.css` and `demo.js` are cached by browsers for a year. When you change either one, bump its `?v=` number (for example `?v=1` to `?v=2`) in every HTML file that links it, or visitors keep the old file.

Images in `assets/` are cached for a week. The icons and the social image (`favicon.svg`, `favicon.png`, `apple-touch-icon.png`, `og.png`, `demo/assets/app-icon.png`) are linked with a `?v=` number for that reason: when you replace one, bump its number in `scripts/build.mjs` and in `index.html`, `privacy/`, `terms/`, `support/` and `404.html` (and in `assets/demo/ios/App.jsx` for the app icon, then rebuild the demo), and run `node scripts/build.mjs`.

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
