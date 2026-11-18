// KYNX Web Deck Lightweight PWA Service Worker (Zero-Stale Network Pass-Through)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Always use live network so chats, WebSockets, and releases are never stale
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request));
});
