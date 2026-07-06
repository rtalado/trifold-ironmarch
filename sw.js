// ============================================================================
// TRIFOLD: IRONMARCH — service worker
// Network-first with cache fallback: every online launch gets the latest
// deploy immediately; offline launches replay the last cached version.
// ============================================================================
'use strict';

const CACHE = 'ironmarch-v2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/defs.js',
  './js/core.js',
  './js/sprites.js',
  './js/sim.js',
  './js/combat.js',
  './js/render.js',
  './js/run.js',
  './js/meta.js',
  './js/lore.js',
  './js/ui.js',
  './js/main.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const fetchFresh = (req, ms) => {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  return fetch(req, { signal: ctl.signal, cache: 'no-cache' }).finally(() => clearTimeout(t));
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const res = await fetchFresh(req, 4000);
      if (res && res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      const cached = await c.match(req, { ignoreSearch: true });
      if (cached) return cached;
      throw err;
    }
  })());
});
