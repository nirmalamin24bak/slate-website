# writeonslate.com

Marketing site for Slate, the calorie journal for iPhone. Static HTML, CSS and a little vanilla JavaScript. No build step, no dependencies, no third-party requests.

The build spec, design rules and brand rules live in [docs/](docs/): `WEBSITE-SPEC.md`, `DESIGN.md`, `BRAND.md`.

## Run locally

```
vercel dev
```

Opens at http://localhost:3000 with the same headers and routing as production (`vercel.json`).

## Deploy

Pushes to `main` deploy to production on Vercel.

When a page's content changes, update its `<lastmod>` date in `sitemap.xml`.

`style.css` and `demo.js` are cached by browsers for a year. When you change either one, bump its `?v=` number (for example `?v=1` to `?v=2`) in every HTML file that links it, or visitors keep the old file.

## Before launch: TODO(launch)

These notes live here, not in the HTML, because HTML comments are public in the page source.

1. **App Store link.** In `index.html`, replace both `<span class="btn btn-soon">Coming soon to iPhone</span>` (hero `.actions` and closing `.closing-actions`) with Apple's official "Download on the App Store" badge, black in light mode and white in dark mode, linking to the App Store URL.
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
