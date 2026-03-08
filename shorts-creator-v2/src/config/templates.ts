/* ============================================================
   config/templates.ts — 템플릿 설정 중앙 집중 관리
   기존 script.js의 videoTemplates, TEMPLATE_STYLES,
   TEMPLATE_HINTS, HOOK_HINTS 등을 타입 안전하게 통합.
   ============================================================ */
import type { TemplateKey, HookKey } from '@/types/state';
import type { TemplateConfig } from '@/types/template';

const SCALE = 1.5; // Canvas 1080 / 720

export const TEMPLATES: Record<Exclude<TemplateKey, 'auto'>, TemplateConfig> = {
  cinematic: {
    name: '시네마틱', emoji: '🎬',
    style: {
      overlay:    { top: 'rgba(0,0,0,0.15)',       bottom: 'rgba(0,0,0,0.55)' },
      subtitle:   { color: '#E8E0D0', hlColor: '#C8A96E', fontSize: 1.0 },
      transition: 'fade', letterbox: true,
      badge:      { bg: 'rgba(0,0,0,0.6)',          dot: '#C8A96E' },
      colorGrade: { r: 0.96, g: 0.93, b: 1.05 },
    },
    caption: {
      font:          `900 ${Math.round(64 * SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,
      color:         '#E8E0D0',
      stroke:        '#C8A96E',
      strokeWidth:   10,
      shadow:        'rgba(0,0,0,0.7)',
      highlightColor:'#C8A96E',
    },
    defaultEffect:  'zoom-in-slow',
    durationRange:  { min: 2.5, max: 6.0 },
  },

  viral: {
    name: '바이럴', emoji: '🔥',
    style: {
      overlay:    { top: 'rgba(0,0,0,0.05)',        bottom: 'rgba(0,0,0,0.45)' },
      subtitle:   { color: '#FFFFFF', hlColor: '#FF2D55', fontSize: 1.08 },
      transition: 'wipe', letterbox: false,
      badge:      { bg: 'rgba(255,45,85,0.75)',     dot: '#FFFFFF' },
      colorGrade: { r: 1.05, g: 0.98, b: 0.96 },
    },
    caption: {
      font:          `900 ${Math.round(78 * SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,
      color:         '#D2FF00',
      stroke:        '#000000',
      strokeWidth:   16,
      shadow:        'rgba(0,0,0,0.95)',
      shadowOffsetY: 10,
      highlightColor:'#FF2D55',
    },
    defaultEffect:  'zoom-in',
    durationRange:  { min: 1.5, max: 4.0 },
  },

  aesthetic: {
    name: '감성', emoji: '✨',
    style: {
      overlay:    { top: 'rgba(255,220,180,0.08)',  bottom: 'rgba(0,0,0,0.40)' },
      subtitle:   { color: '#FFF5E4', hlColor: '#FFB347', fontSize: 1.0 },
      transition: 'fade', letterbox: false,
      badge:      { bg: 'rgba(0,0,0,0.45)',         dot: '#ff6b9d' },
      colorGrade: { r: 1.04, g: 1.01, b: 0.93 },
    },
    caption: {
      font:          `800 ${Math.round(68 * SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,
      color:         '#FFF5E4',
      stroke:        'transparent',
      strokeWidth:   0,
      shadow:        'rgba(0,0,0,0.5)',
      highlightColor:'#FFB347',
      bgColor:       'rgba(0,0,0,0.42)',
    },
    defaultEffect:  'drift',
    durationRange:  { min: 2.5, max: 5.5 },
  },

  mukbang: {
    name: '먹방', emoji: '🍜',
    style: {
      overlay:    { top: 'rgba(0,0,0,0.10)',        bottom: 'rgba(0,0,0,0.50)' },
      subtitle:   { color: '#FFFFFF', hlColor: '#FFE033', fontSize: 1.05 },
      transition: 'zoom', letterbox: false,
      badge:      { bg: 'rgba(0,0,0,0.5)',          dot: '#FF6B35' },
      colorGrade: { r: 1.06, g: 1.02, b: 0.90 },
    },
    caption: {
      font:          `900 ${Math.round(74 * SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,
      color:         '#FFFFFF',
      stroke:        '#000000',
      strokeWidth:   13,
      shadow:        'rgba(255,107,53,0.6)',
      highlightColor:'#FFE033',
    },
    defaultEffect:  'zoom-in',
    durationRange:  { min: 2.0, max: 5.0 },
  },

  vlog: {
    name: '브이로그', emoji: '📹',
    style: {
      overlay:    { top: 'rgba(0,0,0,0.08)',        bottom: 'rgba(0,0,0,0.38)' },
      subtitle:   { color: '#FFFFFF', hlColor: '#7FDBFF', fontSize: 0.96 },
      transition: 'fade', letterbox: false,
      badge:      { bg: 'rgba(0,0,0,0.45)',         dot: '#7FDBFF' },
      colorGrade: { r: 1.0,  g: 1.03, b: 1.0 },
    },
    caption: {
      font:          `700 ${Math.round(62 * SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,
      color:         '#FFFFFF',
      stroke:        '#000000',
      strokeWidth:   10,
      shadow:        'rgba(0,0,0,0.6)',
      highlightColor:'#7FDBFF',
      bgColor:       'rgba(0,0,0,0.32)',
    },
    defaultEffect:  'pan-left',
    durationRange:  { min: 2.5, max: 6.0 },
  },

  review: {
    name: '리뷰', emoji: '⭐',
    style: {
      overlay:    { top: 'rgba(0,0,0,0.12)',        bottom: 'rgba(0,0,0,0.50)' },
      subtitle:   { color: '#FFFFFF', hlColor: '#FFD700', fontSize: 1.0 },
      transition: 'fade', letterbox: false,
      badge:      { bg: 'rgba(0,0,0,0.5)',          dot: '#FFD700' },
      colorGrade: { r: 1.02, g: 1.01, b: 0.96 },
    },
    caption: {
      font:          `900 ${Math.round(80 * SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,
      color:         '#FFFFFF',
      stroke:        '#000000',
      strokeWidth:   12,
      shadow:        'rgba(0,0,0,0.8)',
      highlightColor:'#FFD700',
    },
    defaultEffect:  'zoom-in',
    durationRange:  { min: 2.0, max: 5.0 },
  },

  story: {
    name: '스토리', emoji: '📖',
    style: {
      overlay:    { top: 'rgba(0,0,0,0.10)',        bottom: 'rgba(0,0,0,0.45)' },
      subtitle:   { color: '#FFF9F0', hlColor: '#FF9F7F', fontSize: 1.0 },
      transition: 'fade', letterbox: false,
      badge:      { bg: 'rgba(0,0,0,0.45)',         dot: '#FF9F7F' },
      colorGrade: { r: 0.97, g: 0.94, b: 1.06 },
    },
    caption: {
      font:          `800 ${Math.round(76 * SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,
      color:         '#FFF9F0',
      stroke:        '#000000',
      strokeWidth:   11,
      shadow:        'rgba(0,0,0,0.7)',
      highlightColor:'#FF9F7F',
    },
    defaultEffect:  'float-up',
    durationRange:  { min: 3.0, max: 6.0 },
  },

  info: {
    name: '정보', emoji: '📊',
    style: {
      overlay:    { top: 'rgba(0,0,0,0.20)',        bottom: 'rgba(0,0,0,0.55)' },
      subtitle:   { color: '#FFFFFF', hlColor: '#00E5FF', fontSize: 0.95 },
      transition: 'fade', letterbox: false,
      badge:      { bg: 'rgba(0,0,50,0.6)',         dot: '#00E5FF' },
      colorGrade: { r: 0.95, g: 0.99, b: 1.07 },
    },
    caption: {
      font:          `900 ${Math.round(72 * SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,
      color:         '#E0F0FF',
      stroke:        '#000000',
      strokeWidth:   12,
      shadow:        'rgba(0,0,0,0.8)',
      highlightColor:'#00E5FF',
      bgColor:       'rgba(0,10,30,0.50)',
    },
    defaultEffect:  'pan-right',
    durationRange:  { min: 2.5, max: 5.0 },
  },
};

export function getTemplate(key: TemplateKey): TemplateConfig {
  if (key === 'auto') return TEMPLATES.aesthetic;
  return TEMPLATES[key] ?? TEMPLATES.aesthetic;
}

/* ── 프롬프트 힌트 텍스트 (Gemini 프롬프트 주입용) ── */
export const TEMPLATE_HINTS: Record<Exclude<TemplateKey, 'auto'>, string> = {
  cinematic:  '시네마틱 스타일: 슬로우 컷, 무디 색감, 영화 같은 구성',
  viral:      '바이럴 스타일: 빠른 컷 전환, FOMO 극대화, 틱톡 트렌딩',
  aesthetic:  '감성 스타일: 따뜻한 톤, 소프트 무드, 인스타 감성',
  mukbang:    '먹방 스타일: 음식 클로즈업 극대화, ASMR 느낌 나레이션',
  vlog:       '브이로그 스타일: 일상 기록, 친근한 1인칭 시점',
  review:     '리뷰 스타일: 솔직 평가, 장단점 분석, 가성비 중심',
  story:      '스토리 스타일: 도입→전개→클라이맥스→여운',
  info:       '정보 스타일: 핵심 정보 간결 전달, 카드뉴스 느낌',
};

export const HOOK_HINTS: Record<HookKey, string> = {
  question:  '질문형 훅: "이거 진짜야?", "이 가격 실화?"',
  shock:     '충격형 훅: "이게 가능해?", "미쳤다 진짜"',
  challenge: '도전형 훅: "3초 안에 저장해", "이거 안 먹으면 후회"',
  secret:    '비밀형 훅: "아는 사람만 아는", "현지인 전용"',
  ranking:   '랭킹형 훅: "TOP 1 맛집", "내 인생 최고"',
  pov:       'POV형 훅: "너가 여기 왔을 때", "혼밥 성공 POV"',
};
