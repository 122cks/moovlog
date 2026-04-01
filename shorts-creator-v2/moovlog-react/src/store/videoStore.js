import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── 타입 상수 (JS이므로 JSDoc 주석으로 타입 힌트) ───────────
export const TEMPLATE_NAMES = {
  cinematic: '🎬 시네마틱', viral: '🔥 바이럴', aesthetic: '✨ 감성',
  mukbang: '🍜 먹방', vlog: '📹 브이로그', review: '⭐ 리뷰',
  story: '📖 스토리', info: '📊 정보',
  viral_fast: '⚡ 빠른 비트', vlog_aesthetic: '☕ 감성 브이로그',
  pov: '👁 POV 몰입', reveal: '🎯 반전 공개', foreshadow: '💫 복선 회수',
  asmr: '🎧 ASMR 슬로우', cinematic_story: '🎥 시네마틱 스토리',
  hype: '🔥 하이프 리액션', food_essay: '✏️ 감성 에세이',
  auto: '🤖 AI 자동',
};

export const TEMPLATE_HINTS = {
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

export const HOOK_HINTS = {
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

export const VIRAL_TRENDS = {
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
export const RESTAURANT_TYPES = {
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
export const RESTAURANT_STYLE_PRESETS = {
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

  // 플랫폼 최적화
  targetPlatform: 'reels', // 'reels' | 'shorts' | 'tiktok'

  // Firebase 세션
  sessionDocId: null,
  pipelineSessionId: null,  // startMake 시작 시 생성 — originals·video 동일 경로
};

// ─── Store ────────────────────────────────────────────────────
export const useVideoStore = create(
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
        const { preprocessMediaFiles } = await import('../engine/mediaPreprocess.js');
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
