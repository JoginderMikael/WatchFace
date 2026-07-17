const CACHE_NAME = 'mechanical-face-v2';
const ASSETS = [
  './',
  './index.html',
  './index.css',
  './index.js',
  './manifest.json'
];

// Install Event - cache core static resources
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).then(() => self.skipWaiting());
    })
  );
});

// Activate Event - clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      ).then(() => self.clients.claim());
    })
  );
});

// Fetch Event - network first (with cache fallback)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(e.request.url);
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
    
  );
});
