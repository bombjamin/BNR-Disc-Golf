
const CACHE_NAME = 'golf-app-v2';
const STATIC_CACHE_NAME = 'golf-app-static-v2';

// Only cache static assets, not HTML pages
const urlsToCache = [
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Skip waiting and take control immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Never cache HTML pages or API calls
  if (request.mode === 'navigate' || 
      url.pathname.startsWith('/api/') || 
      request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Cache static assets only
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      url.pathname.includes('/static/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((fetchResponse) => {
            // Cache the response for next time
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => cache.put(request, responseClone));
            }
            return fetchResponse;
          });
        })
    );
    return;
  }
  
  // For everything else, just fetch
  event.respondWith(fetch(request));
});
