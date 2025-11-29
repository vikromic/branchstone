const CACHE_NAME = 'branchstone-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './gallery.html',
  './about.html',
  './contact.html',
  './offline.html',
  './css/bundle.css',
  './js/app.js',
  './js/config.js',
  './js/i18n.js',
  './js/theme-init.js',
  './js/artworks.json',
  './js/translations.json',
  './favicon.svg'
];

const IMAGE_CACHE = 'branchstone-images-v1';
const API_CACHE = 'branchstone-api-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('branchstone-') && cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE && cacheName !== API_CACHE;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin === location.origin) {
    if (request.destination === 'image') {
      event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    } else if (url.pathname.endsWith('.json')) {
      event.respondWith(networkFirstWithCache(request, API_CACHE));
    } else if (
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname === '/'
    ) {
      event.respondWith(cacheFirstWithNetworkFallback(request, CACHE_NAME));
    }
  }
});

async function cacheFirstWithNetworkFallback(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (request.destination === 'document') {
      const offlinePage = await caches.match('./offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline - Data not available' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });
  }
}
