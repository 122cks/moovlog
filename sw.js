// MOOVLOG Shorts Creator — Service Worker v2.71
// 네트워크 우선 전략: API 요청은 캐시하지 않고 앱 쉘만 캐시

const BASE_PATH = new URL(self.registration.scope).pathname;
const CACHE_NAME = 'moovlog-v2.71-20260406-1';
// FFmpeg WASM CDN 파일 — 버전 고정이므로 영구 캐시 (다음 버전 업 시 캐시명 변경)
const WASM_CACHE  = 'moovlog-ffmpeg-wasm-v0.12.6';
const WASM_NAMES  = ['ffmpeg-core.js', 'ffmpeg-core.wasm', 'ffmpeg-core.worker.js'];
const WASM_HOSTS  = ['jsdelivr.net', 'unpkg.com', 'fastly.jsdelivr.net'];
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

  // ⚠️ drive-auth.html 예외: COOP 없이 서빙 → Google OAuth 팝업 통신 허용
  // COOP(same-origin)이 적용된 창에서는 window.opener가 null이 되어 OAuth callback이 차단됨
  if (e.request.mode === 'navigate' && url.pathname.endsWith('/drive-auth.html')) {
    e.respondWith(
      fetch(e.request, { credentials: 'same-origin' })
        .catch(() => caches.match(e.request).then(c => c || new Response('오프라인', { status: 503 })))
    );
    return;
  }

  if (e.request.mode === 'navigate' && url.origin === self.location.origin && url.pathname.startsWith(BASE_PATH)) {
    e.respondWith(
      fetch(e.request, { credentials: 'same-origin' }).then(res => {
        // 304 Not Modified는 body가 없으므로 새 Response 생성 불필요 → 원본 그대로
        if (res.status === 304) return res;
        const headers = new Headers(res.headers);
        headers.set('Cross-Origin-Opener-Policy',   'same-origin');
        headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
      }).catch(async () => {
        // 네트워크 실패 시 캐시에서 제공 — 헤더 반드시 주입 (crossOriginIsolated 유지)
        const cached = await caches.match(e.request);
        if (!cached) return new Response('오프라인 상태입니다. 네트워크를 확인해주세요.', { status: 503 });
        const headers = new Headers(cached.headers);
        headers.set('Cross-Origin-Opener-Policy',   'same-origin');
        headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
        return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
      })
    );
    return;
  }

  // ── FFmpeg WASM CDN 파일 캐싱 (버전 고정 = 영구 캐시 가능) ────────────────
  // @ffmpeg/core@0.12.6 URL은 변하지 않으므로 한 번 다운로드하면 다시 받지 않음
  // → 두 번째 접속부터 WASM 로딩 시간 20~30초 → 1초 이하로 단축
  const isWasmCdn = WASM_NAMES.some(n => url.pathname.endsWith(n)) &&
                    WASM_HOSTS.some(h => url.hostname.includes(h));
  if (isWasmCdn) {
    e.respondWith(
      caches.open(WASM_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) {
            console.log('[SW] WASM cache hit:', url.pathname.split('/').pop());
            return cached;
          }
          return fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached || new Response('WASM 다운로드 실패', { status: 503 }));
        })
      )
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
