/*
 * Site analytics: PostHog, US cloud, the same project and setup as tldrmoney.in (its assets/analytics.js).
 *
 * No cookies, no localStorage, nothing kept between page loads: each page view
 * gets a random id held in memory only (PostHog's "memory" persistence, done
 * here without the library), so there is nothing to consent to. Events are
 * anonymous ($process_person_profile: false) and carry the page's address
 * without its query string; of the query, only utm_source, utm_medium and utm_campaign are sent, as their own
 * properties. Nothing typed into the calculator or any field is read. Only writeonslate.com and
 * www.writeonslate.com (data-site and its www. form) send anything: previews and localhost stay out.
 *
 * Events:
 *   $pageview           every page load
 *   store_badge_click   { store, placement, site, page }  (any link marked data-store; its placement is the
 *                       data-placement on the link or the nearest element around it, from the closed list in
 *                       data/site.json analytics.placements, which scripts/check.mjs enforces)
 *
 * Every event also carries site. The key and site come from this script tag's data-ph-key and data-site;
 * scripts/build.mjs adds the tag to every page from data/site.json (analytics).
 */
(function () {
  'use strict';
  var tag = document.currentScript;
  var KEY = tag && tag.getAttribute('data-ph-key');
  if (!KEY) return;
  var SITE = tag.getAttribute('data-site');
  /* Production only: the site's own host or its www. form. Vercel previews, localhost and saved copies send nothing. */
  if (!SITE || (location.hostname !== SITE && location.hostname !== 'www.' + SITE)) return;
  var HOST = 'https://us.i.posthog.com';

  /* utm_source, utm_medium and utm_campaign, when the address has them. No other parameter is read or sent. */
  var UTM = {};
  try {
    var query = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
      var v = query.get(k);
      if (v) UTM[k] = v.slice(0, 200);
    });
  } catch (e) { /* no UTM tags then */ }

  var hex = function () {
    var a = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  };
  var ID = hex();
  var PAGE = location.pathname;
  var referrer = function () {
    try {
      if (!document.referrer) return '';
      var r = new URL(document.referrer);
      return r.origin + r.pathname;
    } catch (e) { return ''; }
  };

  function send(event, props) {
    var body = JSON.stringify({
      api_key: KEY,
      event: event,
      distinct_id: ID,
      timestamp: new Date().toISOString(),
      properties: Object.assign({
        $process_person_profile: false,
        $current_url: location.origin + location.pathname,
        $host: location.host,
        $pathname: location.pathname,
        $referrer: referrer(),
        $lib: 'writeonslate-site',
        site: SITE,
      }, UTM, props || {}),
    });
    try {
      /* text/plain keeps it a simple request (no preflight); keepalive lets a
         click that navigates away still deliver. */
      fetch(HOST + '/i/v0/e/', { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' }, credentials: 'omit' });
    } catch (e) { /* analytics never breaks the page */ }
  }

  send('$pageview');

  /* App Store links and badges carry data-store and data-placement (scripts/build.mjs badge() and tableLink()). */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-store]');
    if (!a) return;
    var holder = a.closest('[data-placement]');
    send('store_badge_click', { store: a.getAttribute('data-store'), placement: (holder && holder.getAttribute('data-placement')) || 'unknown', page: PAGE });
  }, true);
})();
