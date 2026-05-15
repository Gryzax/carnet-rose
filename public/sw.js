const CACHE_NAME = 'carnet-rose-pwa-v2';
const APP_SHELL = ['./'];

// Only static, non-sensitive assets belong in the cache. Authenticated API
// responses (e.g. Supabase) must never be persisted: Cache Storage outlives the
// session and is shared across users on the same browser.
const STATIC_DESTINATIONS = ['document', 'script', 'style', 'font', 'image', 'manifest'];

const isCacheable = (request) => {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  // Same-origin only — never cache cross-origin calls (Supabase, OAuth, etc.).
  if (url.origin !== self.location.origin) return false;
  if (request.headers.has('Authorization')) return false;
  return STATIC_DESTINATIONS.includes(request.destination);
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (!isCacheable(event.request)) {
    // Pass through untouched — no caching of dynamic or authenticated content.
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./'))),
  );
});
