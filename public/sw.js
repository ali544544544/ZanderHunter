const CACHE_NAME = 'zanderhunter-v15';
const RUNTIME_CACHE = 'zanderhunter-runtime-v15';
const APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'icons/icon.svg',
  'icons/zander.svg',
  'icons/hecht.svg',
  'icons/barsch.svg'
];

async function putInCache(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return;
  }

  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response.clone());
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putInCache(request, response);
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fresh = fetch(request)
    .then((response) => {
      putInCache(request, response).catch(() => {});
      return response;
    })
    .catch(() => cached);

  return cached || fresh;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await putInCache(request, response);
    return response;
  } catch {
    return caches.match(request) || caches.match('index.html') || caches.match('./');
  }
}

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
            .filter((cacheName) => cacheName.startsWith('zanderhunter-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
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

  if (requestUrl.pathname.endsWith('/sw.js')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (
    requestUrl.pathname.includes('/assets/')
    || requestUrl.pathname.includes('/icons/')
    || requestUrl.pathname.includes('/data/')
    || requestUrl.pathname.endsWith('/manifest.json')
  ) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
