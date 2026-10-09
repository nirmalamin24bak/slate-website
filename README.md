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

Search the code for `TODO(launch)` to find each spot.

1. **App Store link.** Replace "Coming soon to iPhone" (hero and closing section in `index.html`) with Apple's official "Download on the App Store" badge, black in light mode and white in dark mode, linking to the App Store URL.
2. **Smart App Banner.** Add `<meta name="apple-itunes-app" content="app-id=...">` to `index.html` once the app ID exists.
3. **Effective dates.** Set the effective date on `/privacy/` and `/terms/` to the launch date.
4. **Grievance Officer.** Confirm the name on `/privacy/` (currently Nirmal Amin).
5. **Counsel review.** Have counsel review `/privacy/` and `/terms/`, then remove the `Draft. Counsel review required before launch.` comment at the top of each.
6. **App Store screenshots.** Optional: once real screenshots exist, add a section after the hero.
7. **Email forwarding.** Confirm support@writeonslate.com and privacy@writeonslate.com forward to the founders' inbox before the site goes live.
8. **Shared packet list.** When the shared packet list ships in the app, publish the commented-out paragraph in "What we don't collect" on `/privacy/` (counsel to review it first).
9. **Domain.** Add writeonslate.com to the Vercel project, with www.writeonslate.com redirecting to the apex.

## Fonts

Inter Tight is self-hosted in `assets/fonts/` (OFL licence alongside). The latin files cover the site's text. The `inter-tight-rupee-*` files are cut from Inter Tight's latin-ext subset down to the ₹ sign only, because ₹ is the only latin-ext character the site uses. If copy ever needs another latin-ext character, regenerate those files with `pyftsubset` and widen their `unicode-range` in `assets/style.css`.

## Security headers

`vercel.json` sets HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, a `Permissions-Policy` that turns off camera, microphone and geolocation, and a Content-Security-Policy that allows only this site's own files. Nothing is loaded from any other domain. Keep it that way: no fonts, scripts, analytics or embeds from third parties.
