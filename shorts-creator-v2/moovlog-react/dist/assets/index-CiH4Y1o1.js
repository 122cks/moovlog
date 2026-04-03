import { c as create, d as devtools, i as initializeApp, g as getStorage, a as getFirestore, b as ref, u as uploadBytes, e as getDownloadURL, f as addDoc, h as collection, s as serverTimestamp, j as updateDoc, k as doc, q as query, o as orderBy, l as limit, m as getDocs, w as where, n as deleteDoc, p as jsxRuntimeExports, t as reactExports, v as reactDomExports, F as FFmpeg, x as toBlobURL, y as fetchFile, M as Muxer, z as Muxer$1, A as Mp4Muxer, W as WebmMuxer, B as client, R as React } from './vendor-_TA3R0fS.js';
import './vendor-firebase-DkG2A0lU.js';

true&&(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
}());

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

// ─── 업종별 스타일 프리셋 (AI 자동 추천 보정) ────────────────────
const RESTAURANT_STYLE_PRESETS = {
  grill:      { template: 'hype',            hook: 'shock' },
  cafe:       { template: 'vlog_aesthetic',  hook: 'pov' },
  seafood:    { template: 'cinematic_story', hook: 'question' },
  pub:        { template: 'viral_fast',      hook: 'challenge' },
  snack:      { template: 'viral',           hook: 'viral_2026' },
  ramen:      { template: 'mukbang',         hook: 'question' },
  finedining: { template: 'cinematic',       hook: 'secret' },
  nopo:       { template: 'food_essay',      hook: 'secret' },
  jeon:       { template: 'story',           hook: 'question' },
  hansik:     { template: 'food_essay',      hook: 'ranking' },
  chinese:    { template: 'hype',            hook: 'shock' },
  japanese:   { template: 'aesthetic',       hook: 'secret' },
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

  // 필수 포함 키워드 (마케팅 키트 태그에 반드시 넣을 키워드)
  requiredKeywords: '',

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
        const pairs = [...newFiles].map(f => [f, getType(f)]).filter(([, t]) => t).slice(0, 50 - s.files.length);
        const items = pairs.map(([f, t]) => ({ file: f, url: URL.createObjectURL(f), type: t }));
        return { files: [...s.files, ...items] };
      }, false, 'addFiles'),

      // 비동기 전처리 버전 — MIME 폴백 + 50MB 초과 영상 720p 다운스케일
      addFilesAsync: async (newFiles) => {
        const { preprocessMediaFiles } = await __vitePreload(async () => { const { preprocessMediaFiles } = await import('./mediaPreprocess-HVM__Ilm.js');return { preprocessMediaFiles }},true?[]:void 0);
        const { files: cur, addToast } = get();
        const limit = 50 - cur.length;
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

      resetPipelineProgress: () => set(s => ({
        pipeline: {
          ...s.pipeline,
          visible: true,
          step: 0,
          title: '',
          sub: '',
          autoStyleName: '',
          done: [false, false, false, false, false, false, false],
        },
      }), false, 'resetPipelineProgress'),

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

      // ── 필수 키워드 ────────────────────────────────────────
      setRequiredKeywords: (requiredKeywords) => set({ requiredKeywords }, false, 'setRequiredKeywords'),

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
  RESTAURANT_STYLE_PRESETS,
  RESTAURANT_TYPES,
  TEMPLATE_HINTS,
  TEMPLATE_NAMES,
  VIRAL_TRENDS,
  useVideoStore
}, Symbol.toStringTag, { value: 'Module' }));

const firebaseConfig = {
  apiKey: "",
  authDomain: "moovlog-be7a6.firebaseapp.com",
  projectId: "moovlog-be7a6",
  storageBucket: undefined                                             || "moovlog-be7a6.firebasestorage.app",
  messagingSenderId: "173534090692",
  appId: ""
};
let storage = null, db = null, sessionDocId = null;
function normalizeRestaurantName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
}
function initFirebase() {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
    console.log("[Firebase] API 키 없음 — 로컬 모드");
    return false;
  }
  try {
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    db = getFirestore(app);
    console.log("[Firebase] 초기화 완료 — moovlog-be7a6");
    return true;
  } catch (e) {
    console.warn("[Firebase] 초기화 실패:", e.message);
    return false;
  }
}
async function fbUpload(blob, storagePath) {
  if (!storage) return null;
  try {
    const storRef = ref(storage, storagePath);
    const snap = await uploadBytes(storRef, blob);
    const url = await getDownloadURL(snap.ref);
    console.log("[Firebase ✓]", storagePath);
    return url;
  } catch (e) {
    console.warn("[Firebase] 업로드 실패:", e.message);
    return null;
  }
}
async function firebaseUploadOriginals(files, restaurantName, pipelineSessionId) {
  if (!storage) return;
  const session = pipelineSessionId || `${Date.now()}_${(restaurantName || "noname").replace(/\s+/g, "_")}`;
  await Promise.all(
    files.map(
      (m, i) => fbUpload(m.file, `originals/${session}/${i}_${m.file.name}`).catch((e) => console.warn(`[Firebase] 파일 ${i} 업로드 실패:`, e.message))
    )
  );
}
async function firebaseSaveSession(script, restaurantName) {
  if (!db) return;
  sessionDocId = null;
  try {
    const normalized = normalizeRestaurantName(restaurantName);
    const docRef = await addDoc(collection(db, "sessions"), {
      restaurant: restaurantName || "",
      restaurantKey: normalized,
      template: "auto",
      sceneCount: script.scenes.length,
      title: script.title || "",
      version: "v2.6-react",
      videoUrl: null,
      ext: null,
      createdAt: serverTimestamp()
    });
    sessionDocId = docRef.id;
    console.log("[Firebase] 세션 저장:", sessionDocId);
  } catch (e) {
    console.warn("[Firebase] 세션 저장 실패:", e.message);
  }
}
async function firebaseUploadVideo(blob, ext, restaurantName, pipelineSessionId) {
  if (!storage || !db) return;
  const session = pipelineSessionId || `${Date.now()}_${(restaurantName || "noname").replace(/\s+/g, "_")}`;
  const url = await fbUpload(blob, `generated/${session}/video.${ext}`);
  if (!url) return;
  try {
    await addDoc(collection(db, "generations"), {
      restaurant: restaurantName || "",
      videoUrl: url,
      ext,
      version: "v2.6-react",
      createdAt: serverTimestamp()
    });
    if (sessionDocId) {
      await updateDoc(doc(db, "sessions", sessionDocId), { videoUrl: url, ext });
    }
  } catch (e) {
    console.warn("[Firebase] Firestore 기록 실패:", e.message);
  }
}
async function firebaseLoadRecentSession() {
  if (!db) return null;
  try {
    const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"), limit(5));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    let latest = null;
    snap.forEach((d) => {
      if (!latest && d.data().videoUrl) latest = { id: d.id, ...d.data() };
    });
    return latest;
  } catch (e) {
    console.warn("[Firebase] 최근 세션 로드 실패:", e.message);
    return null;
  }
}
async function saveBlogPost(blogData) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, "blog_posts"), {
      restaurant: blogData.restaurant || "",
      location: blogData.location || "",
      title: blogData.title || "",
      body: blogData.body || "",
      naverClipTags: blogData.naver_clip_tags || "",
      youtubeTags: blogData.youtube_shorts_tags || "",
      instagramCaption: blogData.instagram_caption || "",
      tiktokTags: blogData.tiktok_tags || "",
      keywords: blogData.keywords || [],
      createdAt: serverTimestamp()
    });
    console.log("[Firebase] 블로그 저장:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn("[Firebase] 블로그 저장 실패:", e.message);
    return null;
  }
}
async function getRecentBlogPosts(limitN = 20) {
  if (!db) return [];
  try {
    const q = query(collection(db, "blog_posts"), orderBy("createdAt", "desc"), limit(limitN));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((d) => results.push({ id: d.id, ...d.data() }));
    return results;
  } catch (e) {
    console.warn("[Firebase] 블로그 목록 로드 실패:", e.message);
    return [];
  }
}
async function searchBlogPosts(keyword) {
  if (!db || !keyword?.trim()) return [];
  const kw = keyword.trim();
  try {
    const q = query(
      collection(db, "blog_posts"),
      orderBy("restaurant"),
      where("restaurant", ">=", kw),
      where("restaurant", "<=", kw + ""),
      limit(30)
    );
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((d) => results.push({ id: d.id, ...d.data() }));
    return results;
  } catch (e) {
    console.warn("[Firebase] 블로그 검색 실패:", e.message);
    return [];
  }
}
async function saveSNSTags(tagsData) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, "sns_tags"), {
      restaurant: tagsData.restaurant || "",
      naverClipTags: tagsData.naver_clip_tags || "",
      youtubeTags: tagsData.youtube_shorts_tags || "",
      instagramCaption: tagsData.instagram_caption || "",
      tiktokTags: tagsData.tiktok_tags || "",
      hashtags: tagsData.hashtags || "",
      createdAt: serverTimestamp()
    });
    console.log("[Firebase] SNS 태그 저장:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn("[Firebase] SNS 태그 저장 실패:", e.message);
    return null;
  }
}
async function saveMarketingKit(data) {
  if (!db) return null;
  try {
    const normalized = normalizeRestaurantName(data.restaurant);
    const docRef = await addDoc(collection(db, "marketing_kits"), {
      restaurant: data.restaurant || "",
      restaurantKey: normalized,
      hookTitle: data.hook_title || "",
      caption: data.caption || "",
      hashtags30: data.hashtags_30 || "",
      receiptReview: data.receipt_review || "",
      hookVariations: data.hook_variations || [],
      naverClipTags: data.naver_clip_tags || "",
      youtubeShortsTags: data.youtube_shorts_tags || "",
      instagramCaption: data.instagram_caption || "",
      tiktokTags: data.tiktok_tags || "",
      hashtags: data.hashtags || "",
      theme: data.theme || "",
      vibeColor: data.vibe_color || "",
      createdAt: serverTimestamp()
    });
    console.log("[Firebase] 마케팅 키트 저장:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn("[Firebase] 마케팅 키트 저장 실패:", e.message);
    return null;
  }
}
async function getMarketingKits(limitN = 20) {
  if (!db) return [];
  try {
    const fetchN = Math.max(limitN * 4, 80);
    const q = query(collection(db, "marketing_kits"), orderBy("createdAt", "desc"), limit(fetchN));
    const snap = await getDocs(q);
    const seen = /* @__PURE__ */ new Set();
    const results = [];
    snap.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      const key = data.restaurantKey || String(data.restaurant || "").trim().toLowerCase().replace(/\s+/g, " ");
      if (!seen.has(key)) {
        seen.add(key);
        results.push(data);
      }
    });
    return results.slice(0, limitN);
  } catch (e) {
    console.warn("[Firebase] 마케팅 키트 목록 실패:", e.message);
    return [];
  }
}
async function searchMarketingKits(keyword) {
  if (!db || !keyword?.trim()) return [];
  const kw = keyword.trim();
  try {
    const q = query(
      collection(db, "marketing_kits"),
      orderBy("restaurant"),
      where("restaurant", ">=", kw),
      where("restaurant", "<=", kw + ""),
      limit(60)
    );
    const snap = await getDocs(q);
    const seen = /* @__PURE__ */ new Set();
    const results = [];
    const docs = [];
    snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    docs.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
    docs.forEach((data) => {
      const key = data.restaurantKey || String(data.restaurant || "").trim().toLowerCase().replace(/\s+/g, " ");
      if (!seen.has(key)) {
        seen.add(key);
        results.push(data);
      }
    });
    return results;
  } catch (e) {
    console.warn("[Firebase] 마케팅 키트 검색 실패:", e.message);
    return [];
  }
}
async function deleteMarketingKit(id) {
  if (!db || !id) return;
  try {
    await deleteDoc(doc(db, "marketing_kits", id));
    console.log("[Firebase] 마케팅 키트 삭제:", id);
  } catch (e) {
    console.warn("[Firebase] 마케팅 키트 삭제 실패:", e.message);
    throw e;
  }
}
async function deleteDocsByRestaurant(collectionName, restaurantName) {
  if (!db || !restaurantName) return 0;
  try {
    const normalized = normalizeRestaurantName(restaurantName);
    const q = query(
      collection(db, collectionName),
      where("restaurantKey", "==", normalized),
      limit(30)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      console.log(`[Firebase] ${collectionName} 기존 ${snap.size}개 삭제 (${restaurantName})`);
      return snap.size;
    }
    const legacyQ = query(
      collection(db, collectionName),
      where("restaurant", "==", restaurantName.trim()),
      limit(30)
    );
    const legacySnap = await getDocs(legacyQ);
    if (legacySnap.empty) return 0;
    await Promise.all(legacySnap.docs.map((d) => deleteDoc(d.ref)));
    console.log(`[Firebase] ${collectionName} 레거시 ${legacySnap.size}개 삭제 (${restaurantName})`);
    return legacySnap.size;
  } catch (e) {
    console.warn(`[Firebase] ${collectionName} 삭제 실패:`, e.message);
    return 0;
  }
}
async function firebaseReplaceRestaurantData(script, restaurantName, marketingData) {
  if (!db) return;
  await Promise.all([
    deleteDocsByRestaurant("sessions", restaurantName),
    deleteDocsByRestaurant("marketing_kits", restaurantName)
  ]);
  await firebaseSaveSession(script, restaurantName).catch(() => {
  });
  if (marketingData) await saveMarketingKit(marketingData).catch(() => {
  });
}

// src/engine/PersonaManager.js
// 식당 테마에 따른 나레이션 페르소나 제어 — 톤, 단어 선택, 이모지 빈도를 자동화

const PERSONA_MAP = {
  cafe: {
    name: '감성 크리에이터',
    tone: '따뜻하고 감성적인 친구 같은 톤. 여유롭고 정감 있게.',
    emoji_frequency: 'medium', // 씬당 1~2개
    highlight_keywords: ['채광 맛집', '비주얼 맛집', '인생샷 각도', '감성 가득', '시간이 멈추는 곳'],
    narration_style: '부드러운 구어체, 여운 있는 마무리. 카페 분위기·음료 비주얼·감성 공간에 집중. ~해요 어미 선호.',
    caption_examples: ['뷰 실화 ✨', '감성 충전 ☕', '여기서 하루종일 있고 싶어요'],
    vibe_words: ['따뜻한', '감성적인', '여유로운', '예쁜'],
  },
  grill: {
    name: '육즙 탐험가 PD',
    tone: '에너지 넘치는 직접적인 맛집 PD 톤. 임팩트 있고 빠르게.',
    emoji_frequency: 'high', // 씬당 2~3개
    highlight_keywords: ['육즙 실화', '두께 보여요', '숯불향', '입에서 녹아요', '고기 마니아 필수'],
    narration_style: '빠르고 임팩트 있는 문장. 식욕 자극 오감 묘사 필수. 고기의 두께·육향·식감에 집중. ~요 어미.',
    caption_examples: ['육즙 폭발 🔥', '오픈런 각 🥩', '두께 보고 기절함'],
    vibe_words: ['강렬한', '두툼한', '짙은', '폭발하는'],
  },
  hansik: {
    name: '진정성 맛집 리뷰어',
    tone: '담백하고 진정성 있는 현실 리뷰어 톤. 속이 편한 정직함.',
    emoji_frequency: 'low', // 씬당 0~1개
    highlight_keywords: ['손맛', '정성 가득', '든든한 한 끼', '정통 레시피', '된장·간장 절임'],
    narration_style: '진솔하고 따뜻한 구어체. 음식의 깊은 맛·정성·든든함을 강조. 할머니의 손맛 느낌. ~요 어미.',
    caption_examples: ['손맛 느껴져요 🍚', '정성 한 그릇', '든든한 집밥 느낌'],
    vibe_words: ['진정성', '정직한', '깊은', '든든한'],
  },
  premium: {
    name: '파인다이닝 에디터',
    tone: '세련되고 절제된 전문 리뷰 톤. 고급스럽고 분위기 있게.',
    emoji_frequency: 'low',
    highlight_keywords: ['플레이팅 완벽', '분위기 최상급', '기념일 강추', '셰프의 시그니처', '섬세한 맛'],
    narration_style: '고급스럽고 절제된 문체. 과장 표현 자제. 공간·플레이팅·서비스를 균형 있게 묘사. ~요 어미.',
    caption_examples: ['플레이팅 예술 🍽️', '오늘의 메인', '기념일 강추 맛집'],
    vibe_words: ['우아한', '섬세한', '완성된', '고급스러운'],
  },
  pub: {
    name: '술집 불청객',
    tone: '신나고 텐션 높은 친구 같은 톤. 유쾌하고 자유롭게.',
    emoji_frequency: 'high',
    highlight_keywords: ['안주 미쳤어요', '한 잔 하고 싶어지는', '인생 안주', '분위기 넘쳐요'],
    narration_style: '활기차고 유쾌한 구어체. 안주와 분위기·사람들의 열기에 집중. ~요 어미.',
    caption_examples: ['안주 비주얼 🍻', '자리 잡자 🥂', '오늘 여기 가즈아'],
    vibe_words: ['활기찬', '텐션 터지는', '신나는', '유쾌한'],
  },
  seafood: {
    name: '해산물 전문 PD',
    tone: '깔끔하고 명쾌한 신선도 강조 톤. 청량하고 시원하게.',
    emoji_frequency: 'medium',
    highlight_keywords: ['신선도 최고', '바다 향', '입안이 바다', '활어 느낌', '싱싱함'],
    narration_style: '깔끔하고 간결한 문장. 신선도·바다 느낌·풍미를 강조. 시원시원한 톤. ~요 어미.',
    caption_examples: ['신선도 실화 🌊', '바다 한 상 🦞', '입안이 바다예요'],
    vibe_words: ['청량한', '신선한', '시원한', '싱싱한'],
  },
  chinese: {
    name: '가성비 탐험가',
    tone: '빠르고 활기차며 가성비를 강조하는 톤. 든든하고 시원하게.',
    emoji_frequency: 'medium',
    highlight_keywords: ['가성비 실화', '양 실화', '중독적인 맛', '기름지고 풍성한', '다시 오고 싶어요'],
    narration_style: '빠르고 경쾌한 구어체. 양·가성비·중독성 있는 맛을 명확히 전달. ~요 어미.',
    caption_examples: ['양 실화 🥡', '가성비 찐', '중독 주의 😋'],
    vibe_words: ['풍성한', '든든한', '중독적인', '가성비'],
  },
};

const DEFAULT_PERSONA = PERSONA_MAP.hansik;

/**
 * 테마 ID로 페르소나 객체 반환
 * @param {string|undefined} theme
 * @returns {Object}
 */
function getPersona(theme) {
  return PERSONA_MAP[theme] || DEFAULT_PERSONA;
}

/**
 * 페르소나를 Gemini 프롬프트용 텍스트 블록으로 변환
 * @param {string|undefined} theme  - 이미 감지한 테마 (없으면 '자동 감지' 모드)
 * @param {string|undefined} mood   - visionAnalysis mood
 * @returns {string}
 */
function getPersonaPrompt(theme, mood) {
  if (theme && PERSONA_MAP[theme]) {
    const p = PERSONA_MAP[theme];
    return `[🎭 페르소나 자동 적용 — 테마: ${theme}]
• 나레이터 역할: ${p.name}
• 톤&매너: ${p.tone}
• 이모지 빈도: ${p.emoji_frequency} (low=0~1개/씬, medium=1~2개/씬, high=2~3개/씬)
• 테마별 추천 키워드 (자연스럽게 녹여 쓸 것): ${p.highlight_keywords.join(', ')}
• 나레이션 스타일: ${p.narration_style}
• 자막 예시 (이 감성으로): ${p.caption_examples.join(' / ')}
• 핵심 무드 단어: ${p.vibe_words.join(', ')}`;
  }

  // 테마 미확정 시 — 비주얼에서 자동 판단 지시
  return `[🎭 페르소나 자동 감지]
• 이미지·메뉴 분석으로 식당 카테고리를 감지해 아래 페르소나 중 하나를 선택하세요:
  - cafe(카페/디저트): 감성 크리에이터 — 따뜻하고 여유로운 톤
  - grill(고깃집/BBQ): 육즙 탐험가 PD — 에너지 넘치고 임팩트 강한 톤
  - hansik(한식/밥집): 진정성 리뷰어 — 담백하고 정직한 톤
  - premium(고급/양식): 파인다이닝 에디터 — 세련되고 절제된 톤
  - pub(술집/포차): 술집 불청객 — 텐션 높고 유쾌한 톤
  - seafood(해산물/일식): 해산물 전문 PD — 청량하고 신선함 강조
  - chinese(중식/가성비): 가성비 탐험가 — 빠르고 든든함 강조
• 감지한 페르소나를 나레이션·자막 전체에 일관되게 적용하세요.
• 현재 분위기 힌트: ${mood || '분석 중'}`;
}

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
async function fetchWithTimeout$1(url, options, timeout = 6e4) {
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
  const r = await fetchWithTimeout$1(
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
  const totalMedia = Math.min(files.length, 50);
  const slice0 = files.slice(0, Math.min(VISION_BATCH, totalMedia));
  const slice1 = files.slice(VISION_BATCH, Math.min(VISION_BATCH * 2, totalMedia));
  const slice2 = files.slice(VISION_BATCH * 2, Math.min(VISION_BATCH * 3, totalMedia));
  const slice3 = files.slice(VISION_BATCH * 3, Math.min(VISION_BATCH * 4, totalMedia));
  const slice4 = files.slice(VISION_BATCH * 4, totalMedia);
  if (!slice0.length) {
    return { keywords: [restaurantName, "留쏆쭛"], mood: "媛먯꽦?곸씤", per_image: [], recommended_order: [] };
  }
  const [filePartsGroup0, filePartsGroup1, filePartsGroup2, filePartsGroup3, filePartsGroup4] = await Promise.all([
    buildBatchPartsGrouped(slice0, 0),
    slice1.length ? buildBatchPartsGrouped(slice1, VISION_BATCH) : Promise.resolve([]),
    slice2.length ? buildBatchPartsGrouped(slice2, VISION_BATCH * 2) : Promise.resolve([]),
    slice3.length ? buildBatchPartsGrouped(slice3, VISION_BATCH * 3) : Promise.resolve([]),
    slice4.length ? buildBatchPartsGrouped(slice4, VISION_BATCH * 4) : Promise.resolve([])
  ]);
  const parts0 = filePartsGroup0.flat();
  const parts1 = filePartsGroup1.flat();
  const parts2 = filePartsGroup2.flat();
  const parts3 = filePartsGroup3.flat();
  const parts4 = filePartsGroup4.flat();
  const allFilePartsGroups = [...filePartsGroup0, ...filePartsGroup1, ...filePartsGroup2, ...filePartsGroup3, ...filePartsGroup4];
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
- cooking_state: "raw"|"cooking"|"cooked"|null — 고기/육류가 보이면 생고기(raw)/굽는중(cooking)/다구워진것(cooked), 비고기류는 null

?꾩껜:
- keywords: ?몃젋??寃?됱뼱 ?ы븿 (ex: "以꾩꽌??吏?, "?몄깮 留쏆쭛", "留쏆쭛?ъ뼱")
- mood, menu, visual_hook
- recommended_order: foodie_score횞0.7 + aesthetic_score횞0.3 媛以묒튂濡??대┝李⑥닚 ?뺣젹 (?앹슃 ?먭레 理쒖슦??
- recommended_template: pov|reveal|viral_fast|aesthetic|mukbang|foreshadow 以??좏깮
- recommended_hook: viral_2026|pov|shock|question|challenge 以??좏깮

JSON留?諛섑솚:
{"keywords":[],"mood":"","menu":[],"visual_hook":"","recommended_order":[],"recommended_template":"reveal","recommended_hook":"viral_2026","per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":0.8,"focus":"?ㅻ챸","focus_coords":{"x":0.5,"y":0.45},"viral_potential":"high","is_exterior":false,"aesthetic_score":85,"foodie_score":8,"best_start_pct":0.2,"tracking_coords":{"start":{"x":0.5,"y":0.5},"end":{"x":0.5,"y":0.5}},"ocr_data":null,"cooking_state":null}]}`;
  const callPass1 = async (batchParts) => {
    const data = await geminiWithFallback({
      contents: [{ parts: [...batchParts, { text: prompt1 }] }],
      generationConfig: { temperature: 0.5, responseMimeType: "application/json" }
    }, 9e4);
    const raw = safeExtractText(data);
    const _s = raw.indexOf("{"), _e = raw.lastIndexOf("}");
    return JSON.parse(_s >= 0 && _e > _s ? raw.slice(_s, _e + 1) : raw.replace(/```json|```/g, "").trim());
  };
  const [pass1Result0, pass1Result1, pass1Result2, pass1Result3, pass1Result4] = await Promise.all([
    callPass1(parts0).catch(() => ({ keywords: [restaurantName], mood: "unknown", per_image: [], recommended_order: [] })),
    parts1.length ? callPass1(parts1).catch(() => ({ per_image: [], recommended_order: [] })) : Promise.resolve(null),
    parts2.length ? callPass1(parts2).catch(() => ({ per_image: [], recommended_order: [] })) : Promise.resolve(null),
    parts3.length ? callPass1(parts3).catch(() => ({ per_image: [], recommended_order: [] })) : Promise.resolve(null),
    parts4.length ? callPass1(parts4).catch(() => ({ per_image: [], recommended_order: [] })) : Promise.resolve(null)
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
    mergeBatch(
      mergeBatch(
        mergeBatch(pass1Result0, pass1Result1, VISION_BATCH),
        pass1Result2,
        VISION_BATCH * 2
      ),
      pass1Result3,
      VISION_BATCH * 3
    ),
    pass1Result4,
    VISION_BATCH * 4
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

// src/engine/tts.js
// TTS 시스템 — Typecast 우선 + Gemini 폴백 (기존 script.js에서 이식)


// ─── AudioContext (싱글턴) ────────────────────────────────
let audioCtx = null;
let audioMixDest = null;

function ensureAudio() {
  if (audioCtx) return { audioCtx, audioMixDest };
  audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
  audioMixDest = audioCtx.createMediaStreamDestination();
  return { audioCtx, audioMixDest };
}
function getAudioCtx() { return audioCtx; }
function getAudioMixDest() { return audioMixDest; }

// ─── Typecast 키 관리 ─────────────────────────────────────
let _typeCastKeys = [];
let _tcKeyIdx = 0;

function setTypeCastKeys(keys) {
  _typeCastKeys = keys.filter(Boolean);
  _tcKeyIdx = 0;
}
function getTypeCastKey() {
  if (!_typeCastKeys.length) return '';
  return _typeCastKeys[_tcKeyIdx % _typeCastKeys.length];
}
function rotateTypeCastKey() {
  _tcKeyIdx = (_tcKeyIdx + 1) % Math.max(_typeCastKeys.length, 1);
  console.log(`[Typecast] 키 로테이션 → #${_tcKeyIdx + 1} (${_typeCastKeys.length}개 중)`);
}
function hasTypeCastKeys() { return _typeCastKeys.length > 0; }

// ─── Typecast 보이스 ID ───────────────────────────────────
let TYPECAST_VOICE_ID =
  localStorage.getItem('moovlog_typecast_voice') || 'tc_5d654ea6b5ce05000143e79b';

// ─── 유틸 ────────────────────────────────────────────────
const sleep$1 = ms => new Promise(r => setTimeout(r, ms));

async function fetchWithTimeout(url, options, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`네트워크 타임아웃 (${Math.round(timeout / 1000)}s 초과)`);
    throw e;
  } finally {
    clearTimeout(id);
  }
}

// ─── 나레이션 전처리 ─────────────────────────────────────
function preprocessNarration(text) {
  if (!text?.trim()) return '';
  return text
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[⭐🔥✨🍜📹📖📊🎬🤖💾🙏]/g, '')
    .replace(/\.{2,}/g, ',')
    .replace(/,\s*/g, ', ')
    .replace(/\.\s+([가-힣])/g, '. $1')
    .replace(/!+/g, '!')
    .replace(/진짜(?![,.])/g, '진짜, ')
    .replace(/(?<![가-힣])와(?=[^가-힣a-zA-Z]|$)/g, '와, ')
    .replace(/\.\s*/g, '.\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── Typecast TTS ─────────────────────────────────────────
async function fetchTypeCastTTS(text) {
  if (!text?.trim()) throw new Error('빈 텍스트');
  const { audioCtx: ac } = ensureAudio();
  const apiKey = getTypeCastKey();
  if (!apiKey) throw new Error('TYPECAST_401: 사용 가능한 API 키 없음');

  console.log(`[Typecast 시도] 키 #${_tcKeyIdx + 1}/${_typeCastKeys.length}`);

  const tcBody = JSON.stringify({
    actor_id: TYPECAST_VOICE_ID,
    text: text.trim(),
    lang: 'auto',
    xapi_hd: true,
    model_version: 'latest',
    xapi_audio_format: 'mp3',
    tempo: PROSODY_TEMPO[theme] ?? 1.45,
    volume: 100,
    pitch: PROSODY_PITCH[theme] ?? 0,
  });
  const tcHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };

  // 엔드포인트: 실제 typecast.ai API 도메인 우선 최신 RFC7231 시도
  let res;
  try {
    res = await fetchWithTimeout('https://typecast.ai/api/speak',
      { method: 'POST', headers: tcHeaders, body: tcBody }, 14000);
  } catch (_firstErr) {
    // 폴백: 이전 엔드포인트
    console.warn('[Typecast] 신규 엔드포인트 실패 → 구 엔드포인트 시도');
    res = await fetchWithTimeout('https://api.typecast.ai/v1/text-to-speech',
      { method: 'POST', headers: tcHeaders, body: tcBody }, 14000);
  }

  if (!res.ok) {
    const _errData = await res.json().catch(() => ({}));
    const _errMsg  = _errData?.result?.message || _errData?.error?.message || `HTTP ${res.status}`;
    // 401(인증 오류)은 즉시 키 로테이션, 429(할당량 초과)는 명시적 표기
    if (res.status === 401) throw new Error(`TYPECAST_401: ${_errMsg}`);
    if (res.status === 429) throw new Error(`TYPECAST_429: ${_errMsg}`);
    throw new Error(`TYPECAST_FAIL_${res.status}: ${_errMsg}`);
  }

  const data = await res.json();
  // speak_v2_url (polling) 또는 바로 오디오 URL
  const directUrl = data?.result?.speak_url || data?.result?.audio_download_url;
  if (directUrl && !data?.result?.speak_v2_url) {
    const audioRes = await fetchWithTimeout(directUrl, {}, 15000);
    if (!audioRes.ok) throw new Error('Typecast 직접 다운로드 실패');
    const ab = await audioRes.arrayBuffer();
    const buf = await ac.decodeAudioData(ab.slice(0));
    if (!buf || buf.duration < 0.05) throw new Error('Typecast 빈 오디오');
    console.log(`[Typecast ✓] ${buf.duration.toFixed(2)}s`);
    return buf;
  }

  const speakUrl = data?.result?.speak_v2_url || data?.result?.speak_url;
  if (!speakUrl) throw new Error(`Typecast URL 누락`);

  // Polling (0.8초 간격, 최대 30초)
  let audioUrl = null;
  for (let i = 0; i < 38; i++) {
    await sleep$1(800);
    try {
      const pollRes = await fetchWithTimeout(
        speakUrl,
        { headers: { 'Authorization': `Bearer ${apiKey}` } },
        4000
      );
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      const status   = pollData?.result?.status;
      if (status === 'DONE') { audioUrl = pollData?.result?.audio_download_url; break; }
      if (status === 'FAILED') throw new Error('Typecast 오디오 합성 실패');
    } catch (e) {
      if (e.name === 'AbortError') continue;
      throw e;
    }
  }
  if (!audioUrl) throw new Error('Typecast 전체 응답 타임아웃 (30초 초과)');

  const audioRes = await fetchWithTimeout(audioUrl, {}, 15000);
  if (!audioRes.ok) throw new Error('Typecast 오디오 다운로드 실패');
  const ab = await audioRes.arrayBuffer();
  if (ab.byteLength < 100) throw new Error('Typecast 오디오 데이터 너무 작음');
  const buf = await ac.decodeAudioData(ab.slice(0));
  if (!buf || buf.duration < 0.05) throw new Error('Typecast 빈 오디오');
  console.log(`[Typecast ✓] ${buf.duration.toFixed(2)}s — ${text.substring(0, 15)}...`);
  return buf;
}

// ─── Gemini TTS 재시도 래퍼 ──────────────────────────────
// AUDIO 모달리티를 지원하는 실제 TTS 전용 모델만 사용
// gemini-2.0-flash-exp / gemini-2.5-flash-exp / gemini-2.0-flash 는 audio 미지원 (404/400)
const TTS_CONFIG = {
  // 429(쿼타 초과) 시 다음 모델로 즉시 전환, 동일 모델 2회 재시도 포함
  models: [
    'gemini-2.5-flash-preview-tts',   // 1순위: TTS 전용 100/day 무료
    'gemini-2.5-pro-preview-tts',     // 2순위: Pro TTS (다른 쿼타)
    'gemini-2.5-flash-preview-tts',   // 3순위: flash 재시도
    'gemini-2.5-pro-preview-tts',     // 4순위: pro 재시도
  ],
  maxRetry:   4,
  retryDelay: 2000,   // 429 이외 오류 대기 (ms)
  sceneDelay: 2500,
};

// 세션 내 단일 부이스 고정 — 모든 씨 동일 남성 목소리
const _GEMINI_MALE_VOICES = ['Fenrir', 'Orus', 'Charon', 'Puck'];
const _sessionGeminiVoice = (() => {
  const stored = localStorage.getItem('moovlog_gemini_voice');
  if (stored && _GEMINI_MALE_VOICES.includes(stored)) return stored;
  const v = _GEMINI_MALE_VOICES[Math.floor(Math.random() * _GEMINI_MALE_VOICES.length)];
  localStorage.setItem('moovlog_gemini_voice', v);
  return v;
})();

async function fetchTTSWithRetry(text, sceneIdx, energyLevel = 3) {
  const { audioCtx: ac } = ensureAudio();
  let lastErr = null;
  // energy_level 1~5 → pitch semitone 조정 (-4 ~ +4)
  const energyPitch = ((energyLevel ?? 3) - 3) * 2;

  for (let attempt = 0; attempt < TTS_CONFIG.maxRetry; attempt++) {
    const model     = TTS_CONFIG.models[attempt % TTS_CONFIG.models.length];
    const voiceName = _sessionGeminiVoice;
    try {
      // 오디오 전용 모델에 직접 요청 (geminiWithFallback은 텍스트 모델만 순환)
      const r = await fetchWithTimeout(
        getApiUrl(model),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
          }),
        },
        42000   // TTS 응답은 최대 42초 대기
      );
      if (!r.ok) {
        const errJson = await r.json().catch(() => ({}));
        const errMsg  = errJson?.error?.message || `HTTP ${r.status}`;
        // 429(쿼타 초과)는 즉시 다음 모델로 전환 (retryDelay 없이)
        if (r.status === 429) {
          console.warn(`[TTS] ${model} 쿼타 초과(429) → 다음 모델로 즉시 전환`);
          lastErr = new Error(errMsg);
          continue;  // 대기 없이 다음 attempt
        }
        throw new Error(errMsg);
      }
      const data = await r.json();
      const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) throw new Error('빈 base64');

      let bytes;
      try {
        const raw = atob(b64);
        bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      } catch { throw new Error('base64 디코딩 실패'); }

      if (bytes.length < 4) throw new Error('오디오 데이터 너무 짧음');

      // WAV 헤더 없으면 RAW PCM으로 처리
      const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
      if (isWav) {
        const buf = await ac.decodeAudioData(bytes.buffer.slice(0));
        if (!buf || buf.duration < 0.05) throw new Error('빈 WAV');
        console.log(`[Gemini TTS ✓] ${model}/${voiceName} — ${buf.duration.toFixed(2)}s`);
        return buf;
      } else {
        const SR = 24000;
        const view = new DataView(bytes.buffer);
        const samples = [];
        for (let i = 0; i < bytes.length - 1; i += 2) samples.push(view.getInt16(i, true) / 32768);
        if (samples.length < 10) throw new Error('PCM 샘플 부족');
        const buf = ac.createBuffer(1, samples.length, SR);
        buf.copyToChannel(new Float32Array(samples), 0);
        console.log(`[Gemini TTS PCM ✓] ${model}/${voiceName} — ${buf.duration.toFixed(2)}s`);
        return buf;
      }
    } catch (e) {
      lastErr = e;
      if (e.message?.startsWith('TTS_403')) throw e;  // 인증 오류는 즉시 중단
      console.warn(`[TTS] 시도 ${attempt + 1}/${TTS_CONFIG.maxRetry} 실패:`, e.message);
      // abort/timeout 은 대기 후 재시도, 429는 위에서 continue로 처리됨
      if (attempt < TTS_CONFIG.maxRetry - 1) await sleep$1(TTS_CONFIG.retryDelay);
    }
  }
  throw lastErr || new Error('TTS 최종 실패');
}

// ─── Typecast 단일 씬 TTS (HTTP 코드 기반 로테이션) ─────
// 429 소진 키 임시 마킹 (60초 TTL)
const _tcExhaustedAt = new Map();
const TC_EXHAUST_TTL = 60_000;
function _isKeyExhausted(key) {
  const ts = _tcExhaustedAt.get(key);
  if (!ts) return false;
  if (Date.now() - ts > TC_EXHAUST_TTL) { _tcExhaustedAt.delete(key); return false; }
  return true;
}
function _markKeyExhausted(key) { _tcExhaustedAt.set(key, Date.now()); }
function _allKeysExhausted() {
  return _typeCastKeys.length > 0 && _typeCastKeys.every(k => _isKeyExhausted(k));
}

async function fetchTypeCastTTSWithRotation(text, theme = 'hansik', energyLevel = 3) {
  if (_allKeysExhausted()) return null; // 모든 키 429 소진 → 즉시 Gemini
  let tcBuf = null;
  const maxAttempts = _typeCastKeys.length * 2;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (_allKeysExhausted()) break;
    // 소진된 키 건너뜀
    let skip = 0;
    while (_isKeyExhausted(getTypeCastKey()) && skip < _typeCastKeys.length) {
      rotateTypeCastKey(); skip++;
    }
    if (_isKeyExhausted(getTypeCastKey())) break;
    try {
      tcBuf = await fetchTypeCastTTS(text, theme);
      break;
    } catch (e2) {
      const m2 = e2.message || '';
      if (m2.startsWith('TYPECAST_429')) {
        _markKeyExhausted(getTypeCastKey());
        rotateTypeCastKey();
        continue;
      }
      if (m2.startsWith('TYPECAST_401')) { rotateTypeCastKey(); continue; }
      // 타임아웃 → 한 번 더 같은 키로 시도
      if (m2.includes('타임아웃') || m2.includes('30초') || e2.name === 'AbortError') {
        if (attempt % 2 === 1) rotateTypeCastKey();
        continue;
      }
      // 기타 오류 → 키 로테이션 후 재시도
      rotateTypeCastKey();
    }
  }
  return tcBuf; // null이면 Gemini 폴백
}

// ─── 전체 씬 TTS 생성 (병렬 처리 + concurrency 제어) ───
async function generateAllTTS(scenes, onToast, theme = 'hansik') {
  const buffers = new Array(scenes.length).fill(null);
  let successCount = 0, failCount = 0, fatalStop = false, processedCount = 0;
  const useTypecast = hasTypeCastKeys();

  // Typecast는 API rate limit 특성상 최대 3개 동시, Gemini는 2개
  const CONCURRENCY = useTypecast ? 3 : 2;

  // 처리할 씬 인덱스만 추출
  const tasks = scenes
    .map((sc, i) => ({ sc, i }))
    .filter(({ sc }) => sc.narration?.trim());

  if (tasks.length > 0) {
    onToast?.(`🎙️ AI 보이스 생성 시작 (${tasks.length}개 씬, ${CONCURRENCY}개 병렬)`, 'inf');
  }

  // 병렬 처리 (concurrency 슬롯 제어)
  let taskIdx = 0;
  let forcedToGemini = false; // Typecast 실패 시 이후 씬 전체 Gemini → 목소리 일관성
  const worker = async () => {
    while (taskIdx < tasks.length) {
      if (fatalStop) break;
      const { sc, i } = tasks[taskIdx++];
      const text = preprocessNarration(sc.narration);
      if (!text) continue;

      try {
        let buf = null;
        if (useTypecast && !forcedToGemini) {
          buf = await fetchTypeCastTTSWithRotation(text, theme, sc.energy_level ?? 3);
          if (!buf) {
            console.warn(`[Typecast] 씬${i+1} 모든 키 소진 — 이후 씬 전체 Gemini로 전환`);
            onToast?.('Typecast 키 소진 — 이후 씬 Gemini로 생성합니다', 'inf');
            forcedToGemini = true;
            buf = await fetchTTSWithRetry(text, i, sc.energy_level ?? 3);
          }
        } else {
          buf = await fetchTTSWithRetry(text, i, sc.energy_level ?? 3);
        }
        buffers[i] = buf;
        successCount++;
      } catch (e) {
        const msg = e.message || '';
        if (msg.includes('TTS_403')) {
          fatalStop = true;
          onToast?.('AI 보이스: API 키에 TTS 권한 없음 — 무음으로 진행합니다', 'inf');
        } else {
          failCount++;
          console.warn(`[TTS] 씬${i + 1} 최종 실패:`, msg);
        }
      }
      processedCount++;
      if (!fatalStop && processedCount < tasks.length) {
        onToast?.(`🎙️ AI 보이스 ${processedCount}/${tasks.length} 완료...`, 'inf');
      }
    }
  };

  // CONCURRENCY 수만큼 worker 병렬 실행
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (!fatalStop) {
    const total = tasks.length;
    if (successCount === 0) onToast?.('AI 보이스 생성 실패 — 무음 영상으로 진행합니다', 'inf');
    else if (failCount > 0) onToast?.(`AI 보이스 ${successCount}/${total}씬 완료 (${failCount}씬 무음)`, 'inf');
    else onToast?.(`${useTypecast ? 'Typecast' : 'Gemini'} AI 보이스 ${successCount}씬 생성 완료 ✓`, 'ok');
  }

  return buffers;
}

const tts = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  TYPECAST_VOICE_ID,
  ensureAudio,
  fetchTTSWithRetry,
  fetchTypeCastTTS,
  generateAllTTS,
  getAudioCtx,
  getAudioMixDest,
  getTypeCastKey,
  hasTypeCastKeys,
  preprocessNarration,
  rotateTypeCastKey,
  setTypeCastKeys,
  sleep: sleep$1
}, Symbol.toStringTag, { value: 'Module' }));

function Header({ activeTab, onTabChange, tabs }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "app-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "header-inner", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "header-logo", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-play", children: "▶" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "logo-text", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-title", children: "MOOVLOG" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-sub", children: activeTab === "blog" ? "Blog Writer" : "Shorts Creator" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "header-version", children: "v2.56" })
      ] }),
      tabs && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "app-tab-nav", children: tabs.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `app-tab-btn ${activeTab === t.id ? "active" : ""}`,
          onClick: () => onTabChange(t.id),
          children: t.label
        },
        t.id
      )) })
    ] }),
    activeTab === "shorts" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feature-tags", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-wand-magic-sparkles" }),
        " AI 자동 스타일"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-instagram" }),
        " 릴스 최적화"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-tiktok" }),
        " 틱톡 트렌드"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-robot" }),
        " 남성 AI 보이스"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-eye" }),
        " POV 모드"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-bolt" }),
        " 0.5초 훅"
      ] })
    ] }),
    activeTab === "blog" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feature-tags", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-pen-nib" }),
        " AI 블로그 작성"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-neos" }),
        " 네이버 최적화"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-instagram" }),
        " 인스타 캡션"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-youtube" }),
        " 유튜브 태그"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-hashtag" }),
        " SNS 태그 자동생성"
      ] })
    ] }),
    activeTab === "shorts" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step-indicator", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StepItem, { n: 1, label: "업로드" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "si-line" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StepItem, { n: 2, label: "AI 생성" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "si-line" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StepItem, { n: 3, label: "결과" })
    ] })
  ] });
}
function StepItem({ n, label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "si-item", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "si-num", children: n }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "si-label", children: label })
  ] });
}

async function generateScript(restaurantName, analysis, userPrompt = "", researchData = "", restaurantType = "", requiredKeywords = "") {
  const { files, selectedTemplate, selectedHook } = useVideoStore.getState();
  const pi = analysis.per_image || [];
  const order = analysis.recommended_order?.length ? analysis.recommended_order : files.map((_, i) => i);
  const exteriorIdx = analysis.per_image?.find((p) => p.is_exterior === true)?.idx;
  const exteriorInfo = exteriorIdx !== void 0 ? `
• [★ 외관 강제 배치] ${exteriorIdx}번 미디어가 가게 외관으로 분석되었습니다. 마지막 씬의 media_idx는 반드시 ${exteriorIdx}로 설정하세요.` : "";
  const videoIdxs = files.map((f, i) => f.type === "video" ? i : -1).filter((i) => i >= 0);
  const videoRule = videoIdxs.length ? `
[🎬 동영상 파일 배치 우선순위 규칙 — 절대 준수]
• 업로드된 동영상(영상) 파일 media_idx 목록: [${videoIdxs.join(", ")}]
• 위 media_idx들은 훅(쐤1)과 클라이맥스 씨에 반드시 1순위로 배치하세요.
• 동영상 파일이 있는데 전체 씨을 정지 이미지만으로 채우는 것은 절대 금지됩니다.
• 동영상을 최대한 교차 배치하세요 (상나 2개 쐤1마다 동영상 1개 이상 댃승).` : "";
  const imgSummary = pi.map((p) => {
    const mediaLabel = files[p.idx]?.type === "video" ? "🎬영상" : "🖼️이미지";
    return `${mediaLabel}${p.idx}(${p.type}/감성${p.emotional_score}점${p.is_exterior ? "/🏪외관" : ""}): 효과=${p.best_effect}, ${p.suggested_duration}s, focus="${p.focus}", narration_hint="${p.narration_hint || p.focus || ""}"`;
  }).join("\n");
  const isTrend = VIRAL_TRENDS[selectedTemplate];
  const sceneCountTarget = isTrend ? isTrend.durations.length : Math.max(5, Math.min(Math.ceil(files.length / 2.5), 7));
  const totalTarget = isTrend ? isTrend.durations.reduce((a, v) => a + v, 0) : Math.max(sceneCountTarget * 4, 22);
  const topFileIdxs = (analysis.recommended_order?.length ? analysis.recommended_order.slice(0, 10) : Array.from({ length: Math.min(files.length, 10) }, (_, i) => i)).filter((i) => i < files.length);
  const _imgPartsArr = await Promise.all(
    topFileIdxs.map(async (i) => {
      const m = files[i];
      const textPart = { text: `
--- [원본 미디어 번호 media_idx: ${i}] ---` };
      if (m.type === "image") {
        try {
          const b64 = await toB64(m.file);
          return [textPart, { inline_data: { mime_type: m.file.type || "image/jpeg", data: b64 } }];
        } catch (_) {
          return [textPart];
        }
      } else {
        try {
          const frames = await extractVideoFramesB64(m.file, 2);
          return [textPart, ...frames.map((fr) => ({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } }))];
        } catch (_) {
          return [textPart];
        }
      }
    })
  );
  const imgParts = _imgPartsArr.flat();
  const trendInstruction = isTrend ? `
[🚨 바이럴 트렌드 템플릿 강제 규칙 🚨]
"${isTrend.name}" 포맷 — 정확히 ${sceneCountTarget}개 블록으로 구성.
각 블록의 total_duration 목표: ${(totalTarget / sceneCountTarget).toFixed(1)}초 내외 (3.0~5.5초 범위 내).
이 템플릿의 에너지감을 살리되, 블록의 total_duration은 반드시 3.0초 이상이어야 합니다.
video_cuts 개별 컷은 0.5~2.5초로 다양하게 조합하여 이 템플릿만의 리듬감을 구현하세요.
` : "";
  const restaurantTypeHint = restaurantType ? "[업체 유형: " + restaurantType + "] — 이 업체 유형의 2026 트렌드·분위기·고객층에 최적화된 나레이션과 자막 스타일을 적용하세요.\n" : "";
  const prompt = `당신은 담백하고 신뢰감 있는 2030 맛집 크리에이터 "무브먼트(MOOVLOG)"입니다. 친한 지인에게 좋은 맛집을 추천하듯, 과장 없이 현실감 있는 구어체로 나레이션을 작성하세요.
2026 릴스/쇼츠: 첫 컷 임팩트, 정보 밀도, 존댓말 나레이션, 자막 임팩트.
${trendInstruction}${getPersonaPrompt(analysis.detected_theme, analysis.mood)}
${restaurantTypeHint}

[사용자 특별 요청 사항 (★이 지시사항을 최우선으로 반영할 것★)]
${userPrompt ? userPrompt : "특별한 요청 없음. 평소체림 최고의 감성으로 작성하세요."}
[음식점 정보]
이름: ${restaurantName} / 분위기: ${analysis.mood || "감성적인"}
메뉴: ${(analysis.menu || []).join(", ") || restaurantName}
비주얼 훅: ${analysis.visual_hook || ""}${researchData ? `

[🔍 실시간 Gemini 검색 조사 — 이 식당의 실제 정보]
${researchData}
★ 위 조사 내용에서 이 집만의 시그니처 메뉴·맛의 비결·특별한 배경을 나레이션에 자연스럽게 녹여내세요. (단, 확인된 정보만 사용하고 없는 정보는 생략)` : ""}

[선택된 전략]
템플릿: ${TEMPLATE_HINTS[selectedTemplate] || TEMPLATE_HINTS.story}
훅: ${HOOK_HINTS[selectedHook] || HOOK_HINTS.question}

[테마 자동 인식 — researchData와 비주얼을 보고 아래 테마 중 하나를 반드시 선택, JSON에 theme/vibe_color 포함]
☕ 카페/디저트 → theme:"cafe"        vibe_color:"#F5C6D0"  (감성·부드러운 톤. 키워드: 채광, 비주얼, 인생샷)
🥩 고깃집/BBQ  → theme:"grill"       vibe_color:"#FF6B35"  (에너지·타격감 있는 톤. 키워드: 육즙, 숯불향)
🥘 한식/밥집   → theme:"hansik"      vibe_color:"#C8E6C9"  (진정성·담백한 톤. 키워드: 손맛, 든든함)
🍷 고급/양식   → theme:"premium"     vibe_color:"#E8D5B7"  (우아·전문적인 톤. 키워드: 분위기, 기념일)
🍺 술집/포차   → theme:"pub"         vibe_color:"#CE93D8"  (신나·텐션 높은 톤. 키워드: 안주, 분위기)
🦞 해산물/일식 → theme:"seafood"     vibe_color:"#80DEEA"  (깔끔·명쾌한 톤. 키워드: 신선도, 입안이 바다)
🥡 중식/가성비 → theme:"chinese"     vibe_color:"#FFF176"  (빠르고 활기찬 톤. 키워드: 양 실화, 가성비)
테마 키워드를 caption1·caption2·naration에 자연스럽게 섞어주세요.
테마별 권장 effect: cafe=zoom-out, grill=zoom-in, pub=pan-right, chinese=tilt-down 

[🥩 고깃집/BBQ 전용 메뉴 우선순위 규칙 — 반드시 준수]
• 볶음밥·냉면·된장찌개·공기밥 등 마무리 메뉴는 「사이드/엔딩 메뉴」입니다. 이 메뉴들을 클라이맥스·히어로 씬의 주인공으로 배치하면 절대 안 됩니다.
• 고깃집 영상의 메인(hero/climax) 씬 주제는 반드시 「구이」(고기·삼겹살·갈비·목살·소고기·곱창 등)이어야 합니다.
• 볶음밥 등 마무리 메뉴는 마지막 CTA 씬 바로 직전 씬 1개에만 짧게(2.0~2.5초) 등장시키거나 완전히 생략하세요.
[🔥 고깃집 구이 표현 정확성 규칙 — 반드시 준수]
• "직접 구워드립니다", "테이블에서 구워드립니다", "구워드릴게요" 등 직원이 고기를 구워주는 표현은 영상/사진에서 직원이 실제로 구워주는 장면이 보일 때만 사용하세요.
• 직원이 구워주는 장면이 없거나 불확실하면 "직접 구워서", "셀프 구이", "집게 들고 뒤집는 재미" 등 고객이 스스로 굽는다는 자연스러운 표현을 사용하세요.

[🎖️ 시각 상태와 나레이션 일치 규칙 — 반드시 준수 (cooking_state 연동)]
• 비주얼 컷 분석에서 cooking_state="cooked"(다 구워진 상태)로 표시된 이미지와 연결된 씬에서는 "선홍빛", "생고기", "구워지기 전", "원육" 등 생고기 상태를 연상시키는 단어를 나레이션/캡션에 절대 사용하지 마세요.
• cooking_state="raw"(생고기)로 표시된 이미지에는 "구워진", "익힌", "육즙이 터지는" 등 이미 익힌 상태를 알리는 단어를 사용하지 마세요.
• cooking_state가 null이거나 "cooking"(굽는 중)이면 화면에 보이는 실제 상태를 그대로 묘사하세요.
• 예시: cooking_state="cooked" 이미지 → "노릇하게 구워진 구이 단면" O, "선홍빛 원육이 놓입니다" ❌
[비주얼 컷 분석 — narration_hint를 나레이션 작성 기반으로 활용]${videoRule}
${imgSummary || "분석 없음"}
권장 컷 순서: [${order.join(",")}]

[★ 총 ${totalTarget}초, ${sceneCountTarget}개 블록으로 구성 — 파일 ${files.length}개 업로드됐어도 블록은 반드시 ${sceneCountTarget}개 이내, 한 블록에 미디어 여러 개 교차 편집 ★]
블록1 발견/훅(total_duration 3.0~4.5s): 강렬한 첫 비주얼 + 궁금증 유발 자막
블록2 설정/기대(total_duration 3.5~4.5s): 이 곳이 특별한 이유, 분위기·비하인드
블록3 클라이맥스 전(total_duration 3.5~4.5s): 대표 메뉴 등장, 텍스처·디테일
블록4 감정 피크(total_duration 3.5~5.0s): 맛·경험 최고조 → 가장 인상적인 컷
마지막 블록 CTA(total_duration 3.0~4.5s): 식당(${restaurantName})에 대한 임팩트 있는 한 줄 요약 + 시청자에게 "구독, 좋아요, 댓글"을 자연스럽게 유도하는 아웃트로 나레이션 필수 포함. caption에 식당 이름 또는 핵심 카피, caption2에 "구독 & 좋아요 꾹!" 또는 "무브먼트 구독하기" 형태의 CTA 문구를 반드시 넣을 것. subtitle_style은 반드시 "cta"로 지정.${exteriorInfo}

[🔁 리텐션 루프 전략 — 시청자를 끝까지 붙잡는 4단계 구조]
• 씬1 (opening_question): 첫 프레임에 답을 알고 싶은 질문을 던져라. 예: "이 줄이 진짜 맞아?" / "가격이 얼마길래?"
• 씬 중간 (midpoint_reveal): 기대를 부풀려라. 결정적인 정보는 살짝 숨기고 "곧 공개" 긴장감 유지.
• 클라이맥스 씬 (climax): 가장 시각적으로 임팩트 있는 컷. 여기서 에너지 레벨 최고조(energy_level 4~5).
• 마지막 씬 (cta_answer): 씬1 질문의 답을 CTA와 함께 공개. "맞아요, 그 집 맞습니다. 저장하고 꼭 가보세요."

[⚡ 씬별 필수 필드]
• energy_level: 1~5 (씬 에너지 강도. 1=차분한 도입, 3=보통, 5=클라이맥스 피크)
• retention_strategy: "opening_question"|"build"|"midpoint_reveal"|"climax"|"cta_answer" (씬 리텐션 역할)
• platform_y_offset: 520 (Reels 기준 자막 Y오프셋 픽셀. 변경 불필요 시 520 고정)

[⏱ Duration 규칙 — 반드시 준수]
★ 블록의 total_duration (= video_cuts 합산, 나레이션 재생 시간 전체): 반드시 3.0초 이상 5.5초 이하.
  - 블록 narration 40자 미만 → total_duration 3.0~4.0초
  - 블록 narration 40~60자 → total_duration 4.0~5.0초
  - 블록 narration 60자 초과 → total_duration 4.5~5.5초
★ video_cuts 개별 컷 duration: 비트매칭을 위해 0.5~2.5초로 자유롭게 조합 가능. (단, 모든 컷 합계가 total_duration과 일치해야 함)
• 컷 최소 0.5초: 그 미만은 화면 로딩 전 전환되어 깜빡임 발생.
• 컷 duration 가이드: 훅 클로즈업=0.7~1.0초, 정보 전달=1.0~2.0초, 클라이맥스 안정=2.0~3.0초.
• 비디오 소스 컷: duration = 클립 길이의 0.5~2배 (예: 3초 클립 → 1.5~6초 duration).
• 이미지 소스 컷: Ken Burns 효과 적용 — 0.7~3.0초 권고.

[🤖 AI 텍스트 '인간화' (Humanize AI) 5대 원칙]
가장 중요한 규칙입니다. AI가 작성한 티가 나는 완벽하고 기계적인 문장을 절대 금지합니다.

1. 금지어(AI 단골 멘트): "환상적인", "다채로운", "입안 가득 퍼지는", "조화를 이루는", "오감을 사로잡는", "선사합니다" ➡️ 100% 사용 금지.
2. 불완전함의 미학: 문장을 너무 매끄럽게 다듬지 마세요. 진짜 사람이 즉흥적으로 말하듯 살짝 문법이 어긋나거나 투박한 '입말(구어체)'을 쓰세요.
3. 감탄사와 추임새 적절히 활용: "와..", "아니 근데", "이거 보실래요", "사실은" 같은 현실적인 추임새를 문장 앞이나 중간에 자연스럽게 섞으세요. (단, "솔직히", "진짜" 반복 금지)
4. 시청자와의 티키타카: 혼잣말만 하지 말고, "다들 아시죠?", "궁금하지 않으세요?"처럼 시청자에게 말을 거는 화법을 넣으세요.
5. 지역 밀착형 현실 멘트: 평범한 리뷰가 아니라, 동네 맛집을 꿰뚫고 있는 사람처럼 "여기 점심시간엔 무조건 웨이팅입니다", "근처 직장인들 성지죠" 같은 현실적인 묘사를 추가하세요.

[❌ AI 느낌 대본 예시]
"이곳의 시그니처 메뉴인 삼겹살은 육즙이 가득하고 부드러워 입안 가득 환상적인 맛을 선사합니다."
[✅ 인간화(Humanized) 대본 예시]
"아니 고기 두께 보이세요? 솔직히 굽기 전엔 퍽퍽할 줄 알았는데, 한 입 씹자마자 육즙이 진짜 팡 터지더라고요."

[나레이션 스타일 — 담백하고 진정성 있는 현실 톤]
• '실화', '미쳤다', '대박', '기절', '폼 미쳤다' 같은 억지스러운 숏폼 과장어 절대 금지
• 호들갑 떨지 말고, 차분하지만 몰입감 있는 "진짜 맛잘알"의 현실적인 구어체를 사용하세요
• "~요" 어미로 끝내되, 과하게 친한 척하지 말고 세련된 리뷰어의 톤앤매너를 유지하세요
• 1~2문장, 각 씬 duration × 4.5글자 이하
• 단순 상황 설명("~하고 있습니다") 절대 금지. 오감(시각, 청각, 미각, 촉각)을 자극하는 디테일한 표현을 1개 이상 섞어주세요.
  (예: "혀끝에 닿자마자 녹아내리는 육향", "은은하게 배어있는 숯불향", "아삭하게 씹히는 단면")
• 화면에 실제 보이는 것을 구체적으로 설명 (narration_hint 참고)

[🚨 트렌드 인지 및 '뒷북' 화법 절대 금지 (Trend Awareness)]
• 이미 대대적으로 유행한 아이템(예: 두바이 초콜릿, 두바이 쿠키, 요아정, 마라탕, 탕후루 등)을 마치 '세상에 처음 나온 신기한 음식'처럼 소개하는 뒷북 멘트를 절대 금지합니다.
• ❌ 금지 예시: "겉모습만 보고 평범한 쿠키라고 생각하면 오산!", "이름부터 특이한", "처음 보실 텐데요", "이게 도대체 뭘까요?"
• 시청자들은 이미 최신 트렌드를 다 알고 있다고 가정하세요. 시청자의 높은 정보력을 존중하는 세련된 화법을 구사하세요.
• ✅ 올바른 화법: "다들 아시는 그 맛", "유행 끝물인 줄 알았는데 막상 먹어보니", "도대체 얼마나 맛있길래 아직도 난리인지 직접 검증해봤습니다" 처럼 이미 트렌드를 알고 탑승하는 포지션을 취하세요.

[🎯 2026 최신 숏폼 트렌드 가이드 — 자막 & 나레이션 필수 지침]
1. 트렌디한 훅(Hook) 구조: 결론을 선제시하세요.
   • ❌ 올드한 훅: "안녕하세요! 오늘은 광화문에 있는 파틱에 왔습니다." (절대 금지)
   • ✅ 트렌디 훅: "나만 알고 싶은 광화문 데이트 종착지", "N년차 빵순이가 정착한 곳" 등 POV와 타겟을 명확히
2. 나레이션 트렌드: TV 방송국 리포터 톤, 인위적인 하이텐션 절대 금지. 친한 지인에게 카톡으로 추천하듯 무심하고 담백하게 팩트만 전달하세요.
   • ✅ 예시: "여긴 진짜 무조건입니다", "비주얼부터 압도적이더라고요"
3. 자막 트렌드(정보 비대칭): 나레이션을 그대로 자막에 쓰지 마세요. 자막=짧고 굵은 카피, 나레이션=자막의 부연 설명.
   • ❌ 나쁜 예: (자막) 치즈가 듬뿍 늘어나네요 / (음성) 치즈가 듬뿍 늘어나네요
   • ✅ 좋은 예: (자막) 미친 치즈 폭포 🧀 / (음성) 젓가락으로 집어 올리기 버거울 정도로 치즈가 쏟아집니다

[🥁 2026 숏폼 나레이션 리듬 최적화]
• 절대 문장을 길게 쓰지 마세요. 3~4어절 단위로 짧게 툭툭 끊어 치세요.
• 접속사(그리고, 그래서, 하지만, 그런데) 100% 삭제하세요.
• 모든 문장을 "~요"나 "~다"로 똑같이 끝내지 마세요. 평서문, 의문문, 명사형 종결을 교차로 사용하여 성우가 숨 가쁘고 리드미컬하게 읽을 수 있게 대본을 짜세요.
• ❌ 금지: "이곳의 고기는 정말 부드럽고 육즙이 가득해서 맛있습니다."
• ✅ 추천: "육즙 보이시죠? 입에 넣자마자 사라집니다. 진짜 미쳤어요."

[📸 비주얼 구성 원칙 — 전체 샷 확보]
• 모든 장면을 클로즈업으로만 구성하지 마세요.
• 첫 번째 씬과 식당 소개 씬에서는 음식의 전체 크기와 테이블 세팅이 한눈에 보이는 풀샷 또는 미디엄샷을 우선 배치하세요.
• 나레이션에서 "자태 좀 보세요"라고 할 때는 반드시 음식이 잘리지 않은 전체 사진을 매칭하세요.

[🎬 인간 크리에이터급 컷편집 템플릿 — 비트매칭 필수 적용]
모든 블록을 기계적으로 3초씩 배분하는 촌스러운 편집을 절대 금지합니다.
아래 비트매칭 구조로\`blocks\` 출력 JSON(하단 참조)을 구성하고, 각 블록의 \`video_cuts\` 안에서 0.5~1.5초 짧은 컷과 1.5~2.5초 긴 컷을 반드시 섞어 리듬감을 만드세요.
단, 모든 video_cuts의 duration 합 = 해당 블록의 total_duration과 일치해야 합니다.

■ 비트매칭 리듬 규칙:
- 블록 시작 훅 컷: 0.7~1.2초 (나레이션 없음 — 자막 + 임팩트 비주얼만)
- 교차 편집 컷: 0.5~1.0초짜리 클로즈업 1~2개
- 클라이맥스 안정 컷: 1.5~2.5초 (풀샷 또는 인테리어 — 나레이션 본격 시작)
- CTA 블록: 총 3.0~4.5초 (single cut 또는 2 cuts)

[🎥 카메라 앵글 및 화각(Shot Size) 배치 규칙]
- 블록마다 화각을 교차 편집(Cross-cutting)하여 시청자 시각 피로를 줄이세요.
- 첫 번째 블록 훅 컷: 강렬한 '클로즈업(Close-up)' 위주
- 두 번째~세 번째 블록: 상차림 전체가 보이는 '테이블 풀샷(Full-shot)' 또는 '매장 인테리어'
- 🚨 풀샷 배정 컷의 나레이션에서는 "육즙이 흐르네요" 같은 근접 묘사 절대 금지. 대신 "상다리가 부러질 듯한 스케일", "분위기 미치지 않았나요?" 등 공간 전체를 아우르는 대본 작성.

[🚨 절대 금지 — 유치함·클리셰 원천 차단 (위반 시 즉시 재생성 대상)]
• 가격 정보를 훅/자막/나레이션에 전면 배치 절대 금지: "소주 3천원", "1인 만원", "가격 실화" 등 구체적 금액 언급 금지. 가격은 언제든 변동되므로 영상에 수치를 넣으면 오정보 위험. 맛·경험·분위기·가성비 감성으로 대체.
• 억지 줄임말·신조어 창조 금지: '두쫀쿠' 등 원본에 없는 줄임말 임의 생성 금지. 상호명·메뉴명은 있는 그대로 사용.
• 시청자 무시·가르치려는 톤 금지: "처음 보시는 거일 거예요", "이거 모르면 간첩", "저만 믿고 따라오세요" 절대 금지.
• 오글거리는 삼류 수식어 완전 금지: "이름도 특이한", "마법의 맛", "입안에서 춤을 추는", "환상적인", "신세계" 절대 금지.
• 만화적 의성어로 시작 금지: "짜잔~", "두둥!", "등장~" 등 유치한 오프닝 금지.
• 기계적 감탄사 금지: "어머어머", "우와아", "음~" 등 영혼 없는 감탄사 나열 금지.
• 사물 존칭 절대 금지: "고기 두께가 좋으십니다", "커피 나오셨습니다" 형태 금지.
• 자신감 없는 어미 금지: "~인 것 같아요", "~보이네요" 대신 능동태로 확신하여 말하세요.
• 철 지난 유행어 완전 차단: '찢었다', '폼 미쳤다', 'JMT', '갓성비', '레전드', '밥도둑', '꿀맛', '비주얼 깡패', '마약 ○○', '폭풍 흡입', '순삭', '맛집 인정', '소름 돋는', '겉바속촉', '둘이 먹다 하나 죽어도 모를' 절대 금지.
• "텐션 높음"의 올바른 해석: 크게 소리치는 것이 아님. 트렌디한 2030 직장인이 세련되게 고급 정보 공유하는 '담백하지만 확신에 찬 톤' 이 진짜 텐션.
• '솔직히', '진짜' 연속 반복 및 문장 시작 남발 절대 금지, '여러분~' 집합 호명 금지, "오늘은 어디를 가볼까요?" 식 도입 절대 금지.
• '여기 안 가면 손해', '인생 맛집 실화', '가지 않으면 후회' 류 과장형 손실 유발 캐치프레이즈 절대 금지.
• 클라이맥스 씬에서는 나레이션을 비우거나 한 단어로만 두어 현장음이 돋보이게 하세요.

[🎥 Show, Don't Tell — 침샘 자극 오감 묘사법]
• "맛있다", "좋다", "최고다", "환상적이다" 같은 1차원적 감정·평가 형용사 사용 엄격 금지.
• 재료의 텍스처·조리방식·온도감·색감·향기를 구체적 오감(시각·청각·촉각) 단어로 묘사하세요.
• ❌ 금지: "스테이크가 진짜 부드럽고 맛있어요." → ✅ 권장: "칼을 댈 필요도 없이 결대로 찢어집니다. 은은한 버터 향이 확 퍼지네요."
• "달달해요" → "기분 좋은 은은한 단맛" / "매워요" → "혀를 기분 좋게 때리는 맵기" / "부드러워요" → "몇 번 씹을 필요도 없이 넘어가는"
• "겉바속촉" 단어 금지 → "포크가 들어갈 땐 바삭, 씹을 땐 육즙이 팡 터집니다"처럼 직접 묘사.

[🎭 자막·나레이션 역할 분리 — 정보의 교차]
• 화면 자막(caption1)과 귀로 듣는 나레이션(narration)을 절대 똑같은 문장으로 쓰지 마세요.
• 자막(caption1)은 시선을 끄는 훅(Hook) 카피라이팅, 나레이션은 그 자막의 배경·맥락을 풀어주는 스토리텔링.
• ❌ 금지: (자막) "광화문 골목 숨은 맛집" / (나레이션) "광화문 골목 숨은 맛집입니다."
• ✅ 권장: (자막) "간판도 없는 이곳" / (나레이션) "지도 앱을 켜고도 하마터면 그냥 지나칠 뻔했습니다."
• 로컬 키워드 자연 배치: "광화문 회식", "을지로 데이트" 등 검색 알고리즘 키워드를 자막에 녹이세요.

[🎵 문장 호흡·리듬 제어 — TTS 최적화]
• 한 문장은 15자 이내 원칙. 쉼표(,)가 2개 이상 들어갈 긴 문장 금지.
• 접속사('그리고', '그래서', '그런데') 과감히 생략.
• 명사형 종결 믹스: 모든 문장을 "~요"로 끝내지 말고 "완벽한 굽기.", "그야말로 예술."처럼 끊어 리듬감 부여.
• 강조 단어 앞 쉼표 전략: "이건, 무조건 시키세요." 형태로 TTS 한 박자 쉬게 유도.
• "데이트 코스로 딱이에요" 금지 → "애프터 성공률 200% 보장하는 무드"처럼 타겟팅된 카피.

[자막 다이어트 규칙 — ★절대 준수★]
• 메인 자막(caption1): 공백 포함 12자 이내. (예: "여긴 진짜 나만 알래", "육즙 파티🤤", "웨이팅 가치 있는 이유")
• 서브 자막(caption2): 키워드 위주 8자 이내. (예: "당장 저장각", "무조건 오픈런", "숯불향 실화")
• 마침표(.) 생략, 임팩트 이모지(🔥 ✨ 🤤 💖) 적극 활용
• 설명조 긴 문장 절대 금지 — 친구 카톡처럼 짧고 강렬하게 끊기
• 할 말이 많으면 장면을 쪼개서 자막을 나눠 배치
• subtitle_style: hook(첫 씬) | hero(클라이맥스) | cta(마지막) | minimal(여운/감성) | elegant(에세이)

[★ SNS 태그 규칙 — 반드시 준수]
naver_clip_tags : #협찬 으로 시작, 이어서 지역·음식·분위기 태그 공백 나열, 총 300자 이내
youtube_shorts_tags : 핵심 태그 5~8개, 공백 포함 100자 이내. ⚠️ 무브먼트·무브먼트픽 등 브랜드 자체 태그 절대 제외. 음식점 이름·지역·메뉴 중심 태그만 사용.
instagram_caption : 감성 소개 2~3줄

#태그1 #태그2 #태그3 #태그4 #태그5 (5개 딱 맞기)
tiktok_tags : #태그 딱 5개만 공백 구분. 무브먼트 브랜드 태그 제외.
${requiredKeywords.trim() ? `
[📌 필수 포함 키워드 — 아래 키워드를 naver_clip_tags와 hashtags_30에 반드시 포함할 것]
${requiredKeywords.trim()}
` : ""}

[컷 매칭 규칙 — ★매우 중요★]
• 각 이미지를 제공할 때 앞에 "--- [원본 미디어 번호 media_idx: N] ---" 이라고 라벨을 뺙여두었습니다.
• 스크립트 씨(scene)을 구성할 때, 화면에 나가는 컷이 어떤 원본 파일인지 파악하여 라벨에 적힌 정확한 N값을 "media_idx" 필드에 적어주세요.
• 반드시 권장 컷 순서 [${order.join(",")}] 의 흐름을 따라 장면을 전개하세요.
${exteriorIdx !== void 0 ? `• ⚠️ 가게 외관/간판 사진(media_idx: ${exteriorIdx})은 반드시 마지막 CTA 블록에만 배치. 고기 굽는 씬·밥상 차림 씬 중간에 외관이 끼어들면 영상 흐름이 끊기는 심각한 편집 오류입니다. 절대 금지.` : ""}
• 🎯 씬-미디어 내용 일치 원칙: 씬의 narration/caption에서 특정 음식(예: 볶음밥)을 설명할 때는 반드시 그 음식이 직접 촬영된 media_idx만 사용하세요. 볶음밥 설명 씬에 고기·김치·다른 반찬 사진을 배치하는 것은 절대 금지입니다. 해당 메뉴가 찍힌 미디어가 없으면 그 씬 자체를 삭제하거나 실제 촬영된 다른 메뉴로 내용을 교체하세요.
• 🥗 밑반찬 씬 ≠ 식전 음료/주스 씬: 밑반찬(반찬, 기본찬, 겉절이 등)을 설명하는 씬에는 반찬 사진만 배치. 식전주스·음료 사진은 밑반찬 씬에 배치하지 마세요. 카테고리가 다른 음식/음료는 별도 씬으로 독립 구성하거나 생략하세요.

[카메라 워크 지시사항]
각 씨의 'effect' 필드에는 아래 6가지 중 미디어의 특성에 맞는 것을 하나 반드시 선택하세요:
1. zoom-in: 음식 디테일 강조 시
2. zoom-out: 전체 분위기 공개 시
3. pan-right/pan-left: 넓은 공간이나 정갈하게 놓인 음식을 훑을 때
4. tilt-up/tilt-down: 층이 쉬인 디저트나 건물 외관을 보여줄 때
★ 정적인 컷은 절대 금지! 모든 씨에 역동적인 움직임을 부여하세요. ★

[모범 나레이션 예시 (이 현실적인 톤과 길이를 똑같이 따라하세요)]
- 씬1: "요즘 이 동네에서 가장 예약하기 힘들다는 곳, 드디어 다녀왔습니다."
- 씬2: "두툼한 고기 두께 보이시나요? 숯불향이 은은하게 코를 스치는데, 굽기 전부터 기대가 되더라고요."
- 씬3: "씹을 것도 없이 부드럽게 넘어가요. 고기 본연의 진한 육향이 입안에 오래 남습니다."
- 씬4: "정갈한 밑반찬 하나하나에 정성이 듬뿍 담겨 있어서, 부모님 모시고 오기에도 참 좋은 곳이에요."
- 마지막 씬(CTA): "웨이팅이 아깝지 않은 찐맛집이었습니다! 무브먼트 구독하고 숨은 맛집 정보 계속 받아가세요. 좋아요와 댓글도 큰 힘이 됩니다!"

[릴스 최적화 자가 검증 — 최종 JSON 출력 전 스스로 채점 후 audit_report에 담기]
• Hook(후킹): 첫 씬 caption1이 2초 안에 시청자를 멈추게 하는가? (0~100점)
• Readability(가독성): 모든 caption1이 12자 이내, caption2가 8자 이내인가? (0~100점)
• Pacing(박자): 모든 블록의 total_duration이 3.0~5.5초 범위이고, video_cuts 개별 컷의 합이 total_duration과 일치하는가? (0~100점)
3항목 평균 점수를 "score" 필드에, 릴스에서 터지는 이유 한 줄을 "reason" 필드에 담아서 JSON에 포함하세요.
기준 미달 항목은 즉시 수정 후 출력하세요.

[📣 마케팅 에셋 생성 — JSON에 marketing 필드 반드시 포함]
• hook_title: 클릭을 유도하는 릴스 제목. "무브먼트픽 🔥 직접 다녀온 리얼 후기", "내돈내산 솔직 후기 — 이 집 혼자 알고 싶었어" 처럼 무브먼트 퍼스널 브랜딩 + 강렬한 훅 문구를 결합할 것. ⚠️ "여기 안 가면 손해", "인생 맛집 실화" 등 과장 캐치프레이즈 절대 금지.
• caption: 인스타그램 본문 캡션. "이 집만큼은 혼자 알고 싶었는데 😅" 처럼 무브먼트 1인칭 페르소나(내돈내산 찐 추천)를 첫 문장에 넣고, 감성 2~3문장 + 방문자 액션 유도 (저장, 좋아요, 댓글). 줄바꿈은 
 사용. ⚠️ "진짜", "솔직히" 반복 남발 금지.
• hashtags_30: 지역 태그 5개 + 음식 카테고리 태그 10개 + 분위기/감성 태그 5개 + 2026 트렌딩 태그 10개. 공백으로 구분, 정확히 30개.
• receipt_review: 네이버 영수증 리뷰용 10~20자 극잘형 한 줄 평 (예: "사장님 친절하고 고기 질 짱. 재방문 200%"). 실제 식당에 갔다 온 사람이 쏴 마음으로 남기는 리얼 훅구체.

[🎯 3종 훅 빅리에이션 — JSON에 hook_variations 배열 반드시 포함]
다음 3가지 오프닝 스타일로 첫 번째 씬의 다른 다른 버전을 제안하세요:
• shock 형: 충격/궁금증 유발 ("...?!", "이거 맞는데?")
• info 형: 정보전달형 ("인천 3대 타이틀?", "여기를 모르면 간첩")
• pov 형: 1인칭 공감 ("퇴근하고 여기 어때?", "어제 다녀왔는데")
로 {타입}: {caption1}, {caption2}, {narration} 옵션 3개가 있는 배열로 출력.

[🎬 오디오/비디오 트랙 분리 구조 (★필수 적용★)]
기존의 '1화면 = 1자막/음성' 구조를 절대 금지합니다. 아래 \`blocks\` 구조로 출력하세요.
- narration: 자연스럽게 이어지는 한 문장 (2~4초 길이 호흡)
- caption: 블록 전체 시간 동안 유지되는 짧고 굵은 자막
- total_duration: narration 길이 + 여유 0.5초 이상 (3.0~5.5초 고정 범위, 최소 3.0s 준수)
- video_cuts: narration이 재생되는 동안 화면에서 빠르게 교차할 짧은 컷들 (0.5~2.5초)
※ video_cuts 각 항목에 media_idx를 반드시 지정하세요. 시스템이 타이밍 자동 보정합니다.

JSON만 반환:
{"audit_report":{"score":93,"reason":""},"title":"","theme":"grill","vibe_color":"#FF6B35","hashtags":"","naver_clip_tags":"","youtube_shorts_tags":"","instagram_caption":"","tiktok_tags":"","marketing":{"hook_title":"","caption":"","hashtags_30":"","receipt_review":""},"hook_variations":[{"type":"shock","caption1":"","caption2":"","narration":""},{"type":"info","caption1":"","caption2":"","narration":""},{"type":"pov","caption1":"","caption2":"","narration":""}],"blocks":[
  {"narration":"다들 아시는 그 맛이겠거니 했는데, 한 입 먹고 바로 생각 바뀌었습니다.","caption":"🚨 유행 끝물인 줄 알았는데","caption2":"당장 저장각","subtitle_style":"hook","energy_level":4,"retention_strategy":"opening_question","effect":"zoom-in","total_duration":4.0,"video_cuts":[{"duration":0.8,"media_idx":2,"visual_focus":"훅 — 음식을 자르거나 뒤집는 역동적인 첫 컷"},{"duration":0.7,"media_idx":3,"visual_focus":"단면 클로즈업"},{"duration":2.5,"media_idx":0,"visual_focus":"전체 상차림 풀샷"}]}
]}`;
  const makeReq = async (url) => {
    const body = {
      system_instruction: {
        parts: [{ text: "당신은 감각적이고 진정성 있는 로컬 맛집 리뷰어 '무브먼트(moovlog)'입니다. '대박', '실화', '미쳤다', '기절' 같은 작위적이고 뻔한 유튜브식 과장어를 절대 사용하지 마세요. 대신 시청자가 텍스트만 읽어도 침이 고이도록, 음식의 디테일과 식당의 분위기를 담백하고 현실감 있는 일상어로 세련되게 묘사해야 합니다." }]
      },
      contents: [{ parts: [...imgParts, { text: prompt }] }],
      generationConfig: { temperature: 0.92, responseMimeType: "application/json" }
    };
    const data = await apiPost(url, body);
    const raw = safeExtractText(data);
    const _s = raw.indexOf("{"), _e = raw.lastIndexOf("}");
    const obj = JSON.parse(_s >= 0 && _e > _s ? raw.slice(_s, _e + 1) : raw.replace(/```json|```/g, "").trim());
    const hasBlocks = Array.isArray(obj.blocks) && obj.blocks.length > 0;
    const hasScenes = Array.isArray(obj.scenes) && obj.scenes.length > 0;
    if (!hasBlocks && !hasScenes) throw new Error("스크립트 오류");
    if (hasBlocks) {
      obj.blocks = obj.blocks.map((block) => {
        const cuts = Array.isArray(block.video_cuts) ? block.video_cuts.map((cut) => ({
          ...cut,
          duration: Math.max(0.5, Math.min(3, Number(cut.duration) || 1))
        })) : block.video_cuts;
        const rawCutTotal = Array.isArray(cuts) ? cuts.reduce((s, c) => s + (c.duration || 1), 0) : 0;
        const clampedTotal = Math.max(3, Math.min(5.5, Number(block.total_duration) || 4));
        let finalCuts = cuts;
        if (Array.isArray(cuts) && cuts.length > 0 && rawCutTotal < clampedTotal - 0.05) {
          finalCuts = [...cuts];
          finalCuts[finalCuts.length - 1] = {
            ...finalCuts[finalCuts.length - 1],
            duration: Math.round((finalCuts[finalCuts.length - 1].duration + (clampedTotal - rawCutTotal)) * 100) / 100
          };
        }
        return { ...block, total_duration: clampedTotal, video_cuts: finalCuts };
      });
    }
    if (hasScenes) {
      obj.scenes = obj.scenes.map((sc) => ({
        ...sc,
        duration: Math.max(2, Math.min(4.5, Number(sc.duration) || 3))
      }));
    }
    const s0 = obj.blocks?.[0] || obj.scenes?.[0];
    if (!obj.hook_variations?.length && s0) {
      const s0cap1 = s0.caption1 || s0.caption || "";
      const s0cap2 = s0.caption2 || "";
      const s0nar = s0.narration || "";
      obj.hook_variations = [
        { type: "shock", caption1: s0cap1, caption2: s0cap2, narration: s0nar },
        { type: "info", caption1: s0cap1, caption2: "이 집 간다 ✅", narration: s0nar },
        { type: "pov", caption1: "오늘 여기 어때?", caption2: s0cap2, narration: s0nar }
      ];
    }
    return obj;
  };
  const preferPro = String(undefined                                       || "0") === "1";
  const primaryModel = preferPro ? "gemini-2.5-pro" : "gemini-2.5-flash";
  const fallbackModel = preferPro ? "gemini-2.5-flash" : "gemini-2.5-pro";
  try {
    return await makeReq(getApiUrl(primaryModel));
  } catch (e) {
    console.warn(`[Script] ${primaryModel} 실패 → ${fallbackModel} 폴백:`, e.message);
    return makeReq(getApiUrl(fallbackModel));
  }
}

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
  const sceneSummary = scenes.slice(0, 10).map((sc, i) => {
    const narration = sc.narration || '';
    const caption = sc.caption || sc.caption1 || '';
    const duration = sc.total_duration || sc.duration || 0;
    const cutCount = Array.isArray(sc.video_cuts) ? sc.video_cuts.length : 1;
    return `씬${i + 1}: narration="${narration}" caption="${caption}" total_duration=${duration}s cuts=${cutCount}`;
  }).join('\n');

  const blockCount = script.blocks?.length || 0;
  const flatSceneCount = script.scenes?.length || 0;
  const structureInfo = blockCount > 0
    ? `블록 수: ${blockCount}개`
    : `씬 수: ${flatSceneCount}개`;

  const prompt = `당신은 2026년 한국 숏폼 콘텐츠 전문 QA 디렉터입니다.
아래 릴스/쇼츠 스크립트를 검수하고 품질 점수를 평가하세요.

식당명: ${restaurantName}
업체 유형: ${restaurantType || '미분류'}
구조: ${structureInfo}

[스크립트 요약 - 최대 10씬]
${sceneSummary}

[검수 기준 (각 항목 0~10점)]
1. 훅(Hook): 첫 씬이 2초 안에 시청자를 멈추게 하는가? 결론 선제시, 강렬한 비주얼 묘사?
2. 금지어 준수: "미쳤다", "대박", "환상적인", "선사", "구워드립니다(표현 오류)" 등 금지어 미사용?
3. 흐름(Flow): 씬 간 이야기가 자연스럽게 연결되는가? 반전→클라이맥스→CTA 아크 구성?
4. 정보 밀도: 음식점 특징·메뉴 정보가 충분히 담겼는가? 오감 묘사 포함?
5. CTA: 마지막 씬에 구독/좋아요 유도가 포함되었는가?

threshold: 총점 45점 이상(90%)이면 통과 — 44점 이하면 무조건 pass:false 반환

JSON만 반환:
{"total_score": 47, "pass": true, "hook": 9, "banned_words": 10, "flow": 9, "info_density": 10, "cta": 9, "issues": [], "suggestion": ""}`;

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
    return { total_score: 50, pass: true, issues: [], suggestion: '' };
  }
}

// src/engine/utils.js

const sleep = ms => new Promise(r => setTimeout(r, ms));

function splitCaptions(text) {
  if (!text) return ['', ''];
  const clean = text.trim();
  if (clean.includes('\n')) {
    const parts = clean.split('\n').map(s => s.trim()).filter(Boolean);
    return [parts[0] || '', parts.slice(1).join(' ') || ''];
  }
  const sm = clean.match(/^(.{3,14}[.!?…]+)\s*(.{2,})$/);
  if (sm) return [sm[1], sm[2]];
  const cp = clean.split(/[,，]/);
  if (cp.length >= 2 && cp[0].trim().length >= 3)
    return [cp[0].trim(), cp.slice(1).join(',').trim()];
  const stripped = clean.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim();
  if (stripped.length <= 10) return [clean, ''];
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  const mid = Math.ceil(clean.length / 2);
  return [clean.slice(0, mid), clean.slice(mid)];
}

function formatDuration(sec) {
  const s  = Math.max(0, Math.floor(Number(sec) || 0));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p  = n => String(n).padStart(2, '0');
  return hh > 0 ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
}

function sanitizeName(name) {
  return (name || 'video').replace(/\s+/g, '_') + '_' + Date.now();
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 8000);
}

// firebaseUploadVideo는 VideoPlayer에서 직접 사용 — pipeline에서 pipelineSessionId 노출

// ─── 자막 분할 ────────────────────────────────────────────
// (utils.js에서 임포트, 기존 splitCaptions() 동일)

function flattenBlocksToScenes(script) {
  if (!Array.isArray(script?.blocks) || !script.blocks.length || script.scenes?.length) return script;
  const flatScenes = [];
  let globalMediaIdx = 0;

  script.blocks.forEach((block, bIdx) => {
    const cuts = (block.video_cuts && block.video_cuts.length > 0)
      ? block.video_cuts
      : [{ duration: block.total_duration || 3.0, media_idx: block.media_idx }];

    cuts.forEach((cut, cIdx) => {
      let humanNarration = '';
      if (cIdx === 0 && block.narration) {
        humanNarration = block.narration
          .replace(/\.(?!\.)/g, ' ')
          .replace(/,/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
      flatScenes.push({
        ...cut,
        blockIdx: bIdx,
        isFirstInBlock: cIdx === 0,
        media_idx: cut.media_idx !== undefined
          ? cut.media_idx
          : (block.media_idx !== undefined ? block.media_idx : globalMediaIdx++),
        caption1: cIdx === 0 ? (block.caption || block.caption1 || '') : '',
        caption2: cIdx === 0 ? (block.caption2 || '') : '',
        narration: humanNarration,
        effect: cut.effect || block.effect || 'zoom-in',
        subtitle_style: block.subtitle_style || 'hero',
        energy_level: block.energy_level || 3,
        retention_strategy: block.retention_strategy || 'build',
      });
    });
  });

  console.log(`[Pipeline] blocks 평탄화: ${script.blocks.length}블록 → ${flatScenes.length}씬`);
  return { ...script, scenes: flatScenes };
}

function tokenizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);
}

function tokenOverlapScore(tokens, text) {
  if (!tokens.length) return 0;
  const source = String(text || '').toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (source.includes(t)) score += 1;
  }
  return score;
}

function refineScenesForStoryboard(scenes, files, analysis) {
  if (!Array.isArray(scenes) || !scenes.length) {
    return { scenes: Array.isArray(scenes) ? scenes : [], mediaSwapCount: 0, subtitleFixCount: 0 };
  }

  const refined = scenes.map(sc => ({ ...sc }));
  const analysisMap = {};
  for (const p of (analysis?.per_image || [])) analysisMap[p.idx] = p;
  const allMediaIdxs = files.map((_, i) => i);
  let mediaSwapCount = 0;
  let subtitleFixCount = 0;

  // 외관 컷은 마지막 CTA에 고정 + 비마지막 씬에 외관 배정 강제 제거
  const exteriorIdx = analysis?.per_image?.find(p => p?.is_exterior === true)?.idx;
  const nonExteriorIdxs = allMediaIdxs.filter(idx => !analysisMap[idx]?.is_exterior);
  if (Number.isInteger(exteriorIdx) && refined.length && files[exteriorIdx]) {
    const lastIdx = refined.length - 1;
    if (refined[lastIdx].media_idx !== exteriorIdx) {
      refined[lastIdx].media_idx = exteriorIdx;
      mediaSwapCount++;
    }
    // 비마지막 씬에 외관이 배정된 경우 foodie_score 높은 비외관 미디어로 교체
    const foodIdxsSorted = nonExteriorIdxs.slice().sort((a, b) =>
      (analysisMap[b]?.foodie_score || 0) - (analysisMap[a]?.foodie_score || 0)
    );
    for (let i = 0; i < refined.length - 1; i++) {
      if (refined[i].media_idx === exteriorIdx) {
        const alt = foodIdxsSorted.find(idx => !refined.slice(0, i).some(s => s.media_idx === idx && s !== refined[i]));
        if (alt !== undefined) { refined[i].media_idx = alt; mediaSwapCount++; }
      }
    }
  }

  // [팟바란 영상 두 자리 코드 제거]
  // 기존 코드: 0번째 + 짝수 위치에 무조건 영상 순환 배치 → 자막과 다른 영상이 튜어나는 문제 발생
  // 수정: Gemini가 직접 할당한 media_idx 신뢰. 콘텐츠 매칭 기반으로만 보정.
  // 단, 영상 파일 중 상당히 더 잘 맞는 것이 있으면 서브스티 스왓
  const videoIdxs = files.map((f, i) => (f.type === 'video' ? i : -1)).filter(i => i >= 0);
  if (videoIdxs.length) {
    // 영상을 주입할 지 마 어느 술지 가장 잘 맞는 요소로 결정
    // 영상 사용륙이 0개이면 첫 번째 씨 + 홀수 았는 씨에 영상 서브스티만 (콘텐츠 스코어 확인)
    const usedVideoIdxSet = new Set(refined.filter(s => files[s.media_idx]?.type === 'video').map(s => s.media_idx));
    const unusedVideoIdxs = videoIdxs.filter(i => !usedVideoIdxSet.has(i));
    // 영상이 전혀 사용되지 앤으면 첫 씨에라도 넓음
    if (usedVideoIdxSet.size === 0 && videoIdxs.length > 0 && refined.length > 0) {
      refined[0].media_idx = videoIdxs[0];
      mediaSwapCount++;
    }
  }

  // 자막-영상 내용 매칭 검증: 텍스트와 focus 설명이 어긋나면 media_idx/자막 보정
  for (let i = 0; i < refined.length; i++) {
    const sc = refined[i];
    const curIdx = Number.isInteger(sc.media_idx) ? sc.media_idx : i;
    const textBundle = `${sc.caption1 || ''} ${sc.caption2 || ''} ${sc.narration || ''}`;
    const tokens = tokenizeText(textBundle);

    if (tokens.length) {
      let bestIdx = curIdx;
      let bestScore = tokenOverlapScore(tokens, `${analysisMap[curIdx]?.focus || ''} ${analysisMap[curIdx]?.narration_hint || ''}`);

      for (const idx of allMediaIdxs) {
        const candText = `${analysisMap[idx]?.focus || ''} ${analysisMap[idx]?.narration_hint || ''}`;
        const s = tokenOverlapScore(tokens, candText);
        if (s > bestScore) {
          bestScore = s;
          bestIdx = idx;
        }
      }

      if (bestIdx !== curIdx && bestScore >= 1) {
        // 외관은 마지막 씬에만 배치 — 비마지막 씬에 외관 content-matching 배정 차단
        if (i < refined.length - 1 && analysisMap[bestIdx]?.is_exterior) {
          // 외관 bestIdx는 중간 씬에 배정하지 않음
        } else {
          sc.media_idx = bestIdx;
          mediaSwapCount++;
        }
      }
    }

    const capNorm = String(sc.caption1 || '').replace(/\s+/g, '');
    const narNorm = String(sc.narration || '').replace(/\s+/g, '');
    if (capNorm && narNorm && capNorm === narNorm) {
      const shorter = String(sc.caption1 || '').replace(/[.!?]/g, '').trim().slice(0, 12);
      if (shorter && shorter !== sc.caption1) {
        sc.caption1 = shorter;
        subtitleFixCount++;
      }
    }

    const selectedMeta = analysisMap[Number.isInteger(sc.media_idx) ? sc.media_idx : i];
    if (sc.caption1 && !sc.caption2 && selectedMeta?.focus) {
      const capTokens = tokenizeText(sc.caption1);
      if (tokenOverlapScore(capTokens, selectedMeta.focus) === 0) {
        const hint = String(selectedMeta.focus).split(/[,.]/)[0].trim().slice(0, 10);
        if (hint) {
          sc.caption2 = hint;
          subtitleFixCount++;
        }
      }
    }
  }

  return { scenes: refined, mediaSwapCount, subtitleFixCount };
}

// ─── 파이프라인 메인 ──────────────────────────────────────
async function startMake() {
  const store = useVideoStore.getState();
  const {
    files, restaurantName, selectedTemplate,
    restaurantType, setDetectedRestaurantType,
    setPipeline, donePipelineStep, setScript,
    setAudioBuffers, setLoaded, setShowResult,
    addToast, setAutoStyleName, setTemplate, setHook,
    hidePipeline, resetPipelineProgress, setPipelineSessionId, setAnalysis,
    requiredKeywords,
  } = store;

  if (!files.length) { addToast('이미지 또는 영상을 올려주세요', 'err'); return; }
  if (!restaurantName.trim()) { addToast('음식점 이름을 입력해주세요', 'err'); return; }

  const { hasGeminiKey } = await __vitePreload(async () => { const { hasGeminiKey } = await Promise.resolve().then(() => gemini);return { hasGeminiKey }},true?void 0:void 0);
  if (!hasGeminiKey()) { addToast('Gemini API 키가 필요합니다', 'err'); return; }

  resetPipelineProgress();

  // AudioContext 초기화 (iOS 보안 정책 대응)
  const { audioCtx } = ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
  try {
    const _osc = audioCtx.createOscillator(), _gain = audioCtx.createGain();
    _gain.gain.value = 0;
    _osc.connect(_gain); _gain.connect(audioCtx.destination);
    _osc.start(0); _osc.stop(audioCtx.currentTime + 0.05);
  } catch (_) {}
  if (window.speechSynthesis) {
    const _u = new SpeechSynthesisUtterance(''); _u.volume = 0; speechSynthesis.speak(_u);
  }

  // 파이프라인 공유 sessionId — originals·video 모두 같은 폴더
  const pipelineSessionId = `${Date.now()}_${restaurantName.trim().replace(/\s+/g, '_')}`;
  setPipelineSessionId(pipelineSessionId);

  // Firebase Storage 업로드 — CORS 설정(gsutil cors set) 전까지 비활성화
  // firebaseUploadOriginals(files, restaurantName, pipelineSessionId).catch(() => {});

  // 화면 꺼짐 방지 (Wake Lock API) — 생성 중 휴대폰 꺼져도 계속 진행
  let _wakeLock = null;
  try {
    if (navigator.wakeLock) {
      _wakeLock = await navigator.wakeLock.request('screen');
      console.log('[WakeLock] 화면 잠금 방지 활성화');
    }
  } catch (_wlErr) { /* 지원 안 해도 계속 진행 */ }

  try {
    // ── STEP 1: 식당 인텔리전스 — 데이터 선행형 파이프라인 ─────────────────────
    // 💡 데이터 먼저! 식당 정보 → AI가 "어떤 사진이 핵심인지" 알고 이미지 분석에 들어갑니다
    setPipeline(1, `"${restaurantName}" 식당 인텔리전스 수집 중...`, `데이터 선행형 — Gemini가 시그니처 메뉴·USP·방문 팁을 먼저 확보합니다`);
    const researchData = await researchRestaurant(restaurantName.trim()).catch(() => '');
    if (researchData) addToast('식당 인텔리전스 확보 ✅ — 데이터 기반 시각 분석 시작', 'ok');
    donePipelineStep(1);

    // ── STEP 2: 업체 유형 분류 ────────────────────────────────────────────────
    setPipeline(2, '업체 유형 분류 중...', '음식점 유형에 맞는 파이프라인 전략을 선택합니다');
    let effectiveType = restaurantType && restaurantType !== 'auto' ? restaurantType : '';
    if (!effectiveType) {
      // 사용자가 'auto' 선택 → AI가 자동 분류
      const tempAnalysis = { keywords: [], mood: '', menu: [] };
      const detected = await detectRestaurantType(restaurantName.trim(), tempAnalysis, researchData).catch(() => 'auto');
      effectiveType = detected !== 'auto' ? detected : '';
      if (effectiveType) {
        setDetectedRestaurantType(effectiveType);
        addToast(`업체 유형 감지: ${effectiveType}`, 'inf');
      }
    } else {
      setDetectedRestaurantType(effectiveType);
    }
    donePipelineStep(2);

    // ── STEP 3: 컨텍스트 기반 Vision Analysis ─────────────────────────────────
    // 💡 식당 정보를 먼저 숙지한 AI가 "어떤 사진이 시그니처 메뉴인지" 판단하며 분석합니다
    setPipeline(3, 'AI 컨텍스트 기반 이미지 분석 중...', '식당 데이터 참고 → 시그니처 메뉴 컷 우선 선별');
    const analysis = await visionAnalysis(restaurantName.trim(), researchData, effectiveType);

    // AI 자동 스타일 선택 + 업종별 프리셋 보정
    const curState = useVideoStore.getState();
    const userChoseManually = curState.selectedTemplate !== 'auto';
    const preset = effectiveType ? RESTAURANT_STYLE_PRESETS[effectiveType] : null;

    if (!userChoseManually) {
      const autoTemplate = preset?.template || analysis.recommended_template;
      if (autoTemplate) setTemplate(autoTemplate);

      if (preset?.hook) {
        setHook(preset.hook);
      } else if (analysis.recommended_hook) {
        setHook(analysis.recommended_hook);
      }
    } else if (analysis.recommended_hook) {
      setHook(analysis.recommended_hook);
    }

    const curTemplate = useVideoStore.getState().selectedTemplate;
    const { TEMPLATE_NAMES } = await __vitePreload(async () => { const { TEMPLATE_NAMES } = await Promise.resolve().then(() => videoStore);return { TEMPLATE_NAMES }},true?void 0:void 0);
    setAutoStyleName(TEMPLATE_NAMES[curTemplate] || curTemplate);
    addToast(
      userChoseManually
        ? `수동 선택: ${TEMPLATE_NAMES[curTemplate] || curTemplate}`
        : `AI 추천: ${TEMPLATE_NAMES[curTemplate] || curTemplate}${effectiveType ? ` · 업종(${effectiveType}) 최적화` : ''}`,
      'inf'
    );
    donePipelineStep(3);
    // analysis 저장 (VideoRenderer의 focus_coords · aesthetic_score 활용)
    setAnalysis(analysis);

    // ── STEP 4: 전체 스토리보드 우선 설계 ─────────────────────────────
    setPipeline(4, '전체 스토리보드 설계 중...', '먼저 내러티브 구조를 완성하고 컷 배치는 다음 단계에서 보정합니다');
    let workingScript = await generateScript(restaurantName.trim(), analysis, useVideoStore.getState().userPrompt, researchData, effectiveType, (useVideoStore.getState().requiredKeywords || '').trim());
    workingScript = flattenBlocksToScenes(workingScript);
    setScript(workingScript);
    donePipelineStep(4);

    // ── STEP 5: 영상 삽입 설계 + 자막 매칭 검증 ─────────────────────────
    setPipeline(5, '영상 컷 삽입 + 자막 매칭 검증 중...', '스토리보드 확정 후 영상 위치와 자막-컷 정합성을 자동 교정합니다');
    const refinedPlan = refineScenesForStoryboard(workingScript.scenes || [], files, analysis);
    workingScript = { ...workingScript, scenes: refinedPlan.scenes };
    setScript(workingScript);
    if (refinedPlan.mediaSwapCount > 0) {
      addToast(`컷 보정 완료: ${refinedPlan.mediaSwapCount}개 씬 media_idx 재배치`, 'ok');
    }
    if (refinedPlan.subtitleFixCount > 0) {
      addToast(`자막 보정 완료: ${refinedPlan.subtitleFixCount}개 씬 자막 수정`, 'ok');
    }
    donePipelineStep(5);

    // ── STEP 6: TTS ─────────────────────────────────────────────────
    setPipeline(6, 'AI 남성 보이스 합성 중...', `Gemini TTS Fenrir — ${workingScript.scenes.length}컷`);
    let audioBuffers;
    try {
      audioBuffers = await generateAllTTS(workingScript.scenes, (msg, type) => addToast(msg, type), workingScript.theme);
    } catch (ttsErr) {
      console.warn('[TTS] 전체 실패, 무음 진행:', ttsErr.message);
      audioBuffers = workingScript.scenes.map(() => null);
      addToast('AI 보이스 실패: 무음 영상으로 진행합니다', 'inf');
    }

    // 오디오 길이로 씬 duration 동기화 (while 루프 — 블록 오디오 잘림 방지)
    const isTrend = VIRAL_TRENDS[useVideoStore.getState().selectedTemplate];
    // analysis.per_image 인덱스 맵 (focus_coords, aesthetic_score 씬에 주입)
    const analysisMap = {};
    for (const p of (analysis.per_image || [])) analysisMap[p.idx] = p;

    const BPM_BEAT   = 0.46875;  // 128 BPM 한 비트
    const finalScenes = [];
    let sceneIdx = 0;
    while (sceneIdx < workingScript.scenes.length) {
      let sc      = workingScript.scenes[sceneIdx];
      const buf   = audioBuffers[sceneIdx];
      const isBlockCut = sc.blockIdx !== undefined;

      if (isBlockCut) {
        // ── 블록 그룹: 같은 blockIdx 컷 전체를 한 번에 처리 ──
        const blockStart = sceneIdx;
        const blockIdx   = sc.blockIdx;
        while (sceneIdx < workingScript.scenes.length && workingScript.scenes[sceneIdx].blockIdx === blockIdx) sceneIdx++;
        const blockScenes = workingScript.scenes.slice(blockStart, sceneIdx);
        const audioDur    = (buf && buf.duration > 0) ? buf.duration : 0;

        // 각 컷 AI 설계 duration 합산
        const rawTotal = blockScenes.reduce((sum, s) => sum + Math.max(BPM_BEAT, s.duration || BPM_BEAT), 0);
        // 필요 최소 총 길이: 오디오 + 0.5s 여유 AND 최소 2.5s 보장 (타이트 컷오프 방지)
        const minTotal = Math.max(audioDur > 0 ? audioDur + 0.5 : 0, 2.5);
        const deficit  = Math.max(0, minTotal - rawTotal);

        // 각 컷 BPM 스냅
        let durations = blockScenes.map(s =>
          Math.max(BPM_BEAT, Math.round(Math.max(BPM_BEAT, s.duration || BPM_BEAT) / BPM_BEAT) * BPM_BEAT)
        );
        // deficit → 마지막 컷에 보정
        if (deficit > 0) durations[durations.length - 1] += Math.ceil(deficit / BPM_BEAT) * BPM_BEAT;

        // BPM 스냅 후에도 부족하면 재보정
        const snappedTotal = durations.reduce((s, d) => s + d, 0);
        if (snappedTotal < minTotal) {
          durations[durations.length - 1] += Math.ceil((minTotal - snappedTotal) / BPM_BEAT) * BPM_BEAT;
        }

        blockScenes.forEach((s, j) => {
          let caption1 = s.caption1, caption2 = s.caption2;
          if (!caption1?.trim()) {
            const [c1, c2] = splitCaptions(s.narration || s.subtitle || '');
            caption1 = c1; caption2 = c2;
          }
          const imgMeta = analysisMap[s.media_idx ?? (blockStart + j)] || {};
          finalScenes.push({ ...s, duration: durations[j], caption1, caption2, subtitle: caption1 || s.subtitle || '',
            focus_coords:    imgMeta.focus_coords    || null,
            aesthetic_score: imgMeta.aesthetic_score || null,
            foodie_score:    imgMeta.foodie_score    || null,
            best_start_pct:  imgMeta.best_start_pct  || 0,
          });
        });
      } else {
        // ── 일반 씬 ──
        let duration;
        if (isTrend && isTrend.durations[sceneIdx] !== undefined) {
          const trendDur = isTrend.durations[sceneIdx];
          duration = (buf && buf.duration > 0)
            ? Math.max(trendDur, Math.round((buf.duration + 0.1) * 10) / 10)
            : trendDur;
          if (!sc.effect && isTrend.effect) sc = { ...sc, effect: isTrend.effect[sceneIdx % isTrend.effect.length] };
        } else if (buf && buf.duration > 0) {
          duration = Math.max(2.0, Math.round((buf.duration + 0.1) * 10) / 10);
        } else {
          duration = Math.max(2.0, sc.duration || 3.0);
        }
        duration = Math.max(2.0, Math.round(duration / BPM_BEAT) * BPM_BEAT);

        let caption1 = sc.caption1, caption2 = sc.caption2;
        if (!caption1?.trim()) {
          const [c1, c2] = splitCaptions(sc.narration || sc.subtitle || '');
          caption1 = c1; caption2 = c2;
        }
        const imgMeta = analysisMap[sc.media_idx ?? sceneIdx] || {};
        finalScenes.push({ ...sc, duration, caption1, caption2, subtitle: caption1 || sc.subtitle || '',
          focus_coords:    imgMeta.focus_coords    || null,
          aesthetic_score: imgMeta.aesthetic_score || null,
          foodie_score:    imgMeta.foodie_score    || null,
          best_start_pct:  imgMeta.best_start_pct  || 0,
        });
        sceneIdx++;
      }
    }

    // ── 영상 무조건 우선 배치 — 그리디 content-aware 매칭 + 미사용 이미지 b-roll ──────
    // ⚠️ 핵심 규칙: 영상이 있으면 무조건 이미지 씬보다 먼저 배치 (점수 임계값 없음)
    {
      const exteriorIdxSet = new Set(
        (analysis.per_image || []).filter(p => p.is_exterior).map(p => p.idx)
      );
      const BROLL_EFFECTS = ['zoom-in', 'pan-right', 'zoom-out', 'pan-left', 'tilt-up'];

      const videoIdxs = files.map((f, i) => f.type === 'video' ? i : -1).filter(i => i >= 0);
      const imageIdxs = files.map((f, i) => f.type === 'image' ? i : -1).filter(i => i >= 0);

      // ① 영상 무조건 우선 배치: 이미지 씬 → 미사용 영상 교체 (content score = 우선순위, 차단 아님)
      if (videoIdxs.length > 0) {
        const getUsedVidSet = () => new Set(
          finalScenes.map(s => files[s.media_idx]?.type === 'video' ? s.media_idx : -1).filter(i => i >= 0)
        );

        // 비외관 미사용 영상 풀
        let unusedVids = videoIdxs.filter(i => !getUsedVidSet().has(i) && !exteriorIdxSet.has(i));

        if (unusedVids.length > 0) {
          // 이미지 씬 인덱스 목록 (CTA 마지막 씬 제외)
          const imgSceneIdxs = [];
          for (let i = 0; i < finalScenes.length - 1; i++) {
            if (files[finalScenes[i].media_idx]?.type === 'image') imgSceneIdxs.push(i);
          }

          if (imgSceneIdxs.length > 0) {
            // (씬 i, 영상 j, content score) 행렬 생성 → score DESC 그리디 배치
            // bestPos=-1 방식 폐기: 점수가 0이어도 반드시 배치 (영상 무조건 우선)
            const pairs = [];
            for (const si of imgSceneIdxs) {
              const sc = finalScenes[si];
              const sceneTokens = tokenizeText(
                `${sc.caption1 || ''} ${sc.caption2 || ''} ${sc.narration || ''}`
              );
              for (const vi of unusedVids) {
                const vText = `${analysisMap[vi]?.focus || ''} ${analysisMap[vi]?.narration_hint || ''}`;
                const score = sceneTokens.length > 0 ? tokenOverlapScore(sceneTokens, vText) : 0;
                pairs.push({ si, vi, score });
              }
            }
            // 점수 높은 순 정렬 — 동점일 때 foodie_score 보조 기준
            pairs.sort((a, b) =>
              b.score - a.score ||
              (analysisMap[b.vi]?.foodie_score || 0) - (analysisMap[a.vi]?.foodie_score || 0)
            );

            // 1패스: greedy 배치 (점수 >= 1인 쌍 우선)
            const assignedScenes = new Set();
            const assignedVids = new Set();
            for (const { si, vi } of pairs) {
              if (assignedScenes.has(si) || assignedVids.has(vi)) continue;
              const meta = analysisMap[vi] || {};
              finalScenes[si] = { ...finalScenes[si], media_idx: vi, best_start_pct: meta.best_start_pct || 0 };
              assignedScenes.add(si);
              assignedVids.add(vi);
            }

            // 2패스: 아직 미배치 이미지 씬 + 미배치 영상이 남아 있으면 순차 배치 (score 0이라도)
            const remainingVids = unusedVids.filter(vi => !assignedVids.has(vi));
            let rvi = 0;
            for (const si of imgSceneIdxs) {
              if (assignedScenes.has(si) || rvi >= remainingVids.length) continue;
              const vi = remainingVids[rvi++];
              const meta = analysisMap[vi] || {};
              finalScenes[si] = { ...finalScenes[si], media_idx: vi, best_start_pct: meta.best_start_pct || 0 };
            }
          }
        }

        // 여전히 미사용 영상 → 몽타주 씬으로 삽입 (총 45초 이내)
        const remainingUnused = videoIdxs.filter(i => !getUsedVidSet().has(i) && !exteriorIdxSet.has(i));
        if (remainingUnused.length > 0 && finalScenes.length > 0) {
          const currentTotal = finalScenes.reduce((s, sc) => s + (sc.duration || 2.0), 0);
          const budget = Math.max(0, 45 - currentTotal);
          const canAdd = Math.min(remainingUnused.length, Math.floor(budget / 2.0));
          if (canAdd > 0) {
            const perDur = Math.max(2.0, Math.min(3.0, budget / canAdd));
            const lastScene = finalScenes.pop();
            for (let i = 0; i < canAdd; i++) {
              const vi = remainingUnused[i]; const meta = analysisMap[vi] || {};
              finalScenes.push({
                media_idx: vi, duration: Math.round(perDur * 10) / 10,
                caption1: '', caption2: '', narration: '', effect: BROLL_EFFECTS[i % BROLL_EFFECTS.length],
                subtitle_style: 'minimal', energy_level: 3, retention_strategy: 'build',
                focus_coords: meta.focus_coords || null, aesthetic_score: meta.aesthetic_score || null,
                foodie_score: meta.foodie_score || null, best_start_pct: meta.best_start_pct || 0,
              });
            }
            finalScenes.push(lastScene);
            addToast(`미사용 영상 ${canAdd}개 → 몽타주 삽입`, 'ok');
          }
        }
      }

      // ② 미사용 이미지 b-roll 보충 (foodie_score 상위 고품질만, 총 45초 이내)
      if (imageIdxs.length > 0 && finalScenes.length > 0) {
        const usedSet = new Set(finalScenes.map(s => s.media_idx));
        const unusedImgs = imageIdxs
          .filter(i => !usedSet.has(i) && !exteriorIdxSet.has(i))
          .sort((a, b) =>
            ((analysisMap[b]?.foodie_score || 0) * 2 + (analysisMap[b]?.aesthetic_score || 0) * 0.05) -
            ((analysisMap[a]?.foodie_score || 0) * 2 + (analysisMap[a]?.aesthetic_score || 0) * 0.05)
          );
        if (unusedImgs.length > 0) {
          const currentTotal = finalScenes.reduce((s, sc) => s + (sc.duration || 2.0), 0);
          const budget = Math.max(0, 45 - currentTotal);
          const qualImgs = unusedImgs.filter(i =>
            (analysisMap[i]?.foodie_score || 0) >= 4 || (analysisMap[i]?.aesthetic_score || 0) >= 60
          );
          const canAdd = Math.min(qualImgs.length, Math.floor(budget / 2.5));
          if (canAdd > 0) {
            const perDur = Math.max(2.0, Math.min(3.0, budget / canAdd));
            const lastScene = finalScenes.pop();
            for (let i = 0; i < canAdd; i++) {
              const imgIdx = qualImgs[i]; const meta = analysisMap[imgIdx] || {};
              finalScenes.push({
                media_idx: imgIdx, duration: Math.round(perDur * 10) / 10,
                caption1: '', caption2: '', narration: '',
                effect: ['zoom-in', 'zoom-out', 'pan-right', 'pan-left'][i % 4],
                subtitle_style: 'minimal', energy_level: 2, retention_strategy: 'build',
                focus_coords: meta.focus_coords || null, aesthetic_score: meta.aesthetic_score || null,
                foodie_score: meta.foodie_score || null, best_start_pct: 0,
              });
            }
            finalScenes.push(lastScene);
            addToast(`미사용 이미지 ${canAdd}개 → b-roll 삽입`, 'ok');
          }
        }
      }
    }

    // script 업데이트
    workingScript = { ...workingScript, scenes: finalScenes };
    setScript(workingScript);
    setAudioBuffers(audioBuffers);
    donePipelineStep(6);

    // ── STEP 7: 렌더링 준비 + AI 품질 검수 ─────────────────────────────
    setPipeline(7, '렌더링 준비 + 품질 검수 중...', '컷 배치 · 애니메이션 · 효과 적용 후 최종 QA를 수행합니다');
    const loaded = await preloadMedia(files);
    setLoaded(loaded);
    await sleep$1(200);

    let qcResult = await geminiQualityCheck(workingScript, restaurantName.trim(), effectiveType).catch(() => ({ pass: true, total_score: 50 }));
    // 서버사이드 강제: Gemini 응답과 무관하게 45점 미만이면 무조건 재생성
    if (typeof qcResult.total_score === 'number' && qcResult.total_score < 45) qcResult.pass = false;
    if (!qcResult.pass) {
      addToast(`품질 검수 미달 (${qcResult.total_score}/50) — 스크립트 재생성 중...`, 'inf');
      let retryCount = 0;
      while (!qcResult.pass && retryCount < 2) {
        retryCount++;
        try {
          let retryScript = await generateScript(restaurantName.trim(), analysis, useVideoStore.getState().userPrompt, researchData, effectiveType);
          retryScript = flattenBlocksToScenes(retryScript);
          const retryRefined = refineScenesForStoryboard(retryScript.scenes || [], files, analysis);
          retryScript = { ...retryScript, scenes: retryRefined.scenes };
          // TTS 재생성
          const retryAudioBuffers = await generateAllTTS(retryScript.scenes, () => {}, retryScript.theme).catch(() => retryScript.scenes.map(() => null));

          // ⚠️ duration sync 필수 적용 (누락 시 narration 중간 끊김 발생)
          const retryFinalScenes = [];
          let rsi = 0;
          while (rsi < retryScript.scenes.length) {
            const rsc = retryScript.scenes[rsi];
            const rbuf = retryAudioBuffers[rsi];
            if (rsc.blockIdx !== undefined) {
              const blkStart = rsi;
              const blkId    = rsc.blockIdx;
              while (rsi < retryScript.scenes.length && retryScript.scenes[rsi].blockIdx === blkId) rsi++;
              const blkScenes = retryScript.scenes.slice(blkStart, rsi);
              const aDur = (rbuf && rbuf.duration > 0) ? rbuf.duration : 0;
              const rawTot = blkScenes.reduce((sum, s) => sum + Math.max(BPM_BEAT, s.duration || BPM_BEAT), 0);
              const minTot = Math.max(aDur > 0 ? aDur + 0.5 : 0, 2.5);
              let durs = blkScenes.map(s =>
                Math.max(BPM_BEAT, Math.round(Math.max(BPM_BEAT, s.duration || BPM_BEAT) / BPM_BEAT) * BPM_BEAT)
              );
              const def = Math.max(0, minTot - rawTot);
              if (def > 0) durs[durs.length - 1] += Math.ceil(def / BPM_BEAT) * BPM_BEAT;
              const snapped = durs.reduce((s, d) => s + d, 0);
              if (snapped < minTot) durs[durs.length - 1] += Math.ceil((minTot - snapped) / BPM_BEAT) * BPM_BEAT;
              blkScenes.forEach((s, j) => {
                let cap1 = s.caption1, cap2 = s.caption2;
                if (!cap1?.trim()) { const [c1, c2] = splitCaptions(s.narration || s.subtitle || ''); cap1 = c1; cap2 = c2; }
                retryFinalScenes.push({ ...s, duration: durs[j], caption1: cap1, caption2: cap2, subtitle: cap1 || s.subtitle || '' });
              });
            } else {
              const aDur = (rbuf && rbuf.duration > 0) ? rbuf.duration : 0;
              let dur = aDur > 0
                ? Math.max(2.0, Math.round((aDur + 0.5) / BPM_BEAT) * BPM_BEAT)
                : Math.max(2.0, Math.round((rsc.duration || 3.0) / BPM_BEAT) * BPM_BEAT);
              dur = Math.max(2.0, dur);
              let cap1 = rsc.caption1, cap2 = rsc.caption2;
              if (!cap1?.trim()) { const [c1, c2] = splitCaptions(rsc.narration || rsc.subtitle || ''); cap1 = c1; cap2 = c2; }
              retryFinalScenes.push({ ...rsc, duration: dur, caption1: cap1, caption2: cap2, subtitle: cap1 || rsc.subtitle || '' });
              rsi++;
            }
          }
          retryScript = { ...retryScript, scenes: retryFinalScenes };

          setScript(retryScript);
          setAudioBuffers(retryAudioBuffers);
          workingScript = retryScript;
          qcResult = await geminiQualityCheck(retryScript, restaurantName.trim(), effectiveType).catch(() => ({ pass: true }));
          if (qcResult.pass) {
            addToast(`재생성 성공 (${retryCount}차) — 품질 통과 ✅`, 'ok');
          } else {
            addToast(`재생성 ${retryCount}차 미달 (${qcResult.total_score}/50)`, 'inf');
          }
        } catch (retryErr) {
          console.warn(`[QC retry ${retryCount}] 재생성 실패:`, retryErr.message);
          break;
        }
      }
      if (!qcResult.pass) addToast('최대 재생성 횟수 초과 — 현재 스크립트로 진행합니다', 'inf');
    } else {
      addToast(`품질 검수 통과 (${qcResult.total_score}/50) ✅`, 'ok');
    }
    donePipelineStep(7);

    // Firebase 저장: 같은 식당명은 기존 데이터 삭제 후 새 결과로 대체
    // ⚠️ await: ResultScreen 열기 전에 저장 완료 보장 → "이전 마케팅 키트"에 최신 버전 즉시 반영
    const latestScriptForSave = useVideoStore.getState().script || workingScript;
    await firebaseReplaceRestaurantData(latestScriptForSave, restaurantName, {
      restaurant: latestScriptForSave.restaurant || restaurantName,
      hook_title: latestScriptForSave.marketing?.hook_title || '',
      caption: latestScriptForSave.marketing?.caption || '',
      hashtags_30: latestScriptForSave.marketing?.hashtags_30 || '',
      receipt_review: latestScriptForSave.marketing?.receipt_review || '',
      hook_variations: latestScriptForSave.hook_variations || [],
      naver_clip_tags: latestScriptForSave.naver_clip_tags || '',
      youtube_shorts_tags: latestScriptForSave.youtube_shorts_tags || '',
      instagram_caption: latestScriptForSave.instagram_caption || '',
      tiktok_tags: latestScriptForSave.tiktok_tags || '',
      hashtags: latestScriptForSave.hashtags || '',
      theme: latestScriptForSave.theme || '',
      vibe_color: latestScriptForSave.vibe_color || '',
    }).catch(() => {});

    await sleep$1(300);
    hidePipeline();
    setShowResult(true);

  } catch (err) {
    hidePipeline();
    console.error('[startMake]', err);
    addToast('오류: ' + (err?.message || String(err) || '알 수 없는 오류'), 'err');
  } finally {
    // Wake Lock 해제
    if (_wakeLock) { _wakeLock.release().catch(() => {}); _wakeLock = null; }
  }
}

// ─── 미디어 프리로드 (병렬) ───────────────────────────────
async function preloadMedia(files) {
  console.log(`[Preload] ${files.length}개 미디어 병렬 로드 시작`);
  const loadPromises = files.map(async (m, index) => {
    if (m.type === 'image') {
      return new Promise((resolve) => {
        const img = Object.assign(new Image(), { src: m.url });
        img.onload  = () => resolve({ type: 'image', src: img, idx: index });
        img.onerror = () => resolve({ type: 'image', src: img, idx: index, error: true });
      });
    } else {
      return new Promise((resolve) => {
        const vid = Object.assign(document.createElement('video'), {
          src: m.url, muted: true, loop: false, playsInline: true, preload: 'auto',
        });
        const timeout = setTimeout(
          () => resolve({ type: 'video', src: vid, offset: 0, idx: index }),
          5000,
        );
        vid.oncanplay = () => { clearTimeout(timeout); resolve({ type: 'video', src: vid, offset: 0, idx: index }); };
        vid.onerror   = () => { clearTimeout(timeout); vid._loadFailed = true; resolve({ type: 'video', src: vid, offset: 0, idx: index }); };
        vid.load();
      });
    }
  });
  const loaded = await Promise.all(loadPromises);
  return loaded.sort((a, b) => a.idx - b.idx);
}

// src/engine/AuthService.js
// 구글 드라이브 인증 서비스 — 자동 갱신 · 재시도 · 세션 복구 지원
// DrivePicker.jsx에서 import해서 사용. 직접 인증 로직은 여기에 집중.

const TOKEN_KEY   = 'moovlog_gdrive_token';
const EXPIRY_KEY  = 'moovlog_gdrive_expiry';
const TTL_MS      = 55 * 60 * 1000;  // 55분 (구글 Access Token 만료 60분 - 5분 여유)
const MAX_RETRY   = 3;
const RETRY_DELAY = 1200;

// ─── 토큰 저장 ─────────────────────────────────────────────
function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY,  token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + TTL_MS));
  } catch (_) { /* 시크릿 모드 등 localStorage 불가 시 무시 */ }
}

// ─── 유효 토큰 반환 (없거나 만료 시 null) ──────────────────
function loadToken() {
  try {
    const token  = localStorage.getItem(TOKEN_KEY);
    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
    if (token && Date.now() < expiry) return token;
  } catch (_) {}
  return null;
}

// ─── 토큰 삭제 ─────────────────────────────────────────────
function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch (_) {}
}

// ─── 토큰 유효 여부 확인 ───────────────────────────────────
function isTokenValid() {
  return !!loadToken();
}

// ─── 남은 유효 시간 (초 단위, 만료 시 0) ───────────────────
function getTokenTtlSec() {
  try {
    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
    return Math.max(0, Math.round((expiry - Date.now()) / 1000));
  } catch (_) { return 0; }
}

/**
 * 인증 오류 자동 재시도 래퍼
 * @param {Function} fn       - async (token: string) => result
 * @param {Function} getToken - async () => string  (새 토큰 발급 콜백)
 * @returns {Promise<any>}
 */
async function withAuthRetry(fn, getToken) {
  let token = loadToken();
  let lastErr;

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    try {
      if (!token) {
        token = await getToken();
        if (!token) throw new Error('토큰 발급 실패');
        saveToken(token);
      }
      return await fn(token);
    } catch (err) {
      lastErr = err;
      const msg = (err?.message || String(err)).toLowerCase();
      const isAuthErr = msg.includes('401') || msg.includes('403')
        || msg.includes('auth') || msg.includes('token') || msg.includes('expired');

      if (isAuthErr) {
        clearToken();
        token = null;
        console.warn(`[AuthService] 인증 오류 (시도 ${attempt + 1}/${MAX_RETRY}) → 토큰 재발급:`, err.message);
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      } else {
        throw err; // 인증 외 오류는 즉시 전파
      }
    }
  }
  throw lastErr || new Error(`[AuthService] 재시도 ${MAX_RETRY}회 한도 초과`);
}

const DRIVE_ICON = /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "14", viewBox: "0 0 87.3 78", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", style: { verticalAlign: "middle" }, children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z", fill: "#0066da" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z", fill: "#00ac47" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z", fill: "#ea4335" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z", fill: "#00832d" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z", fill: "#2684fc" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z", fill: "#ffba00" })
] });
const DRIVE_Q = "(mimeType='image/png' or mimeType='image/jpeg' or mimeType='image/jpg' or mimeType='image/webp' or mimeType='video/mp4' or mimeType='video/quicktime' or mimeType='video/x-m4v') and trashed=false";
async function listDriveFiles(accessToken, pageToken = null, nameFilter = "") {
  let q = DRIVE_Q;
  if (nameFilter.trim()) q += ` and name contains '${nameFilter.replace(/'/g, "\\'")}'`;
  const params = new URLSearchParams({
    q,
    fields: "nextPageToken,files(id,name,mimeType,thumbnailLink,size)",
    pageSize: "50",
    orderBy: "modifiedTime desc"
  });
  if (pageToken) params.set("pageToken", pageToken);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (res.status === 401) throw Object.assign(new Error("TOKEN_EXPIRED"), { code: 401 });
  if (!res.ok) throw new Error(`Drive API 오류 (${res.status})`);
  return res.json();
}
function DriveBrowserModal({ accessToken, onClose, onConfirm, addToast }) {
  const [driveFiles, setDriveFiles] = reactExports.useState([]);
  const [listLoading, setListLoading] = reactExports.useState(false);
  const [nextPageToken, setNextPageToken] = reactExports.useState(null);
  const [selected, setSelected] = reactExports.useState(/* @__PURE__ */ new Set());
  const [search, setSearch] = reactExports.useState("");
  const [downloading, setDownloading] = reactExports.useState(false);
  const lastFilter = reactExports.useRef("");
  const lastClickedIdx = reactExports.useRef(null);
  const loadFiles = reactExports.useCallback(async (reset, nameFilter) => {
    setListLoading(true);
    try {
      const pageToken = reset ? null : nextPageToken;
      const result = await listDriveFiles(accessToken, pageToken, nameFilter);
      setDriveFiles((prev) => reset ? result.files || [] : [...prev, ...result.files || []]);
      setNextPageToken(result.nextPageToken || null);
    } catch (err) {
      addToast(err.message || "Drive 파일 목록 오류", "err");
    } finally {
      setListLoading(false);
    }
  }, [accessToken, nextPageToken]);
  reactExports.useEffect(() => {
    loadFiles(true, "");
  }, []);
  const toggleSelect = (id, idx, e) => {
    if (e?.shiftKey && lastClickedIdx.current !== null && lastClickedIdx.current !== idx) {
      const from = Math.min(lastClickedIdx.current, idx);
      const to = Math.max(lastClickedIdx.current, idx);
      const rangeIds = driveFiles.slice(from, to + 1).map((f) => f.id);
      setSelected((prev) => {
        const next = new Set(prev);
        const shouldSelect = !prev.has(id);
        rangeIds.forEach((rid) => {
          shouldSelect ? next.add(rid) : next.delete(rid);
        });
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
    lastClickedIdx.current = idx;
  };
  const handleSearch = (e) => {
    e.preventDefault();
    lastFilter.current = search;
    loadFiles(true, search);
  };
  const handleConfirm = async () => {
    const picked = driveFiles.filter((f) => selected.has(f.id));
    if (!picked.length) {
      addToast("선택된 파일이 없습니다.", "err");
      return;
    }
    setDownloading(true);
    addToast(`${picked.length}개 파일 다운로드 중...`, "inf");
    try {
      const files = await Promise.all(picked.map(async (doc) => {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error(`'${doc.name}' 다운로드 실패 (${res.status})`);
        const blob = await res.blob();
        if (!blob.size) throw new Error(`'${doc.name}' 공유 권한을 확인하세요.`);
        return new File([blob], doc.name, { type: doc.mimeType || blob.type });
      }));
      onConfirm(files);
    } catch (err) {
      addToast(err.message || "다운로드 중 오류 발생", "err");
    } finally {
      setDownloading(false);
    }
  };
  return reactDomExports.createPortal(
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" },
        onClick: (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1a1a2e", borderRadius: 16, width: "min(96vw, 560px)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontWeight: 700, color: "#fff", fontSize: "0.92rem" }, children: [
              DRIVE_ICON,
              "  Google Drive 파일 선택"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: { background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }, children: "✕" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSearch, style: { padding: "10px 18px", display: "flex", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "파일명 검색...",
                style: { flex: 1, background: "#111", border: "1px solid #333", borderRadius: 8, padding: "7px 11px", color: "#fff", fontSize: "0.8rem" }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", style: { background: "#7c3aed", border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", cursor: "pointer", fontSize: "0.8rem" }, children: "검색" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "12px 18px" }, children: [
            listLoading && driveFiles.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "#888", textAlign: "center", padding: "30px 0", fontSize: "0.82rem" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin", style: { marginRight: 8 } }),
              "불러오는 중..."
            ] }),
            !listLoading && driveFiles.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#666", textAlign: "center", padding: "30px 0", fontSize: "0.82rem" }, children: "파일이 없습니다" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }, children: driveFiles.map((file, idx) => {
              const isSel = selected.has(file.id);
              const isVid = file.mimeType?.startsWith("video/");
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: (e) => toggleSelect(file.id, idx, e),
                  style: { background: isSel ? "rgba(124,58,237,0.22)" : "rgba(255,255,255,0.04)", border: `2px solid ${isSel ? "#7c3aed" : "transparent"}`, borderRadius: 10, padding: 5, cursor: "pointer", textAlign: "left", position: "relative", transition: "all 0.12s" },
                  children: [
                    isSel && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: 3, right: 3, background: "#7c3aed", borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", color: "#fff", zIndex: 1 }, children: "✓" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", aspectRatio: "1", background: "#222", borderRadius: 6, marginBottom: 4, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }, children: file.thumbnailLink ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: file.thumbnailLink, alt: file.name, style: { width: "100%", height: "100%", objectFit: "cover" }, loading: "lazy", referrerPolicy: "no-referrer" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "1.4rem" }, children: isVid ? "🎬" : "🖼️" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: 0, fontSize: "0.6rem", color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }, children: file.name })
                  ]
                },
                file.id
              );
            }) }),
            nextPageToken && !listLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => loadFiles(false, lastFilter.current),
                style: { display: "block", margin: "12px auto 0", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "7px 20px", color: "#ccc", cursor: "pointer", fontSize: "0.78rem" },
                children: "더 불러오기"
              }
            ),
            listLoading && driveFiles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#888", textAlign: "center", padding: "10px 0", fontSize: "0.78rem" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#888", fontSize: "0.76rem" }, children: selected.size > 0 ? `${selected.size}개 선택됨` : "파일을 클릭해서 선택하세요 (Shift+클릭: 범위 선택)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: { background: "none", border: "1px solid #444", borderRadius: 8, padding: "7px 14px", color: "#aaa", cursor: "pointer", fontSize: "0.8rem" }, children: "취소" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handleConfirm,
                  disabled: !selected.size || downloading,
                  style: { background: selected.size && !downloading ? "#7c3aed" : "#444", border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", cursor: selected.size ? "pointer" : "not-allowed", fontSize: "0.8rem" },
                  children: downloading ? "다운로드 중..." : `${selected.size || 0}개 추가`
                }
              )
            ] })
          ] })
        ] })
      }
    ),
    document.body
  );
}
function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = resolve;
    document.body.appendChild(s);
  });
}
function DrivePicker({ addFiles: addFilesProp }) {
  const [ready, setReady] = reactExports.useState(false);
  const [modalToken, setModalToken] = reactExports.useState(null);
  const tokenClientRef = reactExports.useRef(null);
  const clientIdRef = reactExports.useRef("");
  const { addFilesAsync: storeAddFilesAsync, addToast } = useVideoStore();
  const addFiles = addFilesProp || storeAddFilesAsync;
  reactExports.useEffect(() => {
    loadScript("https://accounts.google.com/gsi/client").then(() => setReady(true));
  }, []);
  const getClientId = () => {
    const envId = undefined                                      || "";
    if (envId) return envId.trim();
    let id = localStorage.getItem("moovlog_google_client_id") || "";
    if (!id) {
      id = prompt(
        "Google OAuth 클라이언트 ID를 입력하세요.\n(GCP 콘솔 > 사용자 인증 정보 > OAuth 클라이언트 ID)\n예: 123456789-abc.apps.googleusercontent.com",
        ""
      ) || "";
      if (id) localStorage.setItem("moovlog_google_client_id", id.trim());
    }
    return id.trim();
  };
  const requestNewToken = (clientId) => {
    if (!tokenClientRef.current || clientIdRef.current !== clientId) {
      clientIdRef.current = clientId;
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: (resp) => {
          if (resp.error) {
            clearToken();
            if (resp.error === "redirect_uri_mismatch" || resp.error === "idpiframe_initialization_failed") {
              addToast('GCP 콘솔 "Authorized JavaScript origins"에 https://122cks.github.io 를 추가하세요.', "err");
            } else if (resp.error !== "popup_closed_by_user" && resp.error !== "access_denied") {
              addToast("Google 로그인 실패: " + resp.error, "err");
            }
            return;
          }
          saveToken(resp.access_token);
          setModalToken(resp.access_token);
        }
      });
      tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
    } else {
      tokenClientRef.current.requestAccessToken({ prompt: "" });
    }
  };
  const handleClick = () => {
    if (!ready) {
      addToast("Google API 로딩 중...", "inf");
      return;
    }
    const clientId = getClientId();
    if (!clientId) {
      addToast("클라이언트 ID가 필요합니다.", "err");
      return;
    }
    const validToken = loadToken();
    if (validToken) {
      setModalToken(validToken);
      return;
    }
    requestNewToken(clientId);
  };
  const handleConfirm = (files) => {
    addFiles(files);
    addToast(`${files.length}개 파일을 드라이브에서 추가했습니다!`, "ok");
    setModalToken(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: handleClick,
        className: "drive-import-btn",
        title: "Google Drive에서 사진/영상 불러오기",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "18", height: "15", viewBox: "0 0 87.3 78", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z", fill: "#0066da" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z", fill: "#00ac47" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z", fill: "#ea4335" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z", fill: "#00832d" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z", fill: "#2684fc" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z", fill: "#ffba00" })
          ] }),
          "드라이브에서 가져오기"
        ]
      }
    ),
    modalToken && /* @__PURE__ */ jsxRuntimeExports.jsx(
      DriveBrowserModal,
      {
        accessToken: modalToken,
        onClose: () => setModalToken(null),
        onConfirm: handleConfirm,
        addToast
      }
    )
  ] });
}

function PromptInput() {
  const { userPrompt, setUserPrompt } = useVideoStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "14px", width: "100%" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "block", marginBottom: "8px", fontWeight: "700", color: "#aaa", fontSize: "0.82rem" }, children: [
      "✨ AI에게 특별히 부탁할 점 ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#555", fontWeight: "400" }, children: "(선택)" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        value: userPrompt,
        onChange: (e) => setUserPrompt(e.target.value),
        placeholder: "예: 조금 더 감성적인 톤으로 써줘, 가게 인테리어를 강조해줘, 자막에 이모지를 많이 써줘 등",
        rows: 3,
        style: {
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          backgroundColor: "#0f0f1a",
          border: "1px solid #333",
          borderRadius: "10px",
          color: "#e2e2e2",
          fontSize: "0.88rem",
          fontFamily: "inherit",
          resize: "none",
          outline: "none",
          transition: "border-color 0.2s",
          lineHeight: "1.5"
        },
        onFocus: (e) => e.target.style.borderColor = "#8E2DE2",
        onBlur: (e) => e.target.style.borderColor = "#333"
      }
    )
  ] });
}

function UploadSection() {
  const {
    files,
    addFiles,
    removeFile,
    restaurantName,
    setRestaurantName,
    selectedTemplate,
    setTemplate,
    aspectRatio,
    setAspectRatio,
    restaurantType,
    setRestaurantType,
    requiredKeywords,
    setRequiredKeywords,
    addToast,
    showResult
  } = useVideoStore();
  const fileInputRef = reactExports.useRef();
  const dropRef = reactExports.useRef();
  const kitListRef = reactExports.useRef();
  const itemRefs = reactExports.useRef({});
  const [kitHistory, setKitHistory] = reactExports.useState([]);
  const [kitSearch, setKitSearch] = reactExports.useState("");
  const [kitLoading, setKitLoading] = reactExports.useState(false);
  const [selectedKit, setSelectedKit] = reactExports.useState(null);
  const loadKits = reactExports.useCallback(async (kw = "") => {
    setKitLoading(true);
    setSelectedKit(null);
    try {
      const r = kw.trim() ? await searchMarketingKits(kw.trim()) : await getMarketingKits(20);
      setKitHistory(r);
    } catch {
    } finally {
      setKitLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    loadKits();
  }, [loadKits]);
  const prevShowResult = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (prevShowResult.current && !showResult) {
      loadKits(kitSearch);
    }
    prevShowResult.current = showResult;
  }, [showResult]);
  const onDragOver = reactExports.useCallback((e) => {
    e.preventDefault();
    dropRef.current?.classList.add("over");
  }, []);
  const onDragLeave = reactExports.useCallback(() => dropRef.current?.classList.remove("over"), []);
  const onDrop = reactExports.useCallback((e) => {
    e.preventDefault();
    dropRef.current?.classList.remove("over");
    addFiles([...e.dataTransfer.files]);
  }, [addFiles]);
  const onFileChange = reactExports.useCallback((e) => {
    addFiles([...e.target.files]);
    e.target.value = "";
  }, [addFiles]);
  const handleSetKey = reactExports.useCallback(() => {
    const key = prompt(
      "Gemini API 키를 입력하세요:",
      localStorage.getItem("moovlog_gemini_key") || ""
    );
    if (key !== null) {
      localStorage.setItem("moovlog_gemini_key", key);
      setGeminiKey(key);
      addToast("Gemini API 키 저장 완료", "ok");
    }
    const existingKeys = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => localStorage.getItem(`moovlog_typecast_key${n > 1 ? n : ""}`) || "").join("\n");
    const tcInput = prompt(
      "TypeCast API 키를 입력하세요 (한 줄에 하나씩, 여러 줄 또는 콤마 구분 가능, 최대 8개):",
      existingKeys
    );
    if (tcInput !== null) {
      const parsed = tcInput.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
      parsed.forEach((k, i) => {
        const lsName = `moovlog_typecast_key${i > 0 ? i + 1 : ""}`;
        localStorage.setItem(lsName, k);
      });
      for (let i = parsed.length + 1; i <= 8; i++) {
        localStorage.removeItem(`moovlog_typecast_key${i > 1 ? i : ""}`);
      }
      setTypeCastKeys(parsed);
      addToast(`TypeCast 키 ${parsed.length}개 로테이션 설정 완료 ✅`, "ok");
    }
  }, [addToast]);
  const RATIOS = [
    { value: "9:16", icon: "fa-mobile-alt", label: "9:16 쇼츠" },
    { value: "1:1", icon: "fa-instagram", label: "1:1 피드", fab: true },
    { value: "16:9", icon: "fa-tv", label: "16:9 유튜브" }
  ];
  const TEMPLATES = Object.entries(TEMPLATE_NAMES).filter(([k]) => k !== "auto");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "app-main", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ratio-row", children: RATIOS.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: `ratio-btn ${aspectRatio === r.value ? "active" : ""}`,
        onClick: () => setAspectRatio(r.value),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `${r.fab ? "fab" : "fas"} ${r.icon}` }),
          " ",
          r.label
        ]
      },
      r.value
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", id: "secUpload", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-label", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "num", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "이미지 · 영상 업로드" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "사진와 영상 클립을 올려주세요 (업로드 최다 30개를 모두 사용함)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: dropRef,
          className: "drop-area",
          onDragOver,
          onDragLeave,
          onDrop,
          onClick: () => fileInputRef.current?.click(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drop-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-cloud-upload-alt" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drop-text", children: "여기에 끌어다 놓거나" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "pick-btn", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-folder-open" }),
              " 파일 선택"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                accept: "image/*,video/*",
                multiple: true,
                hidden: true,
                onChange: onFileChange
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drop-hint", children: "JPG · PNG · MP4 · MOV · 최다 30개" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drive-row", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DrivePicker, {}) }),
      files.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "thumb-grid", children: files.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ti", children: [
        m.type === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: m.url, alt: "" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: m.url, muted: true, playsInline: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ti-badge", children: i + 1 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "ti-remove",
            onClick: (e) => {
              e.stopPropagation();
              removeFile(i);
            },
            children: "✕"
          }
        )
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "name-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "name-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-store name-icon" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            className: "name-input",
            placeholder: "음식점 이름 입력 (예: 을지로 돈부리집)",
            maxLength: 40,
            value: restaurantName,
            onChange: (e) => setRestaurantName(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "key-btn", onClick: handleSetKey, title: "API 키 설정", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-key" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "ai-auto-hint", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-sparkles" }),
        " AI가 이미지를 분석해 최적의 스타일 · 훅 · 템플릿을 자동 선택합니다"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", style: { padding: "14px 16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.78rem", fontWeight: 700, color: "#a78bfa", letterSpacing: "0.08em", textTransform: "uppercase" }, children: "🏪 업체 유형 선택" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.7rem", color: "var(--text-sub)" }, children: "— 유형별 최신 쇼츠/릴스 스타일로 자동 설계" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 7 }, children: Object.entries(RESTAURANT_TYPES).map(([key, info]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `tpl-chip ${restaurantType === key ? "active" : ""}`,
          onClick: () => setRestaurantType(key),
          title: info.hint || "",
          children: info.label
        },
        key
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tpl-picker", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `tpl-chip ${selectedTemplate === "auto" ? "active" : ""}`,
          onClick: () => setTemplate("auto"),
          children: "🤖 AI 자동"
        }
      ),
      TEMPLATES.map(([key, name]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `tpl-chip ${selectedTemplate === key ? "active" : ""}`,
          onClick: () => setTemplate(key),
          title: TEMPLATE_HINTS[key] || "",
          children: name
        },
        key
      ))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PromptInput, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "12px", width: "100%" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "block", marginBottom: "8px", fontWeight: "700", color: "#aaa", fontSize: "0.82rem" }, children: [
        "📌 필수 포함 키워드 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#555", fontWeight: "400" }, children: "(선택 — 주요 SNS 태그에 반드시 포함)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          className: "name-input",
          style: { fontSize: "0.85rem", padding: "9px 12px", width: "100%", boxSizing: "border-box" },
          placeholder: "예: 부개동맛집, 인천삼겹살, 숙성삼겹살 (쉼표 구분)",
          value: requiredKeywords,
          onChange: (e) => setRequiredKeywords(e.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "make-btn",
        onClick: startMake,
        disabled: !files.length || !restaurantName.trim(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "make-glow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-wand-magic-sparkles" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "AI 숏폼 자동 생성" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "make-hint", children: "이미지 분석 → 스타일 자동 선택 → 스크립트 → 나레이션 → 영상 완성" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", style: { marginTop: 16 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "#ccc" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-history", style: { marginRight: 6, color: "#a78bfa" } }),
          "이전 마케팅 키트"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => loadKits(kitSearch),
            disabled: kitLoading,
            style: { background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: "0.8rem" },
            children: kitLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-sync-alt" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "name-input",
            style: { flex: 1, fontSize: "0.82rem", padding: "7px 12px" },
            placeholder: "음식점 이름으로 검색...",
            value: kitSearch,
            onChange: (e) => setKitSearch(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && loadKits(kitSearch)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "re-btn", style: { minWidth: 40 }, onClick: () => loadKits(kitSearch), disabled: kitLoading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-search" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: kitListRef, style: { maxHeight: "55vh", overflowY: "scroll", display: "flex", flexDirection: "column", gap: 6, overflowX: "hidden" }, children: [
        kitHistory.length === 0 && !kitLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "10px 0", fontSize: "0.78rem" }, children: "저장된 마케팅 키트가 없습니다" }),
        kitHistory.map((item) => {
          const isOpen = selectedKit?.id === item.id;
          const dateStr = item.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "";
          const SNS_ROWS = [
            { label: "🎣 훅 제목", val: item.hookTitle },
            { label: "✍️ 인스타 캡션", val: item.caption },
            { label: "🏷️ 해시태그 30개", val: item.hashtags30 },
            { label: "🧾 영수증 리뷰", val: item.receiptReview },
            { label: "📎 N클립 태그", val: item.naverClipTags },
            { label: "▶ 쇼츠 태그", val: item.youtubeShortsTags },
            { label: "◎ 릴스 캡션", val: item.instagramCaption },
            { label: "♪ 틱톡 태그", val: item.tiktokTags }
          ].filter((r) => r.val);
          const hookVars = Array.isArray(item.hookVariations) ? item.hookVariations.filter((h) => h?.caption1) : [];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              ref: (el) => {
                itemRefs.current[item.id] = el;
              },
              style: { border: `1px solid ${isOpen ? "#7c3aed66" : "#333"}`, borderRadius: 10, overflow: "hidden", background: isOpen ? "rgba(124,58,237,0.06)" : "#1e1e1e", transition: "border-color 0.15s" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => {
                      if (isOpen) {
                        setSelectedKit(null);
                      } else {
                        setRestaurantName(item.restaurant || "");
                        setSelectedKit(item);
                        addToast(`「${item.restaurant}」 불러오기 완료`, "ok");
                        setTimeout(() => {
                          const el = itemRefs.current[item.id];
                          const container = kitListRef.current;
                          if (el && container) {
                            const containerRect = container.getBoundingClientRect();
                            const elRect = el.getBoundingClientRect();
                            container.scrollTop += elRect.top - containerRect.top - 8;
                          }
                        }, 80);
                      }
                    },
                    style: {
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: "9px 14px",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 700, fontSize: "0.85rem", color: isOpen ? "#c4b5fd" : "#eee" }, children: item.restaurant || "—" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.68rem", color: "var(--text-sub)", whiteSpace: "nowrap" }, children: dateStr }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas fa-chevron-${isOpen ? "up" : "down"}`, style: { fontSize: "0.7rem", color: "#666" } })
                      ] })
                    ]
                  }
                ),
                isOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 8 }, children: [
                  SNS_ROWS.length === 0 && hookVars.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#666", fontSize: "0.75rem", fontStyle: "italic", margin: 0 }, children: "저장된 태그 데이터가 없습니다" }),
                  hookVars.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 10px" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, color: "#a78bfa" }, children: "🎯 AI PD의 3종 훅 전략" }),
                    hookVars.map((h, hi) => {
                      const typeLabel = h.type === "shock" ? "🔥 충격형" : h.type === "info" ? "ℹ️ 정보형" : "👤 1인칭";
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: 4 }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.68rem", color: "#f59e0b", fontWeight: 700 }, children: typeLabel }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "0.72rem", color: "#ddd", marginLeft: 6 }, children: [
                          h.caption1,
                          h.caption2 ? ` / ${h.caption2}` : ""
                        ] })
                      ] }, hi);
                    })
                  ] }),
                  SNS_ROWS.map(({ label, val }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 10px" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.7rem", fontWeight: 700, color: "#a78bfa" }, children: label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          onClick: async () => {
                            try {
                              await navigator.clipboard.writeText(val);
                              addToast(`${label} 복사 완료 ✨`, "ok");
                            } catch {
                              addToast("복사 실패", "err");
                            }
                          },
                          style: { background: "none", border: "1px solid #444", borderRadius: 5, padding: "2px 7px", cursor: "pointer", color: "#aaa", fontSize: "0.65rem" },
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
                            " 복사"
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: 0, fontSize: "0.73rem", color: label.includes("태그") || label.includes("해시") ? "#a855f7" : "#ddd", whiteSpace: "pre-line", lineHeight: 1.6 }, children: val })
                  ] }, label))
                ] })
              ]
            },
            item.id
          );
        })
      ] })
    ] })
  ] });
}

const STEPS = [
  { icon: "fa-search", label: "식당 실시간 정보 조사" },
  { icon: "fa-utensils", label: "업체 유형 분류" },
  { icon: "fa-eye", label: "시각 분석 + 스타일 선택" },
  { icon: "fa-film", label: "스토리보드 설계" },
  { icon: "fa-link", label: "영상 컷 삽입 + 자막 매칭 검증" },
  { icon: "fa-microphone-alt", label: "AI 음성 합성" },
  { icon: "fa-video", label: "렌더링 준비 + 품질 검수" }
];
function LoadingOverlay() {
  const { pipeline } = useVideoStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "loading-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ai-loader", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ai-ring" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ai-ico", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-robot" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "load-title", children: pipeline.title || "AI가 작업 중입니다..." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "load-sub", children: pipeline.sub || "잠시만 기다려주세요" }),
    pipeline.autoStyleName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auto-style-badge", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "asb-label", children: "AI 추천 스타일" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "asb-value", children: pipeline.autoStyleName })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "load-pipeline", children: STEPS.map((step, i) => {
      const isActive = i === pipeline.step - 1;
      const isDone = pipeline.done[i];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `lp-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lp-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${step.icon}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lp-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-name", children: step.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-status", children: isDone ? "완료" : isActive ? "진행중..." : "대기중" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `lp-check ${isDone ? "visible" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-check" }) })
      ] }, i);
    }) })
  ] }) });
}

// src/engine/VideoRenderer.js
// FFmpeg WASM 기반 영상 렌더러 — 시네마틱 LUT · Ken Burns · 전환 효과 · 자막 포함
// ⚠️ SharedArrayBuffer가 필요합니다. COOP/COEP 헤더가 설정된 환경에서만 동작합니다.


const FFMPEG_CORE_URLS = [
  'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',              // unpkg 우선 (안정적, 실제 검증됨)
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd',   // jsDelivr 폴백
];
// 자막용 폰트 (NotoSans KR Bold .ttf — CDN에서 최초 1회 다운로드)
const FONT_CDN_URL = 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2';
// woff2는 ffmpeg drawtext 미지원 → TTF 대안 CDN
const FONT_TTF_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansCJKkr-Bold.otf';

let ffmpegInstance = null;
let isLoading = false;

async function getFFmpeg(onLog) {
  // ⚠️ SharedArrayBuffer 미지원 환경 경고 (throw 대신 warn — SW 주입 후 재시도 가능)
  if (!globalThis.crossOriginIsolated) {
    console.warn('[FFmpeg] crossOriginIsolated=false — COOP/COEP 헤더가 아직 적용 안 됐을 수 있습니다. 계속 시도합니다.');
  }

  if (ffmpegInstance) return ffmpegInstance;
  if (isLoading) {
    // 다른 호출이 로딩 중이면 완료될 때까지 대기
    while (isLoading) await new Promise(r => setTimeout(r, 200));
    if (!ffmpegInstance) throw new Error('FFmpeg 엔진 로딩에 실패했습니다. 다시 시도해주세요.');
    return ffmpegInstance;
  }
  isLoading = true;
  try {
    const ff = new FFmpeg();
    if (onLog) ff.on('log', ({ message }) => onLog(message));
    // CDN 순서대로 시도 (unpkg 우선, jsDelivr 폴백)
    let lastErr;
    for (const cdn of FFMPEG_CORE_URLS) {
      try {
        // HEAD probe: CDN 가용성 확인 (CORS로 null 반환 시 → 실제 로드는 계속 시도)
        const [probeJs, probeWasm] = await Promise.all([
          fetch(`${cdn}/ffmpeg-core.js`,   { method: 'HEAD' }).catch(() => null),
          fetch(`${cdn}/ffmpeg-core.wasm`, { method: 'HEAD' }).catch(() => null),
        ]);
        // probe가 null이 아닌데 명시적 HTTP 오류 상태(4xx/5xx)면 이 CDN 스킵
        if (probeJs   !== null && !probeJs.ok)   throw new Error(`CDN ffmpeg-core.js 응답 오류 (${probeJs.status})`);
        if (probeWasm !== null && !probeWasm.ok) throw new Error(`CDN ffmpeg-core.wasm 응답 오류 (${probeWasm.status})`);
        // probe=null(CORS 차단)이거나 ok=true면 실제 로드 시도

        const coreURL = await toBlobURL(`${cdn}/ffmpeg-core.js`,   'text/javascript');
        const wasmURL = await toBlobURL(`${cdn}/ffmpeg-core.wasm`, 'application/wasm');
        await ff.load({ coreURL, wasmURL });
        ffmpegInstance = ff;
        return ff;
      } catch (e) {
        console.warn(`[FFmpeg] ${cdn} 로드 실패:`, e?.message || String(e));
        lastErr = e;
      }
    }
    const finalMsg = lastErr?.message || String(lastErr) || 'CDN 로드 실패';
    if (!globalThis.crossOriginIsolated) {
      throw new Error(
        `FFmpeg WASM 로드 실패: 페이지를 새로고침(F5) 후 다시 시도해주세요.\n` +
        `(보안 헤더 격리 필요 — COOP/COEP 미적용)\n상세: ${finalMsg}`
      );
    }
    throw lastErr instanceof Error ? lastErr : new Error(finalMsg);
  } catch (e) {
    ffmpegInstance = null; // 실패 시 초기화 → 재시도 가능
    throw e;
  } finally {
    isLoading = false; // 성공/실패 모두 플래그 해제
  }
}

// ─── 테마별 색감 보정 LUT 필터 ───────────────────────────
function getColorLUT(theme) {
  const LUTs = {
    cafe:    'curves=preset=vintage,eq=saturation=1.2:brightness=0.03:contrast=1.08,unsharp=3:3:0.8:3:3:0.0',
    grill:   'eq=contrast=1.1:saturation=1.5:brightness=0.02,unsharp=5:5:1.5:5:5:0.0',
    hansik:  'eq=saturation=1.15:contrast=1.08,unsharp=3:3:0.8:3:3:0.0',
    premium: 'eq=contrast=1.05:saturation=1.3:brightness=0.04,curves=preset=lighter,unsharp=5:5:1.0:5:5:0.0',
    pub:     'eq=saturation=1.4:contrast=1.15:brightness=-0.02,unsharp=3:3:0.9:3:3:0.0',
    seafood: 'eq=saturation=1.3:hue=3:brightness=0.03,unsharp=3:3:1.0:3:3:0.0',
    chinese: 'eq=saturation=1.5:contrast=1.2:brightness=-0.03,unsharp=3:3:0.8:3:3:0.0',
  };
  return LUTs[theme] || LUTs.hansik;
}

// ─── 비디오용 마스터 필터 (색감 + Flash 전환) ────────────
function getVideoFilter(scene, theme, dur, isLastScene, sceneIndex = 0) {
  const f = [];

  // 기본 해상도 / 크롭
  f.push('scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1');
  // ★ Freeze Frame
  f.push('tpad=stop_mode=clone:stop_duration=5');
  
  // 색감 LUT
  f.push(getColorLUT(theme));
  // ★ 업스케일러: 선명도 강화 + 노이즈 감소
  f.push('unsharp=5:5:1.0:5:5:0.0,hqdn3d=1.5:1.5:4.5:4.5');
  // 필름 그레인 텍스처 (uniform noise — 디지털 날것 느낌 제거)
  f.push('noise=alls=8:allf=u');
  
  // 첫 씬 제외: 짧은 컷 화이트 플래시 / 긴 컷 블랙 페이드인
  if (sceneIndex > 0) {
    if (dur < 1.0) {
      f.push('fade=t=in:st=0:d=0.15:color=white');
    } else {
      f.push('fade=t=in:st=0:d=0.2:color=black');
    }
  }

  // 마지막 씩에만 블랙 아웃 (눈 피로 방지)
  if (isLastScene && dur >= 0.6) {
    f.push(`fade=t=out:st=${(dur - 0.5).toFixed(3)}:d=0.5:color=black`);
  } else if (isLastScene) {
    f.push(`fade=t=out:st=0:d=${dur.toFixed(3)}:color=black`);
  }
  return f.join(',');
}

// ─── 이미지용 마스터 필터 (Ken Burns + 색감 + Flash 전환) ─
function getImageFilter(scene, theme, dur, fps, focusCoords, isLastScene, sceneIndex = 0) {
  const f = [];
  const frames = Math.ceil(dur * fps);
  const cx = (focusCoords?.x ?? 0.5).toFixed(4);
  const cy = (focusCoords?.y ?? 0.45).toFixed(4);

  // Ken Burns: 1440x2560으로 업스케일 후 zoompan으로 720x1280 출력
  f.push('scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560');
  
  if (scene.type === 'hook') {
    // 훅 씬: 초반 임팩트 줌 — 최대 1.1배로 제한하여 음식 전체 샷 유지
    f.push(`zoompan=z='if(lte(on,10),1.1,min(zoom+0.0005,1.1))':d=${frames}:x='iw*${cx}-ow/zoom/2':y='ih*${cy}-oh/zoom/2':s=720x1280:fps=${fps}`);
  } else {
    // 일반 씬: 아주 미세하게 움직여 정지 화면 느낌 방지, 전체 샷 보존
    f.push(`zoompan=z='min(zoom+0.0002,1.1)':d=${frames}:x='iw*${cx}-ow/zoom/2':y='ih*${cy}-oh/zoom/2':s=720x1280:fps=${fps}`);
  }
  
  // 색감 LUT
  f.push(getColorLUT(theme));
  // 선명도 향상
  f.push('unsharp=3:3:1.0:3:3:0.0');
  // 필름 그레인 텍스처 (uniform noise)
  f.push('noise=alls=8:allf=u');
  f.push('setsar=1');

  // 첫 씬 제외: 짧은 컷 화이트 플래시 / 긴 컷 블랙 페이드인
  if (sceneIndex > 0) {
    if (dur < 1.0) {
      f.push('fade=t=in:st=0:d=0.15:color=white');
    } else {
      f.push('fade=t=in:st=0:d=0.2:color=black');
    }
  }

  // 마지막 씬에만 블랙 페이드아웃
  if (isLastScene && dur >= 0.6) {
    f.push(`fade=t=out:st=${(dur - 0.5).toFixed(3)}:d=0.5:color=black`);
  } else if (isLastScene) {
    f.push(`fade=t=out:st=0:d=${dur.toFixed(3)}:color=black`);
  }
  return f.join(',');
}

// ─── 자막 오버레이 필터 (fontPath 있을 때만) ─────────────
function getSubtitleFilter(scene, fontPath, isLastScene) {
  if (!fontPath || !scene.caption1) return null;
  const platform = useVideoStore.getState().targetPlatform || 'reels';
  
  // 특수문자 이스케이프 (ffmpeg drawtext)
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
  const fp = fontPath.replace(/\\/g, '/');
  
  // 9번: 플랫폼 버튼 높이에 따른 Y좌표 절대 방어 (틱톡은 더 높게)
  const bottomMargin = platform === 'tiktok' ? 580 : platform === 'shorts' ? 400 : 500;
  const safeY = 1280 - bottomMargin; 

  const filters = [];
  filters.push(`drawbox=y=${safeY - 40}:color=black@0.65:width=iw:height=200:t=fill`); // 다이내믹 섀도우 반영
  filters.push(`drawtext=fontfile='${fp}':text='${esc(scene.caption1.replace(/\*\*/g, ''))}':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=${safeY}`);

  // 12번: 마지막 씬(구독 유도)일 경우 커다란 CTA 이모지 팝업 애니메이션 
  if (isLastScene) {
    filters.push(`drawtext=fontfile='${fp}':text='💖':fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t,0.5,5)'`);
  }
  return filters.join(',');
}

/**
 * FFmpeg WASM으로 씬 배열을 720×1280 MP4로 합성
 * v2.19: 테마 LUT · Ken Burns · White Flash 전환 · 블랙 페이드아웃 · 자막 · 진행률
 *
 * @param {Array}    scenes      - script.scenes 배열 (focus_coords 포함)
 * @param {Array}    files       - videoStore.files [{file, url, type}]
 * @param {Object}   script      - 전체 스크립트 ({theme, vibe_color, ...})
 * @param {Function} onProgress  - (msg: string, pct: number) => void
 * @returns {Blob} 최종 video/mp4 Blob
 */
/**
 * aesthetic_score 기준 베스트 프레임을 Canvas로 추출하여 Blob 반환
 * FFmpeg 없이 프론트엔드 Canvas API만 사용 (빠름 + 디바이스 지원)
 */
async function extractThumbnail(scenes, files, script, onProgress) {
  onProgress?.('썸네일 프레임 선정 중...');

  // aesthetic_score 가장 높은 씬 찾기
  let bestIdx = 0, bestScore = -1;
  (scenes || []).forEach((sc, i) => {
    const score = sc.aesthetic_score ?? sc.foodie_score ?? 0;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });

  const scene    = scenes[bestIdx];
  const fileIdx  = scene?.media_idx ?? bestIdx;
  const fileItem = files?.[fileIdx] ?? files?.[0];
  if (!fileItem) throw new Error('썸네일용 파일 없음');

  const canvas  = document.createElement('canvas');
  canvas.width  = 720;
  canvas.height = 1280;
  const ctx     = canvas.getContext('2d');

  if (fileItem.type === 'image') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = fileItem.url; });
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const sw = img.width * scale, sh = img.height * scale;
    ctx.drawImage(img, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
  } else {
    // 비디오: best_start_pct 시점으로 Seek
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = fileItem.url;
    video.muted = true;
    await new Promise(res => { video.onloadedmetadata = res; video.load(); });
    const seekTo = (scene?.best_start_pct ?? 0.25) * video.duration;
    video.currentTime = Math.max(0, Math.min(seekTo, video.duration - 0.1));
    await new Promise(res => { video.onseeked = res; });
    const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    const sw = video.videoWidth * scale, sh = video.videoHeight * scale;
    ctx.drawImage(video, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
  }

  // 자막 레이어 (미리보기용)
  if (scene?.caption1) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, canvas.height - 340, canvas.width, 180);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scene.caption1.substring(0, 14), canvas.width / 2, canvas.height - 278);
    if (scene?.caption2) {
      ctx.fillStyle = script?.vibe_color || '#FFEA00';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(scene.caption2.substring(0, 10), canvas.width / 2, canvas.height - 208);
    }
  }

  onProgress?.(`씬 ${bestIdx + 1}번 썸네일 완료 (aesthetic ${bestScore})`);
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('Blob 변환 실패')), 'image/jpeg', 0.92)
  );
}

async function renderVideoWithFFmpeg(scenes, files, script, onProgress) {
  const report = (msg, pct) => {
    console.log('[FFmpeg]', msg);
    onProgress?.(msg, typeof pct === 'number' ? pct : undefined);
  };
  const theme = script?.theme || 'hansik';
  const FPS   = 25;

  report('FFmpeg 엔진 로딩 중... (최초 1회, 약 20~40초 소요)', 0);
  const ff = await getFFmpeg((logMsg) => {
    if (logMsg.includes('frame=') || logMsg.includes('time=')) report(logMsg);
  });

  // ── 자막 폰트 로딩 시도 ────────────────────────────────
  let fontPath = null;
  try {
    report('자막 폰트 로딩 중...', 2);
    const fontData = await fetchFile(FONT_TTF_URL);
    await ff.writeFile('subtitle_font.otf', fontData);
    fontPath = 'subtitle_font.otf';
    report('자막 폰트 로드 완료 ✓', 4);
  } catch (e) {
    console.warn('[FFmpeg] 폰트 로딩 실패 — 자막 없이 진행:', e.message);
  }

  const partFiles = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene      = scenes[i];
    const fileItem   = files[scene.media_idx ?? i] ?? files[i];
    if (!fileItem) continue;

    const pct = Math.round(5 + (i / scenes.length) * 80);
    report(`씬 ${i + 1}/${scenes.length} 인코딩 중...`, pct);

    const isVideo    = fileItem.type === 'video';
    const ext        = isVideo ? 'mp4' : 'jpg';
    const inputName  = `in_${i}.${ext}`;
    const outputName = `part_${i}.mp4`;
    // 블록 분리형 짧은 컷(0.5초 등)는 AI 설계 duration 보존
    const dur        = (scene.blockIdx !== undefined)
      ? Math.max(0.4, scene.duration || 0.5)
      : Math.max(2.0, scene.duration || 3.0);
    const isLast     = (i === scenes.length - 1);

    // 파일 가상 FS 기록
    const fileData = fileItem.file
      ? await fetchFile(fileItem.file)
      : await fetchFile(fileItem.url);
    await ff.writeFile(inputName, fileData);

    // 필터 체인 구성 (씬 인덱스 i 전달 → 트랜지션 효과)
    const focusCoords = scene.focus_coords || null;
    let vf = isVideo
      ? getVideoFilter(scene, theme, dur, isLast, i)
      : getImageFilter(scene, theme, dur, FPS, focusCoords, isLast, i);

    // 자막 오버레이 (폰트 로드 성공 시)
    const subtitleF = getSubtitleFilter(scene, fontPath, isLast);
    if (subtitleF) vf = vf + ',' + subtitleF;

    const inputLoopArgs = isVideo ? [] : ['-loop', '1'];
    const ssArgs = (isVideo && scene.best_start_pct > 0)
      ? ['-ss', (scene.best_start_pct * Math.max(dur * 2, 5)).toFixed(2)]
      : [];
    try {
      await ff.exec([
        ...inputLoopArgs,
        ...ssArgs,
        '-i', inputName,
        '-t', String(dur),
        '-vf', vf,
        '-r', String(FPS),
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26',
        '-pix_fmt', 'yuv420p', '-an',
        outputName,
      ]);
      partFiles.push(outputName);
    } catch (sceneErr) {
      console.warn(`[FFmpeg] 씬 ${i + 1} 인코딩 실패 — 건너뜁니다:`, sceneErr.message);
    }
    await ff.deleteFile(inputName).catch(() => {});
  }

  if (!partFiles.length) throw new Error('렌더링할 씬이 없습니다');

  // ── 씬 이어붙이기 ─────────────────────────────────────
  report('씬 합치는 중...', 88);
  const concatContent = partFiles.map(f => `file '${f}'`).join('\n');
  await ff.writeFile('concat.txt', new TextEncoder().encode(concatContent));

  await ff.exec([
    '-f', 'concat', '-safe', '0',
    '-i', 'concat.txt',
    '-c', 'copy',
    'output.mp4',
  ]);

  report('최종 파일 읽는 중...', 96);
  const data = await ff.readFile('output.mp4');
  report('✅ 렌더링 완료!', 100);

  // 임시 파일 정리
  for (const f of partFiles) ff.deleteFile(f).catch(() => {});
  ff.deleteFile('concat.txt').catch(() => {});
  ff.deleteFile('output.mp4').catch(() => {});
  if (fontPath) ff.deleteFile(fontPath).catch(() => {});

  return new Blob([data.buffer], { type: 'video/mp4' });
}

/**
 * 시네마틱 마감 주의 함수 — WebCodecs 원본에 LUT 입혀 최고화
 */
async function renderCinematicFinish(blob, theme, onProgress) {
  const ff = await getFFmpeg();
  onProgress?.('시네마틱 마감 처리 중...', 10);
  await ff.writeFile('raw_input.mp4', await fetchFile(blob));
  const lut = getColorLUT(theme || 'hansik');
  await ff.exec([
    '-i', 'raw_input.mp4',
    '-vf', `${lut},unsharp=3:3:1.0:3:3:0.0`,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22',
    '-c:a', 'copy',
    'cinematic_out.mp4',
  ]);
  onProgress?.('완료!', 100);
  const data = await ff.readFile('cinematic_out.mp4');
  ff.deleteFile('raw_input.mp4').catch(() => {});
  ff.deleteFile('cinematic_out.mp4').catch(() => {});
  return new Blob([data.buffer], { type: 'video/mp4' });
}

const renderFormattedText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#FF2D55", fontWeight: 900 }, children: p.slice(2, -2) }, i);
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: p }, i);
  });
};
function VideoPlayer({ isExporting = false }) {
  const videoRef = reactExports.useRef(null);
  const audioRef = reactExports.useRef(null);
  const [safeZone, setSafeZone] = reactExports.useState(false);
  const {
    script,
    files,
    playing,
    muted,
    scene,
    audioBuffers,
    restaurantName,
    setPlaying,
    setScene,
    setSubAnimProg
  } = useVideoStore();
  const currentScene = script?.scenes[scene];
  const rawFileIdx = currentScene?.media_idx ?? scene;
  const fileIdx = files?.length ? Math.max(0, Math.min(rawFileIdx, files.length - 1)) : 0;
  const currentFile = files?.[fileIdx];
  const isImage = currentFile?.type === "image";
  const effectClass = currentScene?.effect ? `effect-${currentScene.effect}` : "";
  const vibeColor = script?.vibe_color || null;
  const audioSceneIdx = (() => {
    if (currentScene?.blockIdx !== void 0 && script?.scenes) {
      const idx = script.scenes.findIndex((s) => s.blockIdx === currentScene.blockIdx);
      return idx >= 0 ? idx : scene;
    }
    return scene;
  })();
  const currentAudioKey = currentScene?.blockIdx ?? scene;
  reactExports.useEffect(() => {
    if (!isImage && videoRef.current) {
      const video = videoRef.current;
      const onMetadata = () => {
        if (video.duration && isFinite(video.duration)) {
          const startPct = currentScene?.best_start_pct || 0;
          if (startPct > 0 && startPct < 0.95) {
            video.currentTime = startPct * video.duration;
          }
          video.playbackRate = 1;
        }
      };
      video.addEventListener("loadedmetadata", onMetadata);
      video.currentTime = 0;
      video.play().catch(() => {
      });
      return () => video.removeEventListener("loadedmetadata", onMetadata);
    }
  }, [scene, isImage, currentScene?.duration, currentScene?.best_start_pct]);
  reactExports.useEffect(() => {
    if (!playing) return;
    if (!isImage && videoRef.current) {
      const hasAudio = !!audioBuffers?.[audioSceneIdx];
      videoRef.current.volume = hasAudio ? 0.15 : 1;
      videoRef.current.muted = hasAudio || muted;
    }
    if (!muted) {
      const ac = getAudioCtx();
      if (ac && ac.state === "running") {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const filt = ac.createBiquadFilter();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1500, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.25);
        filt.type = "lowpass";
        filt.frequency.value = 2e3;
        gain.gain.setValueAtTime(0, ac.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.25);
        osc.connect(filt);
        filt.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.25);
      }
    }
  }, [scene, playing, isImage, audioBuffers, muted]);
  reactExports.useEffect(() => {
    if (!playing || !script) return;
    const sc = script.scenes[scene];
    if (!sc) return;
    const dur = (sc.duration > 0 && isFinite(sc.duration) ? sc.duration : 3) * 1e3;
    const timer = setTimeout(() => {
      const st = useVideoStore.getState();
      if (!st.playing) return;
      const nextSi = st.scene + 1;
      if (nextSi < (st.script?.scenes?.length ?? 0)) {
        setScene(nextSi);
        setSubAnimProg(0);
      } else {
        setPlaying(false);
        document.getElementById("repeatOverlayReact")?.removeAttribute("hidden");
      }
    }, dur);
    return () => clearTimeout(timer);
  }, [playing, scene, script]);
  reactExports.useEffect(() => {
    if (!playing || !script) return;
    const sc = script.scenes[scene];
    if (!sc) return;
    const dur = (sc.duration > 0 && isFinite(sc.duration) ? sc.duration : 3) * 1e3;
    const total = script.scenes.reduce((a, s) => a + (s.duration > 0 && isFinite(s.duration) ? s.duration : 3), 0);
    const done = script.scenes.slice(0, scene).reduce((a, s) => a + (s.duration > 0 && isFinite(s.duration) ? s.duration : 3), 0);
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const el = Math.min((now - start) / 1e3, dur / 1e3);
      const pct = Math.min((done + el) / total * 100, 100);
      const bar = document.getElementById("vProgReact");
      if (bar) bar.style.width = pct + "%";
      setSubAnimProg(Math.min(el / (dur / 1e3), 1));
      if (el < dur / 1e3) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, scene, script]);
  reactExports.useEffect(() => {
    if (!playing || muted) return;
    const buf = audioBuffers?.[audioSceneIdx];
    if (!buf) return;
    const ac = getAudioCtx();
    if (!ac) return;
    let cancelled = false;
    const playAudio = () => {
      if (cancelled) return;
      try {
        audioRef.current?.stop();
      } catch (_) {
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.connect(ac.destination);
      src.start(0);
      audioRef.current = src;
    };
    if (ac.state === "suspended") {
      ac.resume().then(playAudio).catch(() => {
      });
    } else {
      playAudio();
    }
    return () => {
      cancelled = true;
      try {
        audioRef.current?.stop();
      } catch (_) {
      }
    };
  }, [playing, muted, currentAudioKey, audioBuffers]);
  const togglePlay = reactExports.useCallback(() => {
    const ac = getAudioCtx();
    if (ac?.state === "suspended") ac.resume().catch(() => {
    });
    if (playing) {
      try {
        audioRef.current?.stop();
      } catch (_) {
      }
    }
    setPlaying(!playing);
  }, [playing, setPlaying]);
  const doReplay = reactExports.useCallback(() => {
    try {
      audioRef.current?.stop();
    } catch (_) {
    }
    setPlaying(false);
    setScene(0);
    setSubAnimProg(0);
    document.getElementById("repeatOverlayReact")?.setAttribute("hidden", "");
    setTimeout(() => setPlaying(true), 80);
  }, [setPlaying, setScene, setSubAnimProg]);
  if (!script || !files?.length) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "phone", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-notch" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-screen", style: { background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#444", fontSize: "0.85rem" }, children: "스크립트 생성 후 미리보기" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-bar" })
  ] }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "phone-wrap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "phone", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-notch" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "phone-screen", onClick: togglePlay, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#111" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vignette-overlay", style: { zIndex: 10 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            position: "absolute",
            inset: 0,
            zIndex: 13,
            pointerEvents: "none",
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
            opacity: 0.12,
            mixBlendMode: "overlay"
          } }),
          currentFile && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            isImage && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: currentFile.url,
                style: {
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "blur(30px) brightness(0.4)",
                  transform: "scale(1.2)"
                },
                alt: "bg-blur"
              }
            ),
            isImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: currentFile.url,
                alt: "scene",
                className: `video-media-content ${effectClass}`,
                style: {
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  zIndex: 5,
                  "--dur": `${currentScene?.duration ?? 3}s`,
                  animationDuration: `${currentScene?.duration ?? 3}s`
                }
              },
              `img-${scene}`
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "video",
              {
                ref: videoRef,
                src: currentFile.url,
                className: "video-media-content",
                style: {
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  zIndex: 5,
                  "--dur": `${currentScene?.duration ?? 3}s`
                },
                autoPlay: true,
                loop: true,
                muted: audioBuffers?.[audioSceneIdx] ? true : !!muted,
                playsInline: true
              },
              `vid-${scene}-${fileIdx}`
            )
          ] })
        ] }),
        currentScene && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              bottom: "15%",
              left: 0,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              zIndex: 50,
              pointerEvents: "none"
            },
            children: [
              currentScene.caption1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-subtitle-pop dynamic-subtitle", style: {
                backgroundColor: "rgba(0,0,0,0.75)",
                color: "#FFFFFF",
                padding: "10px 22px",
                borderRadius: "50px",
                fontSize: "2.2rem",
                fontWeight: "900",
                letterSpacing: "-1px",
                textAlign: "center",
                maxWidth: "85%",
                boxShadow: vibeColor ? `0 4px 15px rgba(0,0,0,0.3), 0 0 24px ${vibeColor}66` : "0 4px 15px rgba(0,0,0,0.3)",
                textShadow: vibeColor ? `0 0 18px ${vibeColor}99` : void 0,
                wordBreak: "keep-all",
                lineHeight: "1.2"
              }, children: renderFormattedText(currentScene.caption1) }),
              currentScene.caption2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-subtitle-drop dynamic-subtitle", style: {
                backgroundColor: vibeColor ? vibeColor : "rgba(255,234,0,0.92)",
                color: "#000000",
                padding: "6px 16px",
                borderRadius: "8px",
                fontSize: "1.3rem",
                fontWeight: "700",
                textAlign: "center",
                maxWidth: "80%",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                wordBreak: "keep-all"
              }, children: currentScene.caption2 })
            ]
          },
          `sub-${scene}`
        ),
        safeZone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "safe-zone-overlay", style: { position: "absolute", inset: 0, zIndex: 60, pointerEvents: "none" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: 0, left: 0, right: 0, height: "14%", background: "rgba(255,0,0,0.15)", borderBottom: "1px dashed rgba(255,100,100,0.7)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", bottom: 4, left: 8, fontSize: "0.5rem", color: "rgba(255,150,150,0.9)", fontWeight: 700 }, children: "⚠ 상단 UI 영역" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "rgba(255,165,0,0.10)", borderTop: "1px dashed rgba(255,165,0,0.7)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", top: 4, left: 8, fontSize: "0.5rem", color: "rgba(255,180,80,0.9)", fontWeight: 700 }, children: "⚠ 하단 버튼 영역" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "14%", left: 0, right: 0, height: "26%", border: "1px solid rgba(0,255,0,0.6)", background: "rgba(0,255,0,0.05)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", top: 4, left: 8, fontSize: "0.5rem", color: "rgba(100,255,100,0.9)", fontWeight: 700 }, children: "✅ 자막 세이프 존" }) })
        ] }),
        restaurantName && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "10px 14px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.70), transparent)",
          color: "#fff",
          fontSize: "0.9rem",
          fontWeight: 700
        }, children: restaurantName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(YtInfoOverlay, { script }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yt-progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yt-progress-fill", id: "vProgReact", style: { width: "0%" } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "repeatOverlayReact", className: "repeat-overlay", hidden: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "repeat-box", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "repeat-question", children: "계속 반복하시겠습니까?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "repeat-btns", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "repeat-btn repeat-yes", onClick: (e) => {
              e.stopPropagation();
              doReplay();
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-redo" }),
              " 네, 다시 보기"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "repeat-btn repeat-no", onClick: (e) => {
              e.stopPropagation();
              document.getElementById("repeatOverlayReact")?.setAttribute("hidden", "");
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-times" }),
              " 아니요"
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-bar" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-side yt-side", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yt-avatar-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yt-avatar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "M" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yt-sub-plus", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" }) })
      ] }),
      [
        { icon: "fa-thumbs-up", label: "1.2만" },
        { icon: "fa-thumbs-down", label: "싫어요" },
        { icon: "fa-comment-dots", label: "48" },
        { icon: "fa-share", label: "공유" },
        { icon: "fa-ellipsis-vertical", label: "더보기" }
      ].map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yt-btn-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rsb", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${b.icon}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yt-btn-label", children: b.label })
      ] }, i))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "v-controls-outer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vprog-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vprog-rail", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vprog-bar", id: "vProgReact2" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "v-controls", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "vcb", onClick: doReplay, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-rotate-left" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "vcb vcb-play", onClick: togglePlay, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${playing ? "fa-pause" : "fa-play"}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "vcb", onClick: () => useVideoStore.getState().setMuted(!muted), children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${muted ? "fa-volume-mute" : "fa-volume-up"}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: `vcb${safeZone ? " vcb-active" : ""}`,
            onClick: () => setSafeZone((v) => !v),
            title: "인스타 세이프 존 가이드",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-th" })
          }
        )
      ] })
    ] })
  ] });
}
function YtInfoOverlay({ script }) {
  if (!script) return null;
  const { audioBuffers, restaurantName } = useVideoStore();
  const hasAudio = audioBuffers?.some((b) => b);
  const name = restaurantName || "MOOVLOG";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yt-info", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yt-info-title", children: script.title || name }),
    hasAudio && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yt-music-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-music yt-music-icon" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yt-music-ticker", children: [
        "Original Sound · ",
        name
      ] })
    ] })
  ] });
}
function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function drawMedia(ctx, media, effect, prog, CW, CH, SCALE, isExporting = false) {
  if (!media) {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, CW, CH);
    return;
  }
  if (media.type === "video") {
    const vid = media.src;
    if (vid._loadFailed || vid.readyState < 2) {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, CW, CH);
      return;
    }
    if (!isExporting && vid.paused) vid.play().catch(() => {
    });
  }
  const e = ease(prog);
  let sc = 1, ox = 0, oy = 0;
  switch (effect) {
    case "zoom-in":
      sc = 1 + e * 0.25;
      break;
    case "zoom-in-slow":
      sc = 1 + e * 0.1;
      break;
    case "zoom-out":
      sc = 1.25 - e * 0.25;
      break;
    case "pan-left":
      sc = 1.15;
      ox = (1 - e) * CW * 0.15;
      break;
    case "pan-right":
      sc = 1.15;
      ox = -(1 - e) * CW * 0.15;
      break;
    case "float-up":
      sc = 1.1;
      oy = (1 - e) * CH * 0.08;
      break;
    case "pan-up":
      sc = 1.12;
      oy = (1 - e) * CH * 0.1;
      break;
    case "drift":
      sc = 1.08;
      ox = Math.sin(e * Math.PI) * CW * 0.06;
      break;
    default:
      sc = 1.06 + e * 0.08;
  }
  const el = media.src;
  const sw = media.type === "video" ? el.videoWidth || CW : el.naturalWidth;
  const sh = media.type === "video" ? el.videoHeight || CH : el.naturalHeight;
  const r = Math.max(CW / sw, CH / sh), dw = sw * r, dh = sh * r;
  ctx.save();
  ctx.translate(CW / 2 + ox, CH / 2 + oy);
  ctx.scale(sc, sc);
  try {
    ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
  } catch {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
  }
  ctx.restore();
}
function drawVignetteGrad(ctx, CW, CH) {
  const g = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.18, CW / 2, CH / 2, CH * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}
function drawSubtitle(ctx, sc, animProg, CW, CH, SCALE) {
  if (!sc) return;
  const cap1 = sc.caption1 || sc.subtitle || "";
  const cap2 = sc.caption2 || "";
  if (!cap1 && !cap2) return;
  const pos = sc.subtitle_position || "lower";
  const style = sc.subtitle_style || "detail";
  const baseY = pos === "upper" ? CH * 0.16 : pos === "center" ? CH * 0.44 : CH * 0.7;
  const showCap2 = !!(cap2 && animProg > 0.6);
  const appear = showCap2 ? Math.min((animProg - 0.6) * 10, 1) : Math.min(animProg * 5, 1);
  const oy = (1 - ease(appear)) * 18 * SCALE;
  const popScale = appear < 0.45 ? 0.8 + appear / 0.45 * 0.32 : 1.12 - (appear - 0.45) / 0.55 * 0.12;
  ctx.save();
  ctx.globalAlpha = appear;
  ctx.translate(0, oy);
  ctx.translate(CW / 2, baseY);
  ctx.scale(popScale, popScale);
  ctx.translate(-CW / 2, -baseY);
  const SM = {
    hook: { main: "#FFFFFF", hl: "#FF2D55", sz: 54, bg: "gradient" },
    hero: { main: "#FFE340", hl: "#FF9F0A", sz: 50, bg: "gradient" },
    cta: { main: "#CCFF00", hl: "#FF3B30", sz: 48, bg: "gradient" },
    detail: { main: "#FFFFFF", hl: "#FFFFFF", sz: 44, bg: "simple" },
    bold_drop: { main: "#FFFFFF", hl: "#FFD60A", sz: 56, bg: "bold" },
    minimal: { main: "#FFFFFF", hl: "#FFFFFFA0", sz: 40, bg: "none" },
    elegant: { main: "#FFE8C0", hl: "#FFC87A", sz: 44, bg: "elegant" }
  };
  const S = SM[style] || SM.detail;
  const fs = Math.round(S.sz * SCALE);
  ctx.font = `500 ${fs}px 'Noto Sans KR', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = showCap2 ? cap2 : cap1;
  if (!text) {
    ctx.restore();
    return;
  }
  const cleanText = text.replace(/\*\*/g, "");
  const hasKwHl = cleanText !== text;
  const tw = ctx.measureText(hasKwHl ? cleanText : text).width;
  const padX = Math.round(30 * SCALE);
  const padY = Math.round(14 * SCALE);
  const bw = Math.min(tw + padX * 2, CW * 0.92);
  const bh = fs + padY * 2;
  if (S.bg === "gradient" || S.bg === "bold") {
    const bgGrad = ctx.createLinearGradient(CW / 2 - bw / 2, 0, CW / 2 + bw / 2, 0);
    if (S.bg === "bold") {
      bgGrad.addColorStop(0, "rgba(0,0,0,0.88)");
      bgGrad.addColorStop(0.5, "rgba(20,20,20,0.80)");
      bgGrad.addColorStop(1, "rgba(0,0,0,0.88)");
    } else {
      bgGrad.addColorStop(0, "rgba(0,0,0,0.80)");
      bgGrad.addColorStop(0.5, "rgba(0,0,0,0.65)");
      bgGrad.addColorStop(1, "rgba(0,0,0,0.80)");
    }
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(CW / 2 - bw / 2, baseY - bh / 2, bw, bh, Math.round(bh * 0.35));
    ctx.fill();
    const accentH = bh - Math.round(14 * SCALE);
    ctx.fillStyle = S.hl;
    ctx.beginPath();
    ctx.roundRect(CW / 2 - bw / 2, baseY - accentH / 2, Math.round(5 * SCALE), accentH, Math.round(3 * SCALE));
    ctx.fill();
    if (S.bg === "bold") {
      ctx.fillStyle = S.hl;
      ctx.beginPath();
      ctx.roundRect(
        CW / 2 - bw / 2,
        baseY + bh / 2 - Math.round(5 * SCALE),
        bw,
        Math.round(5 * SCALE),
        [0, 0, Math.round(bh * 0.35), Math.round(bh * 0.35)]
      );
      ctx.fill();
    }
  } else if (S.bg === "elegant") {
    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.beginPath();
    ctx.roundRect(CW / 2 - bw / 2, baseY - bh / 2, bw, bh, Math.round(10 * SCALE));
    ctx.fill();
    ctx.fillStyle = S.hl;
    ctx.fillRect(CW / 2 - bw / 2, baseY - bh / 2 + Math.round(8 * SCALE), Math.round(4 * SCALE), bh - Math.round(16 * SCALE));
  } else if (S.bg === "simple") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(CW / 2 - bw / 2, baseY - bh / 2, bw, bh, Math.round(12 * SCALE));
    ctx.fill();
  }
  const strokeW = S.bg === "minimal" ? Math.round(9 * SCALE) : Math.round(7 * SCALE);
  ctx.lineWidth = strokeW;
  ctx.lineJoin = "round";
  if (hasKwHl) {
    const segs = text.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((w) => {
      const isHl = w.startsWith("**") && w.endsWith("**");
      const str = isHl ? w.slice(2, -2) : w;
      ctx.font = isHl ? `900 ${Math.round(fs * 1.12)}px 'Noto Sans KR', sans-serif` : `500 ${fs}px 'Noto Sans KR', sans-serif`;
      return { str, isHl, width: ctx.measureText(str).width };
    });
    const totalW = segs.reduce((a, s) => a + s.width, 0);
    let curX = CW / 2 - totalW / 2;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    segs.forEach((seg) => {
      ctx.font = seg.isHl ? `900 ${Math.round(fs * 1.12)}px 'Noto Sans KR', sans-serif` : `500 ${fs}px 'Noto Sans KR', sans-serif`;
      if (seg.isHl) {
        ctx.fillStyle = "#FF2D55";
        ctx.fillRect(curX, baseY + fs * 0.06, seg.width, fs * 0.36);
        ctx.fillStyle = "#FFFFFF";
      } else {
        ctx.fillStyle = showCap2 ? S.main : style !== "detail" && style !== "minimal" && style !== "elegant" ? S.hl : S.main;
      }
      ctx.strokeStyle = "rgba(0,0,0,0.9)";
      ctx.strokeText(seg.str, curX, baseY);
      ctx.fillText(seg.str, curX, baseY);
      curX += seg.width;
    });
  } else {
    ctx.strokeStyle = "rgba(0,0,0,0.95)";
    ctx.strokeText(text, CW / 2, baseY);
    ctx.fillStyle = showCap2 ? S.main : style !== "detail" && style !== "minimal" && style !== "elegant" ? S.hl : S.main;
    ctx.fillText(text, CW / 2, baseY);
    if (style === "bold_drop" || style === "hook") {
      const words = text.split(" ");
      if (words.length > 1) {
        const firstWord = words[0];
        const rest = " " + words.slice(1).join(" ");
        const fw = ctx.measureText(firstWord).width;
        const rw = ctx.measureText(rest).width;
        const startX = CW / 2 - (fw + rw) / 2;
        ctx.font = `600 ${fs}px 'Noto Sans KR', sans-serif`;
        ctx.strokeText(firstWord, startX + fw / 2, baseY);
        ctx.fillStyle = S.hl;
        ctx.fillText(firstWord, startX + fw / 2, baseY);
        ctx.strokeText(rest, startX + fw + rw / 2, baseY);
        ctx.fillStyle = S.main;
        ctx.fillText(rest, startX + fw + rw / 2, baseY);
      }
    }
  }
  ctx.restore();
}
function drawChannelTop(ctx, name, CW, CH, SCALE) {
  if (!name) return;
  ctx.save();
  const topH = Math.round(CH * 0.13);
  const grad = ctx.createLinearGradient(0, 0, 0, topH);
  grad.addColorStop(0, "rgba(0,0,0,0.80)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, topH);
  const PAD = Math.round(18 * SCALE);
  const CY = Math.round(CH * 0.048);
  const AV = Math.round(24 * SCALE);
  ctx.fillStyle = "#7c3aed";
  ctx.beginPath();
  ctx.arc(PAD + AV, CY, AV, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = Math.round(2.5 * SCALE);
  ctx.stroke();
  ctx.font = `700 ${Math.round(14 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name[0]?.toUpperCase() || "M", PAD + AV, CY);
  const nameX = PAD + AV * 2 + Math.round(10 * SCALE);
  const nameFontSize = Math.round(28 * SCALE);
  ctx.font = `800 ${nameFontSize}px 'Black Han Sans', 'Noto Sans KR', sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = Math.round(8 * SCALE);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(2 * SCALE);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(name.slice(0, 16), nameX, CY - Math.round(7 * SCALE));
  ctx.shadowBlur = Math.round(4 * SCALE);
  ctx.shadowOffsetY = 0;
  ctx.font = `500 ${Math.round(14 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("@" + name.replace(/\s+/g, "").slice(0, 14), nameX, CY + Math.round(16 * SCALE));
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const followX = CW - Math.round(96 * SCALE);
  const followW = Math.round(76 * SCALE);
  const followH = Math.round(32 * SCALE);
  const followY = CY - followH / 2;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = Math.round(1.5 * SCALE);
  ctx.beginPath();
  ctx.roundRect(followX, followY, followW, followH, Math.round(followH / 2));
  ctx.fill();
  ctx.stroke();
  ctx.font = `600 ${Math.round(13 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("팔로우", followX + followW / 2, CY);
  ctx.restore();
}
const ASPECT_MAP_EX = {
  "9:16": { CW: 1080, CH: 1920 },
  "1:1": { CW: 1080, CH: 1080 },
  "16:9": { CW: 1920, CH: 1080 }
};
function renderFrameToCtx(ctx, { script, loaded, aspectRatio, restaurantName }, si, prog, subAnim, isExporting = false) {
  const { CW, CH } = ASPECT_MAP_EX[aspectRatio] || ASPECT_MAP_EX["9:16"];
  const SCALE = Math.min(CW, CH) / 720;
  const sc = script?.scenes?.[si];
  if (!sc) return;
  const mediaIdx = sc.media_idx !== void 0 ? sc.media_idx : sc.idx ?? si;
  const media = loaded?.[mediaIdx % Math.max(loaded?.length || 1, 1)] || null;
  ctx.clearRect(0, 0, CW, CH);
  drawMedia(ctx, media, sc.effect, prog, CW, CH, SCALE, isExporting);
  drawVignetteGrad(ctx, CW, CH);
  drawChannelTop(ctx, restaurantName, CW, CH, SCALE);
  drawSubtitle(ctx, sc, subAnim, CW, CH, SCALE);
  if (prog < 0.1) {
    const flashT = 1 - prog / 0.1;
    ctx.fillStyle = `rgba(255,255,255,${flashT * 0.45})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}

function SceneEditor({ sceneIdx, onClose }) {
  const { script, updateScene, audioBuffers, updateAudioBuffer, addToast } = useVideoStore();
  const sc = script?.scenes?.[sceneIdx];
  if (!sc) return null;
  const [caption, setCaption] = reactExports.useState(sc.caption1 || sc.subtitle || "");
  const [narration, setNarration] = reactExports.useState(sc.narration || "");
  const [duration, setDuration] = reactExports.useState(sc.duration > 0 ? sc.duration : 3);
  const [loading, setLoading] = reactExports.useState(false);
  const [statusMsg, setStatusMsg] = reactExports.useState("");
  const handleSave = async () => {
    setLoading(true);
    try {
      updateScene(sceneIdx, { caption1: caption, subtitle: caption, duration });
      if (narration.trim() && narration !== sc.narration) {
        setStatusMsg("음성 재합성 중...");
        const text = preprocessNarration(narration);
        let newBuf = null;
        if (hasTypeCastKeys()) {
          const { _typeCastKeys } = await __vitePreload(async () => { const { _typeCastKeys } = await Promise.resolve().then(() => tts);return { _typeCastKeys }},true?void 0:void 0).then((m) => ({ _typeCastKeys: [] }));
          let tcErr = null;
          for (let attempt = 0; attempt < 7; attempt++) {
            try {
              newBuf = await fetchTypeCastTTS(text);
              break;
            } catch (e) {
              tcErr = e;
              rotateTypeCastKey();
            }
          }
          if (!newBuf) throw tcErr || new Error("Typecast 모든 키 소진");
        } else {
          newBuf = await fetchTTSWithRetry(text, sceneIdx);
        }
        updateAudioBuffer(sceneIdx, newBuf);
        if (newBuf?.duration > 0) {
          const newDur = Math.max(2, Math.round((newBuf.duration + 0.4) * 10) / 10);
          updateScene(sceneIdx, { narration, duration: newDur });
          setDuration(newDur);
        }
        addToast(`SCENE ${sceneIdx + 1} 음성 재합성 완료!`, "ok");
      } else {
        updateScene(sceneIdx, { narration });
        addToast(`SCENE ${sceneIdx + 1} 수정 완료`, "ok");
      }
      onClose();
    } catch (e) {
      addToast(`음성 재생성 실패: ${e.message}`, "err");
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-backdrop", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-box", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "modal-title", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }),
        " ",
        statusMsg
      ] }) : `SCENE ${sceneIdx + 1} 편집` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "modal-close", onClick: onClose, children: "✕" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "modal-label", children: "캡션 (자막)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        className: "modal-input",
        type: "text",
        value: caption,
        onChange: (e) => setCaption(e.target.value),
        placeholder: "자막 텍스트"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "modal-label", children: "씬 재생 길이 (초)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        className: "modal-input",
        type: "number",
        step: "0.1",
        min: "0.5",
        max: "15",
        value: duration,
        onChange: (e) => setDuration(parseFloat(e.target.value))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "modal-label", children: "나레이션" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        className: "modal-textarea",
        rows: 4,
        value: narration,
        onChange: (e) => setNarration(e.target.value),
        placeholder: "나레이션 텍스트"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-btns", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "modal-btn-cancel", onClick: onClose, children: "취소" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "modal-btn-save", onClick: handleSave, disabled: loading, children: loading ? "처리 중..." : "저장" })
    ] })
  ] }) });
}

function SceneList() {
  const { script, scene: currentScene } = useVideoStore();
  const [editIdx, setEditIdx] = reactExports.useState(null);
  if (!script?.scenes?.length) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "scenes-details", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-list-ul" }),
        " 생성된 장면 스크립트"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scene-list", children: script.scenes.map((sc, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `scard ${i === currentScene ? "active" : ""}`,
          id: `sc${i}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "scard-num", children: [
              "SCENE ",
              i + 1,
              " · ",
              formatDuration(Math.round(sc.duration || 0)),
              " · ",
              sc.subtitle_style || "detail",
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "scard-edit-btn", onClick: () => setEditIdx(i), children: "수정" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "scard-sub", children: [
              sc.caption1,
              sc.caption2 ? ` / ${sc.caption2}` : ""
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scard-nar", children: sc.narration })
          ]
        },
        i
      )) })
    ] }),
    editIdx !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(SceneEditor, { sceneIdx: editIdx, onClose: () => setEditIdx(null) })
  ] });
}

function ExportPanel() {
  const { script, audioBuffers, restaurantName, addToast, setExporting, exporting, pipelineSessionId: pipelineSessionId2, files } = useVideoStore();
  const [btnText, setBtnText] = reactExports.useState("영상 저장하기");
  const [ffmpegText, setFfmpegText] = reactExports.useState("📦 FFmpeg 내보내기 (시네마틱)");
  const [ffmpegBusy, setFfmpegBusy] = reactExports.useState(false);
  const [ffmpegPct, setFfmpegPct] = reactExports.useState(0);
  const [thumbBusy, setThumbBusy] = reactExports.useState(false);
  const [hybridBusy, setHybridBusy] = reactExports.useState(false);
  const doExport = async () => {
    if (exporting) return;
    if (!script?.scenes?.length) {
      addToast("먼저 영상을 생성해주세요", "err");
      return;
    }
    setExporting(true);
    setBtnText("준비 중...");
    const ac = getAudioCtx();
    if (ac?.state === "suspended") await ac.resume();
    try {
      const hasWebCodecs = typeof VideoEncoder !== "undefined" && typeof AudioEncoder !== "undefined" && typeof VideoEncoder.isConfigSupported === "function" && (typeof Muxer !== "undefined" || typeof Muxer$1 !== "undefined");
      if (hasWebCodecs) {
        await doExportWebCodecs(script, audioBuffers, restaurantName, setBtnText, addToast);
      } else {
        addToast("WebCodecs 미지원 브라우저 — Chrome을 이용해주세요", "err");
      }
    } catch (err) {
      addToast("저장 오류: " + (err?.message || String(err)), "err");
      setBtnText("영상 저장하기");
    } finally {
      setExporting(false);
    }
  };
  const doExportAudio = async () => {
    if (!audioBuffers?.some((b) => b)) {
      addToast("AI 음성이 없습니다", "err");
      return;
    }
    addToast("음성 WAV 저장 중...", "inf");
    try {
      const ac = getAudioCtx();
      const totalDur = script.scenes.reduce((a, s) => a + (s.duration > 0 && isFinite(s.duration) ? s.duration : 3), 0);
      const SR = 44100;
      const totalSamples = Math.ceil(SR * totalDur);
      const mixed = new Float32Array(totalSamples);
      let offset = 0;
      for (let i = 0; i < script.scenes.length; i++) {
        const dur = script.scenes[i].duration > 0 && isFinite(script.scenes[i].duration) ? script.scenes[i].duration : 3;
        const buf = audioBuffers[i];
        if (buf) {
          const ch = buf.getChannelData(0);
          for (let j = 0; j < Math.min(ch.length, totalSamples - offset); j++) mixed[offset + j] = ch[j];
        }
        offset += Math.round(dur * SR);
      }
      const wavBlob = new Blob([encodeWav(mixed, SR)], { type: "audio/wav" });
      downloadBlob(wavBlob, `moovlog_${sanitizeName(restaurantName)}.wav`);
      addToast("음성 WAV 저장 완료!", "ok");
    } catch (e) {
      addToast("음성 저장 오류: " + e.message, "err");
    }
  };
  const ensureIsolation = () => {
    if (crossOriginIsolated) return true;
    addToast("보안 헤더 미적용 — FFmpeg가 실패하면 페이지를 새로고침(F5) 후 다시 시도하세요.", "inf");
    return true;
  };
  const doExportThumbnail = async () => {
    if (thumbBusy) return;
    if (!script?.scenes?.length || !files?.length) {
      addToast("시작 전 영상을 만들어주세요", "err");
      return;
    }
    setThumbBusy(true);
    try {
      const blob = await extractThumbnail(script.scenes, files, script, (msg) => addToast(msg, "inf"));
      downloadBlob(blob, `moovlog_thumb_${sanitizeName(restaurantName)}.jpg`);
      addToast("썸네일 저장 완료! 최고등급 씨 추출 ✨", "ok");
    } catch (e) {
      addToast("썸네일 오류: " + e.message, "err");
    } finally {
      setThumbBusy(false);
    }
  };
  const doExportHybrid = async () => {
    if (hybridBusy || exporting) return;
    if (!script?.scenes?.length) {
      addToast("먼저 영상을 생성해주세요", "err");
      return;
    }
    ensureIsolation();
    setHybridBusy(true);
    setExporting(true);
    try {
      addToast("하이브리드: WebCodecs 로 빠르게 렌더링 후 FFmpeg LUT 마감 중...", "inf");
      const rawBlob = await new Promise((resolve, reject) => {
        doExportWebCodecs(script, audioBuffers, restaurantName, (t) => {
        }, addToast).then(resolve).catch(reject);
      });
      if (files?.length) {
        const cinematic = await renderCinematicFinish(
          rawBlob || new Blob(),
          script.theme,
          (msg, pct) => addToast(msg, "inf")
        );
        downloadBlob(cinematic, `moovlog_hybrid_${sanitizeName(restaurantName)}.mp4`);
        addToast("하이브리드 렌더링 완료! 🎬", "ok");
      }
    } catch (e) {
      try {
        const blob = await renderVideoWithFFmpeg(script.scenes, files, script, (msg, pct) => {
          if (typeof pct === "number") addToast(`하이브리드 폴백: ${msg}`, "inf");
        });
        downloadBlob(blob, `moovlog_hybrid_${sanitizeName(restaurantName)}.mp4`);
        addToast("하이브리드(FFmpeg 대체) 완료!", "ok");
      } catch (e2) {
        addToast("하이브리드 오류: " + e2.message, "err");
      }
    } finally {
      setHybridBusy(false);
      setExporting(false);
    }
  };
  const doExportFFmpeg = async () => {
    if (ffmpegBusy) return;
    if (!script?.scenes?.length) {
      addToast("먼저 영상을 생성해주세요", "err");
      return;
    }
    if (!files?.length) {
      addToast("미디어 파일이 없습니다", "err");
      return;
    }
    ensureIsolation();
    setFfmpegBusy(true);
    setFfmpegPct(0);
    try {
      const blob = await renderVideoWithFFmpeg(
        script.scenes,
        files,
        script,
        (msg, pct) => {
          setFfmpegText(`🎬 ${msg}`);
          if (typeof pct === "number") setFfmpegPct(pct);
        }
      );
      downloadBlob(blob, `moovlog_ffmpeg_${sanitizeName(restaurantName)}.mp4`);
      addToast("FFmpeg 렌더링 완료!", "ok");
      setFfmpegText("📦 FFmpeg 내보내기 (시네마틱)");
      setFfmpegPct(0);
    } catch (err) {
      const msg = err?.message || String(err);
      addToast("FFmpeg 오류: " + msg, "err");
      if (/sharedarraybuffer|crossoriginisolated|coop|coep|security|worker/i.test(msg)) {
        addToast("FFmpeg 격리 오류로 기본 저장으로 자동 전환합니다.", "inf");
        await doExport().catch(() => {
        });
      }
      setFfmpegText("📦 FFmpeg 내보내기 (시네마틱)");
      setFfmpegPct(0);
    } finally {
      setFfmpegBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dl-box", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "dl-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-download" }),
      " 영상 저장"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "dl-desc", children: [
      "나레이션 음성이 자동으로 합성됩니다.",
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      "버튼을 누르면 ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "음성 포함 MP4 영상" }),
      "이 저장됩니다."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "dl-btn", onClick: doExport, disabled: exporting, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${exporting ? "fa-spinner fa-spin" : "fa-download"}` }),
      " ",
      btnText
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "dl-audio-btn", onClick: doExportAudio, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-music" }),
      " 음성만 저장 (WAV)"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "dl-audio-btn",
        onClick: doExportFFmpeg,
        disabled: ffmpegBusy,
        style: { marginTop: "8px" },
        title: "FFmpeg WASM 시네마틱 렌더링 (LUT·Ken Burns·자막)",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${ffmpegBusy ? "fa-spinner fa-spin" : "fa-film"}` }),
          " ",
          ffmpegText
        ]
      }
    ),
    "      ",
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "dl-audio-btn",
        onClick: doExportThumbnail,
        disabled: thumbBusy,
        style: { marginTop: "6px" },
        title: "최고화질 썸네일 추출",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${thumbBusy ? "fa-spinner fa-spin" : "fa-image"}` }),
          " ",
          thumbBusy ? "썸네일 추출 중..." : "베스트 썸네일 저장"
        ]
      }
    ),
    "      ",
    ffmpegBusy && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "6px 0 2px", background: "rgba(255,255,255,0.08)", borderRadius: "6px", overflow: "hidden", height: "6px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      height: "100%",
      background: "linear-gradient(90deg,#7c3aed,#a855f7)",
      width: `${ffmpegPct}%`,
      transition: "width 0.4s ease",
      borderRadius: "6px"
    } }) }),
    ffmpegBusy && ffmpegPct > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: "0.68rem", color: "#a855f7", textAlign: "right", margin: "2px 0 0" }, children: [
      ffmpegPct,
      "%"
    ] })
  ] });
}
function encodeWav(f32, SR) {
  const N = f32.length, bps = 16, ch = 1, blockAlign = ch * bps / 8;
  const dataSize = N * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const ws = (off, s) => s.split("").forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)));
  ws(0, "RIFF");
  v.setUint32(4, 36 + dataSize, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, SR, true);
  v.setUint32(28, SR * blockAlign, true);
  v.setUint16(32, blockAlign, true);
  v.setUint16(34, bps, true);
  ws(36, "data");
  v.setUint32(40, dataSize, true);
  for (let i = 0; i < N; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true);
  }
  return buf;
}
async function doExportWebCodecs(script, audioBuffers, restaurantName, setBtnText, addToast) {
  const { loaded, aspectRatio } = useVideoStore.getState();
  const { CW, CH } = ASPECT_MAP_EX[aspectRatio] || ASPECT_MAP_EX["9:16"];
  const FPS = 60;
  const sceneDurs = script.scenes.map((s) => s.duration > 0 && isFinite(s.duration) ? s.duration : 3);
  const totalDur = sceneDurs.reduce((a, b) => a + b, 0);
  const nFrames = Math.ceil(totalDur * FPS);
  const VBR = 2e7;
  const ABR = 192e3;
  setBtnText("코덱 확인 중...");
  let fmt = null;
  if (typeof Muxer !== "undefined") {
    for (const vc of [
      { enc: "avc1.640033", mux: "avc" },
      { enc: "avc1.4d0033", mux: "avc" },
      { enc: "avc1.42001f", mux: "avc" }
    ]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: VBR, framerate: FPS });
        if (s.supported) {
          fmt = { vc, MuxLib: Mp4Muxer, ext: "mp4", mime: "video/mp4", ac: { enc: "mp4a.40.2", mux: "aac" } };
          break;
        }
      } catch {
      }
    }
  }
  if (!fmt && typeof Muxer$1 !== "undefined") {
    for (const vc of [{ enc: "vp09.00.41.08", mux: "V_VP9" }, { enc: "vp08.00.41.08", mux: "V_VP8" }]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: VBR, framerate: FPS });
        if (s.supported) {
          fmt = { vc, MuxLib: WebmMuxer, ext: "webm", mime: "video/webm", ac: { enc: "opus", mux: "A_OPUS" } };
          break;
        }
      } catch {
      }
    }
  }
  if (!fmt) throw new Error("지원하는 코덱 없음 — Chrome을 이용해주세요");
  let pcm = null;
  if (audioBuffers?.some((b) => b)) {
    setBtnText("음성 처리 중... 3%");
    try {
      const SR = 48e3;
      const totalSamples = Math.ceil(SR * totalDur);
      const mixed = new Float32Array(totalSamples);
      let offset = 0;
      for (let i = 0; i < script.scenes.length; i++) {
        const dur = script.scenes[i].duration > 0 && isFinite(script.scenes[i].duration) ? script.scenes[i].duration : 3;
        const buf = audioBuffers[i];
        if (buf) {
          const ch = buf.getChannelData(0);
          const ac = getAudioCtx();
          let resampled = ch;
          if (buf.sampleRate !== SR) {
            const offCtx = new OfflineAudioContext(1, Math.ceil(buf.length * SR / buf.sampleRate), SR);
            const src = offCtx.createBufferSource();
            src.buffer = buf;
            src.connect(offCtx.destination);
            src.start(0);
            const rendered = await offCtx.startRendering();
            resampled = rendered.getChannelData(0);
          }
          for (let j = 0; j < Math.min(resampled.length, totalSamples - offset); j++) {
            mixed[offset + j] = resampled[j];
          }
        }
        offset += Math.round(dur * SR);
      }
      pcm = mixed;
    } catch (e) {
      console.warn("[Export] 오디오 렌더 실패:", e.message);
    }
  }
  const { Muxer: Muxer$2, ArrayBufferTarget } = fmt.MuxLib;
  const muxTarget = new ArrayBufferTarget();
  const muxer = new Muxer$2({
    target: muxTarget,
    video: { codec: fmt.vc.mux, width: CW, height: CH, frameRate: FPS },
    ...pcm ? { audio: { codec: fmt.ac.mux, numberOfChannels: 1, sampleRate: 48e3 } } : {},
    firstTimestampBehavior: "offset",
    ...fmt.ext === "mp4" ? { fastStart: "in-memory" } : {}
  });
  const videoEnc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (err) => {
      throw new Error(err?.message || String(err) || "VideoEncoder 오류");
    }
  });
  videoEnc.configure({ codec: fmt.vc.enc, width: CW, height: CH, bitrate: VBR, framerate: FPS, latencyMode: "quality", bitrateMode: "variable" });
  const snapCanvas = new OffscreenCanvas(CW, CH);
  const snapCtx = snapCanvas.getContext("2d", { willReadFrequently: true });
  const renderCtx = { script, loaded, aspectRatio, restaurantName };
  let globalFrame = 0;
  for (let si = 0; si < script.scenes.length; si++) {
    const dur = sceneDurs[si];
    const nSceneFrames = Math.ceil(dur * FPS);
    const media = loaded?.[(script.scenes[si].idx ?? 0) % Math.max(loaded?.length || 1, 1)] || null;
    if (media?.type === "video" && media.src && !media.src._loadFailed) {
      media.src.pause();
      media.src.currentTime = 0;
      await new Promise((r) => {
        media.src.onseeked = r;
        setTimeout(r, 200);
      });
    }
    for (let f = 0; f < nSceneFrames; f++) {
      const prog = nSceneFrames > 1 ? f / (nSceneFrames - 1) : 0;
      if (media?.type === "video" && media.src && !media.src._loadFailed) {
        const vDur = media.src.duration;
        const targetTime = vDur && isFinite(vDur) ? Math.min(prog * vDur, vDur - 0.1) : prog * dur;
        if (Math.abs(media.src.currentTime - targetTime) > 0.08) {
          await new Promise((r) => {
            media.src.currentTime = targetTime;
            media.src.onseeked = r;
            setTimeout(r, 150);
          });
        }
      }
      renderFrameToCtx(snapCtx, renderCtx, si, prog, Math.min(prog, 1), true);
      const vf = new VideoFrame(snapCanvas, {
        timestamp: Math.round(globalFrame * 1e6 / FPS),
        duration: Math.round(1e6 / FPS)
      });
      if (videoEnc.encodeQueueSize > 30) {
        await new Promise((resolve) => {
          const checkQ = () => videoEnc.encodeQueueSize <= 10 ? resolve() : setTimeout(checkQ, 10);
          checkQ();
        });
      }
      videoEnc.encode(vf, { keyFrame: globalFrame % FPS === 0 });
      vf.close();
      if (globalFrame % 15 === 0) {
        const pct = Math.round(globalFrame / nFrames * (pcm ? 65 : 90));
        setBtnText(`인코딩 중... ${pct}%`);
        await new Promise((r) => setTimeout(r, 0));
      }
      globalFrame++;
    }
  }
  await videoEnc.flush();
  videoEnc.close();
  if (pcm) {
    setBtnText("음성 인코딩 중... 70%");
    const audioEnc = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (err) => {
        throw new Error(err?.message || String(err) || "AudioEncoder 오류");
      }
    });
    audioEnc.configure({ codec: fmt.ac.enc, sampleRate: 48e3, numberOfChannels: 1, bitrate: ABR });
    const CHUNK = 1920;
    for (let i = 0; i < pcm.length; i += CHUNK) {
      const slice = pcm.slice(i, Math.min(i + CHUNK, pcm.length));
      const ad = new AudioData({ format: "f32", sampleRate: 48e3, numberOfFrames: slice.length, numberOfChannels: 1, timestamp: Math.round(i * 1e6 / 48e3), data: slice.buffer });
      audioEnc.encode(ad);
      ad.close();
      if (i % (CHUNK * 30) === 0) await new Promise((r) => setTimeout(r, 0));
    }
    await audioEnc.flush();
    audioEnc.close();
  }
  setBtnText("파일 생성 중... 98%");
  await new Promise((r) => setTimeout(r, 80));
  muxer.finalize();
  const { buffer } = muxTarget;
  if (!buffer || buffer.byteLength < 1e3) throw new Error("영상 데이터 생성 실패");
  const blob = new Blob([buffer], { type: fmt.mime });
  downloadBlob(blob, `moovlog_${sanitizeName(restaurantName)}.${fmt.ext}`);
  setBtnText("다시 저장하기");
  addToast(pcm ? `✓ AI 음성 포함 ${fmt.ext.toUpperCase()} 저장 완료!` : `✓ ${fmt.ext.toUpperCase()} 저장 완료!`, "ok");
  firebaseUploadVideo(blob, fmt.ext, restaurantName, pipelineSessionId).catch(() => {
  });
}

function processNaver(text) {
  const raw = text || "";
  const t = raw.startsWith("#협찬") ? raw : "#협찬 " + raw;
  if (t.length <= 300) return t;
  const cut = t.slice(0, 300);
  const sp = cut.lastIndexOf(" ");
  return sp > 0 ? cut.slice(0, sp) : cut;
}
function processYoutube(text) {
  const raw = text || "";
  if (raw.length <= 100) return raw;
  const cut = raw.slice(0, 100);
  const sp = cut.lastIndexOf(" ");
  return sp > 85 ? cut.slice(0, sp) : cut;
}
function processTikTok(text) {
  const tags = (text || "").match(/#[^\s#]+/g) || [];
  return tags.slice(0, 5).join(" ");
}
function processInsta(caption) {
  if (!caption) return "";
  const sep = caption.indexOf("\n\n");
  if (sep !== -1) {
    const desc = caption.slice(0, sep);
    const tags2 = (caption.slice(sep + 2).match(/#[^\s#]+/g) || []).slice(0, 5);
    return desc + "\n\n" + tags2.join(" ");
  }
  const tags = (caption.match(/#[^\s#]+/g) || []).slice(0, 5);
  return tags.length ? tags.join(" ") : caption;
}
function SNSTags({ script }) {
  if (!script) return null;
  const { addToast } = useVideoStore();
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("클립보드 복사 완료!", "ok");
    } catch {
      addToast("복사 실패", "err");
    }
  };
  const tags = [
    { badge: "naver", label: "N 클립", limit: "300자 (#협찬 포함)", text: processNaver(script.naver_clip_tags) },
    { badge: "youtube", label: "▶ 쇼츠", limit: "100자 이내", text: processYoutube(script.youtube_shorts_tags) },
    { badge: "insta", label: "◎ 릴스", limit: "캡션 + 5개 태그", text: processInsta(script.instagram_caption) },
    { badge: "tiktok", label: "♪ 틱톡", limit: "5개만", text: processTikTok(script.tiktok_tags) }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-wrap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "sns-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-hashtag" }),
      " SNS 플랫폼별 태그"
    ] }),
    tags.map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `sns-badge ${t.badge}`, children: t.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sns-limit", children: t.limit }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "sns-copy-btn", onClick: () => copy(t.text), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
          " 복사"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sns-text", children: t.text })
    ] }, i))
  ] });
}

function AutoRecovery({ scenes, audioBuffers, addToast }) {
  const { updateAudioBuffer, updateScene } = useVideoStore();
  const [recovering, setRecovering] = reactExports.useState({});
  const failedScenes = (scenes || []).map((sc, i) => ({ sc, i })).filter(({ sc, i }) => sc.narration?.trim() && !audioBuffers?.[i]);
  if (!failedScenes.length) return null;
  const handleResynth = async (sc, i) => {
    if (recovering[i]) return;
    setRecovering((r) => ({ ...r, [i]: true }));
    addToast(`씬 ${i + 1} 음성 재합성 중...`, "inf");
    try {
      const ac = getAudioCtx();
      if (ac?.state === "suspended") await ac.resume();
      const text = preprocessNarration(sc.narration);
      const buf = await fetchTTSWithRetry(text, i, sc.energy_level ?? 3);
      updateAudioBuffer(i, buf);
      const newDur = Math.max(2, Math.round((buf.duration + 0.4) * 10) / 10);
      updateScene(i, { duration: newDur });
      addToast(`씬 ${i + 1} 음성 복구 완료 ✅`, "ok");
    } catch (e) {
      addToast(`씬 ${i + 1} 재합성 실패: ${e.message}`, "err");
    } finally {
      setRecovering((r) => ({ ...r, [i]: false }));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-assets-box", style: { border: "1px solid rgba(255,80,80,0.4)", background: "rgba(255,50,50,0.07)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", style: { color: "#ff6b6b" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-exclamation-triangle" }),
      " ",
      failedScenes.length,
      "개 씬 음성 누락 — 자동 복구"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }, children: failedScenes.map(({ sc, i }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "8px 12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { flex: 1, fontSize: "0.8rem", color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
        "씬 ",
        i + 1,
        ": ",
        sc.caption1 || sc.narration?.substring(0, 20) || "(내용 없음)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => handleResynth(sc, i),
          disabled: !!recovering[i],
          style: {
            padding: "6px 14px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background: recovering[i] ? "#555" : "#e74c3c",
            color: "#fff",
            fontSize: "0.8rem",
            fontWeight: 700,
            whiteSpace: "nowrap"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${recovering[i] ? "fa-spinner fa-spin" : "fa-redo"}` }),
            recovering[i] ? " 합성 중..." : " 음성 복구"
          ]
        }
      )
    ] }, i)) })
  ] });
}
function PlatformOptimizer({ target, setTarget, addToast }) {
  const PLATFORMS = [
    { id: "reels", label: "◎ 릴스", color: "#E1306C", desc: "9:16 세이프존 적용" },
    { id: "shorts", label: "▶ 쇼츠", color: "#FF0000", desc: "YT UI 하단 회피" },
    { id: "tiktok", label: "♪ 틱톡", color: "#6FC2F5", desc: "하단 버튼 영역 확보" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-assets-box", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-layer-group" }),
      " 플랫폼 최적화 (세이프 존)"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginTop: "10px" }, children: PLATFORMS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => {
          setTarget(p.id);
          addToast(`${p.label} 세이프존 모드 적용됨`, "ok");
        },
        style: {
          flex: 1,
          padding: "10px 6px",
          borderRadius: "12px",
          border: `1.5px solid ${target === p.id ? p.color : "#333"}`,
          background: target === p.id ? `${p.color}22` : "#1a1a1a",
          color: target === p.id ? p.color : "#aaa",
          fontSize: "0.8rem",
          fontWeight: target === p.id ? 800 : 500,
          cursor: "pointer",
          transition: "all 0.18s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: p.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.65rem", opacity: 0.7 }, children: p.desc })
        ]
      },
      p.id
    )) })
  ] });
}
function ThumbnailMaker({ scenes, files, script, addToast }) {
  const [loading, setLoading] = reactExports.useState(false);
  const [thumbUrl, setThumbUrl] = reactExports.useState(null);
  const handleCreate = async () => {
    if (loading) return;
    setLoading(true);
    addToast("AI가 가장 식욕 자극 프레임을 찾는 중...", "inf");
    try {
      const blob = await extractThumbnail(scenes, files, script, (msg) => console.log("[Thumb]", msg));
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
      setThumbUrl(URL.createObjectURL(blob));
      addToast("바이럴 썸네일 생성 완료! ✨", "ok");
    } catch (err) {
      addToast("썸네일 생성 실패: " + err.message, "err");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-assets-box", style: { marginTop: "12px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-camera-retro" }),
      " AI 썸네일 팩토리"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "make-btn",
        onClick: handleCreate,
        disabled: loading,
        style: { marginTop: "10px", height: "44px", fontSize: "0.88rem", opacity: loading ? 0.7 : 1 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: loading ? "fas fa-spinner fa-spin" : "fas fa-magic" }),
          loading ? " 베스트 프레임 분석 중..." : " 고대비 바이럴 썸네일 추출"
        ]
      }
    ),
    thumbUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "14px", display: "flex", alignItems: "center", gap: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: thumbUrl, alt: "썸네일", style: { width: "80px", height: "142px", objectFit: "cover", borderRadius: "8px", border: "2px solid #FF2D55" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#aaa", fontSize: "0.75rem", margin: 0 }, children: "저장 후 릴스 표지로 직접 업로드하세요!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: thumbUrl,
            download: "moovlog_thumb.jpg",
            style: {
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#FF2D55",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              textAlign: "center"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-download" }),
              " 이미지 저장"
            ]
          }
        )
      ] })
    ] })
  ] });
}
function HookPicker({ variations, script, setScript, addToast }) {
  const { updateAudioBuffer } = useVideoStore();
  const [loading, setLoading] = reactExports.useState(false);
  if (!variations?.length) return null;
  const LABELS = { shock: "🔥 충격형", info: "ℹ️ 정보형", pov: "👤 1인칭" };
  const handleSelect = async (h) => {
    if (loading) return;
    setLoading(true);
    addToast(`${LABELS[h.type] || h.type} 스타일로 변경 중...`, "inf");
    try {
      const ac = getAudioCtx();
      if (ac?.state === "suspended") await ac.resume();
      const processedText = preprocessNarration(h.narration);
      const newBuffer = await fetchTTSWithRetry(processedText, 0);
      const newScenes = script.scenes ? [...script.scenes] : [];
      if (newScenes.length > 0) {
        newScenes[0] = {
          ...newScenes[0],
          caption1: h.caption1,
          caption2: h.caption2,
          narration: h.narration,
          duration: Math.max(2, Math.round((newBuffer.duration + 0.4) * 10) / 10)
        };
      }
      updateAudioBuffer(0, newBuffer);
      setScript({ ...script, scenes: newScenes });
      addToast(`${LABELS[h.type] || h.type} 훅 & 음성 교체 완료! ✨`, "ok");
    } catch (err) {
      console.error("[HookPicker] 재합성 실패:", err);
      addToast("음성 재합성 실패: 자막만 교체합니다.", "err");
      const newScenes = script.scenes ? [...script.scenes] : [];
      if (newScenes.length > 0) {
        newScenes[0] = { ...newScenes[0], caption1: h.caption1, caption2: h.caption2, narration: h.narration };
      }
      setScript({ ...script, scenes: newScenes });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hook-picker-wrap", style: { opacity: loading ? 0.7 : 1 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${loading ? "fa-spinner fa-spin" : "fa-fish"}` }),
      loading ? " AI가 목소리 만드는 중..." : " AI PD의 3종 훅 전략"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hook-grid", children: variations.map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `hook-card${loading ? " disabled" : ""}`, onClick: () => handleSelect(h), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hook-type", children: LABELS[h.type] || h.type }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "hook-cap", children: h.caption1 })
    ] }, i)) })
  ] });
}
function MarketingAssets({ marketing, addToast }) {
  if (!marketing) return null;
  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} 복사 완료! ✨`, "ok");
    } catch {
      addToast("복사 실패 — 직접 선택해서 복사해주세요", "err");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-assets-box", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-rocket" }),
      " 릴스 떡상 마케팅 키트"
    ] }),
    marketing.hook_title && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "🎣 훅 제목" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: () => copy(marketing.hook_title, "훅 제목"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 복사"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", children: marketing.hook_title })
    ] }),
    marketing.caption && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "✍️ 인스타 캡션" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: () => copy(marketing.caption, "인스타 캡션"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 복사"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", style: { whiteSpace: "pre-line", fontSize: "0.75rem" }, children: marketing.caption })
    ] }),
    marketing.hashtags_30 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "🏷️ 해시태그 30개" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: () => copy(marketing.hashtags_30, "해시태그 30개"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 한번에 복사"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", style: { fontSize: "0.68rem", lineHeight: 1.8, color: "#a855f7" }, children: marketing.hashtags_30 })
    ] }),
    marketing.receipt_review && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "🧢 네이버 영수증 리뷰" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: () => copy(marketing.receipt_review, "영수증 리뷰"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 복사"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", children: marketing.receipt_review })
    ] })
  ] });
}
function ResultScreen() {
  const {
    script,
    audioBuffers,
    files,
    targetPlatform,
    setTargetPlatform,
    reset,
    setShowResult,
    addToast,
    setScript
  } = useVideoStore();
  const totalSec = script?.scenes?.reduce((a, s) => a + (s.duration || 0), 0) || 0;
  const hasAudio = audioBuffers?.some((b) => b);
  const [kitHistory, setKitHistory] = reactExports.useState([]);
  const [kitSearch, setKitSearch] = reactExports.useState("");
  const [showKitHistory, setShowKitHistory] = reactExports.useState(false);
  const [kitLoading, setKitLoading] = reactExports.useState(false);
  const [loadedKit, setLoadedKit] = reactExports.useState(null);
  const [kitDeleting, setKitDeleting] = reactExports.useState(false);
  const kitPanelRef = reactExports.useRef(null);
  const loadKitHistory = async (kw = "") => {
    setKitLoading(true);
    try {
      const results = kw.trim() ? await searchMarketingKits(kw.trim()) : await getMarketingKits(20);
      setKitHistory(results);
    } catch (e) {
      addToast("이력 로드 실패: " + e.message, "err");
    } finally {
      setKitLoading(false);
    }
  };
  const loadKitFromHistory = (item) => {
    setScript({
      ...script,
      marketing: {
        hook_title: item.hookTitle || "",
        caption: item.caption || "",
        hashtags_30: item.hashtags30 || "",
        receipt_review: item.receiptReview || ""
      },
      hook_variations: item.hookVariations || [],
      naver_clip_tags: item.naverClipTags || "",
      youtube_shorts_tags: item.youtubeShortsTags || "",
      instagram_caption: item.instagramCaption || "",
      tiktok_tags: item.tiktokTags || "",
      hashtags: item.hashtags || ""
    });
    setShowKitHistory(false);
    setLoadedKit(item);
    addToast(`"${item.restaurant}" 마케팅 키트 로드 완료 ✓`, "ok");
    setTimeout(() => kitPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };
  const deleteKit = async (id, restaurantName, e) => {
    e?.stopPropagation();
    if (!id || kitDeleting) return;
    if (!confirm(`"${restaurantName}" 키트를 삭제할까요?`)) return;
    setKitDeleting(true);
    try {
      await deleteMarketingKit(id);
      setKitHistory((h) => h.filter((x) => x.id !== id));
      if (loadedKit?.id === id) setLoadedKit(null);
      addToast("마케팅 키트 삭제 완료", "ok");
    } catch (err) {
      addToast("삭제 실패: " + err.message, "err");
    } finally {
      setKitDeleting(false);
    }
  };
  const goBack = () => {
    setShowResult(false);
  };
  const doReset = () => {
    reset();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "result-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "result-inner", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "result-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "result-back-btn", onClick: goBack, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-arrow-left" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "result-title-box", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "result-label", children: "생성 완료" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "result-sub", children: [
          script?.scenes?.length || 0,
          "개 씬 · ",
          totalSec.toFixed(1),
          "초"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "badge-group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `audio-badge ${hasAudio ? "" : "muted"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${hasAudio ? "fa-microphone-alt" : "fa-volume-mute"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: hasAudio ? "AI 보이스" : "무음" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(VideoPlayer, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AutoRecovery, { scenes: script?.scenes, audioBuffers, addToast }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PlatformOptimizer, { target: targetPlatform, setTarget: setTargetPlatform, addToast }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbnailMaker, { scenes: script?.scenes || [], files, script, addToast }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SceneList, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ExportPanel, {}),
    (script?.marketing || script?.hook_title || script?.caption) && /* @__PURE__ */ jsxRuntimeExports.jsx(
      MarketingAssets,
      {
        marketing: script.marketing || {
          hook_title: script.hook_title || "",
          caption: script.caption || "",
          hashtags_30: script.hashtags_30 || "",
          receipt_review: script.receipt_review || ""
        },
        addToast
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: kitPanelRef, className: "marketing-assets-box", style: { marginTop: 8, ...loadedKit ? { border: "1.5px solid #7c3aed66", background: "rgba(124,58,237,0.07)" } : {} }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-title", style: { margin: 0 }, children: loadedKit ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-check-circle", style: { color: "#7c3aed" } }),
          " ",
          loadedKit.restaurant
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-history" }),
          " 이전 마케팅 키트"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 6, alignItems: "center" }, children: [
          loadedKit && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  setLoadedKit(null);
                  setShowKitHistory(true);
                },
                style: { background: "none", color: "#aaa", border: "1px solid #444", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: "0.73rem" },
                children: "← 목록"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: (e) => deleteKit(loadedKit.id, loadedKit.restaurant, e),
                disabled: kitDeleting,
                style: { background: "none", color: "#ff6b6b", border: "1px solid #ff6b6b55", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: "0.73rem" },
                children: kitDeleting ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : "🗑️ 삭제"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setLoadedKit(null), style: { background: "none", color: "#666", border: "none", cursor: "pointer", fontSize: "0.8rem" }, children: "✕" })
          ] }),
          !loadedKit && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setShowKitHistory((p) => !p);
                if (!showKitHistory && !kitHistory.length) loadKitHistory();
              },
              style: { background: "none", color: "#aaa", border: "none", cursor: "pointer", fontSize: "0.8rem" },
              children: showKitHistory ? "닫기" : "불러오기"
            }
          )
        ] })
      ] }),
      !loadedKit && showKitHistory && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, margin: "10px 0" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "name-input",
              style: { flex: 1, fontSize: "0.85rem", padding: "8px 12px" },
              placeholder: "음식점 이름으로 검색...",
              value: kitSearch,
              onChange: (e) => setKitSearch(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && loadKitHistory(kitSearch)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "re-btn", style: { minWidth: 44 }, onClick: () => loadKitHistory(kitSearch), disabled: kitLoading, children: kitLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-search" }) })
        ] }),
        kitHistory.length === 0 && !kitLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "12px 0", fontSize: "0.8rem" }, children: "저장된 이력이 없습니다" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }, children: kitHistory.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              padding: "10px 12px",
              cursor: "pointer",
              position: "relative",
              transition: "border-color 0.15s"
            },
            onMouseEnter: (e) => e.currentTarget.style.borderColor = "#7c3aed55",
            onMouseLeave: (e) => e.currentTarget.style.borderColor = "#2a2a2a",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: (e) => deleteKit(item.id, item.restaurant, e),
                  disabled: kitDeleting,
                  style: {
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "rgba(255,107,107,0.12)",
                    color: "#ff6b6b",
                    border: "none",
                    borderRadius: 6,
                    padding: "2px 6px",
                    cursor: "pointer",
                    fontSize: "0.65rem",
                    lineHeight: "1.4"
                  },
                  title: "삭제",
                  children: "🗑️"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => loadKitFromHistory(item), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontWeight: 800, fontSize: "0.85rem", margin: "0 20px 4px 0", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: item.restaurant || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: "0.65rem", color: "#666", margin: "0 0 6px" }, children: item.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "" }),
                item.hookTitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: "0.7rem", color: "#888", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
                  "🎣 ",
                  item.hookTitle
                ] })
              ] })
            ]
          },
          item.id
        )) })
      ] }),
      loadedKit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 12 }, children: [
        [
          { label: "🎣 훅 제목", val: loadedKit.hookTitle },
          { label: "✍️ 인스타 캡션", val: loadedKit.caption },
          { label: "🏷️ 해시태그 30개", val: loadedKit.hashtags30 },
          { label: "🧾 네이버 영수증 리뷰", val: loadedKit.receiptReview },
          { label: "📎 네이버 클립 태그", val: loadedKit.naverClipTags },
          { label: "◎ 릴스 캡션", val: loadedKit.instagramCaption },
          { label: "▶ 유튜브 쇼츠 태그", val: loadedKit.youtubeShortsTags },
          { label: "♪ 틱톡 태그", val: loadedKit.tiktokTags }
        ].map(({ label, val }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", style: { marginBottom: 12 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", style: { margin: 0 }, children: label }),
            val && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: async () => {
              try {
                await navigator.clipboard.writeText(val);
                addToast(`${label} 복사 완료!`, "ok");
              } catch {
                addToast("복사 실패", "err");
              }
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
              " 복사"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", style: {
            whiteSpace: "pre-line",
            fontSize: "0.78rem",
            margin: 0,
            color: val ? label.includes("태그") || label.includes("해시태그") ? "#a855f7" : "#ddd" : "#666",
            background: "rgba(0,0,0,0.3)",
            borderRadius: 8,
            padding: "8px 12px",
            fontStyle: val ? "normal" : "italic"
          }, children: val || "(저장된 데이터 없음)" })
        ] }, label)),
        loadedKit.hookVariations?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", style: { marginBottom: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "🎣 3종 훅 베리에이션" }),
          loadedKit.hookVariations.map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 12px", marginTop: 6, fontSize: "0.75rem" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#a855f7", fontWeight: 700 }, children: h.type }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#fff", marginLeft: 8 }, children: h.caption1 }),
            h.caption2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#aaa", marginLeft: 6 }, children: [
              "/ ",
              h.caption2
            ] }),
            h.narration && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#888", marginTop: 4, margin: "4px 0 0", fontStyle: "italic" }, children: h.narration })
          ] }, i))
        ] })
      ] })
    ] }),
    script?.hook_variations?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(HookPicker, { variations: script.hook_variations, script, setScript, addToast }),
    script && /* @__PURE__ */ jsxRuntimeExports.jsx(SNSTags, { script }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "re-btn", onClick: doReset, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-redo" }),
      " 다시 만들기"
    ] })
  ] }) });
}

const TABS = [
  { id: "blog", label: "📝 블로그 포스팅" },
  { id: "sns", label: "📱 SNS 태그" },
  { id: "guide", label: "🟢 네이버 등록" },
  { id: "search", label: "🔍 검색 기록" }
];
function BlogPage() {
  const { addToast } = useVideoStore();
  const [files, setFiles] = reactExports.useState([]);
  const [name, setName] = reactExports.useState("");
  const [location, setLocation] = reactExports.useState("");
  const [keywords, setKeywords] = reactExports.useState("");
  const [extra, setExtra] = reactExports.useState("");
  const [result, setResult] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [loadLabel, setLoadLabel] = reactExports.useState("");
  const [activeTab, setActiveTab] = reactExports.useState("blog");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [recentPosts, setRecentPosts] = reactExports.useState([]);
  const [postsLoading, setPostsLoading] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef();
  const dropRef = reactExports.useRef();
  const addFiles = reactExports.useCallback(async (list) => {
    const { preprocessMediaFiles } = await __vitePreload(async () => { const { preprocessMediaFiles } = await import('./mediaPreprocess-HVM__Ilm.js');return { preprocessMediaFiles }},true?[]:void 0);
    const remaining = 20 - files.length;
    if (!remaining) return;
    const arr = [...list].slice(0, remaining);
    const big = arr.some((f) => f.size > 50 * 1024 * 1024);
    if (big) addToast("용량이 큰 영상을 최적화 중...", "inf");
    const results = await preprocessMediaFiles(arr, (msg) => addToast(msg, "inf"));
    const items = results.map(({ file: pf, mediaType }) => ({
      file: pf,
      url: URL.createObjectURL(pf),
      type: mediaType
    }));
    setFiles((prev) => [...prev, ...items]);
  }, [files.length, addToast]);
  const removeFile = reactExports.useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);
  const onDragOver = reactExports.useCallback((e) => {
    e.preventDefault();
    dropRef.current?.classList.add("over");
  }, []);
  const onDragLeave = reactExports.useCallback(() => dropRef.current?.classList.remove("over"), []);
  const onDrop = reactExports.useCallback((e) => {
    e.preventDefault();
    dropRef.current?.classList.remove("over");
    addFiles([...e.dataTransfer.files]);
  }, [addFiles]);
  const onFileChange = reactExports.useCallback((e) => {
    addFiles([...e.target.files]);
    e.target.value = "";
  }, [addFiles]);
  const handleGenerate = async () => {
    if (!name.trim()) {
      addToast("음식점 이름을 입력해주세요", "err");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setLoadLabel("이미지를 분석 중...");
      const r = await generateBlogPost({
        name: name.trim(),
        location: location.trim(),
        keywords: keywords.trim(),
        extra: extra.trim(),
        imageFiles: files.map((f) => f.file)
      });
      setResult(r);
      setActiveTab("blog");
      addToast("블로그 포스팅 생성 완료 ✓", "ok");
      saveBlogPost({
        restaurant: name.trim(),
        location: location.trim(),
        keywords: keywords.trim() ? keywords.trim().split(/[,\s]+/).filter(Boolean) : [],
        title: r.title || "",
        body: r.body || "",
        naver_clip_tags: r.naver_clip_tags || "",
        youtube_shorts_tags: r.youtube_shorts_tags || "",
        instagram_caption: r.instagram_caption || "",
        tiktok_tags: r.tiktok_tags || ""
      }).catch((e) => console.warn("[Blog] Firebase 저장 실패:", e.message));
      saveSNSTags({
        restaurant: name.trim(),
        naver_clip_tags: r.naver_clip_tags || "",
        youtube_shorts_tags: r.youtube_shorts_tags || "",
        instagram_caption: r.instagram_caption || "",
        tiktok_tags: r.tiktok_tags || "",
        hashtags: r.hashtags || ""
      }).catch((e) => console.warn("[SNS] Firebase 저장 실패:", e.message));
    } catch (err) {
      console.error(err);
      addToast("오류: " + (err.message || "알 수 없는 오류"), "err");
    } finally {
      setLoading(false);
      setLoadLabel("");
    }
  };
  const copyText = async (text, label = "") => {
    try {
      await navigator.clipboard.writeText(text);
      addToast((label || "텍스트") + " 복사 완료 ✓", "ok");
    } catch {
      addToast("복사 실패 — 직접 선택 후 Ctrl+C 하세요", "inf");
    }
  };
  const fullCopy = () => {
    if (!result) return;
    const text = (result.title ? result.title + "\n\n" : "") + (result.body || "");
    copyText(text, "제목 + 본문");
  };
  const loadPosts = reactExports.useCallback(async (kw = "") => {
    setPostsLoading(true);
    try {
      const results = kw.trim() ? await searchBlogPosts(kw.trim()) : await getRecentBlogPosts(30);
      setRecentPosts(results);
    } catch (e) {
      addToast("포스팅 목록 로드 실패: " + e.message, "err");
    } finally {
      setPostsLoading(false);
    }
  }, [addToast]);
  reactExports.useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  const handleTabChange = async (id) => {
    setActiveTab(id);
    if (id === "search") loadPosts(searchQuery);
  };
  const loadFromHistory = (item) => {
    setResult({
      title: item.title || "",
      body: item.body || "",
      naver_clip_tags: item.naverClipTags || "",
      youtube_shorts_tags: item.youtubeTags || "",
      instagram_caption: item.instagramCaption || "",
      tiktok_tags: item.tiktokTags || ""
    });
    setName(item.restaurant || "");
    setLocation(item.location || "");
    setActiveTab("blog");
  };
  const reset = () => {
    setResult(null);
    setActiveTab("blog");
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "blog-loading-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "loading-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ai-loader", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ai-ring" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ai-ico", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-pen-nib" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "load-title", children: loadLabel }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "load-sub", children: "Gemini 2.5 가 글을 쓰고 있습니다..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "load-pipeline", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lp-item active", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lp-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-eye" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-name", children: "시각 자료 분석" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-status", children: "이미지 읽는 중..." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lp-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lp-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-feather-alt" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-name", children: "블로그 본문 작성" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-status", children: "대기 중" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lp-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lp-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-hashtag" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-name", children: "SNS 태그 생성" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-status", children: "대기 중" })
          ] })
        ] })
      ] })
    ] }) });
  }
  if (result) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "app-main blog-result-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "re-btn", style: { marginBottom: 16 }, onClick: reset, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-arrow-left" }),
        " 다시 작성"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "blog-tabs", children: TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `btab ${activeTab === t.id ? "active" : ""}`,
          onClick: () => handleTabChange(t.id),
          children: t.label
        },
        t.id
      )) }),
      activeTab === "blog" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-pane-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-section-title", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "제목" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "blog-copy-btn", onClick: () => copyText(result.title || "", "제목"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
              " 복사"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "blog-text", children: result.title })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-section-title", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "본문 (네이버 스마트에디터에 붙여넣기)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "blog-copy-btn", onClick: () => copyText(result.body || "", "본문"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
              " 복사"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "blog-info-hint", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-info-circle" }),
            " [사진 N] · [영상 N] 위치에 해당 파일을 에디터에 직접 삽입하세요"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "blog-text blog-body-text", children: result.body })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "make-btn", onClick: fullCopy, style: { marginTop: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "make-glow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
          " 제목 + 본문 전체 복사"
        ] })
      ] }),
      activeTab === "sns" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-pane-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { badge: "naver", badgeLabel: "N 클립", hint: "300자", text: result.naver_clip_tags, onCopy: () => copyText(result.naver_clip_tags || "", "네이버 태그") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { badge: "youtube", badgeLabel: "▶ 유튜브 쇼츠", hint: "100자", text: result.youtube_shorts_tags, onCopy: () => copyText(result.youtube_shorts_tags || "", "유튜브 태그") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { badge: "insta", badgeLabel: "◎ 인스타 릴스", hint: "캡션+태그", text: result.instagram_caption, onCopy: () => copyText(result.instagram_caption || "", "인스타 캡션") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { badge: "tiktok", badgeLabel: "♪ 틱톡 태그", hint: "5개", text: result.tiktok_tags, onCopy: () => copyText(result.tiktok_tags || "", "틱톡 태그") })
      ] }),
      activeTab === "guide" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-pane-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "naver-guide-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "naver-guide-title", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-info-circle" }),
            " 네이버 블로그 붙여넣기 방법"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "naver-guide-list", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "아래 버튼으로 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "네이버 블로그 에디터" }),
              "를 엽니다"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "새 글 쓰기" }),
              " → 제목 입력란에 제목 붙여넣기"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "본문 영역 클릭 → ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Ctrl+V (붙여넣기)" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "사진은 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "에디터 사진 아이콘" }),
              "으로 직접 업로드"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "오른쪽 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "태그 입력란" }),
              "에 네이버 클립 태그 붙여넣기"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "발행" }),
              " 버튼 클릭"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: "https://blog.naver.com/PostWriteForm.naver",
              target: "_blank",
              rel: "noreferrer",
              className: "naver-open-btn",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-external-link-alt" }),
                " 네이버 블로그 에디터 열기"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dl-box", style: { marginTop: 14 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "dl-title", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-lightbulb" }),
            " 더 쉽게 하는 방법"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "dl-desc", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "① 전체 복사" }),
            " 후 네이버 블로그 에디터에 ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Ctrl+V" }),
            "로 붙여넣기",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "② 사진" }),
            "은 에디터에서 직접 드래그 앤 드롭으로 추가",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "③ 네이버 태그" }),
            "는 복사 후 태그 입력란에 붙여넣기"
          ] })
        ] })
      ] }),
      activeTab === "search" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-pane-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 14 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "name-input",
              style: { flex: 1 },
              type: "text",
              placeholder: "음식점 이름으로 검색 (비우면 최근 30개)",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              onKeyDown: (e) => {
                setSearchQuery(e.target.value);
                if (e.key === "Enter") loadPosts(e.target.value);
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "re-btn", onClick: () => loadPosts(searchQuery), disabled: postsLoading, children: postsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-search" }) })
        ] }),
        recentPosts.length === 0 && !postsLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "24px 0" }, children: "저장된 포스팅이 없습니다" }),
        recentPosts.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "sns-card",
            style: { marginBottom: 8, cursor: "pointer" },
            onClick: () => loadFromHistory(item),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card-head", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 600, fontSize: 13 }, children: item.restaurant || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sns-limit", children: item.location || "" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 11, color: "var(--text-sub)", marginLeft: "auto" }, children: item.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sns-text", style: { fontSize: 12, marginTop: 4, color: "var(--text-sub)" }, children: item.title || "제목 없음" })
            ]
          },
          item.id
        ))
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "app-main", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", style: { marginBottom: 14 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-label", style: { marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "num", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-history" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "이전 포스팅 불러오기" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "음식점 이름 클릭 → 바로 불러오기" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "name-input",
            style: { flex: 1 },
            type: "text",
            placeholder: "음식점 이름으로 검색...",
            value: searchQuery,
            onChange: (e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) loadPosts("");
            },
            onKeyDown: (e) => e.key === "Enter" && loadPosts(searchQuery)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "re-btn", onClick: () => loadPosts(searchQuery), disabled: postsLoading, children: postsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-search" }) })
      ] }),
      postsLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "8px 0", fontSize: 12 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }),
        " 불러오는 중..."
      ] }),
      !postsLoading && recentPosts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "8px 0", fontSize: 12 }, children: "저장된 포스팅이 없습니다 (Firebase 미연동 시 비어 있음)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }, children: recentPosts.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => loadFromHistory(item),
          style: {
            background: "#1c1c1e",
            border: "1px solid #333",
            borderRadius: 10,
            padding: "9px 14px",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 700, fontSize: 13, color: "#eee" }, children: item.restaurant || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: 11, color: "var(--text-sub)", flexShrink: 0, marginLeft: 8 }, children: [
              item.location ? `${item.location} · ` : "",
              item.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || ""
            ] })
          ]
        },
        item.id
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-label", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "num", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "이미지 · 영상 업로드" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "음식점 사진과 영상을 올려주세요 (최대 20개)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: dropRef,
          className: "drop-area",
          onDragOver,
          onDragLeave,
          onDrop,
          onClick: () => fileInputRef.current?.click(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drop-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-cloud-upload-alt" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drop-text", children: "여기에 끌어다 놓거나" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "pick-btn", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-folder-open" }),
              " 파일 선택"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: "image/*,video/*", multiple: true, hidden: true, onChange: onFileChange }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drop-hint", children: "JPG · PNG · MP4 · MOV" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drive-row", style: { marginTop: 10, marginBottom: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DrivePicker, { addFiles }) }),
      files.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "thumb-grid", style: { marginTop: 14 }, children: files.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ti", children: [
        m.type === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: m.url, alt: "" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: m.url, muted: true, playsInline: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ti-badge", children: i + 1 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "ti-remove", onClick: (e) => {
          e.stopPropagation();
          removeFile(i);
        }, children: "✕" })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-label", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "num", children: "02" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "음식점 정보" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "이름·지역 입력 → AI가 블로그 포스팅 전체를 작성합니다" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-form-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-store name-icon" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "name-input", type: "text", placeholder: "음식점 이름 (예: 을지로 돈부리집)", maxLength: 40, value: name, onChange: (e) => setName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-form-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-map-marker-alt name-icon" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "name-input", type: "text", placeholder: "위치 (예: 서울 중구 을지로)", maxLength: 60, value: location, onChange: (e) => setLocation(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-form-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-key name-icon", style: { color: "var(--accent2)" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "name-input", type: "text", placeholder: "키워드 (예: 인천 맛집, 산곡동 고기집)", maxLength: 120, value: keywords, onChange: (e) => setKeywords(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-form-row", style: { alignItems: "flex-start", paddingTop: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-comment-alt name-icon", style: { marginTop: 4 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: "name-input blog-textarea",
            placeholder: "추가 지시사항 (선택) — 예: 3인 방문, 웨이팅 30분, 직화 구이 강조",
            maxLength: 400,
            rows: 3,
            value: extra,
            onChange: (e) => setExtra(e.target.value)
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "make-btn",
        onClick: handleGenerate,
        disabled: !name.trim(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "make-glow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-pen-nib" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "AI 블로그 포스팅 생성" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "make-hint", children: "이미지 분석 → 리뷰 본문 · SNS 태그 · 네이버 클립 태그 자동 생성" })
  ] });
}
function TagSection({ badge, badgeLabel, hint, text, onCopy }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card", style: { marginBottom: 10 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `sns-badge ${badge}`, children: badgeLabel }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sns-limit", children: hint }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "sns-copy-btn", onClick: onCopy, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 복사"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sns-text", children: text || "—" })
  ] });
}

function ToastContainer() {
  const { toasts, removeToast } = useVideoStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "toasts", children: toasts.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(Toast, { toast: t, onRemove: () => removeToast(t.id) }, t.id)) });
}
function Toast({ toast, onRemove }) {
  reactExports.useEffect(() => {
    const timer = setTimeout(onRemove, 3500);
    return () => clearTimeout(timer);
  }, []);
  const icons = { ok: "fa-check-circle", err: "fa-exclamation-circle", inf: "fa-info-circle" };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `toast ${toast.type}`, onClick: onRemove, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${icons[toast.type] || icons.inf}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: toast.msg })
  ] });
}

const __vite_import_meta_env__ = {"BASE_URL": "/moovlog/shorts-creator/", "DEV": false, "MODE": "production", "PROD": true, "SSR": false, "VITE_FIREBASE_API_KEY": "", "VITE_FIREBASE_APP_ID": "", "VITE_GEMINI_KEY": "", "VITE_TYPECAST_KEY": "", "VITE_TYPECAST_KEY_2": "", "VITE_TYPECAST_KEY_3": "", "VITE_TYPECAST_KEY_4": "", "VITE_TYPECAST_KEY_5": "", "VITE_TYPECAST_KEY_6": "", "VITE_TYPECAST_KEY_7": ""};
const APP_TABS = [
  { id: "shorts", label: "🎬 숏폼 만들기" },
  { id: "blog", label: "📝 블로그 포스팅" }
];
function App() {
  const { pipeline, showResult } = useVideoStore();
  const [activeTab, setActiveTab] = reactExports.useState("shorts");
  reactExports.useEffect(() => {
    const gKey = localStorage.getItem("moovlog_gemini_key") || "";
    setGeminiKey(gKey);
    const tcKeys = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((n) => {
      const envKey = __vite_import_meta_env__[`VITE_TYPECAST_KEY${n > 1 ? "_" + n : ""}`] || "";
      const lsKey = localStorage.getItem(`moovlog_typecast_key${n > 1 ? n : ""}`) || "";
      const raw = envKey || lsKey;
      return raw ? raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) : [];
    }).slice(0, 8);
    setTypeCastKeys(tcKeys);
    console.log(`[App] TypeCast 키 로드: ${tcKeys.length}개`);
    initFirebase();
    document.title = "무브먼트 Shorts Creator v2";
    if (!window.crossOriginIsolated && navigator.serviceWorker?.controller) {
      const store = useVideoStore.getState();
      if (!store.files.length && !store.script) {
        const attempts = parseInt(sessionStorage.getItem("_coi_attempts") || "0", 10);
        if (attempts < 3) {
          sessionStorage.setItem("_coi_attempts", String(attempts + 1));
          console.log("[App] SW 활성 but !crossOriginIsolated → 재로드 (COI 헤더 확보)");
          location.reload();
        }
      }
    }
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-root", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, { activeTab, onTabChange: setActiveTab, tabs: APP_TABS }),
    activeTab === "shorts" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      !showResult && /* @__PURE__ */ jsxRuntimeExports.jsx(UploadSection, {}),
      pipeline.visible && /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingOverlay, {}),
      showResult && /* @__PURE__ */ jsxRuntimeExports.jsx(ResultScreen, {})
    ] }),
    activeTab === "blog" && /* @__PURE__ */ jsxRuntimeExports.jsx(BlogPage, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ToastContainer, {})
  ] });
}

client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
if (navigator.serviceWorker) {
  window.addEventListener("load", () => {
    const swBase = "/moovlog/shorts-creator/";
    navigator.serviceWorker.register(`${swBase}sw.js`, { scope: swBase }).then((reg) => {
      if (window.crossOriginIsolated) {
        sessionStorage.removeItem("_coi_attempts");
        return;
      }
      const doReload = () => {
        if (window.crossOriginIsolated) return;
        const attempts = parseInt(sessionStorage.getItem("_coi_attempts") || "0", 10);
        if (attempts < 3) {
          sessionStorage.setItem("_coi_attempts", String(attempts + 1));
          location.reload();
        }
      };
      if (reg.active) {
        doReload();
      } else {
        const sw = reg.installing || reg.waiting;
        if (sw) sw.addEventListener("statechange", (e) => {
          if (e.target.state === "activated") doReload();
        });
        navigator.serviceWorker.addEventListener("controllerchange", doReload);
      }
    }).catch(() => {
    });
  });
}
