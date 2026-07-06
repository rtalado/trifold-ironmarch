// ============================================================================
// TRIFOLD: IRONMARCH — service worker
// Precache on install, then stale-while-revalidate: every load is served from
// cache instantly (offline included) while a background refetch picks up
// whatever was pushed to the repo. New versions apply on the next launch.
// ============================================================================
'use strict';

const CACHE = 'ironmarch-v1';
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
  './js/ui.js',
  './js/main.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const cached = await c.match(req, { ignoreSearch: true });
    const refetch = fetch(req)
      .then(res => { if (res && res.ok) c.put(req, res.clone()); return res; })
      .catch(() => null);
    if (cached) { e.waitUntil(refetch); return cached; }
    const fresh = await refetch;
    return fresh || Response.error();
  }));
});
