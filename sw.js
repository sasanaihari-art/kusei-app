const CACHE_NAME = 'kusei-v2';
const ASSETS = [
  './', './index.html', './map.html', './places.html', './settings.html',
  './css/style.css',
  './js/kusei-engine.js', './js/chart.js', './js/app.js',
  './js/family.js', './js/places.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network first for API calls, cache first for static assets
  if (e.request.url.includes('nominatim') || e.request.url.includes('tile.openstreetmap')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
