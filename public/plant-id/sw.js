// Minimal service worker: caches the app shell so the interface loads instantly and
// works offline. Identification itself always needs the network (and the /api proxy),
// so API requests are never cached.

const CACHE = 'plant-id-v7';
const SHELL = [
  './',
  './index.html',
  './css/plant-id.css',
  './js/app.js',
  './js/camera.js',
  './js/downscale.js',
  './js/api.js',
  './js/render.js',
  './js/species-info.js',
  './js/strands.js',
  './js/specular-button.js',
  './js/birdsong.js',
  './js/vendor/ogl.js',
  './manifest.json',
  './icons/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never cache the identify POST

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return; // always hit the network for identification

  // Cache-first for same-origin shell assets, network fallback.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
