import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── 타입 상수 (JS이므로 JSDoc 주석으로 타입 힌트) ───────────
export const TEMPLATE_NAMES = {
  cinematic: '🎬 시네마틱', viral: '🔥 바이럴', aesthetic: '✨ 감성',
  mukbang: '🍜 먹방', vlog: '📹 브이로그', review: '⭐ 리뷰',
  story: '📖 스토리', info: '📊 정보',
  viral_fast: '⚡ 빠른 비트', vlog_aesthetic: '☕ 감성 브이로그',
  auto: '🤖 AI 자동',
};

export const TEMPLATE_HINTS = {
  cinematic:  '시네마틱 스타일: 슬로우 컷, 무디 색감, 영화 같은 구성',
  viral:      '바이럴 스타일: 빠른 컷 전환, FOMO 극대화, 틱톡 트렌딩',
  aesthetic:  '감성 스타일: 따뜻한 톤, 소프트 무드, 인스타 감성',
  mukbang:    '먹방 스타일: 음식 클로즈업 극대화, ASMR 느낌 나레이션',
  vlog:       '브이로그 스타일: 일상 기록, 친근한 1인칭 시점',
  review:     '리뷰 스타일: 솔직 평가, 장단점 분석, 가성비 중심',
  story:      '스토리 스타일: 감성 여정, 도입→전개→클라이맥스→여운',
  info:       '정보 스타일: 핵심 정보 간결 전달, 카드뉴스 느낌',
};

export const HOOK_HINTS = {
  question:  '궁금증 훅: "이거 진짜야?", "이 집 알아?" — 호기심 자극',
  shock:     '충격 훅: "이 가격에 이게 나온다고?" — 놀라움으로 시작',
  challenge: '챌린지 훅: "이거 안 먹어봤으면 진짜 손해" — 도전/FOMO',
  secret:    '비밀 훅: "아무도 모르는 찐 맛집" — 독점 정보 느낌',
  ranking:   '랭킹 훅: "서울 3대 ○○ 중 하나" — 권위/검증',
  pov:       'POV 훅: "나 지금 여기 왔는데..." — 1인칭 몰입감',
};

export const VIRAL_TRENDS = {
  viral_fast: {
    name: '⚡ 0.5초 빠른 비트 (틱톡/릴스)',
    durations: [1.5, 0.5, 0.5, 0.5, 0.5, 2.0],
    transition: 'wipe', subtitle_style: 'bold_drop',
    effect: ['zoom-out', 'pan-left', 'pan-right', 'zoom-in', 'zoom-in-slow', 'drift'],
  },
  vlog_aesthetic: {
    name: '☕ 감성 브이로그 (룸투어/카페)',
    durations: [3.0, 1.2, 1.2, 1.2, 2.5],
    transition: 'fade', subtitle_style: 'minimal',
    effect: ['zoom-in-slow', 'drift', 'drift', 'drift', 'float-up'],
  },
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
    step: 0,          // 0=idle, 1~4=진행
    title: '',
    sub: '',
    autoStyleName: '',
    done: [false, false, false, false],
  },

  // 결과 화면
  showResult: false,
  restaurantName: '',

  // 토스트
  toasts: [],         // [{ id, msg, type }]

  // Firebase 세션
  sessionDocId: null,
};

// ─── Store ────────────────────────────────────────────────────
export const useVideoStore = create(
  devtools(
    (set, get) => ({
      ...INITIAL,

      // ── 파일 관리 ──────────────────────────────────────────
      addFiles: (newFiles) => set(s => {
        const valid = [...newFiles]
          .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
          .slice(0, 10 - s.files.length);
        const items = valid.map(f => ({
          file: f,
          url: URL.createObjectURL(f),
          type: f.type.startsWith('video/') ? 'video' : 'image',
        }));
        return { files: [...s.files, ...items] };
      }, false, 'addFiles'),

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

      // ── Firebase ───────────────────────────────────────────
      setSessionDocId: (sessionDocId) => set({ sessionDocId }, false, 'setSessionDocId'),

      // ── 전체 리셋 ──────────────────────────────────────────
      reset: () => set({
        ...INITIAL,
        toasts: [],
      }, false, 'reset'),
    }),
    { name: 'VideoStore' }
  )
);
