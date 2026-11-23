// KYNX Web Deck High-Performance PWA Service Worker (v15 - Exact Glassy OTP V15 Motion Animation)
const CACHE_NAME = 'kynx-pwa-v15';

const STATIC_PRECACHE = [
  '/web',
  '/css/web.css?v=15',
  '/css/web.css',
  '/js/web-engine.js?v=15',
  '/js/web-engine.js',
  '/js/qrcode.min.js',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/assets/kynx-logo.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[KYNX SW] Precache non-critical item warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Live Passthrough for APIs, WebSockets, and External Media Uploads
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/ws') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return;
  }

  // 2. Navigation Request (/web - App Shell)
  // Stale-While-Revalidate: Return cached shell in 0ms, fetch fresh update in background
  if (req.mode === 'navigate' || url.pathname === '/web') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match('/web');
        const networkFetch = fetch(req).then((netRes) => {
          if (netRes && netRes.status === 200) {
            cache.put('/web', netRes.clone());
          }
          return netRes;
        }).catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // 3. Static Assets (CSS, JS, Logos, Icons)
  // Stale-While-Revalidate: Instant 0ms cache return, silent background refresh
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/css/') ||
     url.pathname.startsWith('/js/') ||
     url.pathname.startsWith('/assets/') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.ico') ||
     url.pathname.endsWith('.json'))
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then((netRes) => {
          if (netRes && netRes.status === 200) {
            cache.put(req, netRes.clone());
          }
          return netRes;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. Google Web Fonts (Cache-First)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const netRes = await fetch(req);
          if (netRes && netRes.status === 200) {
            cache.put(req, netRes.clone());
          }
          return netRes;
        } catch (_) {
          return cached;
        }
      })
    );
    return;
  }

  // Default: Live Network Fetch
  event.respondWith(fetch(req));
});
