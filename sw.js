/* Kloud — minimal offline app-shell service worker.
   Honest scope: this only caches the same-origin files listed below so the app can
   reopen without a network connection once it has been visited at least once over
   http(s). It intentionally does NOT intercept cross-origin requests (e.g. the
   local Kloud Genie connector at localhost:8787), so that feature's "offline"
   behavior is unaffected. Registration silently no-ops on file:// (service workers
   require http/https), which is expected and not an error. */
const CACHE_NAME = 'kloud-app-shell-v2';
const APP_SHELL = [
  './Kloud_Shark_Tank_Full_Experience.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './qrcode-lib.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // never cache/proxy cross-origin (e.g. the Genie connector)
  /* Network-first: always try the live network copy first so edits/updates show up
     immediately on the next reload. Cache is only ever used as an offline fallback
     when the network request fails — never used to silently mask a fresh update. */
  event.respondWith(
    fetch(event.request).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return res;
    }).catch(() => caches.match(event.request))
  );
});
