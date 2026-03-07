/* =============================================
   Service Worker — 무브먼트 Shorts Creator
   Network-first: 배포 즉시 반영
   ============================================= */

const CACHE = 'moovlog-shorts-v5';

// App shell: network-first (배포 즉시 반영)
const APP_SHELL = ['.html', '.js', '.css'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      './manifest.json', './icon-192.png', './icon-512.png',
    ])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('generativelanguage.googleapis.com')) return;
  if (e.request.url.includes('cdn.jsdelivr.net')) return;

  const url = new URL(e.request.url);
  const isLocal = url.origin === location.origin;
  const isAppShell = isLocal && APP_SHELL.some(ext => url.pathname.endsWith(ext));

  if (isAppShell) {
    // Network-first: 항상 최신 버전 제공, 네트워크 실패 시 캐시 폴백
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
  } else {
    // Cache-first: 폰트/아이콘 등 외부 리소스
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
});

