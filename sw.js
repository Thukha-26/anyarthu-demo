/* Anyarthu PWA service worker
   - pages: network first (always fresh), cached copy when offline
   - versioned files & CDN libraries: served from cache, refreshed in the background */
const CACHE = 'anyarthu-v3';
const CORE = ['/', '/index.html', '/logo.png', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/fonts/ATest-Light.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const CDN = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|flagcdn\.com|images\.unsplash\.com)\//;

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;

  // HTML pages: network first so updates show immediately
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('/index.html', copy)); return res; })
      .catch(() => caches.match('/index.html').then(r => r || caches.match('/'))));
    return;
  }
  // site files and trusted CDNs: stale-while-revalidate
  if (same || CDN.test(req.url)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
