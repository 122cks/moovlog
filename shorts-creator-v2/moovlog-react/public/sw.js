// MOOVLOG Shorts Creator — Service Worker v2.50
// 네트워크 우선 전략: API 요청은 캐시하지 않고 앱 쉘만 캐시

const BASE_PATH = new URL(self.registration.scope).pathname;
const CACHE_NAME = 'moovlog-v2.50-20260403-1';
const STATIC_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // ① 구버전 캐시 삭제 → ② claim → ③ 모든 탭 navigate(COOP/COEP 헤더 받도록)
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        // 기존 탭이 COOP/COEP 없이 로드된 경우 SW가 헤더 주입하도록 재진입 유도
        for (const client of clients) {
          // 이미 crossOriginIsolated된 탭은 건드리지 않음 (postMessage로 확인 불가 → 안전하게 navigate)
          client.navigate(client.url).catch(() => {});
        }
      })
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ── FFmpeg WASM용 COOP/COEP 헤더 주입 ──────────────────────────────────────
  // mode === 'navigate': 메인 프레임 페이지 내비게이션 요청 (destination=document 보다 더 정확)
  // 같은 오리진 한정 적용 (cross-origin 리소스 불개입)
  if (e.request.mode === 'navigate' && url.origin === self.location.origin && url.pathname.startsWith(BASE_PATH)) {
    e.respondWith(
      fetch(e.request, { credentials: 'same-origin' }).then(res => {
        // 304 Not Modified는 body가 없으므로 새 Response 생성 불필요 → 원본 그대로
        if (res.status === 304) return res;
        const headers = new Headers(res.headers);
        headers.set('Cross-Origin-Opener-Policy',   'same-origin');
        headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
      }).catch(() => caches.match(e.request))
    );
    return;
  }

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
    (url.pathname.startsWith(BASE_PATH) && (url.pathname.endsWith('.html') || url.pathname.endsWith('/')))
      ? fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => caches.match(e.request))
      : caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
