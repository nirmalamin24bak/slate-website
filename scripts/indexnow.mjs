// Tells Bing (and the other IndexNow search engines) about every page in sitemap.xml.
//
//   node scripts/indexnow.mjs
//
// Run it after a deploy is live, so the pages it names are the new ones. The key is the
// <32 hex characters>.txt file at the site root; IndexNow fetches it to check the request
// comes from this site. Vercel runs no build step, so this is a manual step, not a hook.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "writeonslate.com";
const keyFile = readdirSync(ROOT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("no IndexNow key file (<32 hex>.txt) at the site root");
const key = readFileSync(join(ROOT, keyFile), "utf8").trim();

const urlList = [...readFileSync(join(ROOT, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const live = await fetch(`https://${HOST}/${keyFile}`);
if (!live.ok || (await live.text()).trim() !== key) throw new Error(`https://${HOST}/${keyFile} isn't live yet; deploy first`);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList }),
});
console.log(`IndexNow: ${urlList.length} URLs, HTTP ${res.status}${res.status === 200 || res.status === 202 ? " (accepted)" : ` ${await res.text()}`}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);
