const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/engine-core-CVvj_IMC.js","assets/engine-script-Hqvxxul9.js","assets/vendor-firebase-CmLdJ1V2.js","assets/vendor-DKjQ1qLu.js","assets/vendor-react-CvBl8VdO.js"])))=>i.map(i=>d[i]);
import { p as create, v as devtools } from './vendor-DKjQ1qLu.js';
import './engine-core-CVvj_IMC.js';

const scriptRel = 'modulepreload';const assetsURL = function(dep) { return "/moovlog/shorts-creator/"+dep };const seen = {};const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (true && deps && deps.length > 0) {
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep, importerUrl);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        const isBaseRelative = !!importerUrl;
        if (isBaseRelative) {
          for (let i = links.length - 1; i >= 0; i--) {
            const link2 = links[i];
            if (link2.href === dep && (!isCss || link2.rel === "stylesheet")) {
              return;
            }
          }
        } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};

// ─── 타입 상수 (JS이므로 JSDoc 주석으로 타입 힌트) ───────────
const TEMPLATE_NAMES = {
  cinematic: '🎬 시네마틱', viral: '🔥 바이럴', aesthetic: '✨ 감성',
  mukbang: '🍜 먹방', vlog: '📹 브이로그', review: '⭐ 리뷰',
  story: '📖 스토리', info: '📊 정보',
  viral_fast: '⚡ 빠른 비트', vlog_aesthetic: '☕ 감성 브이로그',
  pov: '👁 POV 몰입', reveal: '🎯 반전 공개', foreshadow: '💫 복선 회수',
  asmr: '🎧 ASMR 슬로우', cinematic_story: '🎥 시네마틱 스토리',
  hype: '🔥 하이프 리액션', food_essay: '✏️ 감성 에세이',
  auto: '🤖 AI 자동',
};

const TEMPLATE_HINTS = {
  cinematic:       '시네마틱 스타일: 슬로우 컷, 무디 색감, 영화 같은 구성',
  viral:           '바이럴 스타일: 빠른 컷 전환, FOMO 극대화, 틱톡 트렌딩',
  aesthetic:       '감성 스타일: 따뜻한 톤, 소프트 무드, 인스타 감성',
  mukbang:         '먹방 스타일: 음식 클로즈업 극대화, ASMR 느낌 나레이션',
  vlog:            '브이로그 스타일: 일상 기록, 친근한 1인칭 시점',
  review:          '리뷰 스타일: 솔직 평가, 장단점 분석, 가성비 중심',
  story:           '스토리 스타일: 감성 여정, 도입→전개→클라이맥스→여운',
  info:            '정보 스타일: 핵심 정보 간결 전달, 카드뉴스 느낌',
  pov:             'POV 몰입 스타일: 1인칭 시점, "지금 이 순간" 완전 몰입, 2026 릴스 최강 포맷',
  reveal:          '반전 공개 스타일: 기대감 쌓기 → 충격 공개, "이게 뭐야" 반응 극대화',
  foreshadow:      '복선 회수 스타일: 첫 씬에 떡밥 → 마지막에 회수, 시청 완료율 최상위',
  asmr:            'ASMR 슬로우 스타일: 음식 클로즈업+텍스처 감성, 느린 호흡, 수저를 듣는 듯한 감성',
  cinematic_story: '시네마틱 스토리: 영화적 내러티브, 감동 아크, 문에서 맛의 여운까지 한 편의 영화',
  hype:            '하이프 리액션 스타일: MZ세대 과장 리액션, 준절 컷 전환+텍스트 팝업, 릴스 공유율 최상',
  food_essay:      '감성 에세이 스타일: 은율감 있는 나레이션, 시네마틱 색감, 맛집 인터뷰 형식',
};

const HOOK_HINTS = {
  question:  '궁금증 훅: "이거 진짜야?", "이 집 알아?" — 호기심 자극',
  shock:     '충격 훅: "이 가격에 이게 나온다고?" — 놀라움으로 시작',
  challenge: '챌린지 훅: "이거 안 먹어봤으면 진짜 손해" — 도전/FOMO',
  secret:    '비밀 훅: "아무도 모르는 찐 맛집" — 독점 정보 느낌',
  ranking:   '랭킹 훅: "서울 3대 ○○ 중 하나" — 권위/검증',
  pov:       'POV 훅: "나 지금 여기 왔는데..." — 1인칭 몰입감',
  viral_2026: '2026 바이럴 훅: "이거 진짜임.." + 0.5초 정지 — 알고리즘 최적화',
  cliffhanger: '클리프행어 훅: "끝까지 봐야 함" — 시청 완료율 극대화',
  trend_sound: '트렌드 사운드 훅: 첫 프레임부터 BGM 몰입 — 릴스 공유율 3배',
};

const VIRAL_TRENDS = {
  viral_fast: {
    name: '⚡ 빠른 비트 (틱톡/릴스)',
    durations: [2.0, 1.0, 1.0, 1.0, 1.0, 2.5],
    transition: 'wipe', subtitle_style: 'bold_drop',
    effect: ['zoom-out', 'pan-left', 'pan-right', 'zoom-in', 'zoom-in-slow', 'drift'],
  },
  vlog_aesthetic: {
    name: '☕ 감성 브이로그 (룸투어/카페)',
    durations: [3.5, 2.5, 2.5, 2.5, 3.5],
    transition: 'fade', subtitle_style: 'minimal',
    effect: ['zoom-in-slow', 'drift', 'drift', 'drift', 'float-up'],
  },
  pov: {
    name: '👁 POV 몰입 (2026 인스타 릴스)',
    durations: [1.5, 2.0, 3.0, 3.0, 3.5, 3.0],
    transition: 'cut', subtitle_style: 'bold_drop',
    effect: ['zoom-in', 'zoom-in', 'pan-left', 'zoom-out', 'zoom-in-slow', 'float-up'],
  },
  reveal: {
    name: '🎯 반전 공개 (릴스 저장율 1위)',
    durations: [1.5, 2.0, 2.5, 3.5, 4.0, 2.5],
    transition: 'wipe', subtitle_style: 'hook',
    effect: ['zoom-out', 'zoom-in', 'pan-right', 'zoom-in', 'zoom-in-slow', 'float-up'],
  },
  foreshadow: {
    name: '💫 복선 회수 (시청 완료율 85%+)',
    durations: [2.5, 3.0, 3.5, 3.5, 3.5, 4.0],
    transition: 'fade', subtitle_style: 'minimal',
    effect: ['zoom-out', 'drift', 'pan-left', 'pan-right', 'zoom-in-slow', 'zoom-out'],
  },
  asmr: {
    name: '🎧 ASMR 슬로우 (먹방/감성)',
    durations: [4.0, 4.5, 5.0, 4.5, 4.0],
    transition: 'fade', subtitle_style: 'minimal',
    effect: ['zoom-in-slow', 'zoom-in-slow', 'drift', 'drift', 'float-up'],
  },
  cinematic_story: {
    name: '🎥 시네마틱 스토리 (감동 아크)',
    durations: [2.5, 3.5, 4.0, 4.5, 4.0, 3.0],
    transition: 'fade', subtitle_style: 'hero',
    effect: ['zoom-out', 'drift', 'zoom-in-slow', 'pan-left', 'float-up', 'zoom-out'],
  },
  hype: {
    name: '🔥 하이프 리액션 (MZ 공유율 최상)',
    durations: [1.0, 1.5, 2.0, 2.5, 2.0, 2.0],
    transition: 'wipe', subtitle_style: 'cta',
    effect: ['zoom-in', 'pan-right', 'zoom-out', 'zoom-in', 'pan-left', 'zoom-in-slow'],
  },
  food_essay: {
    name: '✏️ 감성 에세이 (맛집 인터뷰)',
    durations: [3.0, 4.0, 4.5, 4.0, 3.5, 3.0],
    transition: 'fade', subtitle_style: 'elegant',
    effect: ['zoom-in-slow', 'drift', 'zoom-out', 'pan-left', 'float-up', 'zoom-in-slow'],
  },
};

// ─── 음식점 업체 유형 ─────────────────────────────────────────
const RESTAURANT_TYPES = {
  auto:       { label: '🤖 자동 감지',       key: 'auto' },
  grill:      { label: '🥩 고깃집/BBQ',      key: 'grill' },
  cafe:       { label: '☕ 카페/디저트',      key: 'cafe' },
  seafood:    { label: '🦞 해물집/일식',      key: 'seafood' },
  pub:        { label: '🍺 술집/포차',        key: 'pub' },
  snack:      { label: '🥡 분식/일반음식',    key: 'snack' },
  ramen:      { label: '🍜 라멘/면',          key: 'ramen' },
  finedining: { label: '🍷 파인다이닝/양식',  key: 'finedining' },
  nopo:       { label: '🏮 노포/전통음식',     key: 'nopo' },
  jeon:       { label: '🥘 전/부침개',         key: 'jeon' },
  hansik:     { label: '🍚 한식/백반',         key: 'hansik' },
  chinese:    { label: '🥡 중식',              key: 'chinese' },
  japanese:   { label: '🍣 일식/스시',         key: 'japanese' },
};

// ─── 초기 상태 ────────────────────────────────────────────────
const INITIAL = {
  // 파일/미디어
  files: [],          // [{ file, url, type:'image'|'video' }]
  loaded: [],         // [{ type, src }]  — 프리로드된 미디어

  // 스크립트/오디오
  script: null,       // VideoScript | null
  audioBuffers: [],   // (AudioBuffer | null)[]

  // 재생 상태
  playing: false,
  muted: false,
  scene: 0,
  subAnimProg: 0,
  exporting: false,

  // 화면 비율
  aspectRatio: '9:16',  // '9:16' | '1:1' | '16:9'

  // 템플릿
  selectedTemplate: 'auto',
  selectedHook: 'question',

  // 파이프라인 UI
  pipeline: {
    visible: false,
    step: 0,          // 0=idle, 1~7=진행
    title: '',
    sub: '',
    autoStyleName: '',
    done: [false, false, false, false, false, false, false], // 7단계
  },

  // 결과 화면
  showResult: false,
  restaurantName: '',

  // Vision 분석 결과 (focus_coords, aesthetic_score, foodie_score 포함)
  analysis: null,

  // 토스트
  toasts: [],         // [{ id, msg, type }]

  // 업체 유형
  restaurantType: 'auto',       // RESTAURANT_TYPES 키
  detectedRestaurantType: '',   // AI 자동 감지된 업체 유형

  // 유저 프롬프트
  userPrompt: '',

  // 플랫폼 최적화
  targetPlatform: 'reels', // 'reels' | 'shorts' | 'tiktok'

  // Firebase 세션
  sessionDocId: null,
  pipelineSessionId: null,  // startMake 시작 시 생성 — originals·video 동일 경로
};

// ─── Store ────────────────────────────────────────────────────
const useVideoStore = create(
  devtools(
    (set, get) => ({
      ...INITIAL,

      // ── 파일 관리 ──────────────────────────────────────────
      addFiles: (newFiles) => set(s => {
        // MIME 타입 없는 모바일 파일 대비 확장자 폴백 추가
        const V = new Set(['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv']);
        const I = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif', 'avif']);
        const getType = f => {
          if (f.type.startsWith('video/')) return 'video';
          if (f.type.startsWith('image/')) return 'image';
          const ext = (f.name || '').split('.').pop().toLowerCase();
          if (V.has(ext)) return 'video';
          if (I.has(ext)) return 'image';
          return null;
        };
        const pairs = [...newFiles].map(f => [f, getType(f)]).filter(([, t]) => t).slice(0, 30 - s.files.length);
        const items = pairs.map(([f, t]) => ({ file: f, url: URL.createObjectURL(f), type: t }));
        return { files: [...s.files, ...items] };
      }, false, 'addFiles'),

      // 비동기 전처리 버전 — MIME 폴백 + 50MB 초과 영상 720p 다운스케일
      addFilesAsync: async (newFiles) => {
        const { preprocessMediaFiles } = await __vitePreload(async () => { const { preprocessMediaFiles } = await import('./engine-core-CVvj_IMC.js').then(n => n.C);return { preprocessMediaFiles }},true?__vite__mapDeps([0,1,2,3,4]):void 0);
        const { files: cur, addToast } = get();
        const limit = 30 - cur.length;
        if (limit <= 0) return;
        const arr = [...newFiles].slice(0, limit);
        const big = arr.some(f => f.size > 50 * 1024 * 1024);
        if (big) addToast('용량이 큰 영상을 최적화 중...', 'inf');
        const results = await preprocessMediaFiles(arr, msg => addToast(msg, 'inf'));
        const items = results.map(({ file: pf, mediaType }) => ({
          file: pf, url: URL.createObjectURL(pf), type: mediaType,
        }));
        set(s => ({ files: [...s.files, ...items] }), false, 'addFilesAsync');
        if (big) addToast(`${items.length}개 파일 추가 완료`, 'ok');
      },

      removeFile: (idx) => set(s => ({
        files: s.files.filter((_, i) => i !== idx),
      }), false, 'removeFile'),

      setLoaded: (loaded) => set({ loaded }, false, 'setLoaded'),

      // ── 스크립트/오디오 ────────────────────────────────────
      setScript: (script) => set({ script }, false, 'setScript'),

      setAudioBuffers: (audioBuffers) => set({ audioBuffers }, false, 'setAudioBuffers'),

      updateScene: (idx, patch) => set(s => {
        if (!s.script) return s;
        const scenes = s.script.scenes.map((sc, i) => i === idx ? { ...sc, ...patch } : sc);
        return { script: { ...s.script, scenes } };
      }, false, 'updateScene'),

      updateAudioBuffer: (idx, buf) => set(s => {
        const audioBuffers = [...s.audioBuffers];
        audioBuffers[idx] = buf;
        return { audioBuffers };
      }, false, 'updateAudioBuffer'),

      // ── 재생 제어 ──────────────────────────────────────────
      setPlaying: (playing) => set({ playing }, false, 'setPlaying'),
      setMuted: (muted) => set({ muted }, false, 'setMuted'),
      setScene: (scene) => set({ scene }, false, 'setScene'),
      setSubAnimProg: (subAnimProg) => set({ subAnimProg }, false, 'setSubAnimProg'),
      setExporting: (exporting) => set({ exporting }, false, 'setExporting'),

      // ── 화면 비율 ──────────────────────────────────────────
      setAspectRatio: (aspectRatio) => set({ aspectRatio }, false, 'setAspectRatio'),

      // ── 템플릿 ─────────────────────────────────────────────
      setTemplate: (selectedTemplate) => set({ selectedTemplate }, false, 'setTemplate'),
      setHook: (selectedHook) => set({ selectedHook }, false, 'setHook'),

      // ── 파이프라인 UI ──────────────────────────────────────
      setPipeline: (step, title, sub) => set(s => ({
        pipeline: { ...s.pipeline, visible: true, step, title, sub },
      }), false, 'setPipeline'),

      donePipelineStep: (n) => set(s => {
        const done = [...s.pipeline.done];
        done[n - 1] = true;
        return { pipeline: { ...s.pipeline, done } };
      }, false, 'donePipelineStep'),

      setAutoStyleName: (name) => set(s => ({
        pipeline: { ...s.pipeline, autoStyleName: name },
      }), false, 'setAutoStyleName'),

      hidePipeline: () => set(s => ({
        pipeline: { ...s.pipeline, visible: false },
      }), false, 'hidePipeline'),

      // ── 결과 화면 ──────────────────────────────────────────
      setShowResult: (showResult) => set({ showResult }, false, 'setShowResult'),
      setRestaurantName: (restaurantName) => set({ restaurantName }, false, 'setRestaurantName'),

      // ── 토스트 ─────────────────────────────────────────────
      addToast: (msg, type = 'inf') => set(s => ({
        toasts: [...s.toasts, { id: Date.now() + Math.random(), msg, type }],
      }), false, 'addToast'),

      removeToast: (id) => set(s => ({
        toasts: s.toasts.filter(t => t.id !== id),
      }), false, 'removeToast'),

      // ── 업체 유형 ──────────────────────────────────────────
      setRestaurantType: (restaurantType) => set({ restaurantType }, false, 'setRestaurantType'),
      setDetectedRestaurantType: (t) => set({ detectedRestaurantType: t }, false, 'setDetectedRestaurantType'),

      // ── 유저 프롬프트 ──────────────────────────────────────
      setUserPrompt: (userPrompt) => set({ userPrompt }, false, 'setUserPrompt'),

      // ── Firebase ───────────────────────────────────────────
      setSessionDocId: (sessionDocId) => set({ sessionDocId }, false, 'setSessionDocId'),
      setPipelineSessionId: (pipelineSessionId) => set({ pipelineSessionId }, false, 'setPipelineSessionId'),

      // ── 플랫폼 ──────────────────────────────────────────────
      setTargetPlatform: (targetPlatform) => set({ targetPlatform }, false, 'setTargetPlatform'),

      // ── Analysis 저장 (Vision 결과 — focus_coords·aesthetic_score 포함) ──
      setAnalysis: (analysis) => set({ analysis }, false, 'setAnalysis'),
      // ── 전체 리셋 ──────────────────────────────────────────
      reset: () => set({
        ...INITIAL,
        toasts: [],
      }, false, 'reset'),
    }),
    { name: 'VideoStore' }
  )
);

const videoStore = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  HOOK_HINTS,
  RESTAURANT_TYPES,
  TEMPLATE_HINTS,
  TEMPLATE_NAMES,
  VIRAL_TRENDS,
  useVideoStore
}, Symbol.toStringTag, { value: 'Module' }));

let geminiKey = localStorage.getItem("moovlog_gemini_key") || "";
function setGeminiKey(key) {
  if (key) geminiKey = key;
}
function getGeminiKey() {
  return geminiKey;
}
function hasGeminiKey() {
  return !!geminiKey;
}
function getApiUrl(model, key) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key || geminiKey}`;
}
async function fetchWithTimeout(url, options, timeout = 6e4) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`?ㅽ듃?뚰겕 ??꾩븘??(${Math.round(timeout / 1e3)}s 珥덇낵)`);
    throw e;
  } finally {
    clearTimeout(id);
  }
}
async function apiPost(url, body, timeoutMs = 6e4) {
  const r = await fetchWithTimeout(
    url,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    timeoutMs
  );
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `${r.status}`);
  }
  return r.json();
}
const TEXT_MODELS = [
  "gemini-2.5-flash",
  // 1?쒖쐞: ?띾룄쨌鍮꾩슜 洹좏삎
  "gemini-2.5-pro"
  // 2?쒖쐞: 怨좏뭹吏??대갚
];
async function geminiWithFallback(body, timeoutMs = 6e4) {
  let lastErr;
  for (const model of TEXT_MODELS) {
    try {
      return await apiPost(getApiUrl(model), body, timeoutMs);
    } catch (e) {
      lastErr = e;
      console.warn(`[Gemini] ${model} ?ㅽ뙣 ???ㅼ쓬 紐⑤뜽:`, e.message);
    }
  }
  throw lastErr || new Error("紐⑤뱺 Gemini 紐⑤뜽 ?ㅽ뙣");
}
async function geminiRace(body, models = TEXT_MODELS, timeoutMs = 28e3) {
  if (!models.length) throw new Error("紐⑤뜽 紐⑸줉 ?놁쓬");
  const attempts = models.map(
    (model) => apiPost(getApiUrl(model), body, timeoutMs).then((r) => ({ model, data: r })).catch((e) => {
      console.warn(`[Gemini 蹂묐젹] ${model} ?ㅽ뙣:`, e.message);
      throw e;
    })
  );
  const result = await Promise.any(attempts);
  console.log(`[Gemini ?? 梨꾪깮 紐⑤뜽: ${result.model}`);
  return result.data;
}
const MAX_IMG_SIZE = 1280;
function toB64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`'${file.name}' ?뚯씪???쎌쓣 ???놁뒿?덈떎.`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("?대?吏 ?뚯떛 ?ㅽ뙣"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width: w, height: h } = img;
        if (w > MAX_IMG_SIZE || h > MAX_IMG_SIZE) {
          const ratio = Math.min(MAX_IMG_SIZE / w, MAX_IMG_SIZE / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.9).split(",")[1]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function extractVideoFramesB64(file, count = 2) {
  return new Promise((resolve) => {
    const globalTimer = setTimeout(() => {
      resolve([]);
    }, 15e3);
    const vid = Object.assign(document.createElement("video"), {
      muted: true,
      playsInline: true,
      preload: "metadata"
    });
    const url = URL.createObjectURL(file);
    const cleanup = (canvas) => {
      clearTimeout(globalTimer);
      URL.revokeObjectURL(url);
      vid.pause();
      vid.src = "";
      vid.load();
      vid.remove();
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    };
    const done = (frames, canvas) => {
      cleanup(canvas);
      resolve(frames);
    };
    vid.onerror = () => {
      done([], null);
    };
    const metaTimer = setTimeout(() => {
      vid.onloadedmetadata = null;
      done([], null);
    }, 8e3);
    vid.onloadedmetadata = () => {
      clearTimeout(metaTimer);
      const dur = isFinite(vid.duration) ? vid.duration : 0;
      if (!dur) {
        done([], null);
        return;
      }
      const offscreen = document.createElement("canvas");
      offscreen.width = 640;
      offscreen.height = 360;
      const octx = offscreen.getContext("2d");
      const frames = [];
      const times = Array.from({ length: count }, (_, i) => dur * (i + 0.5) / count);
      const captureAt = (idx) => {
        if (idx >= times.length) {
          done(frames, offscreen);
          return;
        }
        const seekTimer = setTimeout(() => {
          vid.onseeked = null;
          captureAt(idx + 1);
        }, 5e3);
        vid.currentTime = times[idx];
        vid.onseeked = () => {
          clearTimeout(seekTimer);
          try {
            octx.drawImage(vid, 0, 0, 640, 360);
            const b64 = offscreen.toDataURL("image/jpeg", 0.82).split(",")[1];
            frames.push({ base64: b64, mimeType: "image/jpeg" });
          } catch (_) {
          }
          captureAt(idx + 1);
        };
      };
      captureAt(0);
    };
    vid.src = url;
  });
}
function safeExtractText(data) {
  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  if (finishReason === "SAFETY") {
    throw new Error("肄섑뀗痢??덉쟾???뺤콉???섑빐 ?앹꽦??李⑤떒?섏뿀?듬땲?? 吏덉쓽瑜??섏젙??二쇱꽭??");
  }
  if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
    console.warn(`[Gemini] finishReason: ${finishReason}`);
  }
  return candidate?.content?.parts?.[0]?.text || "";
}
async function visionAnalysis(restaurantName, researchData = "", restaurantType = "auto") {
  const { files } = useVideoStore.getState();
  const buildBatchPartsGrouped = async (fileSlice, baseIdx) => Promise.all(fileSlice.map(async (m, li) => {
    const i = baseIdx + li;
    const label = { text: `
--- [?먮낯 誘몃뵒??踰덊샇 media_idx: ${i}] ---` };
    if (m.type === "image") {
      try {
        const b64 = await toB64(m.file);
        return [label, { inline_data: { mime_type: m.file.type || "image/jpeg", data: b64 } }];
      } catch (_) {
        return [label];
      }
    } else {
      try {
        const frames = await extractVideoFramesB64(m.file, 2);
        return [label, ...frames.map((fr) => ({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } }))];
      } catch (_) {
        return [label];
      }
    }
  }));
  const VISION_BATCH = 10;
  const totalMedia = Math.min(files.length, 30);
  const slice0 = files.slice(0, Math.min(VISION_BATCH, totalMedia));
  const slice1 = files.slice(VISION_BATCH, Math.min(VISION_BATCH * 2, totalMedia));
  const slice2 = files.slice(VISION_BATCH * 2, totalMedia);
  if (!slice0.length) {
    return { keywords: [restaurantName, "留쏆쭛"], mood: "媛먯꽦?곸씤", per_image: [], recommended_order: [] };
  }
  const [filePartsGroup0, filePartsGroup1, filePartsGroup2] = await Promise.all([
    buildBatchPartsGrouped(slice0, 0),
    slice1.length ? buildBatchPartsGrouped(slice1, VISION_BATCH) : Promise.resolve([]),
    slice2.length ? buildBatchPartsGrouped(slice2, VISION_BATCH * 2) : Promise.resolve([])
  ]);
  const parts0 = filePartsGroup0.flat();
  const parts1 = filePartsGroup1.flat();
  const parts2 = filePartsGroup2.flat();
  const allFilePartsGroups = [...filePartsGroup0, ...filePartsGroup1, ...filePartsGroup2];
  const typeHint = restaurantType && restaurantType !== "auto" ? `
[?낆껜 ?좏삎: ${restaurantType}] ?????좏삎???뱀꽦??留욊쾶 ?쒓렇?덉쿂 而룹쓣 ?곗꽑 遺꾨쪟?섏꽭??` : "";
  const prompt1 = `?뱀떊? 2026???몄뒪?洹몃옩 Reels 쨌 ?좏뒠釉?Shorts ?뚭퀬由ъ쬁 ?꾨Ц 鍮꾩＜???붾젆?곗엯?덈떎.
?뚯떇?? "${restaurantName}" / 誘몃뵒??${totalMedia}媛?{typeHint}${researchData ? `

[?뵇 ?앸떦 ?ъ쟾 ?명뀛由ъ쟾?????꾨옒 ?뺣낫瑜?李멸퀬?섏뿬, ?쒓렇?덉쿂 硫붾돱쨌USP? 媛???곌????ъ쭊???믪? emotional_score쨌foodie_score瑜?遺?ы븯?몄슂]
${researchData.slice(0, 500)}` : ""}

媛??대?吏:
- type: "hook"|"hero"|"detail"|"ambiance"|"process"|"wide"
- best_effect: "zoom-in"|"zoom-out"|"pan-left"|"pan-right"|"zoom-in-slow"|"float-up"
- emotional_score: 1~10
- suggested_duration: 0.5~5珥?
- focus: ?앸떦 ?명뀛由ъ쟾???곗씠?곗? ?議고빐 ?뚯떇쨌?뚮즺紐낆쓣 ?뺥솗???앸퀎 ??1臾몄옣 ?ㅻ챸 (援ъ뼱泥? ?뚮즺쨌嫄닿컯二쇱뒪쨌?뚮즺?샕룸Ъ? ?덈? ?뚯뒪쨌?쒕젅?깆씠???쒗쁽 湲덉?. ?? "?쒖옉 ???쒓났?섎뒗 嫄닿컯二쇱뒪?덉슂.", "?먰댋??梨꾨걡 ?ㅽ뀒?댄겕媛 泥좏뙋 ?꾩뿉 ?щ씪媛 ?덉뼱??")
- focus_coords: {"x":0.5,"y":0.5}
- viral_potential: "high"|"medium"|"low"
- is_exterior: 媛寃??멸?쨌媛꾪뙋쨌嫄대Ъ ?낃뎄쨌?곹샇紐낆씠 蹂댁씠硫?true, ?뚯떇쨌?ㅻ궡쨌湲고?硫?false
- aesthetic_score: 0~100 (援щ룄쨌諛앷린쨌?됯컧 醫낇빀 ?먯닔. 80 ?댁긽?대㈃ type??"hook"?쇰줈 ?곗꽑 遺꾨쪟)
- foodie_score: 0~10 (?뚯떇???ㅺ린쨌吏덇컧쨌?됯컧 ?좊챸?? ?앹슃 ?먭레 媛뺣룄. ?뚯떇 ?꾨땶 ?ъ? null)
- best_start_pct: 0.0~1.0 (?곸긽 ?뚯뒪??寃쎌슦 媛???몄긽?곸씤 ?섏씠?쇱씠??援ш컙 ?쒖옉 吏??鍮꾩쑉. ?대?吏??0)
- tracking_coords: {"start":{"x":0.5,"y":0.5},"end":{"x":0.5,"y":0.5}} (?쇱궗泥??대룞 寃쎈줈 異붿젙. ?뺤쟻 而룹? start쨌end ?숈씪)
- ocr_data: {"menu_items":[],"prices":[]} (硫붾돱?먃룰?寃⑺몴쨌?곸닔利앹뿉???몄떇???띿뒪?? ?놁쑝硫?null)

?꾩껜:
- keywords: ?몃젋??寃?됱뼱 ?ы븿 (ex: "以꾩꽌??吏?, "?몄깮 留쏆쭛", "留쏆쭛?ъ뼱")
- mood, menu, visual_hook
- recommended_order: foodie_score횞0.7 + aesthetic_score횞0.3 媛以묒튂濡??대┝李⑥닚 ?뺣젹 (?앹슃 ?먭레 理쒖슦??
- recommended_template: pov|reveal|viral_fast|aesthetic|mukbang|foreshadow 以??좏깮
- recommended_hook: viral_2026|pov|shock|question|challenge 以??좏깮

JSON留?諛섑솚:
{"keywords":[],"mood":"","menu":[],"visual_hook":"","recommended_order":[],"recommended_template":"reveal","recommended_hook":"viral_2026","per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":0.8,"focus":"?ㅻ챸","focus_coords":{"x":0.5,"y":0.45},"viral_potential":"high","is_exterior":false,"aesthetic_score":85,"foodie_score":8,"best_start_pct":0.2,"tracking_coords":{"start":{"x":0.5,"y":0.5},"end":{"x":0.5,"y":0.5}},"ocr_data":null}]}`;
  const callPass1 = async (batchParts) => {
    const data = await geminiWithFallback({
      contents: [{ parts: [...batchParts, { text: prompt1 }] }],
      generationConfig: { temperature: 0.5, responseMimeType: "application/json" }
    }, 9e4);
    const raw = safeExtractText(data);
    const _s = raw.indexOf("{"), _e = raw.lastIndexOf("}");
    return JSON.parse(_s >= 0 && _e > _s ? raw.slice(_s, _e + 1) : raw.replace(/```json|```/g, "").trim());
  };
  const [pass1Result0, pass1Result1, pass1Result2] = await Promise.all([
    callPass1(parts0).catch(() => ({ keywords: [restaurantName], mood: "unknown", per_image: [], recommended_order: [] })),
    parts1.length ? callPass1(parts1).catch(() => ({ per_image: [], recommended_order: [] })) : Promise.resolve(null),
    parts2.length ? callPass1(parts2).catch(() => ({ per_image: [], recommended_order: [] })) : Promise.resolve(null)
  ]);
  const mergeBatch = (base, extra, offset) => {
    if (!extra) return base;
    return {
      ...base,
      per_image: [
        ...base.per_image || [],
        ...(extra.per_image || []).map((p) => ({ ...p, idx: p.idx + offset }))
      ],
      recommended_order: [
        ...base.recommended_order || [],
        ...(extra.recommended_order || []).map((i) => i + offset)
      ]
    };
  };
  const firstResult = mergeBatch(
    mergeBatch(pass1Result0, pass1Result1, VISION_BATCH),
    pass1Result2,
    VISION_BATCH * 2
  );
  const topIdxs = (firstResult.recommended_order || []).slice(0, Math.min(5, allFilePartsGroups.length));
  const topParts = topIdxs.length ? topIdxs.flatMap((idx) => allFilePartsGroups[idx] || []) : allFilePartsGroups.slice(0, 5).flat();
  const focusSummary = (firstResult.per_image || []).map((p) => `?대?吏${p.idx}: ${p.focus || ""}`).join("\n");
  const prompt2 = `?뱀떊? ?대갚?섍퀬 ?몃젴??2030 留쏆쭛 ?щ━?먯씠?곗엯?덈떎. 怨쇳븯吏 ?딄쾶, 吏꾩쭨 留쏆옒?뚯쿂???꾩떎?곸씤 援ъ뼱泥대줈 媛??대?吏???댁슱由щ뒗 ?섎젅?댁뀡 ?뚰듃瑜??묒꽦?섏꽭??
?뚯떇?? "${restaurantName}"${researchData ? `

[?앸떦 硫붾돱 ?뺣낫 ?ㅼ떆 李멸퀬 ???대?吏 ???뚯떇쨌?뚮즺紐낆쓣 ?뺥솗??諛섏쁺?섏꽭?? ?뚮즺쨌嫄닿컯二쇱뒪???뚯뒪???섏? 留덉꽭??]
${researchData.slice(0, 800)}` : ""}
?꾨옒 ?대?吏?ㅼ쓽 1李?遺꾩꽍 寃곌낵瑜?李멸퀬?섏뿬, 媛??대?吏??????섎젅?댁뀡 ?뚰듃瑜??앹꽦?섏꽭??

[1李?遺꾩꽍 ?붿빟]
${focusSummary || "遺꾩꽍 ?놁쓬"}

[narration_hint 洹쒖튃]
??"~?? ?대? ?ъ슜 (?? 蹂댁씠?쒕굹??/ ?щ씪媛 ?덉뼱??/ ?ш텋吏?泥좏뙋 ?꾩삁??
??"~?낅땲?? "~?⑸땲?? 媛숈? ?깅뵳??留먰닾 ?덈? 湲덉?
???붾㈃???ㅼ젣 蹂댁씠??寃껋쓣 ?ㅺ컧?쇰줈 援ъ껜?곸쑝濡??ㅻ챸 (吏덇컧쨌?됯컧쨌?⑤룄媛먃룻뼢쨌?뚮━ ??
??1臾몄옣, 15???댁쇅
?????덈? 湲덉? ?쒗쁽: "誘몄낀?댁슂", "?諛뺤씠?먯슂", "?ㅽ솕?덉슂", "湲곗젅?댁뿉??, "??誘몄낀?댁슂", "?뺣쭚 留쏆엳?댁슂", "吏꾩쭨 留쏆엳?댁슂", "?덈Т 留쏆엳?댁슂", "?섏긽?댁뿉??, "理쒓퀬?덉슂", "?덉쟾?쒖삁??, "?뚮쫫?댁뿉??, "?좎꽭怨꾩삁??
?????몃뱾媛?媛먰깂??湲덉?: "?~!", "?諛?!", "??", "?대㉧!", "?몄긽??"
?????щ컮瑜??덉떆: "?먰댘?섍쾶 ?곗뼱??梨꾨걹???ш텋吏?泥좏뙋 ?꾩뿉???듭뼱媛怨??덉뼱??", "?ы겕媛 ?우옄留덉옄 寃곕?濡?李?뼱吏??吏덇컧??蹂댁씠?쒕굹??", "湲곕텇 醫뗭? ??텋?μ씠 ?щ씪?ㅻ뒗 ?λ㈃?댁뿉??"

JSON留?諛섑솚 ??per_image 諛곗뿴 媛???ぉ??narration_hint ?꾨뱶留??ы븿:
{"per_image":[{"idx":0,"narration_hint":"?먰댘?섍쾶 ?곗뼱???쒖슦 梨꾨걹???ш텋吏?泥좏뙋 ?꾩뿉???듭뼱媛怨??덉뒿?덈떎."}]}`;
  let secondResult = { per_image: [] };
  try {
    const data2 = await geminiWithFallback({
      contents: [{ parts: [...topParts, { text: prompt2 }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
    }, 9e4);
    const raw2 = safeExtractText(data2);
    const _s2 = raw2.indexOf("{"), _e2 = raw2.lastIndexOf("}");
    secondResult = JSON.parse(_s2 >= 0 && _e2 > _s2 ? raw2.slice(_s2, _e2 + 1) : raw2.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.warn("[visionAnalysis 2-pass] 2踰덉㎏ ?⑥뒪 ?ㅽ뙣:", e.message);
  }
  const hintMap = {};
  for (const h of secondResult.per_image || []) hintMap[h.idx] = h.narration_hint;
  const mergedPerImage = (firstResult.per_image || []).map((p) => ({
    ...p,
    narration_hint: hintMap[p.idx] || p.focus || ""
  }));
  return { ...firstResult, per_image: mergedPerImage };
}
async function researchRestaurant(restaurantName) {
  const prompt = `援ш? 寃?됱쓣 ?듯빐 '?앸떦紐? ${restaurantName}'??理쒖떊 釉붾줈洹맞룹씤?ㅽ?洹몃옩 由щ럭瑜?議곗궗?섍퀬, ?꾨옒 ??ぉ??350???대궡濡??붿빟?섏꽭??

[?꾩닔 議곗궗 ??ぉ]
1. ?쒓렇?덉쿂 硫붾돱 & 留쏆쓽 ?뱀쭠 (?? ?≪쬂 媛?앺븳 ?섏젣踰꾧굅, 30???꾪넻 媛꾩옣寃뚯옣)
2. ???앸떦留뚯쓽 USP ??寃쎌웳 ?앸떦怨?李⑤퀎?붾맂 ?듭떖 ?ъ씤??(?? ?ъ옣??吏곸젒 ?섑솗 ?щ즺, ?뱀젣 ?뚯뒪 鍮꾨쾿)
3. 理쒓렐 3媛쒖썡 由щ럭 ?멸린 ?ㅼ썙??TOP 3 (?? "?⑥씠??2?쒓컙", "怨좉린?먭퍡 ?ㅽ솕", "酉?誘몄낀?댁슂")
4. ?ㅼ젣 諛⑸Ц??轅??
   - ?⑥씠???? ?됯퇏 ?⑥씠???쒓컙, 踰덊샇?쑣룹삁??媛???щ?, ?⑥씠???⑥텞踰?(?ㅽ뵂 吏곹썑 諛⑸Ц ??
   - 二쇱감 ?뺣낫: ?꾩슜 二쇱감???щ?, ?멸렐 怨듭쁺二쇱감?? 諛쒕젢 ?쒕퉬???щ?
   - ?덉젅 二쇱쓽 硫붾돱: 議곌린 ?덉젅?섎뒗 硫붾돱紐낃낵 異붿쿇 諛⑸Ц ?쒓컙?
5. 遺꾩쐞湲?諛?諛⑸Ц ?곹솴 (?곗씠?? 媛議??섎뱾?? 吏곸옣???먯떖 ??
6. 媛寃⑸? ?뺣낫

?녿뒗 ?뺣낫???앸왂?섍퀬, ?뺤씤???ъ떎留?媛꾧껐?섍쾶 ?붿빟?섏꽭??`;
  const searchModels = ["gemini-2.5-flash", "gemini-2.5-pro"];
  for (const model of searchModels) {
    try {
      const data = await apiPost(getApiUrl(model), {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.5 }
      }, 25e3);
      const text = safeExtractText(data)?.trim();
      if (text && text.length > 20) {
        console.log(`[researchRestaurant ?? ${model} 寃???깃났`);
        return text;
      }
    } catch (e) {
      console.warn(`[researchRestaurant] ${model} ?ㅽ뙣:`, e.message);
    }
  }
  return "";
}
async function generateBlogPost({ name, location, keywords, extra, imageFiles }) {
  const allFiles = (imageFiles || []).slice(0, 20);
  const buildBatchParts = async (fileSlice, baseIdx) => Promise.all(fileSlice.map(async (f, li) => {
    const label = { text: `
--- [?뚯씪 ${baseIdx + li + 1}: ${f.type.startsWith("video/") ? "?곸긽" : "?ъ쭊"}] ---` };
    if (f.type.startsWith("image/")) {
      try {
        return [label, { inline_data: { mime_type: f.type, data: await toB64(f) } }];
      } catch (_) {
        return [label];
      }
    } else {
      try {
        const frames = await extractVideoFramesB64(f, 2);
        return [label, ...frames.map((fr) => ({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } }))];
      } catch (_) {
        return [label];
      }
    }
  }));
  const BATCH = 10;
  const slice0 = allFiles.slice(0, BATCH);
  const slice1 = allFiles.slice(BATCH);
  const [partGroups0, partGroups1] = await Promise.all([
    buildBatchParts(slice0, 0),
    slice1.length ? buildBatchParts(slice1, BATCH) : Promise.resolve([])
  ]);
  const parts0 = partGroups0.flat();
  const parts1 = partGroups1.flat();
  const analysisPrompt = `?뚯떇??"${name}" 愿???대?吏/?곸긽?낅땲?? 媛??뚯씪???댁슜???뚯븙?섏꽭??
JSON 諛곗뿴留?諛섑솚: [{"file":1,"desc":"?붾㈃??蹂댁씠??寃?1~2臾몄옣","type":"food|interior|exterior|menu|process","placement":"?꾩엯|?뚯떇?뚭컻|?뚯떇?뷀뀒??遺꾩쐞湲?留덈Т由?}]`;
  const runAnalysis = async (parts) => {
    if (!parts.length) return [];
    try {
      const data = await geminiWithFallback({
        contents: [{ parts: [...parts, { text: analysisPrompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
      }, 9e4);
      const raw = safeExtractText(data);
      const s = raw.indexOf("["), e = raw.lastIndexOf("]");
      return JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : "[]");
    } catch {
      return [];
    }
  };
  const [analysis0, analysis1] = await Promise.all([
    runAnalysis(parts0),
    slice1.length ? runAnalysis(parts1) : Promise.resolve([])
  ]);
  const combined = [...analysis0, ...analysis1];
  const mediaContext = allFiles.map((f, i) => {
    const a = combined.find((c) => c.file === i + 1);
    const tag = f.type.startsWith("video/") ? `[?곸긽 ${i + 1}]` : `[?ъ쭊 ${i + 1}]`;
    return `${tag} ${a?.desc || ""} ??異붿쿇 ?꾩튂: ${a?.placement || "?먯쑀 ?쎌엯"}`;
  }).join("\n");
  const prompt = `?뱀떊? ?쒓뎅?먯꽌 媛???멸린 ?덈뒗 留쏆쭛 釉붾줈嫄?"臾대툕癒쇳듃(moovlog)"?낅땲??
?ㅼ쓬 ?뺣낫? ?대?吏 遺꾩꽍 寃곌낵瑜?諛뷀깢?쇰줈 ?ㅼ씠踰?釉붾줈洹??ъ뒪?낆쓣 ?묒꽦?댁＜?몄슂.

?뚯떇?? ${name}
?꾩튂: ${location || "(?대?吏?먯꽌 ?뚯븙)"}
泥⑤? ?뚯씪: 珥?${allFiles.length}媛?
${keywords ? `蹂몃Ц???먯뿰?ㅻ읇寃??뱀뿬?????ㅼ썙?? ${keywords}` : ""}
${extra ? `異붽? 吏?쒖궗?? ${extra}` : ""}

[?뚯씪蹂?遺꾩꽍 寃곌낵 ?????댁슜 湲곕컲?쇰줈 蹂몃Ц ?묒꽦]
${mediaContext || "?놁쓬"}

[臾대툕癒쇳듃 釉붾줈洹??ㅽ?????2026 ?ㅼ씠踰??곸쐞 ?몄텧 理쒖쟻??
???꾩엯: 諛⑸Ц ?숆린쨌?ㅻ젅??湲곕?媛?(移쒓렐??援ъ뼱泥? ?대え吏 ?쒖슜)
???멸?쨌?낃뎄 ?뚭컻
?????硫붾돱 ?뚭컻쨌硫붾돱?먃룰?寃??뺣낫
???뚯떇 ?뷀뀒??臾섏궗 (援ъ껜??留쎛룹떇媛먃룸퉬二쇱뼹)
??遺꾩쐞湲걔룹꽌鍮꾩뒪쨌?⑥씠???멸툒
???щ갑臾??섏궗 + 寃곕줎 + ?꾩튂쨌?곸뾽?쒓컙 ?뺣낫

[以묒슂 洹쒖튃]
- ?뚯씪 遺꾩꽍??"異붿쿇 ?꾩튂"???곕씪 [?ъ쭊 N] ?먮뒗 [?곸긽 N] 留덉빱瑜?蹂몃Ц??諛곗튂 (珥?${allFiles.length}媛쒓퉴吏 ?ъ슜)
- ?ㅼ썙?쒕뒗 ??臾몄옣???먯뿰?ㅻ읇寃?(愿묎퀬???섏뿴 湲덉?)
- ?⑤씫 援щ텇? 鍮덉쨪, 援ъ뼱泥? ?대え吏 ?곷떦??
- ?ㅼ씠踰??곸쐞 ?몄텧???꾪빐 泥?臾몃떒???듭떖 ?ㅼ썙???ы븿

JSON留?諛섑솚:
{
  "title": "釉붾줈洹??쒕ぉ (?대┃瑜??믪? 媛먯꽦 ?쒕ぉ)",
  "body": "釉붾줈洹?蹂몃Ц ?꾩껜 (?⑤씫留덈떎 鍮덉쨪, [?ъ쭊/?곸긽 N] 留덉빱 ?ы븿)",
  "naver_clip_tags": "#?쒓렇??(300???대궡, 吏???뚯떇 ?꾩＜)",
  "youtube_shorts_tags": "#?쒓렇??(100???대궡)",
  "instagram_caption": "?뚭컻 2~3以?
\\n#?댁떆?쒓렇??(10媛?",
  "tiktok_tags": "#?쒓렇1 #?쒓렇2 #?쒓렇3 #?쒓렇4 #?쒓렇5"
}`;
  const topParts = partGroups0.slice(0, 4).flat();
  const body = {
    contents: [{ parts: [...topParts, { text: prompt }] }],
    generationConfig: { temperature: 0.85, responseMimeType: "application/json" }
  };
  const parseJson = (raw) => {
    const _s = raw.indexOf("{"), _e = raw.lastIndexOf("}");
    return JSON.parse(_s >= 0 && _e > _s ? raw.slice(_s, _e + 1) : raw.replace(/```json|```/g, "").trim());
  };
  try {
    const data = await apiPost(getApiUrl("gemini-2.5-pro"), body);
    return parseJson(safeExtractText(data));
  } catch (e) {
    console.warn("[Blog] Pro ??Flash ?대갚:", e.message);
    const data = await apiPost(getApiUrl("gemini-2.5-flash"), body);
    return parseJson(safeExtractText(data));
  }
}

const gemini = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  TEXT_MODELS,
  apiPost,
  extractVideoFramesB64,
  geminiRace,
  geminiWithFallback,
  generateBlogPost,
  getApiUrl,
  getGeminiKey,
  hasGeminiKey,
  researchRestaurant,
  safeExtractText,
  setGeminiKey,
  toB64,
  visionAnalysis
}, Symbol.toStringTag, { value: 'Module' }));

// src/engine/gemini-classify.js
// 업체 유형 분류 + AI 품질 검수 — gemini.js 분리 (Rollup 빌드 스택 오버플로우 방지)

// ─── STEP 1.6: 업체 유형 자동 분류 ────────────────────────
async function detectRestaurantType(restaurantName, analysis, researchData = '') {
  const keywords = (analysis.keywords || []).join(', ');
  const mood = analysis.mood || '';
  const menu = (analysis.menu || []).join(', ');
  const prompt = `다음 식당 정보를 분석하여 가장 적합한 업체 유형을 분류하세요.

식당명: ${restaurantName}
분위기: ${mood}
키워드: ${keywords}
메뉴: ${menu}
${researchData ? `조사 정보: ${researchData.slice(0, 400)}` : ''}

업체 유형 목록 (아래 key 중 하나만 반환):
- grill: 고깃집/BBQ (삼겹살, 갈비, 소고기, 곱창 등)
- cafe: 카페/디저트 (커피, 케이크, 빙수, 음료 등)
- seafood: 해물집/일식 (회, 초밥, 해산물, 랍스터 등)
- pub: 술집/포차 (안주, 맥주, 소주, 이자카야 등)
- snack: 분식/일반음식 (떡볶이, 순대, 김밥, 분식 등)
- ramen: 라멘/면 (라멘, 우동, 쌀국수, 짬뽕 등)
- finedining: 파인다이닝/양식 (스테이크, 코스요리, 파스타, 와인 등)
- nopo: 노포/전통음식 (오래된 식당, 전통, 옛날식, 노포 감성)
- jeon: 전/부침개 (파전, 해물파전, 빈대떡, 전 종류)
- hansik: 한식/백반 (백반, 된장찌개, 갈비탕, 한정식 등)
- chinese: 중식 (짜장면, 짬뽕, 탕수육, 중화요리 등)
- japanese: 일식/스시 외 (돈가스, 오마카세, 야키토리, 일본식 등)

JSON만 반환: {"type": "grill", "confidence": 0.9, "reason": "삼겹살 전문점으로 보임"}`;

  try {
    const data = await geminiWithFallback({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }, 15000);
    const raw = safeExtractText(data);
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
    const result = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw.replace(/```json|```/g, '').trim());
    console.log(`[detectRestaurantType] ${restaurantName} → ${result.type} (신뢰도: ${result.confidence})`);
    return result.type || 'auto';
  } catch (e) {
    console.warn('[detectRestaurantType] 실패:', e.message);
    return 'auto';
  }
}

// ─── STEP 6: AI 품질 검수 ────────────────────────────────
async function geminiQualityCheck(script, restaurantName, restaurantType = '') {
  const scenes = script.blocks || script.scenes || [];
  const sceneSummary = scenes.slice(0, 8).map((sc, i) => {
    const narration = sc.narration || '';
    const caption = sc.caption || sc.caption1 || '';
    const duration = sc.total_duration || sc.duration || 0;
    return `씬${i + 1}: narration="${narration}" caption="${caption}" duration=${duration}s`;
  }).join('\n');

  const prompt = `당신은 2026년 한국 숏폼 콘텐츠 전문 QA 디렉터입니다.
아래 릴스/쇼츠 스크립트를 검수하고 품질 점수를 평가하세요.

식당명: ${restaurantName}
업체 유형: ${restaurantType || '미분류'}

[스크립트 요약 - 최대 8씬]
${sceneSummary}

[검수 기준 (각 항목 0~10점)]
1. 훅(Hook): 첫 씬이 2초 안에 시청자를 멈추게 하는가?
2. 금지어 준수: "미쳤다", "대박", "환상적인", "선사" 등 금지어 미사용?
3. 흐름(Flow): 씬 간 이야기가 자연스럽게 연결되는가?
4. 정보 밀도: 음식점 특징·메뉴 정보가 충분히 담겼는가?
5. CTA: 마지막 씬에 구독/좋아요 유도가 포함되었는가?

threshold: 총점 35점 이상(70%)이면 통과

JSON만 반환:
{"total_score": 38, "pass": true, "hook": 8, "banned_words": 9, "flow": 7, "info_density": 7, "cta": 7, "issues": ["첫 씬 임팩트 부족"], "suggestion": "첫 씬 caption을 더 강렬하게 수정 권장"}`;

  try {
    const data = await geminiWithFallback({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    }, 20000);
    const raw = safeExtractText(data);
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
    const result = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw.replace(/```json|```/g, '').trim());
    console.log(`[geminiQualityCheck] 점수: ${result.total_score}/50 → ${result.pass ? '통과' : '재생성 필요'}`);
    return result;
  } catch (e) {
    console.warn('[geminiQualityCheck] 실패 → 기본 통과 처리:', e.message);
    return { total_score: 40, pass: true, issues: [], suggestion: '' };
  }
}

export { HOOK_HINTS as H, RESTAURANT_TYPES as R, TEMPLATE_HINTS as T, VIRAL_TRENDS as V, __vitePreload as _, geminiQualityCheck as a, apiPost as b, setGeminiKey as c, detectRestaurantType as d, extractVideoFramesB64 as e, TEMPLATE_NAMES as f, getApiUrl as g, generateBlogPost as h, videoStore as i, gemini as j, researchRestaurant as r, safeExtractText as s, toB64 as t, useVideoStore as u, visionAnalysis as v };
