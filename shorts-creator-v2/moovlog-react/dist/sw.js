// MOOVLOG Shorts Creator — Service Worker
// 네트워크 우선 전략: API 요청은 캐시하지 않고 앱 쉘만 캐시

const CACHE_NAME = 'moovlog-v2.1';
const STATIC_ASSETS = [
  '/moovlog/shorts-creator/',
  '/moovlog/shorts-creator/index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API, Firebase, Gemini 요청은 캐시 안 함 — 항상 네트워크
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('typecast.ai') ||
    e.request.method !== 'GET'
  ) {
    return;
  }

  // 앱 쉘: 캐시 우선, 실패 시 네트워크
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
