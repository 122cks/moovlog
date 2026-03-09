// MOOVLOG Shorts Creator — Service Worker
// 네트워크 우선 전략: API 요청은 캐시하지 않고 앱 쉘만 캐시

const CACHE_NAME = 'moovlog-v2.6';
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
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        // 새 SW가 활성화되면 모든 탭을 자동 새로고침 → 구버전 캐시 즉시 해소
        for (const client of clients) client.navigate(client.url);
      })
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

  // 앱 쉘: HTML은 네트워크 우선(항상 최신 index.html), JS/CSS/폰트는 캐시 우선
  e.respondWith(
    url.pathname.endsWith('.html') || url.pathname.endsWith('/')
      ? fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => caches.match(e.request))
      : caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
