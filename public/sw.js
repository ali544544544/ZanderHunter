const CACHE_NAME = 'zanderhunter-v14';
const APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'icons/icon.svg',
  'icons/zander.svg',
  'icons/hecht.svg',
  'icons/barsch.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('zanderhunter-') && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (requestUrl.pathname.includes('/data/')) {
    event.respondWith(fetch(event.request, { cache: 'no-cache' }));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .catch(() => caches.match('index.html') || caches.match('./'))
    );
    return;
  }

  if (requestUrl.pathname.includes('/assets/')) {
    event.respondWith(fetch(event.request, { cache: 'no-cache' }));
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
