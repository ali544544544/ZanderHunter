const CACHE_NAME = 'zander-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // API-Calls: Network-first (frische Daten bevorzugen)
  if (event.request.url.includes('api.')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  } else {
    // Static Assets: Cache-first
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  }
});
