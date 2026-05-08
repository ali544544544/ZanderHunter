const CACHE_NAME = 'zanderhunter-v13';
const APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'icons/icon.svg',
  'icons/zander.svg',
  'icons/hecht.svg',
  'icons/barsch.svg'
];

// Install: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Strategy Network-first with Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // 1. EXTERNE QUELLEN (Map Tiles, Wetter API, Pegel)
  // Wir überlassen das Caching dem Browser (Cache-Control Header)
  // um Probleme mit Opaque Responses und Quotas zu vermeiden.
  if (requestUrl.origin !== self.location.origin) {
    return; // Browser übernimmt normales Fetching
  }

  // 2. GROSSE DATEN-DATEIEN (/data/)
  // Diese laden wir immer frisch vom Netzwerk oder Browser-Cache.
  // Das Cachen in der Service Worker Datenbank (15MB+) kann die App bremsen.
  if (requestUrl.pathname.includes('/data/')) {
    return; // Browser übernimmt normales Fetching
  }

  // 3. NAVIGATION (SPA Route handling)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('index.html') || caches.match('./'))
    );
    return;
  }

  // 4. APP ASSETS (JS, CSS, Bilder)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Nur valide Antworten cachen
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
