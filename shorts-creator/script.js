'use strict';
/* ============================================================
   무브먼트 Shorts Creator v9 — script.js
   Build: 2026-03-09T12:00:00+09:00
   ============================================================ */

/* ── 버전 정보 ───────────────────────────────── */
const APP_VERSION  = 'v31 (20260308-1600)';
const APP_BUILD_TS = '2026-03-08 KST';

/* ── API ─────────────────────────────────────────────────── */
const _INJECTED_KEY          = '__GEMINI_KEY__';
let geminiKey = _INJECTED_KEY.includes('__') ? (localStorage.getItem('moovlog_gemini_key') || '') : _INJECTED_KEY;

// Typecast API 키 7개 주입 패턴 — GitHub Secrets: TYPECAST_API_KEY / ..._2 ~ ..._7
const _TC_K1 = '__TYPECAST_API_KEY__';
const _TC_K2 = '__TYPECAST_API_KEY_2__';
const _TC_K3 = '__TYPECAST_API_KEY_3__';
const _TC_K4 = '__TYPECAST_API_KEY_4__';
const _TC_K5 = '__TYPECAST_API_KEY_5__';
const _TC_K6 = '__TYPECAST_API_KEY_6__';
const _TC_K7 = '__TYPECAST_API_KEY_7__';
const _TYPECAST_KEYS = [
  _TC_K1.includes('__') ? (localStorage.getItem('moovlog_typecast_key')   || '') : _TC_K1,
  _TC_K2.includes('__') ? (localStorage.getItem('moovlog_typecast_key2')  || '') : _TC_K2,
  _TC_K3.includes('__') ? (localStorage.getItem('moovlog_typecast_key3')  || '') : _TC_K3,
  _TC_K4.includes('__') ? (localStorage.getItem('moovlog_typecast_key4')  || '') : _TC_K4,
  _TC_K5.includes('__') ? (localStorage.getItem('moovlog_typecast_key5')  || '') : _TC_K5,
  _TC_K6.includes('__') ? (localStorage.getItem('moovlog_typecast_key6')  || '') : _TC_K6,
  _TC_K7.includes('__') ? (localStorage.getItem('moovlog_typecast_key7')  || '') : _TC_K7,
].filter(Boolean);  // 빈 키 제외
let _tcKeyIdx = 0;  // 현재 시도 중인 키 인덱스
function getTypeCastKey() {
  if (!_TYPECAST_KEYS.length) return '';
  return _TYPECAST_KEYS[_tcKeyIdx % _TYPECAST_KEYS.length];
}
function rotateTypeCastKey() {
  _tcKeyIdx = (_tcKeyIdx + 1) % Math.max(_TYPECAST_KEYS.length, 1);
  console.log(`[Typecast] 키 로테이션 → #${_tcKeyIdx + 1} (${_TYPECAST_KEYS.length}개 중)`);
}

// 강제 타임아웃 방어 함수 (무한 대기 좀비 커넥션 방지)
async function fetchWithTimeout(url, options, timeout = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
function getApiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
}
function ensureApiKey() {
  if (geminiKey) return true;
  return false;
}

async function apiPost(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || `${r.status}`); }
  return r.json();
}
async function geminiWithFallback(body) {
  try { return await apiPost(getApiUrl('gemini-2.5-pro'), body); }
  catch (e) { console.warn('[Gemini] Pro → Flash 폴백:', e.message); return apiPost(getApiUrl('gemini-2.5-flash'), body); }
}

/* ── Canvas (멀티 화면 비율 동적 전환 지원) ─────────────────────────── */
let CW = 1080, CH = 1920;          // 기본: 9:16 쇼츠·틱톡·릴스 해상도
let SCALE = 1.5;                   // 1080/720 — 모든 px 좌표 기준 스케일
const AUTO_EXPORT_ON_CREATE = false;
const g  = id => document.getElementById(id);
const D  = {
  dropArea: g('dropArea'), fileInput: g('fileInput'), thumbGrid: g('thumbGrid'),
  restName: g('restName'), makeBtn: g('makeBtn'),
  loadWrap: g('loadingWrap'), loadTitle: g('loadTitle'), loadSub: g('loadSub'),
  ls1: g('ls1'), ls2: g('ls2'), ls3: g('ls3'), ls4: g('ls4'),
  ls1s: g('ls1s'), ls2s: g('ls2s'), ls3s: g('ls3s'), ls4s: g('ls4s'),
  ls1c: g('ls1c'), ls2c: g('ls2c'), ls3c: g('ls3c'), ls4c: g('ls4c'),
  resultWrap: g('resultWrap'), canvas: g('videoCanvas') || g('vc'),
  vProg: g('vProg'), playBtn: g('playBtn'), playIco: g('playIco'),
  replayBtn: g('replayBtn'), muteBtn: g('muteBtn'), muteIco: g('muteIco'),
  sceneList: g('sceneList'), dlBtn: g('dlBtn'), dlAudioBtn: g('dlAudioBtn'),
  recStatus: g('recStatus'), recTimer: g('recTimer'),
  reBtn: g('reBtn'), reBtnBottom: g('reBtnBottom'),
  toasts: g('toasts'), audioStatus: g('audioStatus'),
  resultSub: g('resultSub'), audioBadge: g('audioBadge'), audioBadgeText: g('audioBadgeText'),
  sceneDots: g('sceneDots'),
  snsWrap: g('snsWrap'), tagNaver: g('tagNaver'), tagYoutube: g('tagYoutube'),
  tagInsta: g('tagInsta'), tagTiktok: g('tagTiktok'),
  vProgText: g('vProgText'), bgmBadge: g('bgmBadge'), bgmBadgeText: g('bgmBadgeText'),
  selectedTplInput: g('selectedTplInput'),
  ttsPlayer: g('ttsPlayer'), captionLayer: g('captionLayer'),
};
const ctx = D.canvas.getContext('2d');
D.canvas.width = CW; D.canvas.height = CH;
ctx.imageSmoothingEnabled = true;  // 렌더링 화질 최상으로 강제 설정 (계단 현상 방지)
ctx.imageSmoothingQuality = 'high';

/* ── Audio ───────────────────────────────────────────────── */
let audioCtx = null, audioMixDest = null;
let _sessionDocId = null;  // 현재 Firestore sessions 문서 ID (saveSession 후 설정)
function ensureAudio() {
  if (audioCtx) return;
  audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
  audioMixDest = audioCtx.createMediaStreamDestination();
}

/* ── Template / Hook 전역 상태 (Instagram/TikTok 스타일) ── */
let selectedTemplate = 'auto';
let selectedHook     = 'question';

/* ── 바이럴 트렌드 보반 템플릿 (Beat-Sync) ───────────────── */
const VIRAL_TRENDS = {
  viral_fast: {
    name: '⚡ 0.5초 빠른 비트 (틱톡/릴스)',
    durations: [1.5, 0.5, 0.5, 0.5, 0.5, 2.0],
    transition: 'wipe', subtitle_style: 'bold_drop',
    effect: ['zoom-out', 'pan-left', 'pan-right', 'zoom-in', 'zoom-in-slow', 'drift']
  },
  vlog_aesthetic: {
    name: '☕ 감성 브이로그 (룸투어/카페)',
    durations: [3.0, 1.2, 1.2, 1.2, 2.5],
    transition: 'fade', subtitle_style: 'minimal',
    effect: ['zoom-in-slow', 'drift', 'drift', 'drift', 'float-up']
  },
};

const TEMPLATE_HINTS = {
  cinematic:  '시네마틱 스타일: 슬로우 컷, 무디 색감, 영화 같은 구성, 감성 BGM 느낌',
  viral:      '바이럴 스타일: 빠른 컷 전환, FOMO 극대화, "저장 필수" 포맷, 틱톡 트렌딩',
  aesthetic:  '감성 스타일: 따뜻한 톤, 소프트 무드, 카페·맛집 바이브, 인스타 감성',
  mukbang:    '먹방 스타일: 음식 클로즈업 극대화, 식감·소리 묘사, ASMR 느낌 나레이션',
  vlog:       '브이로그 스타일: 일상 기록, 친근한 1인칭 시점, 맛집 탐방 일기',
  review:     '리뷰 스타일: 솔직 평가, 장단점 분석, 가성비 중심, 별점 느낌',
  story:      '스토리 스타일: 감성 여정, 도입→전개→클라이맥스→여운, 내러티브 중심',
  info:       '정보 스타일: 핵심 정보 간결 전달, 위치·가격·메뉴·특징, 카드뉴스 느낌',
};
const TEMPLATE_NAMES = {
  cinematic: '🎬 시네마틱', viral: '🔥 바이럴', aesthetic: '✨ 감성',
  mukbang: '🍜 먹방', vlog: '📹 브이로그', review: '⭐ 리뷰',
  story: '📖 스토리', info: '📊 정보',
  viral_fast: '⚡ 빠른 비트', vlog_aesthetic: '☕ 감성 브이로그',
};
const HOOK_HINTS = {
  question:  '질문형 훅: "이거 진짜야?", "이 가격 실화?", "여기 가봤어?"',
  shock:     '충격형 훅: "이게 가능해?", "미쳤다 진짜", "실화냐 이거"',
  challenge: '도전형 훅: "3초 안에 저장해", "나만 알고 싶었는데", "이거 안 먹으면 후회"',
  secret:    '비밀형 훅: "아는 사람만 아는", "현지인 전용", "절대 알려주기 싫은"',
  ranking:   '랭킹형 훅: "TOP 1 맛집", "내 인생 최고", "1등 메뉴는?"',
  pov:       'POV형 훅: "너가 여기 왔을 때", "맛집 찾았을 때 기분", "혼밥 성공 POV"',
};

/* ── Template Visual Styles (렌더러 주입용) ─────────────── */
const TEMPLATE_STYLES = {
  cinematic: {
    overlay:    { top: 'rgba(0,0,0,0.15)',       bottom: 'rgba(0,0,0,0.55)' },
    subtitle:   { color: '#E8E0D0', hlColor: '#C8A96E', fontSize: 1.0 },
    transition: 'fade',
    letterbox:  true,
    badge:      { bg: 'rgba(0,0,0,0.6)',          dot: '#C8A96E' },
    colorGrade: { r: 0.96, g: 0.93, b: 1.05 },   // 쿨한 시네마틱 톤
  },
  viral: {
    overlay:    { top: 'rgba(0,0,0,0.05)',        bottom: 'rgba(0,0,0,0.45)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#FF2D55',  fontSize: 1.08 },
    transition: 'wipe',
    letterbox:  false,
    badge:      { bg: 'rgba(255,45,85,0.75)',     dot: '#FFFFFF' },
    colorGrade: { r: 1.05, g: 0.98, b: 0.96 },   // 선명하고 따뜻
  },
  aesthetic: {
    overlay:    { top: 'rgba(255,220,180,0.08)',  bottom: 'rgba(0,0,0,0.40)' },
    subtitle:   { color: '#FFF5E4', hlColor: '#FFB347',  fontSize: 1.0 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.45)',         dot: '#ff6b9d' },
    colorGrade: { r: 1.04, g: 1.01, b: 0.93 },   // 웜톤 감성
  },
  mukbang: {
    overlay:    { top: 'rgba(0,0,0,0.10)',        bottom: 'rgba(0,0,0,0.50)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#FFE033',  fontSize: 1.05 },
    transition: 'zoom',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.5)',          dot: '#FF6B35' },
    colorGrade: { r: 1.06, g: 1.02, b: 0.90 },   // 음식 색감 강조
  },
  vlog: {
    overlay:    { top: 'rgba(0,0,0,0.08)',        bottom: 'rgba(0,0,0,0.38)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#7FDBFF',  fontSize: 0.96 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.45)',         dot: '#7FDBFF' },
    colorGrade: { r: 1.0,  g: 1.03, b: 1.0 },    // 자연스러운 일상
  },
  review: {
    overlay:    { top: 'rgba(0,0,0,0.12)',        bottom: 'rgba(0,0,0,0.50)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#FFD700',  fontSize: 1.0 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.5)',          dot: '#FFD700' },
    colorGrade: { r: 1.02, g: 1.01, b: 0.96 },   // 리뷰 톤
  },
  story: {
    overlay:    { top: 'rgba(0,0,0,0.10)',        bottom: 'rgba(0,0,0,0.45)' },
    subtitle:   { color: '#FFF9F0', hlColor: '#FF9F7F',  fontSize: 1.0 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.45)',         dot: '#FF9F7F' },
    colorGrade: { r: 0.97, g: 0.94, b: 1.06 },   // 보라 계열 무드
  },
  info: {
    overlay:    { top: 'rgba(0,0,0,0.20)',        bottom: 'rgba(0,0,0,0.55)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#00E5FF',  fontSize: 0.95 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,50,0.6)',         dot: '#00E5FF' },
    colorGrade: { r: 0.95, g: 0.99, b: 1.07 },   // 쿨 블루 정보 톤
  },
};
function getTplStyle() {
  return TEMPLATE_STYLES[selectedTemplate] || TEMPLATE_STYLES.aesthetic;
}

/* ════════════════════════════════════════════════════════════
   VIDEO TEMPLATES — CapCut 스타일 캡션 렌더링 설정
   JSON 템플릿과 연동, drawTrendyText()에서 참조
   ════════════════════════════════════════════════════════════ */
const videoTemplates = {
  cinematic:  { font: `900 ${Math.round(72*SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,  color: '#E8E0D0', stroke: '#C8A96E', strokeWidth: 10, shadow: 'rgba(0,0,0,0.7)', highlightColor: '#C8A96E' },
  viral:      { font: `900 ${Math.round(88*SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,  color: '#D2FF00',  stroke: '#000000', strokeWidth: 14, shadow: 'rgba(0,0,0,0.95)', shadowOffsetY: 8, highlightColor: '#FF2D55' },
  aesthetic:  { font: `800 ${Math.round(76*SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,  color: '#FFF5E4', stroke: 'transparent', strokeWidth: 0, shadow: 'rgba(0,0,0,0.5)', highlightColor: '#FFB347', bgColor: 'rgba(0,0,0,0.42)' },
  mukbang:    { font: `900 ${Math.round(86*SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,  color: '#FFFFFF',  stroke: '#000000', strokeWidth: 13, shadow: 'rgba(255,107,53,0.6)', highlightColor: '#FFE033' },
  vlog:       { font: `700 ${Math.round(72*SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,  color: '#FFFFFF',  stroke: '#000000', strokeWidth: 10, shadow: 'rgba(0,0,0,0.6)', highlightColor: '#7FDBFF', bgColor: 'rgba(0,0,0,0.32)' },
  review:     { font: `900 ${Math.round(80*SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,  color: '#FFFFFF',  stroke: '#000000', strokeWidth: 12, shadow: 'rgba(0,0,0,0.8)', highlightColor: '#FFD700' },
  story:      { font: `800 ${Math.round(76*SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,  color: '#FFF9F0', stroke: '#000000', strokeWidth: 11, shadow: 'rgba(0,0,0,0.7)', highlightColor: '#FF9F7F' },
  info:       { font: `900 ${Math.round(72*SCALE)}px 'Black Han Sans', 'Noto Sans KR'`,  color: '#E0F0FF', stroke: '#000000', strokeWidth: 12, shadow: 'rgba(0,0,0,0.8)', highlightColor: '#00E5FF', bgColor: 'rgba(0,10,30,0.50)' },
};

/** 현재 selectedTemplate에 대한 videoTemplates 스타일 반환 */
function getTrendyStyle() {
  return videoTemplates[selectedTemplate] || videoTemplates.aesthetic;
}

/* ── 템플릿 JSON 로더 (./templates/{name}.json) ─────────── */
async function loadTemplate(name) {
  try {
    const r = await fetch(`./templates/${name}.json`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } catch (e) {
    console.warn('[loadTemplate] 실패:', name, e.message);
    return null;
  }
}

/* ── 훅 생성 (HOOK_POOL 기반) ─────────────────────────────── */
function generateHook(place) {
  const pool = HOOK_POOL;
  const hook = pool[Math.floor(Math.random() * pool.length)];
  return place ? `${place} ${hook}` : hook;
}

/* ── 숏폼 훅 풀 (틱톡 스타일 첫 씬 참고) ───────────────── */
const HOOK_POOL = [
  '이거 왜 유명한지 알았다', '여기 모르면 손해', '이거 진짜 미쳤다',
  '줄 서는 이유 있음', '아는 사람만 안다', '진짜 실화임?',
  '여기 왜 이제 왔지', '내 최애 맛집 생김',
];

/* ── 자막 분할 (5~12자 틱톡 스타일) ──────────────────────── */
function splitCaptions(text) {
  if (!text) return ['', ''];
  const clean = text.trim();
  // ① 이미 줄바꿈 있으면 그 경계로 분리
  if (clean.includes('\n')) {
    const parts = clean.split('\n').map(s => s.trim()).filter(Boolean);
    return [parts[0] || '', parts.slice(1).join(' ') || ''];
  }
  // ② 마침표·느낌표·물음표 뒤 자연 끊기 (숏폼 리듬)
  const sm = clean.match(/^(.{3,14}[.!?…]+)\s*(.{2,})$/);
  if (sm) return [sm[1], sm[2]];
  // ③ 쉼표 기준 분리
  const cp = clean.split(/[,，]/);
  if (cp.length >= 2 && cp[0].trim().length >= 3)
    return [cp[0].trim(), cp.slice(1).join(',').trim()];
  // ④ 이모지 제거 후 10자 이하 — 분리 불필요
  const stripped = clean.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim();
  if (stripped.length <= 10) return [clean, ''];
  // ⑤ 공백 기준 단어 단위 반분
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  // ⑥ 글자 수 반분
  const mid = Math.ceil(clean.length / 2);
  return [clean.slice(0, mid), clean.slice(mid)];
}

/* ── State ───────────────────────────────────────────────── */
const S = {
  files: [], loaded: [], script: null, audioBuffers: [],
  currentAudio: null, playing: false, muted: false,
  scene: 0, startTs: null, audioStartTs: 0, raf: null,
  exporting: false,
  subAnimProg: 0,  // 0..1, subtitle animation progress per scene
};

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  D.dropArea.addEventListener('dragover',  e => { e.preventDefault(); D.dropArea.classList.add('over'); });
  D.dropArea.addEventListener('dragleave', () => D.dropArea.classList.remove('over'));
  D.dropArea.addEventListener('drop',      e => { e.preventDefault(); D.dropArea.classList.remove('over'); addFiles([...e.dataTransfer.files]); });
  D.dropArea.addEventListener('click',     e => { if (!e.target.closest('.pick-btn')) D.fileInput.click(); });
  D.fileInput.addEventListener('change',   e => { addFiles([...e.target.files]); D.fileInput.value = ''; });
  D.restName.addEventListener('input', () => {});
  D.restName.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); D.makeBtn.click(); }
  });
  D.makeBtn.addEventListener('click',   startMake);
  D.playBtn.addEventListener('click',   togglePlay);
  D.canvas.addEventListener('click',    togglePlay);  // 모바일: 캔버스 탭으로 재생/일시정지
  D.replayBtn.addEventListener('click', doReplay);
  D.muteBtn.addEventListener('click',   toggleMute);
  D.dlBtn.addEventListener('click',     doExport);
  if (D.dlAudioBtn) D.dlAudioBtn.addEventListener('click', doExportAudio);
  D.reBtn.addEventListener('click',     goBack);
  if (D.reBtnBottom) D.reBtnBottom.addEventListener('click', goBack);
  // 반복 재생 오버레이 버튼
  const _repeatYes = document.getElementById('repeatYesBtn');
  const _repeatNo  = document.getElementById('repeatNoBtn');
  if (_repeatYes) _repeatYes.addEventListener('click', () => { hideRepeatPrompt(); doReplay(); });
  if (_repeatNo)  _repeatNo.addEventListener('click',  () => { hideRepeatPrompt(); });
  // 좋아요 버튼 애니메이션
  const likeBtn = document.querySelector('.rsb-like');
  if (likeBtn) likeBtn.addEventListener('click', function() {
    this.classList.toggle('liked');
    this.style.transform = 'scale(1.35)';
    setTimeout(() => { this.style.transform = ''; }, 200);
  });
  updateStepUI(1);
  const verEl = document.getElementById('appVersion');
  if (verEl) verEl.textContent = `${APP_VERSION} · ${APP_BUILD_TS}`;
  const apkSub = g('apkBannerSub');
  if (apkSub) apkSub.textContent = `moovlog-shorts-creator-${APP_VERSION}.apk →`;
  document.querySelectorAll('.sns-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.target);
      if (!el?.textContent) return;
      navigator.clipboard.writeText(el.textContent).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> 복사됨'; btn.classList.add('copied');
        toast('클립보드에 복사되었습니다 ✓', 'ok');
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> 복사'; btn.classList.remove('copied'); }, 2000);
      }).catch(() => {
        const r = document.createRange(); r.selectNodeContents(el);
        window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
        toast('Ctrl+C로 복사하세요', 'inf');
      });
    });
  });
  if ('speechSynthesis' in window) {
    // voices를 종종 비동기로 로드됨 — 이벤트 리스너로 선제 로드
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }
    setTimeout(() => speechSynthesis.getVoices(), 500);
  }
  renderTemplatePicker();

  // Firebase Firestore 세션 로드 (firebase-ready 이벤트 또는 폴백 timeout)
  const _tryLoadSession = () => { if (window.FB_db) loadRecentSession(); };
  window.addEventListener('firebase-ready', _tryLoadSession, { once: true });
  setTimeout(_tryLoadSession, 1500); // 폴백: firebase-ready가 이미 불렸을 때
});

/* ── Template Picker UI ─────────────────────────────────── */
function renderTemplatePicker() {
  const container = document.getElementById('tplPicker');
  if (!container) return;
  container.innerHTML = '';

  // 첫 번째: AI 자동 칩
  const autoChip = document.createElement('button');
  autoChip.className = 'tpl-chip tpl-chip-auto' + (selectedTemplate === 'auto' ? ' active' : '');
  autoChip.textContent = '🤖 AI 자동';
  autoChip.addEventListener('click', () => {
    selectedTemplate = 'auto';
    if (D.selectedTplInput) D.selectedTplInput.value = 'auto';
    container.querySelectorAll('.tpl-chip').forEach(c => c.classList.remove('active'));
    autoChip.classList.add('active');
    toast('AI가 영상에 맞게 자동 선택합니다', 'inf');
    if (S.script && S.script.scenes.length) renderFrame(S.scene, S.subAnimProg > 0 ? 1 : 0);
  });
  container.appendChild(autoChip);

  Object.entries(TEMPLATE_NAMES).forEach(([key, label]) => {
    const btn = document.createElement('button');
    btn.className = 'tpl-chip' + (key === selectedTemplate ? ' active' : '');
    btn.dataset.tpl = key;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      selectedTemplate = key;
      if (D.selectedTplInput) D.selectedTplInput.value = key;
      container.querySelectorAll('.tpl-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      toast(`${label} 템플릿 선택됨`, 'inf');
      if (S.script && S.script.scenes.length) renderFrame(S.scene, S.subAnimProg > 0 ? 1 : 0);
    });
    container.appendChild(btn);
  });
}

/* ── File Upload ─────────────────────────────────────────── */
function addFiles(files) {
  const valid = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
  if (!valid.length) return;
  if (S.files.length + valid.length > 10) { toast('최대 10개까지 가능합니다', 'err'); return; }
  // 영상 우선 정렬 (video > image)
  const sorted = [
    ...valid.filter(f => f.type.startsWith('video/')),
    ...valid.filter(f => f.type.startsWith('image/')),
  ];
  sorted.forEach(f => S.files.push({ file: f, url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image' }));
  renderThumbs();
}
function renderThumbs() {
  D.thumbGrid.innerHTML = '';
  S.files.forEach((m, i) => {
    const w = document.createElement('div'); w.className = 'ti';
    const el = m.type === 'image'
      ? Object.assign(document.createElement('img'),   { src: m.url })
      : Object.assign(document.createElement('video'), { src: m.url, muted: true, preload: 'metadata' });
    const badge = Object.assign(document.createElement('span'), { className: 'ti-badge', textContent: i + 1 });
    const del   = document.createElement('button'); del.className = 'ti-del';
    del.innerHTML = '<i class="fas fa-times"></i>';
    del.onclick = ev => { ev.stopPropagation(); S.files.splice(i, 1); renderThumbs(); };
    w.append(el, badge, del); D.thumbGrid.appendChild(w);
  });
}

/* ════════════════════════════════════════════════════════════
   PIPELINE
   ════════════════════════════════════════════════════════════ */
async function startMake() {
  if (!S.files.length) { toast('이미지 또는 영상을 올려주세요', 'err'); return; }
  const name = D.restName.value.trim();
  if (!name) { toast('음식점 이름을 입력해주세요', 'err'); D.restName.focus(); return; }
  if (!ensureApiKey()) { toast('API 키가 필요합니다', 'err'); return; }
  D.makeBtn.disabled = true;
  if (D.snsWrap) D.snsWrap.hidden = true;
  updateStepUI(2); showLoad(); ensureAudio();
  // 💡 iOS/Android 오디오 차단 완벽 방어: Oscillator 무음 재생으로 AudioContext 즉시 활성화
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    try {
      const _osc = audioCtx.createOscillator(), _gain = audioCtx.createGain();
      _gain.gain.value = 0;
      _osc.connect(_gain); _gain.connect(audioCtx.destination);
      _osc.start(0); _osc.stop(audioCtx.currentTime + 0.05);
    } catch(_) {}
  }
  // Web Speech 권한도 미리 뚫어두기 (폴백 보장)
  if ('speechSynthesis' in window) {
    const _u = new SpeechSynthesisUtterance(''); _u.volume = 0; speechSynthesis.speak(_u);
  }
  // 원본 파일을 Firebase Storage에 백그라운드 업로드 (블로킹 없음)
  uploadOriginalsInBackground();
  try {
    setStep(1, '이미지 분석 + 스타일 자동 선택 중...', 'AI가 최적의 템플릿과 훅을 찾고 있습니다');
    const analysis = await visionAnalysis(name);
    // AI 자동 스타일 선택 (수동 선택 시 무시)
    const userChoseManually = D.selectedTplInput && D.selectedTplInput.value !== 'auto';
    if (!userChoseManually && analysis.recommended_template && TEMPLATE_HINTS[analysis.recommended_template]) {
      selectedTemplate = analysis.recommended_template;
      // tplPicker active 칩 동기화
      const picker = document.getElementById('tplPicker');
      if (picker) {
        picker.querySelectorAll('.tpl-chip').forEach(c => c.classList.remove('active'));
        const matchChip = picker.querySelector(`[data-tpl="${selectedTemplate}"]`);
        if (matchChip) matchChip.classList.add('active');
      }
    }
    if (analysis.recommended_hook && HOOK_HINTS[analysis.recommended_hook]) {
      selectedHook = analysis.recommended_hook;
    }
    const styleBadge = document.getElementById('autoStyleBadge');
    const styleName  = document.getElementById('autoStyleName');
    if (styleBadge && styleName) {
      styleName.textContent = TEMPLATE_NAMES[selectedTemplate] || selectedTemplate;
      styleBadge.hidden = false;
    }
    if (!userChoseManually) toast(`AI 추천: ${TEMPLATE_NAMES[selectedTemplate] || selectedTemplate}`, 'inf');
    else toast(`수동 선택: ${TEMPLATE_NAMES[selectedTemplate] || selectedTemplate}`, 'inf');
    doneStep(1);

    setStep(2, 'Instagram Reels 스토리보드 생성 중...', '훅→감성→클로즈업→CTA 내러티브 설계');
    const script = await generateScript(name, analysis);
    S.script = script;
    doneStep(2);

    setStep(3, 'AI 남성 보이스 합성 중...', `Gemini TTS Fenrir — ${script.scenes.length}컷`);
    try {
      S.audioBuffers = await generateAllTTS(script.scenes);
    } catch (ttsErr) {
      console.warn('[TTS] 전체 실패, 무음 진행:', ttsErr.message);
      S.audioBuffers = script.scenes.map(() => null);
      toast('AI 보이스 실패: 무음 영상으로 진행합니다', 'inf');
    }
    // 오디오 실제 길이로 씬 duration 동기화 + 바이럴 트렌드 보반 강제
    const isTrend = VIRAL_TRENDS[selectedTemplate];

    for (let i = 0; i < script.scenes.length; i++) {
      const sc  = script.scenes[i];
      const buf = S.audioBuffers[i];
      if (isTrend && isTrend.durations[i] !== undefined) {
        // 트렌드 템플릿: 나레이션 길이 무시하고 정해진 박자(초수) 강제
        sc.duration = isTrend.durations[i];
        if (!sc.effect && isTrend.effect) sc.effect = isTrend.effect[i % isTrend.effect.length];
      } else if (buf && buf.duration > 0) {
        const minDur = (i === 0) ? 1.0 : 1.5; // 첫 씬 (i=0): 1초, 나머지: 1.5초 최소값
        sc.duration = Math.max(minDur, Math.round((buf.duration + 0.15) * 10) / 10);
      }
      // caption = narration 텍스트 직접 분할 (AI 자막 무시)
      const [c1, c2] = splitCaptions(sc.narration || sc.subtitle || '');
      sc.caption1 = c1; sc.caption2 = c2;
      // subtitle fallback (씬 카드·레거시 표시용)
      if (!sc.subtitle) sc.subtitle = sc.caption1 || '';
    }
    doneStep(3);

    setStep(4, '렌더링 준비 중...', '컷 배치 · 애니메이션 · 효과 적용');
    await preload(); buildSceneCards(); await sleep(200);
    doneStep(4);
    // 결과 헤더 업데이트
    if (D.resultSub) {
      const totalSec = script.scenes.reduce((a, s) => a + (s.duration || 0), 0);
      D.resultSub.textContent = `${script.scenes.length}개 씬 · ${totalSec}초`;
    }
    buildSceneDots();
    buildSNSTags(script);
    saveSession(script).catch(() => {});  // Firestore sessions 컬렉션에 저장
    // 유튜브 숏츠 UI — 채널명/제목/음악 정보 업데이트
    (function updateYtInfo() {
      const ytInfo    = document.getElementById('ytInfo');
      const ytChannel = document.getElementById('ytChannelName');
      const ytTitle   = document.getElementById('ytTitle');
      const ytMusic   = document.getElementById('ytMusicText');
      if (!ytInfo) return;
      ytInfo.hidden = false;
      const rawName = D.restName?.value?.trim() || 'MOOVLOG';
      if (ytChannel) ytChannel.textContent = '@' + rawName.replace(/\s+/g, '').toLowerCase().slice(0, 18);
      if (ytTitle)   ytTitle.textContent   = script.scenes[0]?.subtitle || rawName;
      if (ytMusic)   ytMusic.textContent   = `Original Sound · ${rawName}`;
    })();
    await sleep(300);
    updateStepUI(3); hideLoad(); D.resultWrap.hidden = false;
    // BGM 배지: 현재 선택 템플릿 표시
    const bgmBadgeEl = document.getElementById('bgmBadge');
    const bgmTextEl  = document.getElementById('bgmBadgeText');
    if (bgmTextEl) bgmTextEl.textContent = TEMPLATE_NAMES[selectedTemplate] || selectedTemplate;
    if (bgmBadgeEl) bgmBadgeEl.hidden = false;
    setupPlayer();
    setTimeout(startPlay, 300);  // 결과 표시 시 자동 재생
    if (AUTO_EXPORT_ON_CREATE) {
      toast('영상 생성 완료! 자동 저장을 시작합니다', 'inf');
      setTimeout(() => { doExport(); }, 2500);
    }
  } catch (err) {
    hideLoad(); D.makeBtn.disabled = false;
    console.error('[startMake]', err);
    const msg = err?.message || String(err) || '알 수 없는 오류';
    toast('오류: ' + msg, 'err');
  }
}

/* ════════════════════════════════════════════════════════════
   STEP 1 — Vision Analysis (Gemini 2.5 Pro)
   이미지별 타입·감성·효과·순서 분석
   ════════════════════════════════════════════════════════════ */
async function visionAnalysis(restaurantName) {
  const parts = [];
  // 업로드 순서대로 최대 8개 처리 (이미지 + 영상 프레임 혼용)
  for (let i = 0; i < Math.min(S.files.length, 8); i++) {
    const m = S.files[i];
    if (m.type === 'image') {
      const b64 = await toB64(m.file);
      parts.push({ inline_data: { mime_type: m.file.type || 'image/jpeg', data: b64 } });
    } else {
      try {
        const frames = await extractVideoFramesB64(m.file, 2);
        for (const fr of frames) parts.push({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } });
      } catch (e) { console.warn('[Vision] 비디오 프레임 추출 실패 무시'); }
    }
  }
  if (!parts.length) return { keywords: [restaurantName, '맛집'], mood: '감성적인', per_image: [], recommended_order: [] };
  const mediaCount = parts.length;

  const prompt = `당신은 인스타그램 Reels 전문 비주얼 디렉터입니다.
음식점: "${restaurantName}" / 미디어 ${mediaCount}개 (순서대로 미디어0, 미디어1...)

각 이미지를 순서대로 정밀 분석하세요.

[분석 기준]
- type: "hook"(시선강탈), "hero"(대표메뉴 클로즈업), "detail"(식재료/질감), "ambiance"(분위기/공간), "process"(조리과정), "wide"(전경)
- best_effect: "zoom-in"|"zoom-out"|"pan-left"|"pan-right"|"zoom-in-slow"|"float-up"
  (hero→zoom-in, ambiance→pan-left/pan-right, detail→zoom-in-slow, hook→zoom-out, process→float-up)
- emotional_score: 1~10 (인스타 바이럴 잠재력)
- suggested_duration: 2~5초 (클로즈업→3~4s, 분위기→4~5s, 훅/CTA→2~3s)
- focus: 이 이미지 핵심 포인트 1문장

전체:
- keywords: 핵심 키워드 5개
- mood: 감성 키워드 (예: "따뜻한 저녁빛", "힙한 골목 감성")
- menu: 발견된 메뉴명
- visual_hook: 식욕/호기심 자극 1문장 (감각적, 구체적)
- recommended_order: emotional_score+스토리흐름 기준 정렬된 인덱스 배열
- recommended_template: 이미지 분위기에 가장 적합한 콘텐츠 스타일 하나 선택: "cinematic"|"viral"|"aesthetic"|"mukbang"|"vlog"|"review"|"story"|"info"
  (고급감·무디→cinematic, 자극·트렌드→viral, 감성·따뜻→aesthetic, 음식클로즈업→mukbang, 일상·가벼움→vlog, 평가·비교→review, 내러티브→story, 정보중심→info)
- recommended_hook: 가장 어울리는 오프닝 훅 하나 선택: "question"|"shock"|"challenge"|"secret"|"ranking"|"pov"

JSON만 반환:
{"keywords":["k1","k2","k3","k4","k5"],"mood":"감성","menu":["메뉴"],"visual_hook":"훅","recommended_order":[0,1,2],"recommended_template":"aesthetic","recommended_hook":"question","per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":3,"focus":"설명"}]}`;

  const data = await geminiWithFallback({ contents: [{ parts: [...parts, { text: prompt }] }], generationConfig: { temperature: 0.6, responseMimeType: 'application/json' } });
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
  catch { return { keywords: [restaurantName], mood: '활기찬', per_image: [], recommended_order: [] }; }
}

/* ════════════════════════════════════════════════════════════
   STEP 2 — Instagram Reels 스크립팅 (Gemini 2.5 Pro)
   Hook→Context→Hero→Detail→CTA 내러티브 + SNS 태그
   ════════════════════════════════════════════════════════════ */
async function generateScript(restaurantName, analysis) {
  const pi       = analysis.per_image || [];
  const order    = analysis.recommended_order?.length ? analysis.recommended_order : S.files.map((_, i) => i);
  const imgSummary = pi.map(p => `이미지${p.idx}(${p.type}/감성${p.emotional_score}점): 효과=${p.best_effect}, ${p.suggested_duration}s, "${p.focus}"`).join('\n');
  const isTrend = VIRAL_TRENDS[selectedTemplate];
  const totalTarget = isTrend
    ? isTrend.durations.reduce((a, v) => a + v, 0)
    : Math.min(Math.max(S.files.length * 3 + 6, 22), 42);

  const imgParts = [];
  // 업로드 순서대로 최대 8개 처리 (이미지 + 영상 프레임 혼용)
  for (let i = 0; i < Math.min(S.files.length, 8); i++) {
    const m = S.files[i];
    if (m.type === 'image') {
      const b64 = await toB64(m.file);
      imgParts.push({ inline_data: { mime_type: m.file.type || 'image/jpeg', data: b64 } });
    } else {
      try {
        const frames = await extractVideoFramesB64(m.file, 2);
        for (const fr of frames) imgParts.push({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } });
      } catch (e) { console.warn('[generateScript] 비디오 프레임 추출 실패 무시'); }
    }
  }

  const trendInstruction = isTrend ? `
[🚨 바이럴 트렌드 템플릿 강제 규칙 🚨]
당신은 현재 "${isTrend.name}" 포맷으로 영상을 만들어야 합니다.
- 무조건 정확히 **${isTrend.durations.length}개의 씬(scenes)**만 생성하세요!
- 각 씬의 duration은 다음 배열과 정확히 일치해야 합니다: [${isTrend.durations.join(', ')}]
- duration이 1초 미만인 씬은 말할 시간이 없으므로 narration을 비우거나("") 단어 1개만 넣으세요.
` : '';

  const prompt = `당신은 팔로워 50만+ 한국 맛집 인스타그램·유튜브 Shorts 전문 감독 "무브먼트(MOOVLOG)"입니다.
인천·서울·부천·경기 맛집 채널 / 매 영상 조회수 10만+ 달성하는 최상위 크리에이터.
${trendInstruction}
[음식점 정보]
이름: ${restaurantName}
분위기: ${analysis.mood || '감성적인'}
메뉴: ${(analysis.menu || []).join(', ') || restaurantName}
비주얼 훅: ${analysis.visual_hook || ''}
핵심 키워드: ${(analysis.keywords || []).join(', ')}

[선택된 콘텐츠 전략]
템플릿: ${TEMPLATE_HINTS[selectedTemplate] || TEMPLATE_HINTS.story}
훅 스타일: ${HOOK_HINTS[selectedHook] || HOOK_HINTS.question}

[비주얼 컷 분석]
${imgSummary || '분석 없음'}
권장 컷 순서: [${order.join(',')}]

[★ 조회수 폭발 공식 — 총 ${totalTarget}초, ${S.files.length}씬]
■ 씬1 Hook (1.8~2.5s): 첫 0.8초 안에 멈추게 하는 임팩트. 짧을수록 좋음.
  → caption1 예: "이거 실화?" / "이게 가능?" / "여기 실화?"
  → narration: 반말로 딱 2문장. "이거 실화야. 이 가격에 이게 나온다고."
■ 씬2 Context (2~3s): 공간·분위기 감성. 가고 싶게 만들기.
  → caption1: 장소명+감성 ("을지로 숨은 맛집" / "여기 분위기 미쳤다")
  → narration: "을지로에 이런 데가 있었어. 완전 숨은 맛집이잖아."
■ 씬3 Hero (3~4.5s): 대표 메뉴 클로즈업. 육즙·윤기·볼륨감·색감 극대화 묘사.
  → caption1: 재료나열 또는 비주얼 반응 ("연어 + 계란 + 밥" / "비주얼 미쳤다")
  → caption2: 리액션 ("단골 됩니다" / "저장각이다")
  → narration: "육즙이 터지는 거 봐. 바삭하고 촉촉한 게 진짜 미쳤다."
■ 씬4~N-1 Detail (2.5~3.5s): 식감·온도·두께 입체적 묘사. 직접 먹는 것처럼.
■ 씬N CTA (1.8~2.5s): 저장·팔로우 유도. 딱 2문장.
  → "여기 꼭 가봐. 저장해두면 나중에 고마워."

[★ 자막-내레이션 완전 일치 규칙 — 가장 중요]
⚠️ caption1/caption2는 반드시 해당 씬의 narration에서 그대로 가져온 핵심 단어/구절이어야 한다!
- narration이 "육즙이 터지는 거 봐. 바삭하고 촉촉해." → caption1="육즙 터진다" caption2="바삭 촉촉"
- narration이 "이거 실화야. 이 가격에 이게 나온다고." → caption1="이거 실화야" caption2="이 가격에.."
- narration이 "분위기가 너무 좋아. 여기 데이트 코스야." → caption1="분위기 미쳤다" caption2="데이트 코스"
- 절대 금지: narration과 전혀 다른 내용을 caption에 넣는 것

[★ 틱톡/릴스 스타일 자막 규칙]
- caption1: narration 첫 임팩트 구절 that 4~8자 (최대 10자), 반말, 구어체.
  ✅ 맞는 예: "이거 뭐냐", "육즙 터짐", "진짜야?", "여기 실화", "향이 미침"
  ✅ 재료 나열도 OK: "연어 + 계란 + 밥", "3만원인데?"
  ❌ 틀린 예: narration에 없는 내용, 광고체, 존댓말
- caption2: narration 후반 핵심 구절. 4~8자, 리액션형. 없으면 빈 문자열 허용.
  ✅ 맞는 예: narration 마지막 문장의 핵심어 ("단골 됩니다", "저장각이다", "찐이야")
  ⚠️ caption1+caption2 합쳐서 narration 전체를 2줄로 요약하는 느낌이어야 함
- subtitle_style: "hook"(훅)|"detail"(디테일)|"hero"(대표메뉴)|"cta"(콜투액션)
- subtitle_position: "center"|"lower"|"upper"
- narration: 아래 규칙 엄격 준수
  • 반드시 해당 이미지에서 실제로 보이는 것을 묘사할 것 (메뉴명, 색감, 식감, 굽기, 윤기 등)
  • 틱톡 호흡: 한 씬 나레이션 총합 15글자 이하 필수. 1~2문장만. 글자 수 초과 금지.
  • 마침표(.) 최소화, 쉼표(,)와 느낌표(!) 적극 활용 — TTS가 자연스러운 억양으로 읽음
  • 매 씬 같은 패턴(~거 봐 / ~미쳤다 / ~실화야) 3회 이상 반복 금지 — 다양한 시작 방식 사용
  • 다양한 시작: 궁금증("여기 뭐냐!"), 놀람("진짜 이거 된대"), 청각("시즈마 들려봐"), 한술("가격이 3만원이라고?"), 리액션("서렇될 듯" · "저장해") 등
  • 인스타 릴스 느낌: 반말, 감탄, 의성어, 구체적 맛·식감 묘사
  • 이미지 focus 값을 narration에 반드시 반영할 것
  • ✅ 예시(Hook): "이거 실화야! 이 가격에 이게 나온다고."
  • ✅ 예시(Hero): "육즙이, 진짜 터진다! 바삭하고 촉촉해."
  • ✅ 예시(Detail): "불향이 살아있어! 겉은 바삭, 속은 촉촉."
  • ✅ 예시(Ambiance): "여기 분위기, 완전 좋다! 데이트 코스야."
  • ✅ 예시(CTA): "여기 꼭 가봐! 저장해두면 나중에 고마워."
  • ❌ 금지(반드시): 습니다/세요/드립니다 등 존댓말, 추상적 설명, 이모지, 실제 영상에 없는 내용
  • 글자 수: ≤ duration × 7 (예: 3초 씬 → 21글자 이내)
- effect: 컷 분석 best_effect 우선, 없으면 hero→zoom-in / ambiance→pan-left / detail→zoom-in-slow
- duration: 컷 분석 suggested_duration 우선, 나레이션 길이 반영 (min:2.5 / max:6)
- idx: 0~${S.files.length - 1}

[★ 플랫폼별 최적화 SNS 태그]
- naver_clip_tags: 300자 이내 #태그 (지역명맛집 + 음식종류 + 가격대 + 감성키워드 + 채널명)
  형식: #협찬 #${restaurantName} #인천맛집 #맛집추천 #음식스타그램 #MOOVLOG ...
- youtube_shorts_tags: 유튜브 쇼츠 SEO 최적화 태그 100자 이내
  형식: #맛집 #Shorts #먹방 #한국맛집 #${restaurantName}
- instagram_caption: 인스타 릴스 최적화
  형식: 감성 본문 4~6줄(반말·이모지·개행 활용, 음식 맛·분위기·추천포인트 풍부하게) + 개행 + #태그 정확히 5개
  태그 5개 예시: #${restaurantName}맛집 #지역맛집 #음식스타그램 #reels #koreanfood
- tiktok_tags: 틱톡 바이럴 5개 태그 (#먹방 형태)

JSON만 반환 (백틱·설명 없이 순수 JSON):
{"title":"제목","hashtags":"#태그들","naver_clip_tags":"...","youtube_shorts_tags":"...","instagram_caption":"...","tiktok_tags":"...","scenes":[
  {"idx":0,"duration":2.5,"caption1":"이거 실화임?","caption2":"이 가격에..","subtitle_style":"hook","subtitle_position":"center","narration":"이거 실화야. 이 가격에 이게 나온다고.","effect":"zoom-out"},
  {"idx":1,"duration":3,"caption1":"을지로 숨은 맛집","caption2":"여기 진짜야","subtitle_style":"detail","subtitle_position":"lower","narration":"을지로에 이런 데가 있었어. 완전 숨은 맛집이잖아.","effect":"pan-left"},
  {"idx":2,"duration":3.5,"caption1":"비주얼 미쳤다","caption2":"단골 됩니다","subtitle_style":"hero","subtitle_position":"lower","narration":"육즙이 터지는 거 봐. 바삭하고 촉촉한 게 진짜 미쳤다.","effect":"zoom-in"}
]}`;

  const makeReq = async url => {
    const data = await apiPost(url, { contents: [{ parts: [...imgParts, { text: prompt }] }], generationConfig: { temperature: 0.92, responseMimeType: 'application/json' } });
    const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const obj  = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (!Array.isArray(obj.scenes) || !obj.scenes.length) throw new Error('스크립트 오류');
    return obj;
  };
  try { return await makeReq(getApiUrl('gemini-2.5-pro')); }
  catch (e) { console.warn('[Script] Pro → Flash 폴백:', e.message); return makeReq(getApiUrl('gemini-2.5-flash')); }
}

function toB64(file) {
  return new Promise((ok, fail) => { const r = new FileReader(); r.onload = e => ok(e.target.result.split(',')[1]); r.onerror = fail; r.readAsDataURL(file); });
}

/* ── 비디오에서 프레임 추출 (Base64 JPEG) ─────────────────── */
async function extractVideoFramesB64(file, count = 4) {
  return new Promise(resolve => {
    const vid = Object.assign(document.createElement('video'), { muted: true, playsInline: true, preload: 'metadata' });
    const url = URL.createObjectURL(file);
    vid.src = url;
    vid.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
    vid.onloadedmetadata = async () => {
      // iOS Safari 웹업: seeked 이벤트 실패 방지
      vid.play().then(() => vid.pause()).catch(() => {});
      const dur = isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 0;
      if (!dur) { URL.revokeObjectURL(url); resolve([]); return; }
      const c = document.createElement('canvas'); c.width = 360; c.height = 640;
      const cx = c.getContext('2d');
      // 💡 영상 전체 구간에서 고르게 프레임 추출 → AI가 영상 흐름 전체를 파악
      const sampleDur = dur;
      const frames = [], times = Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * sampleDur);
      for (const t of times) {
        await new Promise(r => {
          let settled = false;
          const onSeeked = () => {
            if (settled) return;
            settled = true;
            vid.removeEventListener('seeked', onSeeked);
            try {
              cx.drawImage(vid, 0, 0, 360, 640);
              frames.push({ base64: c.toDataURL('image/jpeg', 0.75).split(',')[1], mimeType: 'image/jpeg' });
            } catch (_) { /* 프레임 추출 실패 무시 */ }
            r();
          };
          vid.addEventListener('seeked', onSeeked);
          vid.currentTime = t;
          setTimeout(() => {
            if (!settled) { settled = true; vid.removeEventListener('seeked', onSeeked); r(); }
          }, 1500);
        });
      }
      URL.revokeObjectURL(url); resolve(frames);
    };
  });
}
/* ════════════════════════════════════════════════════════════
   SNS 태그 채우기
   ════════════════════════════════════════════════════════════ */
function buildSNSTags(script) {
  if (!D.snsWrap) return;
  const fill = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t || ''; };
  fill('tagNaver', script.naver_clip_tags || ''); fill('tagYoutube', script.youtube_shorts_tags || '');
  fill('tagInsta', script.instagram_caption || ''); fill('tagTiktok', script.tiktok_tags || '');
  D.snsWrap.hidden = false;
}

/* ════════════════════════════════════════════════════════════
   STEP 3 — TTS 시스템 v3 (Typecast 우선 + Gemini 폴백)
   ────────────────────────────────────────────────────────────
   우선순위: Typecast ssfm-v30 ko → Gemini TTS → 무음
   버그 수정 유지: system_instruction 제거, buf.duration 체크,
                   .slice(0) 복사, concurrency 병렬, 429 보호
   ════════════════════════════════════════════════════════════ */

// Typecast API 설정
// 한국어 남성 보이스 ID — Typecast 콘솔(app.typecast.ai)에서 배우 선택 후 localStorage.setItem('moovlog_typecast_voice', 'tc_...') 으로 변경 가능
const TYPECAST_VOICE_ID = localStorage.getItem('moovlog_typecast_voice') || 'tc_5d654ea6b5ce05000143e79b';

const TTS_CONFIG = {
  models:      ['gemini-2.5-flash-preview-tts', 'gemini-2.0-flash-exp', 'gemini-1.5-flash'],
  voices:      ['Fenrir', 'Orus', 'Charon', 'Kore', 'Aoede'],
  concurrency: 1,
  retryDelay:  3000, // 실패 시 3초 대기 (구글 과부하 방지)
  maxRetry:    4,    // 4번까지 끈질기게 재시도
  sceneDelay:  3000, // 씬마다 3초 휴식 (구글 서버 차단 회피)
};

/* ── 나레이션 타입캐스트 스타일 전처리 ──────────────────────
   인스타 릴스처럼 자연스러운 호흡 유도
   ─────────────────────────────────────────────────────────── */
function preprocessNarration(text) {
  if (!text?.trim()) return '';
  return text
    // 이모지 제거 (TTS가 "불꽃 이모티콘" 등으로 읽어버림)
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[⭐🔥✨🍜📹📖📊🎬🤖💾🙏]/g, '')
    // 말줄임표(...) → 쉼표 변환 (자연스러운 호흡 유도, "점점점" 방지)
    .replace(/\.{2,}/g, ',')
    // 쉼표 뒤 자연 끊김 유도
    .replace(/,\s*/g, ', ')
    // 마침표 뒤 짧은 pause 유도
    .replace(/\.\s+([가-힣])/g, '. $1')
    // 느낌표 강조 유지
    .replace(/!+/g, '!')
    // 호흡 패턴 — "진짜", "와" 뒤 말을 끊어 생동감 추가
    .replace(/진짜(?![,.\s]*\.{2,})/g, '진짜...')
    .replace(/(?<![가-힣])와(?=[^가-힣a-zA-Z]|$)/g, '와...')
    // 마침표 뒤 줄바꿈 (TTS 문장 단위 pause)
    .replace(/\.\s*/g, '.\n')
    // 연속 공백 정리
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ── 전체 씬 TTS 병렬 생성 ───────────────────────────────── */
async function generateAllTTS(scenes) {
  const buffers     = new Array(scenes.length).fill(null);
  let successCount  = 0, failCount = 0, fatalStop = false;
  const useTypecast = _TYPECAST_KEYS.length > 0;

  const tasks = scenes.map((sc, i) => async () => {
    if (fatalStop || !sc.narration) return;
    const text = preprocessNarration(sc.narration);
    if (!text) return;
    try {
      if (useTypecast) {
        // 💡 키 풀(Pool) 로직: 타임아웃·429 등 어떤 에러든 rotateTypeCastKey()로 다음 키를 끝까지 시도
        let tcBuf = null;
        let tcErr = null;
        for (let attempt = 0; attempt < _TYPECAST_KEYS.length; attempt++) {
          try {
            tcBuf = await fetchTypeCastTTS(text); // 현재 활성 키 사용
            break; // 성공 시 탈출
          } catch (e2) {
            tcErr = e2;
            const m2 = e2.message || e2.name || '';
            console.warn(`[Typecast] 키 #${_tcKeyIdx + 1} 실패 (${m2}) → 다음 키 시도`);
            rotateTypeCastKey(); // 어떤 에러든 무조건 다음 키로 전환
          }
        }
        if (tcBuf) {
          buffers[i] = tcBuf; successCount++;
        } else {
          // 모든 Typecast 키 소진 → Gemini 폴백
          console.warn(`[Typecast] 키 ${_TYPECAST_KEYS.length}개 모두 소진 — Gemini로 전환 (${tcErr?.message || ''})`);
          toast(`Typecast 키 ${_TYPECAST_KEYS.length}개 모두 한도 — Gemini로 전환합니다`, 'inf');
          buffers[i] = await fetchTTSWithRetry(text, i);
          successCount++;
        }
      } else {
        buffers[i] = await fetchTTSWithRetry(text, i);
        successCount++;
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('TTS_403')) {
        fatalStop = true;
        toast('AI 보이스: API 키에 TTS 권한 없음 — 무음으로 진행합니다', 'inf');
      } else {
        failCount++;
        console.warn(`[TTS] 씬${i + 1} 최종 실패:`, msg);
      }
    }
  });

  // 순새 실행 + 씨 간 딥레이 (429 Rate Limit 방지)
  for (let i = 0; i < tasks.length; i++) {
    if (fatalStop) break;
    await tasks[i]();
    if (i < tasks.length - 1) await sleep(TTS_CONFIG.sceneDelay);
  }

  if (!fatalStop) {
    if (successCount === 0) {
      toast('AI 보이스 생성 실패 — 무음 영상으로 진행합니다', 'inf');
    } else if (failCount > 0) {
      toast(`AI 보이스 ${successCount}/${scenes.length}씬 완료 (${failCount}씬 무음)`, 'inf');
    } else {
      const engine = useTypecast ? 'Typecast' : 'Gemini';
      toast(`${engine} AI 보이스 ${successCount}씬 생성 완료 ✓`, 'ok');
    }
  }
  if (successCount > 0) updateAudioStatus('google-tts');
  return buffers;
}

/* ── Typecast TTS API 호출 (강제 타임아웃 + Polling 지원) ────────── */
async function fetchTypeCastTTS(text) {
  if (!text?.trim()) throw new Error('빈 텍스트');
  if (!audioCtx) ensureAudio();
  // 💡 호출 직전 현재 인덱스에 맞는 키를 확실히 가져옴
  const apiKey = _TYPECAST_KEYS[_tcKeyIdx % _TYPECAST_KEYS.length];
  if (!apiKey) throw new Error('TYPECAST_401: 사용 가능한 API 키 없음');
  console.log(`[Typecast 시도] 키 #${_tcKeyIdx + 1}/${_TYPECAST_KEYS.length} 사용 중...`);

  // 1. 합성 요청 (7초 이상 대기 시 강제 중단 → 다음 키로 넘어감)
  const res = await fetchWithTimeout('https://api.typecast.ai/v1/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
    body: JSON.stringify({
      voice_id:  TYPECAST_VOICE_ID,
      text:      text.trim(),
      model:     'ssfm-v30',
      language:  'kor',
      prompt:    { emotion_type: 'friendly' },
      output:    { volume: 100, audio_pitch: 1, audio_tempo: 1.27, audio_format: 'wav' },
    }),
  }, 7000);

  // 💡 에러 상태를 caller에게 정확히 전달 → 즉시 다음 키로 로테이션 유도
  if (!res.ok) {
    const _errData = await res.json().catch(() => ({}));
    const _errMsg  = _errData?.result?.message || `HTTP ${res.status}`;
    throw new Error(`TYPECAST_ERR_${res.status}: ${_errMsg}`);
  }

  const data = await res.json();
  const speakUrl = data?.result?.speak_v2_url;
  if (!speakUrl) throw new Error('Typecast speak_v2_url 누락');

  // 2. Polling (0.5초 간격, 1회당 4초 타임아웃, 최대 10초)
  let audioUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const pollRes = await fetchWithTimeout(speakUrl, { headers: { 'X-API-KEY': apiKey } }, 4000);
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      const status = pollData?.result?.status;
      if (status === 'DONE') { audioUrl = pollData?.result?.audio_download_url; break; }
      else if (status === 'FAILED') throw new Error('Typecast 오디오 합성 실패');
    } catch (e) {
      if (e.name === 'AbortError') { console.warn('[Typecast] Polling 지연 무시'); continue; }
      throw e;
    }
  }
  if (!audioUrl) throw new Error('Typecast 전체 응답 타임아웃 (10초 초과)');

  // 3. 완성된 오디오 다운로드 (10초 타임아웃)
  const audioRes = await fetchWithTimeout(audioUrl, {}, 10000);
  if (!audioRes.ok) throw new Error('Typecast 오디오 다운로드 실패');

  const ab = await audioRes.arrayBuffer();
  if (ab.byteLength < 100) throw new Error('Typecast 오디오 데이터 용량 너무 작음');

  const buf = await audioCtx.decodeAudioData(ab.slice(0));
  if (!buf || buf.duration < 0.05) throw new Error('Typecast 빈 오디오');

  console.log(`[Typecast ✓] ${buf.duration.toFixed(2)}s — ${text.substring(0, 15)}...`);
  return buf;
}

/* ── Gemini TTS 재시도 래퍼 ──────────────────────────────── */
async function fetchTTSWithRetry(text, sceneIdx) {
  let lastErr;
  for (let attempt = 0; attempt <= TTS_CONFIG.maxRetry; attempt++) {
    if (attempt > 0) await sleep(TTS_CONFIG.retryDelay * attempt);
    try {
      return await fetchGeminiTTS(text);
    } catch (e) {
      lastErr = e;
      if (e.message?.startsWith('TTS_403')) throw e;
      if (e.message?.startsWith('429')) {
        const waitSec = 5 * (attempt + 1);
        console.warn(`[TTS] 429 구글 서버 과부하: ${waitSec}초 강제 대기 후 재시도...`);
        await sleep(waitSec * 1000);
        continue;
      }
      console.warn(`[TTS] 씬${sceneIdx + 1} 시도${attempt + 1}:`, e.message);
    }
  }
  throw lastErr || new Error('TTS 재시도 초과');
}

/* ── Gemini TTS API 호출 (폴백) ──────────────────────────── */
async function fetchGeminiTTS(text) {
  if (!text?.trim()) throw new Error('빈 텍스트');
  let lastErr;

  for (const model of TTS_CONFIG.models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

    for (const voiceName of TTS_CONFIG.voices) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // ※ system_instruction 제거 — TTS 모드에서 400 오류 유발
            contents: [{ parts: [{ text: text.trim() }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
            },
          }),
        });

        // 모델 미지원 → 보이스 루프 탈출 후 다음 모델로
        if (res.status === 404 || res.status === 400) {
          lastErr = new Error(`model_unsupported:${model}`);
          break;
        }
        if (res.status === 403) {
          const d = await res.json().catch(() => ({}));
          throw new Error(`TTS_403: ${d?.error?.message || 'Forbidden'}`);
        }
        if (res.status === 429) throw new Error(`429: Rate limit`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          lastErr = new Error(d?.error?.message || `HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        const part = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
        if (!part?.inlineData?.data) { lastErr = new Error('오디오 데이터 없음'); continue; }

        const buf = await decodePCMAudio(
          part.inlineData.data,
          part.inlineData.mimeType || 'audio/L16;rate=24000'
        );
        if (!buf || buf.duration < 0.05) { lastErr = new Error('빈 오디오'); continue; }

        console.log(`[Gemini TTS ✓] ${model}/${voiceName} — ${buf.duration.toFixed(2)}s`);
        return buf;

      } catch (e) {
        if (e.message?.startsWith('TTS_403') || e.message?.startsWith('429')) throw e;
        lastErr = e;
        console.warn(`[TTS] ${model}/${voiceName}:`, e.message);
      }
    }
  }
  throw lastErr || new Error('TTS 전체 실패');
}

/* ── PCM 오디오 디코딩 (Gemini PCM 포맷용) ──────────────── */
async function decodePCMAudio(b64, mimeType) {
  if (!audioCtx) ensureAudio();
  if (!b64) throw new Error('빈 base64');

  let bytes;
  try {
    const binary = atob(b64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } catch { throw new Error('base64 디코딩 실패'); }

  if (bytes.length < 4) throw new Error('오디오 데이터 너무 짧음');

  const isPCM = mimeType?.includes('pcm') || mimeType?.includes('L16') || mimeType?.includes('linear');

  if (isPCM) {
    const sr = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || '24000');
    const n  = Math.floor(bytes.length / 2);
    if (n < 10) throw new Error('PCM 샘플 부족');
    const buf = audioCtx.createBuffer(1, n, sr);
    const ch  = buf.getChannelData(0);
    const dv  = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i < n; i++) ch[i] = dv.getInt16(i * 2, true) / 32768;
    return buf;
  }

  // WAV/MP3 → decodeAudioData
  // ※ .slice(0) 복사본 전달 — 공유 ArrayBuffer 참조 시 detached 오류 방지
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  try {
    return await audioCtx.decodeAudioData(ab.slice(0));
  } catch {
    // raw PCM16 재시도
    const n2 = Math.floor(bytes.length / 2);
    if (n2 < 10) throw new Error('RAW PCM 샘플 부족');
    const buf2 = audioCtx.createBuffer(1, n2, 24000);
    const ch2  = buf2.getChannelData(0);
    const dv2  = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let j = 0; j < n2; j++) ch2[j] = dv2.getInt16(j * 2, true) / 32768;
    return buf2;
  }
}

// OfflineAudioContext로 전체 오디오 사전 렌더링 (추후 export용)
async function prerenderAudio(totalDur) {
  const SR = 48000;
  // [FIX] 오디오가 씬 duration보다 길 수 있으므로 실제 최대 끝 시간으로 총 길이 결정
  let offset = 0, maxEnd = totalDur;
  for (let i = 0; i < S.script.scenes.length; i++) {
    const scDur = (S.script.scenes[i].duration > 0 && isFinite(S.script.scenes[i].duration))
      ? S.script.scenes[i].duration : 3;
    const buf = S.audioBuffers[i];
    if (buf) {
      const end = offset + buf.duration;
      if (end > maxEnd) maxEnd = end;
    }
    offset += scDur;
  }
  // 오디오 버퍼 길이 0이하 → OfflineAudioContext NotSupportedError 방지
  if (maxEnd <= 0) return null;

  const off = new OfflineAudioContext(1, Math.ceil(SR * (maxEnd + 0.1)), SR);

  // 1. 나레이션 트랙 믹싱
  offset = 0;
  for (let i = 0; i < S.script.scenes.length; i++) {
    const scDur = (S.script.scenes[i].duration > 0 && isFinite(S.script.scenes[i].duration))
      ? S.script.scenes[i].duration : 3;
    const buf = S.audioBuffers[i];
    if (buf) {
      const src = off.createBufferSource();
      src.buffer = buf;
      const narGain = off.createGain(); narGain.gain.value = 1.5;
      src.connect(narGain); narGain.connect(off.destination); src.start(offset);
    }
    offset += scDur;
  }

  const rendered = await off.startRendering();
  return rendered.getChannelData(0); // Float32Array@48kHz
}

function playSceneAudio(si, capture = false) {
  stopAudio();
  const buf = S.audioBuffers?.[si];
  const doStart = () => {
    if (buf && audioCtx) {
      const src = audioCtx.createBufferSource();
      src.buffer = buf; src.playbackRate.value = 1.0; // 자막 타이머와 1:1 싱크 — 속도는 Typecast tempo로 제어
      const narGain = audioCtx.createGain(); narGain.gain.value = 1.5; // 나레이션 볼륨 강화
      src.connect(narGain); narGain.connect(audioCtx.destination);
      if (capture && audioMixDest) narGain.connect(audioMixDest);
      src.start(); S.currentAudio = src;
      S.audioStartTs = audioCtx.currentTime; // resume 완료 후 캡처 — BUG B 수정
    } else {
      S.audioStartTs = audioCtx ? audioCtx.currentTime : 0;
      // Web Speech 폴백 — API 실패 시 완전 무음 방지
      if (!capture && S.script?.scenes?.[si]) playWebSpeech(S.script.scenes[si]);
      console.warn(`[Audio] 씬 ${si + 1} AI 오디오 없음: Web Speech 폴백 사용`);
    }
  };
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().then(doStart).catch(doStart); // resume 완료 후 start — BUG B 수정
  } else {
    doStart();
  }
}
// Web Speech 폴백 — AI TTS 실패 시 자동 호출, 남성 없어도 한국어 음성 사용
function playWebSpeech(sc) {
  if (!sc?.narration || typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(sc.narration);
  u.lang = 'ko-KR'; u.pitch = 1.1; u.rate = 1.05; u.volume = 1;
  const trySpeak = () => {
    const all  = speechSynthesis.getVoices();
    const pick = all.find(x => /male|남성/i.test(x.name) && x.lang.startsWith('ko'))
              || all.find(x => x.lang.startsWith('ko'))
              || null;
    if (pick) u.voice = pick;
    speechSynthesis.speak(u);
  };
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    trySpeak();
  } else {
    // 아직 로드 안 됨 — voiceschanged 돌 때까지 대기
    speechSynthesis.addEventListener('voiceschanged', trySpeak, { once: true });
  }
}
function stopAudio() {
  if (S.currentAudio) { try { S.currentAudio.stop(); } catch {} S.currentAudio = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/* ── BGM 제거 ─────────────────────────────────────────────── */
async function playBGM() {} // BGM 제거
function stopBGM()       {} // BGM 제거

/* ── Preload media ───────────────────────────────────────── */
async function preload() {
  S.loaded = [];

  for (const m of S.files) {
    if (m.type === 'image') {
      try {
        const img = await new Promise((ok, fail) => { const i = new Image(); i.src = m.url; i.onload = () => ok(i); i.onerror = () => fail(new Error('이미지 로드 실패')); });
        S.loaded.push({ type: 'image', src: img });
      } catch (e) { console.warn('[Preload] 이미지 건너뜀:', e.message); }
    } else {
      const vid = Object.assign(document.createElement('video'), { src: m.url, muted: true, loop: true, playsInline: true });
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      const loaded = await new Promise(r => {
        vid.onloadeddata = () => r(true);
        vid.onerror      = () => r(false);
        setTimeout(() => r(vid.readyState >= 2), 5000);
      });
      if (!loaded) {
        // 비디오 로드 실패 — 코덱 미지원 가능성
        console.warn('[Preload] 비디오 로드 실패:', m.file?.name || m.url);
        vid.src = '';
        vid._loadFailed = true;
        S.loaded.push({ type: 'video', src: vid });
        toast(`비디오 로드 실패: ${m.file?.name || ''}. MP4(H.264) 형식을 권장합니다`, 'inf');
      } else {
        vid.play().catch(() => {}); // canvas drawImage는 playing 상태 필요 (모바일)
        const dur = isFinite(vid.duration) ? vid.duration : 0;
        const maxOffset = Math.max(0, dur - 4.0);
        // AI 분석 순서와 일치하도록 랜덤 offset 제거 → 시작점 0으로 고정
        const offset = 0;
        S.loaded.push({ type: 'video', src: vid, offset });
      }
    }
  }
}

/* ── Player ──────────────────────────────────────────────── */
function setupPlayer() {
  S.playing = false; S.scene = 0; S.startTs = null; S.subAnimProg = 0;
  D.vProg.style.width = '0%'; renderFrame(0, 0); setPlayIcon(false); hideRepeatPrompt();
  const _ytFill = document.getElementById('ytProgressFill');
  if (_ytFill) _ytFill.style.width = '0%';
  S.loaded?.forEach(m => { if (m.type === 'video') m.src.currentTime = m.offset || 0; });
}
function togglePlay()  { S.playing ? pausePlay() : startPlay(); }
async function startPlay() {
  if (audioCtx?.state === 'suspended') {
    try { await audioCtx.resume(); } catch (_) {}
  }
  // 마지막 씬에서 종료된 상태로 재클릭 시 → 처음부터 재시작 (첫 컷 즉시 종료 버그 수정)
  if (S.script && !S.playing) {
    const lastIdx = S.script.scenes.length - 1;
    if (S.scene >= lastIdx) {
      S.scene = 0; S.startTs = null; S.subAnimProg = 0;
      D.vProg.style.width = '0%';
      if (D.vProgText) D.vProgText.textContent = '0%';
      highlightScene(0);
      S.loaded?.forEach(m => { if (m.type === 'video') m.src.currentTime = m.offset || 0; });
    }
  }
  S.playing = true; S.startTs = null; S.subAnimProg = 0;
  setPlayIcon(true); if (!S.muted) playSceneAudio(S.scene); tick();
}
function pausePlay()  { S.playing = false; if (S.raf) cancelAnimationFrame(S.raf); stopAudio(); setPlayIcon(false); }
function doReplay()   { pausePlay(); S.scene = 0; S.startTs = null; S.subAnimProg = 0; D.vProg.style.width = '0%'; renderFrame(0, 0); highlightScene(0); setTimeout(startPlay, 80); }
function toggleMute() {
  S.muted = !S.muted;
  D.muteIco.className = S.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  if (S.muted) { stopAudio(); } else if (S.playing) { playSceneAudio(S.scene); }
}
function setPlayIcon(pl) { D.playIco.className = pl ? 'fas fa-pause' : 'fas fa-play'; }

/* 재생 종료 → "계속 반복하시겠습니까?" 오버레이 표시 */
function showRepeatPrompt() {
  const overlay = document.getElementById('repeatOverlay');
  if (!overlay) { doReplay(); return; }
  overlay.hidden = false;
}
function hideRepeatPrompt() {
  const overlay = document.getElementById('repeatOverlay');
  if (overlay) overlay.hidden = true;
}

/* ── Tick loop (오디오 싱크 강화 버전) ──────────────────────────────────────────────── */
function tick() {
  const run = now => {
    if (!S.playing) return;

    // ── 씬 시작 타임스탬프 초기화
    if (S.startTs === null) {
      S.startTs = now;
      // S.audioStartTs는 playSceneAudio() 내 src.start() 직후 이미 정확히 캡처됨 — 여기서 덮어쓰지 않음
    }

    const sc = S.script?.scenes?.[S.scene];
    if (!sc) { S.playing = false; setPlayIcon(false); return; }

    // dur 방어: undefined/0/NaN → 기본 3초
    const dur = (sc.duration > 0 && isFinite(sc.duration)) ? sc.duration : 3;

    // 💡 핵심: 오디오가 있으면 AudioContext 시간 기준, 없으면 Date.now() 기준
    let el;
    const hasAudio = S.audioBuffers?.[S.scene] && S.currentAudio;
    if (hasAudio && audioCtx) {
      el = audioCtx.currentTime - S.audioStartTs;
    } else {
      el = (now - S.startTs) / 1000;
    }

    const prog = Math.min(el / dur, 1);

    // 진행바 업데이트
    const total = S.script.scenes.reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);
    const done  = S.script.scenes.slice(0, S.scene).reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);
    const pct   = Math.min((done + el) / total * 100, 100);
    D.vProg.style.width = pct + '%';
    if (D.vProgText) D.vProgText.textContent = Math.floor(pct) + '%';
    const _ytFill = document.getElementById('ytProgressFill');
    if (_ytFill) _ytFill.style.width = pct + '%';

    const _audioBuf  = S.audioBuffers?.[S.scene];
    const _audioDur  = _audioBuf?.duration ?? null;
    // [FIX] 오디오가 씬보다 짧을 때만 오디오 비율 적용, 아니면 씬 끝까지 자막 유지
    const _subTarget = (_audioDur && _audioDur < dur) ? Math.max(_audioDur / dur, 0.40) : 1.0;
    S.subAnimProg    = Math.min(prog / _subTarget, 1);

    // ── 렌더링 (에러가 나도 씬 전환 로직에 영향 없도록 별도 try/catch)
    const TD = Math.min(0.28, dur * 0.15);
    try {
      if (el >= dur - TD && S.scene < S.script.scenes.length - 1)
        drawTransition(S.scene, Math.min((el - (dur - TD)) / TD, 1));
      else renderFrame(S.scene, prog);
    } catch (err) {
      console.error('[tick] 렌더링 에러:', err.message, err.stack?.split('\n')?.[1]);
    }

    // ── 씬 전환 (렌더링 에러와 무관하게 항상 실행)
    if (prog >= 1) {
      if (S.scene < S.script.scenes.length - 1) {
        const _prevMedia = getMedia(S.script.scenes[S.scene]); // 전환 전 클립
        S.scene++;
        S.startTs = null;
        // S.audioStartTs 리셋 제거 — doStart() 내부에서 resume 완료 후 직접 설정됨 (BUG C 수정)
        S.subAnimProg = 0;
        highlightScene(S.scene);
        // � 스마트 씬 점프: 단일 영상은 씬 비율 타임스탬프로 강제 점프, 멀티 클립은 교체 시 0초
        const _nextMedia = getMedia(S.script.scenes[S.scene]);
        if (_nextMedia?.type === 'video' && _nextMedia.src) {
          if (S.files.length === 1) {
            // 🚀 Proportional Sync: 각 씬의 duration 합계 기반 정확한 비율 점프
            const _totalDur = S.script.scenes.reduce((a, sc) => a + (sc.duration > 0 ? sc.duration : 3), 0);
            const _elapsed  = S.script.scenes.slice(0, S.scene).reduce((a, sc) => a + (sc.duration > 0 ? sc.duration : 3), 0);
            const _vidDur = isFinite(_nextMedia.src.duration) ? _nextMedia.src.duration : 0;
            if (_vidDur > 0 && _totalDur > 0) _nextMedia.src.currentTime = (_elapsed / _totalDur) * _vidDur;
          } else if (_prevMedia !== _nextMedia) {
            _nextMedia.src.currentTime = 0;
          }
        }
        if (!S.muted) playSceneAudio(S.scene);
      } else {
        D.vProg.style.width = '100%'; S.playing = false; stopAudio(); setPlayIcon(false);
        showRepeatPrompt();
        return;
      }
    }
    S.raf = requestAnimationFrame(run);
  };
  S.raf = requestAnimationFrame(run);
}

/* ════════════════════════════════════════════════════════════
   CANVAS RENDER
   ════════════════════════════════════════════════════════════ */
function renderFrame(si, prog, subAnimOverride, skipClear) {
  const sc = S.script.scenes[si], media = getMedia(sc);
  const sap = subAnimOverride !== undefined ? subAnimOverride : S.subAnimProg;
  if (!skipClear) ctx.clearRect(0, 0, CW, CH);
  drawMedia(media, sc.effect, prog);
  drawVignetteGrad();
  drawColorGrade(prog);
  drawMoodOverlay(sc.subtitle_style, Math.min(prog * 3, 1));
  const _tplStyle = getTplStyle();
  if (_tplStyle.letterbox || sc.subtitle_style === 'hero') {
    drawLetterbox(Math.min(prog * 4, 1));
    if (sc.subtitle_style === 'hero') drawSparkles(prog);
  }
  drawSubtitle(sc, sap);
  if (si === 0) drawTopBadge();
  // ── [캡컷] 씬 진입 flash burst (0.10초, 더 강렬한 섬광 → 컷 타격감↑)
  if (!skipClear && prog < 0.10) {
    const flashT = 1 - prog / 0.10;
    ctx.fillStyle = `rgba(255,255,255,${flashT * 0.45})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}
function drawTransition(fi, t) {
  const e = ease(t);
  const nextStyle = S.script.scenes[fi + 1]?.subtitle_style || 'detail';
  const tplMode   = getTplStyle().transition || 'fade';
  if (nextStyle === 'hero') {
    // [캡컷] Zoom Burst: 이전 씬을 빠르게 줌아웃하며 다음 씬으로
    renderFrame(fi, 1);
    ctx.save();
    ctx.globalAlpha = e;
    // 줌인 시작 (0.92x) → 정상(1.0x)으로 → hero 에너제틱 진입
    const zScale = 0.92 + e * 0.08;
    ctx.translate(CW / 2, CH / 2);
    ctx.scale(zScale, zScale);
    ctx.translate(-CW / 2, -CH / 2);
    renderFrame(fi + 1, 0, 0, true);
    ctx.restore();
    // 흰 flash 오버레이 (피크 때 최대)
    const flashPeak = Math.sin(e * Math.PI);
    ctx.fillStyle = `rgba(255,255,255,${flashPeak * 0.22})`;
    ctx.fillRect(0, 0, CW, CH);
  } else if (nextStyle === 'hook' || tplMode === 'wipe') {
    // [캡컷] Whip Pan Up: 빠른 위아래 슬라이드 컷 (easeInOut 가속)
    renderFrame(fi, 1);
    const eStrong = e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, CH * (1 - eStrong), CW, CH * eStrong);
    ctx.clip();
    renderFrame(fi + 1, 0, 0, true);
    ctx.restore();
    // 경계선 흰빛
    const lineY = CH * (1 - eStrong);
    ctx.fillStyle = `rgba(255,255,255,${(1 - e) * 0.5})`;
    ctx.fillRect(0, lineY - 4 * SCALE, CW, 4 * SCALE);
  } else if (nextStyle === 'cta' || tplMode === 'zoom') {
    // [캡컷] Push Zoom: 강한 줌 버스트 전환
    renderFrame(fi, 1);
    const zOut = 1 + e * 0.18;   // 이전 씬 빠르게 확대
    ctx.save();
    ctx.globalAlpha = 1 - e * 0.6;
    ctx.translate(CW / 2, CH / 2); ctx.scale(zOut, zOut); ctx.translate(-CW / 2, -CH / 2);
    renderFrame(fi, 1, 1, true);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = e;
    ctx.translate(CW / 2, CH / 2); ctx.scale(0.88 + e * 0.12, 0.88 + e * 0.12); ctx.translate(-CW / 2, -CH / 2);
    renderFrame(fi + 1, 0, 0, true);
    ctx.restore();
  } else {
    // [캡컷] Smart Fade: 크로스페이드 + 미세 스케일
    renderFrame(fi, 1);
    ctx.save();
    ctx.globalAlpha = e;
    const sc = 0.97 + e * 0.03;
    ctx.translate(CW / 2, CH / 2); ctx.scale(sc, sc); ctx.translate(-CW / 2, -CH / 2);
    renderFrame(fi + 1, 0, 0, true);
    ctx.restore();
  }
}
// 특정 시간 t(초)에 해당하는 프레임 렌더링 (export용, 실시간 불필요)
function renderFrameAtTime(t) {
  let elapsed = 0;
  const sc = S.script.scenes;
  for (let i = 0; i < sc.length; i++) {
    const dur = (sc[i].duration > 0 && isFinite(sc[i].duration)) ? sc[i].duration : 3;
    if (t < elapsed + dur || i === sc.length - 1) {
      const prog        = Math.max(0, Math.min((t - elapsed) / dur, 1));
      const _ab = S.audioBuffers?.[i]; const _ad = _ab?.duration ?? null;
      // [FIX] tick()과 동일 계산: 오디오가 씬보다 짧을 때만 오디오 비율 적용
      const _stTarget = (_ad && _ad < dur) ? Math.max(_ad / dur, 0.20) : 1.0; // 0.40→0.20: 짧은 오디오에서도 자막 강제 정지 방지
      const subAnimProg = Math.min(prog / _stTarget, 1);
      const prevSubAnim = S.subAnimProg;
      S.subAnimProg = subAnimProg;
      const media       = getMedia(sc[i]);
      ctx.clearRect(0, 0, CW, CH);
      drawMedia(media, sc[i].effect, prog);
      drawVignetteGrad();
      drawColorGrade(prog);
      drawMoodOverlay(sc[i].subtitle_style, Math.min(prog * 3, 1));
      if (sc[i].subtitle_style === 'hero') {
        drawLetterbox(Math.min(prog * 4, 1));
        drawSparkles(prog);
      }
      drawSubtitle(sc[i], subAnimProg);
      if (i === 0) drawTopBadge();
      S.subAnimProg = prevSubAnim;
      return;
    }
    elapsed += dur;
  }
}
function getMedia(sc) { return S.loaded.length ? S.loaded[(sc.idx ?? 0) % S.loaded.length] : null; }

/* ── Ken Burns (캡컷급 10종 + easeInOut 강화) ────────────── */
function drawMedia(media, effect, prog) {
  if (!media) { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, CW, CH); return; }
  if (media.type === 'video') {
    const vid = media.src;
    if (vid._loadFailed || vid.readyState < 2) {
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, CW, CH); return;
    }
    if (vid.paused) vid.play().catch(() => {});
  }
  // 큐빅 이즈인아웃 — 가속감 극대화 (캡컷 특유의 탱글한 움직임)
  const e = prog < 0.5 ? 4 * prog * prog * prog : 1 - Math.pow(-2 * prog + 2, 3) / 2;
  let sc = 1, ox = 0, oy = 0, rot = 0;
  switch (effect) {
    case 'zoom-in':        sc = 1.0  + e * 0.25; break;         // 확대 (강)
    case 'zoom-in-slow':   sc = 1.0  + e * 0.10; break;         // 확대 (약)
    case 'zoom-out':       sc = 1.25 - e * 0.25; break;         // 축소
    case 'zoom-out-slow':  sc = 1.10 - e * 0.10; break;
    case 'pan-left':       sc = 1.15; ox =  (1 - e) * CW * 0.15; break;
    case 'pan-right':      sc = 1.15; ox = -(1 - e) * CW * 0.15; break;
    case 'float-up':       sc = 1.10; oy =  (1 - e) * CH * 0.08; break;
    case 'pan-up':         sc = 1.12; oy =  (1 - e) * CH * 0.10; break;
    case 'zoom-pan':       sc = 1.0 + e * 0.15; ox = (0.5 - e) * CW * 0.10; break;
    case 'drift':          sc = 1.08; ox = Math.sin(e * Math.PI) * CW * 0.06; break; // 부유
    default:               sc = 1.06 + e * 0.08;
  }
  const el = media.src;
  const sw = media.type === 'video' ? (el.videoWidth  || CW) : el.naturalWidth;
  const sh = media.type === 'video' ? (el.videoHeight || CH) : el.naturalHeight;
  const r  = Math.max(CW / sw, CH / sh), dw = sw * r, dh = sh * r;
  ctx.save();
  ctx.translate(CW / 2 + ox, CH / 2 + oy); ctx.scale(sc, sc);
  try {
    ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
  } catch (err) {
    console.warn('[drawMedia] drawImage 실패:', err.message);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
  }
  ctx.restore();
}

/* ── 시네마틱 컬러 그레이드 ──────────────────────────────── */
function drawColorGrade(prog) {
  // 연한 웜 톤 오버레이 (음식 영상 식욕 자극용)
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = 'rgba(255, 170, 60, 1)';
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();
}

/* ── 비네트 ──────────────────────────────────────────────── */
function drawVignetteGrad() {
  const tpl = getTplStyle();
  const topColor = tpl.overlay?.top    || 'rgba(0,0,0,0.10)';
  const botColor = tpl.overlay?.bottom || 'rgba(0,0,0,0.35)';
  const top = ctx.createLinearGradient(0, 0, 0, CH * 0.30);
  top.addColorStop(0, topColor); top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, CW, CH * 0.30);
  const bot = ctx.createLinearGradient(0, CH * 0.50, 0, CH);
  bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(0.55, 'rgba(0,0,0,0.40)'); bot.addColorStop(1, 'rgba(0,0,0,0.80)');
  ctx.fillStyle = bot; ctx.fillRect(0, CH * 0.50, CW, CH * 0.50);
}

/* ── [강화1] 씬 무드 컬러 오버레이 ──────────────────────── */
function drawMoodOverlay(style, alpha) {
  return; // 명암 정도 유지를 위해 무효화
}

/* ── [강화2] 시네마틱 레터박스 ───────────────────────────── */
function drawLetterbox(alpha) {
  if (!alpha) return;
  const barH = CH * 0.065;
  ctx.fillStyle = `rgba(0, 0, 0, ${0.88 * alpha})`;
  ctx.fillRect(0, 0, CW, barH);
  ctx.fillRect(0, CH - barH, CW, barH);
}

/* ── [강화2] Hero 스파클 파티클 ──────────────────────────── */
function drawSparkles(prog) {
  // deterministic: export 시에도 동일한 위치
  const phase = prog * Math.PI * 4;
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const seed1 = Math.sin(i * 127.1) * 0.5 + 0.5;
    const seed2 = Math.sin(i * 311.7 + 1.9) * 0.5 + 0.5;
    const px    = seed1 * CW;
    const py    = seed2 * CH * 0.55 + CH * 0.18;
    const twink = Math.sin(phase + i * 0.88) * 0.5 + 0.5;
    if (twink < 0.25) continue;
    const r     = (1.5 + seed1 * 2.5) * twink * SCALE;
    const a     = twink * 0.65;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 230, 120, ${a})`; ctx.fill();
    // 십자 반짝임
    ctx.strokeStyle = `rgba(255, 255, 200, ${a * 0.6})`;
    ctx.lineWidth = 0.8 * SCALE;
    ctx.beginPath();
    ctx.moveTo(px - r * 3, py); ctx.lineTo(px + r * 3, py);
    ctx.moveTo(px, py - r * 3); ctx.lineTo(px, py + r * 3);
    ctx.stroke();
  }
  ctx.restore();
}

/* ════════════════════════════════════════════════════════════
   SUBTITLE SYSTEM v2 — 20종 릴스/틱톡 스타일
   subtitle_style 값 → 렌더러 매핑
   기존 4종(hook/detail/hero/cta) 완전 호환 유지 +
   템플릿별 고유 스타일 자동 선택
   ════════════════════════════════════════════════════════════ */

const SUBTITLE_RENDERERS = {
  // 기존 스타일 (하위 호환)
  hook:          (sc, ap) => subStyle_Impact    (sc.subtitle, sc.subtitle_position || 'center', ap),
  detail:        (sc, ap) => subStyle_SlideUp   (sc.subtitle, sc.subtitle_position || 'lower',  ap),
  hero:          (sc, ap) => subStyle_HeroWord  (sc.subtitle, ap),
  cta:           (sc, ap) => subStyle_CTABounce (sc.subtitle, ap),
  // 릴스 트렌드 스타일
  neon:          (sc, ap) => subStyle_Neon        (sc.subtitle, sc.subtitle_position || 'lower', ap),
  split:         (sc, ap) => subStyle_Split       (sc.subtitle, ap),
  typewriter:    (sc, ap) => subStyle_Typewriter  (sc.subtitle, sc.subtitle_position || 'lower', ap),
  glitch:        (sc, ap) => subStyle_Glitch      (sc.subtitle, ap),
  bold_drop:     (sc, ap) => subStyle_BoldDrop    (sc.subtitle, sc.subtitle_position || 'lower', ap),
  pill:          (sc, ap) => subStyle_Pill        (sc.subtitle, sc.subtitle_position || 'lower', ap),
  outline:       (sc, ap) => subStyle_Outline     (sc.subtitle, sc.subtitle_position || 'lower', ap),
  gradient_text: (sc, ap) => subStyle_GradientText(sc.subtitle, sc.subtitle_position || 'lower', ap),
  shake:         (sc, ap) => subStyle_Shake       (sc.subtitle, ap),
  word_by_word:  (sc, ap) => subStyle_WordByWord  (sc.subtitle, sc.subtitle_position || 'lower', ap),
  underline:     (sc, ap) => subStyle_Underline   (sc.subtitle, sc.subtitle_position || 'lower', ap),
  kinetic:       (sc, ap) => subStyle_Kinetic     (sc.subtitle, ap),
  stamp:         (sc, ap) => subStyle_Stamp       (sc.subtitle, ap),
  shadow_pop:    (sc, ap) => subStyle_ShadowPop   (sc.subtitle, sc.subtitle_position || 'lower', ap),
  minimal:       (sc, ap) => subStyle_Minimal     (sc.subtitle, sc.subtitle_position || 'lower', ap),
  retro:         (sc, ap) => subStyle_Retro       (sc.subtitle, ap),
};

/* 템플릿별 기본 스타일 오버라이드 (detail/hook 씬만 적용, hero/cta는 고정) */
const TEMPLATE_SUB_STYLE = {
  cinematic: { detail: 'minimal',      hook: 'outline'       },
  viral:     { detail: 'bold_drop',    hook: 'impact'        },
  aesthetic: { detail: 'pill',         hook: 'gradient_text' },
  mukbang:   { detail: 'word_by_word', hook: 'stamp'         },
  vlog:      { detail: 'typewriter',   hook: 'underline'     },
  review:    { detail: 'split',        hook: 'retro'         },
  story:     { detail: 'kinetic',      hook: 'shadow_pop'    },
  info:      { detail: 'outline',      hook: 'pill'          },
};

function drawSubtitle(sc, animProg) {
  const cap1 = sc.caption1 || sc.subtitle || '';
  const cap2 = sc.caption2?.trim() ? sc.caption2 : '';
  if (!cap1) return;

  // [FIX] caption2 전환점: 고정 0.50 → cap1/cap2 글자 수 비율로 동적 계산
  // 예: cap1="육즙 터진다"(6자) + cap2="단골 됩니다"(5자) → 전환점 54.5%
  let switchPt = 0.50;
  if (cap2) {
    const len1 = cap1.replace(/\s/g, '').length || 1;
    const len2 = cap2.replace(/\s/g, '').length || 1;
    switchPt = Math.min(Math.max(len1 / (len1 + len2), 0.35), 0.65);
  }
  let text, localAp;
  if (cap2 && animProg >= switchPt) {
    text    = cap2;
    localAp = Math.min((animProg - switchPt) / (1.0 - switchPt), 1);
  } else {
    text    = cap1;
    localAp = cap2 ? Math.min(animProg / switchPt, 1) : animProg;
  }

  ctx.save();

  // 자막 글자 수가 많으면 화면 밖으로 나가지 않도록 자동 축소 (최소 0.6배)
  const textLen = text.replace(/\s/g, '').length;
  if (textLen > 10) {
    const shrink = Math.max(0.60, 10 / textLen);
    ctx.translate(CW / 2, CH / 2);
    ctx.scale(shrink, shrink);
    ctx.translate(-CW / 2, -CH / 2);
  }

  let style = sc.subtitle_style || 'detail';
  const tplOverride = TEMPLATE_SUB_STYLE[selectedTemplate];
  if (tplOverride && style !== 'hero' && style !== 'cta') {
    style = tplOverride[style] || tplOverride['detail'] || style;
  }
  // 렌더러가 sc.subtitle을 읽으므로 표시할 텍스트로 임시 교체 후 복원
  const _orig = sc.subtitle;
  sc.subtitle = text;
  try {
    (SUBTITLE_RENDERERS[style] || SUBTITLE_RENDERERS.detail)(sc, localAp);
  } finally {
    sc.subtitle = _orig; // 에러 발생 시에도 반드시 복원
  }
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   공통 헬퍼
   ────────────────────────────────────────────────────────── */
function subY(pos) {
  return pos === 'upper' ? CH * 0.20 : pos === 'center' ? CH * 0.50 : CH - 195 * SCALE;
}
function subBg(cy, h, alpha) {
  const grad = ctx.createLinearGradient(0, cy - h, 0, cy + h);
  grad.addColorStop(0,   `rgba(0,0,0,0)`);
  grad.addColorStop(0.3, `rgba(0,0,0,${0.22 * alpha})`);
  grad.addColorStop(0.7, `rgba(0,0,0,${0.22 * alpha})`);
  grad.addColorStop(1,   `rgba(0,0,0,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, cy - h, CW, h * 2);
}
function getTplHL()        { return getTplStyle().subtitle?.hlColor || '#FFE033'; }
function getTplColor()     { return getTplStyle().subtitle?.color   || '#FFFFFF'; }
function getTplFontSz(base){ return base * SCALE * (getTplStyle().subtitle?.fontSize || 1.0); }

/* ── CapCut 스타일 공통 렌더러 (v2 — 캡컷급 업그레이드)
   · 단어별 초고속 팝인 (0.08s 간격)
   · 오버슛 1.42x → 1.0x 강한 스프링 바운스
   · 강조 단어: 풀사이즈 배경 박스 + 두꺼운 그림자
   · 비강조: 두꺼운 검은 스트로크 윤곽 + 미세 그림자
   ──────────────────────────────────────────────────────────── */
function capWords(text, cx, cy, maxSz, color, hlIdx, ap) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return;
  ctx.save();
  const hlColor = getTplHL();
  let sz = maxSz;
  ctx.font = `900 ${sz}px "Noto Sans KR", Impact, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let wM = words.map(w => ctx.measureText(w).width);
  const sp = () => sz * 0.26;
  const tot = () => wM.reduce((a, b) => a + b, 0) + sp() * (words.length - 1);
  if (tot() > CW - SCALE * 50) {
    sz = Math.max(SCALE * 32, Math.floor(sz * (CW - SCALE * 50) / tot()));
    ctx.font = `900 ${sz}px "Noto Sans KR", Impact, sans-serif`;
    wM = words.map(w => ctx.measureText(w).width);
  }
  const N    = words.length;
  const step = 0.85 / Math.max(N, 1);   // 나레이션 속도에 맞춰 단어 순차 등장 (0.48 → 0.85)
  const sw   = Math.max(sz * 0.13, SCALE * 7);
  let x = cx - tot() / 2;
  words.forEach((word, i) => {
    const wProg = Math.max(0, Math.min(1, (ap - i * step) / (step * 1.5)));
    const drawX = x;
    x += wM[i] + sp();
    if (wProg <= 0) return;
    // 스프링 바운스: 0→1.55(오버슛)→1.0 + 진입 시 미세 회전
    let scl, rot = 0;
    if (wProg < 0.45) {
      scl = (wProg / 0.45) * 1.55;          // 빠르게 1.55x까지 확대
      rot = Math.sin(i * 2) * 0.12 * (1 - wProg / 0.45); // 단어별 방향이 다른 시차 기울기
    } else if (wProg < 0.72) {
      scl = 1.55 - ((wProg - 0.45) / 0.27) * 0.55;  // 1.55 → 1.0으로 복귀
    } else {
      // 미세 진동 (2회 리바운드)
      const vibT = (wProg - 0.72) / 0.28;
      scl = 1.0 + Math.sin(vibT * Math.PI * 2) * 0.04 * (1 - vibT);
    }
    const alpha = Math.min(wProg * 5, 1);
    const wx    = drawX + wM[i] / 2;
    const isHL  = (i === hlIdx);
    // 자동 키워드 강조 감지
    const KEYWORDS = ['진짜', '대박', '미쳤다', '역대급', '최고', '꼭', '실화', '잔낙', '업업', '얼마'];
    const isKeyword = KEYWORDS.some(k => word.includes(k));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(wx, cy); ctx.scale(scl, scl); ctx.rotate(rot);
    if (isHL || isKeyword) {
      // [캔컷] 강조 단어: 배경 박스 + 특수 코드 주스
      const padX = sz * 0.18, padY = sz * 0.14;
      const bw = wM[i] + padX * 2, bh = sz * 1.15;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = sz * 0.25;
      ctx.fillStyle = isKeyword && !isHL ? '#FF2D55' : hlColor; // 키워드면 핯핑크
      roundRect(ctx, -wM[i] / 2 - padX, -bh / 2, bw, bh, Math.min(bh * 0.28, 16 * SCALE));
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(word, -wM[i] / 2, 0);
    } else {
      // [캡컷] 일반 단어: 굵은 검은 스트로크 + 드롭 섀도우
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = sz * 0.15;
      ctx.shadowOffsetY = sz * 0.05;
      ctx.lineWidth = sw; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.98)';
      ctx.strokeText(word, -wM[i] / 2, 0);
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = color;
      ctx.fillText(word, -wM[i] / 2, 0);
    }
    ctx.restore();
  });
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ① Impact — 첫 단어 강조 (기존 hook)
   ────────────────────────────────────────────────────────── */
function subStyle_Impact(text, pos, ap) {
  const sz = getTplFontSz(96);
  const y  = subY(pos);
  subBg(y, sz, Math.min(ap * 3, 1));
  capWords(text, CW / 2, y, sz, getTplColor(), 0, ap);
}

/* ──────────────────────────────────────────────────────────
   ② SlideUp — 아래서 위로 슬라이드 (기존 detail)
   ────────────────────────────────────────────────────────── */
function subStyle_SlideUp(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const sz    = getTplFontSz(74);
  const baseY = subY(pos);
  const y     = baseY + (1 - eased) * 32 * SCALE;
  subBg(y, sz, Math.min(ap * 3, 1));
  capWords(text, CW / 2, y, sz, getTplColor(), null, ap);
}

/* ──────────────────────────────────────────────────────────
   ③ HeroWord — 마지막 단어 클라이맥스 (기존 hero)
   ────────────────────────────────────────────────────────── */
function subStyle_HeroWord(text, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const sz    = getTplFontSz(88);
  const y     = CH - 188 * SCALE + (1 - eased) * 24 * SCALE;
  const words = text.split(/\s+/).filter(Boolean);
  subBg(y, sz, Math.min(ap * 3, 1));
  capWords(text, CW / 2, y, sz, getTplColor(), words.length - 1, ap);
}

/* ──────────────────────────────────────────────────────────
   ④ CTABounce — 바운스 콜투액션 (기존 cta)
   ────────────────────────────────────────────────────────── */
function subStyle_CTABounce(text, ap) {
  const eased  = ease(Math.min(ap * 2.5, 1));
  const bounce = ap < 0.4 ? Math.sin(ap * Math.PI * 2.5) * 14 * SCALE : 0;
  const sz     = getTplFontSz(80);
  const y      = CH - 128 * SCALE + (1 - eased) * 28 * SCALE - bounce;
  subBg(y, sz, Math.min(ap * 3, 1));
  capWords(text, CW / 2, y, sz, getTplHL(), 0, ap);
}

/* ──────────────────────────────────────────────────────────
   ⑤ Neon — 네온 글로우 효과
   ────────────────────────────────────────────────────────── */
function subStyle_Neon(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const y     = subY(pos) + (1 - eased) * 20 * SCALE;
  const sz    = getTplFontSz(72);
  const alpha = Math.min(ap * 3, 1);
  const hl    = getTplHL();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  [18 * SCALE, 10 * SCALE, 4 * SCALE].forEach((blur, i) => {
    ctx.shadowColor = hl; ctx.shadowBlur = blur;
    ctx.fillStyle = i < 2 ? 'transparent' : hl;
    if (i === 2) ctx.fillText(text, CW / 2, y);
  });
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑥ Split — 두 줄 좌우 슬라이드인
   ────────────────────────────────────────────────────────── */
function subStyle_Split(text, ap) {
  const words = text.split(/\s+/).filter(Boolean);
  const half  = Math.ceil(words.length / 2);
  const line1 = words.slice(0, half).join(' ');
  const line2 = words.slice(half).join(' ');
  const sz    = getTplFontSz(68);
  const baseY = CH - 230 * SCALE;
  const eased = ease(Math.min(ap * 2.2, 1));
  ctx.save();
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = Math.min(ap * 4, 1);
  ctx.save();
  ctx.translate((1 - eased) * -80 * SCALE, 0);
  ctx.lineWidth = 8 * SCALE; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.strokeText(line1, CW / 2, baseY);
  ctx.fillStyle = getTplColor(); ctx.fillText(line1, CW / 2, baseY);
  ctx.restore();
  if (line2) {
    ctx.save();
    ctx.translate((1 - eased) * 80 * SCALE, 0);
    ctx.lineWidth = 8 * SCALE; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.strokeText(line2, CW / 2, baseY + sz * 1.3);
    ctx.fillStyle = getTplHL(); ctx.fillText(line2, CW / 2, baseY + sz * 1.3);
    ctx.restore();
  }
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑦ Typewriter — 한 글자씩 타이핑
   ────────────────────────────────────────────────────────── */
function subStyle_Typewriter(text, pos, ap) {
  const visLen = Math.floor(ap * text.length * 1.4);
  const shown  = text.slice(0, Math.min(visLen, text.length));
  const y      = subY(pos);
  const sz     = getTplFontSz(68);
  subBg(y, sz * 0.9, Math.min(ap * 4, 1));
  ctx.save();
  ctx.font = `700 ${sz}px "Noto Sans KR", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = 1;
  ctx.lineWidth = 7 * SCALE; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.strokeText(shown, CW / 2, y);
  ctx.fillStyle = getTplColor(); ctx.fillText(shown, CW / 2, y);
  if (visLen < text.length) {
    const tm = ctx.measureText(shown);
    const cx = CW / 2 + tm.width / 2 + 4 * SCALE;
    ctx.fillStyle = getTplHL();
    ctx.fillRect(cx, y - sz * 0.5, 3 * SCALE, sz);
  }
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑧ Glitch — RGB 글리치
   ────────────────────────────────────────────────────────── */
function subStyle_Glitch(text, ap) {
  const y         = CH - 200 * SCALE;
  const sz        = getTplFontSz(78);
  const glitchAmt = ap < 0.3 ? (0.3 - ap) * 18 * SCALE : 0;
  ctx.save();
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = Math.min(ap * 3, 1);
  if (glitchAmt > 0) {
    ctx.fillStyle = 'rgba(255,0,80,0.7)';
    ctx.fillText(text, CW / 2 - glitchAmt, y - 2 * SCALE);
    ctx.fillStyle = 'rgba(0,200,255,0.7)';
    ctx.fillText(text, CW / 2 + glitchAmt, y + 2 * SCALE);
  }
  ctx.lineWidth = 8 * SCALE; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.strokeText(text, CW / 2, y);
  ctx.fillStyle = getTplColor(); ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑨ BoldDrop — 위에서 떨어지며 임팩트
   ────────────────────────────────────────────────────────── */
function subStyle_BoldDrop(text, pos, ap) {
  const target       = subY(pos);
  const eased        = ease(Math.min(ap * 3, 1));
  const dropProgress = ap < 0.5 ? (ap / 0.5) : 1;
  const overshoot    = ap < 0.5 ? Math.sin(ap * Math.PI) * 20 * SCALE : 0;
  const y  = (CH * 0.05) + (target - CH * 0.05) * ease(dropProgress) + overshoot;
  const sz = getTplFontSz(82);
  subBg(y, sz * 0.9, eased);
  ctx.save();
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = Math.min(ap * 5, 1);
  ctx.lineWidth = 10 * SCALE; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000'; ctx.strokeText(text, CW / 2, y);
  ctx.fillStyle = getTplColor(); ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑩ Pill — 배경 알약 박스
   ────────────────────────────────────────────────────────── */
function subStyle_Pill(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const sz    = getTplFontSz(64);
  const y     = subY(pos) + (1 - eased) * 24 * SCALE;
  const alpha = Math.min(ap * 3, 1);
  ctx.save();
  ctx.font = `800 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw  = ctx.measureText(text).width;
  const pad = { x: 28 * SCALE, y: 16 * SCALE };
  const bx  = CW / 2 - tw / 2 - pad.x;
  const by  = y - sz * 0.58 - pad.y;
  const bw  = tw + pad.x * 2;
  const bh  = sz * 1.16 + pad.y * 2;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  roundRect(ctx, bx, by, bw, bh, bh / 2); ctx.fill();
  ctx.strokeStyle = getTplHL();
  ctx.lineWidth = 2.5 * SCALE;
  roundRect(ctx, bx, by, bw, bh, bh / 2); ctx.stroke();
  ctx.fillStyle = getTplColor(); ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑪ Outline — 텍스트 테두리만
   ────────────────────────────────────────────────────────── */
function subStyle_Outline(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const sz    = getTplFontSz(70);
  const y     = subY(pos) + (1 - eased) * 20 * SCALE;
  const alpha = Math.min(ap * 3, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 10 * SCALE; ctx.lineJoin = 'round';
  ctx.strokeStyle = getTplHL(); ctx.strokeText(text, CW / 2, y);
  ctx.lineWidth = 2 * SCALE;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(text, CW / 2, y);
  ctx.fillStyle = getTplColor(); ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑫ GradientText — 그라데이션 컬러 텍스트
   ────────────────────────────────────────────────────────── */
function subStyle_GradientText(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const sz    = getTplFontSz(72);
  const y     = subY(pos) + (1 - eased) * 24 * SCALE;
  const alpha = Math.min(ap * 3, 1);
  ctx.save();
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = alpha;
  const tw   = ctx.measureText(text).width;
  const grad = ctx.createLinearGradient(CW / 2 - tw / 2, 0, CW / 2 + tw / 2, 0);
  const hl   = getTplHL();
  grad.addColorStop(0, getTplColor());
  grad.addColorStop(0.5, hl);
  grad.addColorStop(1, getTplColor());
  ctx.lineWidth = 9 * SCALE; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.92)'; ctx.strokeText(text, CW / 2, y);
  ctx.fillStyle = grad; ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑬ Shake — 진동 효과
   ────────────────────────────────────────────────────────── */
function subStyle_Shake(text, ap) {
  const y        = CH - 200 * SCALE;
  const sz       = getTplFontSz(80);
  const alpha    = Math.min(ap * 3, 1);
  const shakeAmt = ap < 0.25 ? (0.25 - ap) / 0.25 * 6 : 0;
  const dx       = shakeAmt * Math.sin(ap * 120);
  const dy       = shakeAmt * Math.cos(ap * 90);
  subBg(y, sz, alpha);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(dx, dy);
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 9 * SCALE; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.97)'; ctx.strokeText(text, CW / 2, y);
  ctx.fillStyle = getTplColor(); ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑭ WordByWord — 단어별 팝인 하이라이트
   ────────────────────────────────────────────────────────── */
function subStyle_WordByWord(text, pos, ap) {
  const words = text.split(/\s+/).filter(Boolean);
  const y     = subY(pos);
  const sz    = getTplFontSz(74);
  const step  = 1.0 / words.length;
  subBg(y, sz, Math.min(ap * 3, 1));
  ctx.save();
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const widths = words.map(w => ctx.measureText(w).width);
  const sp     = sz * 0.26;
  const total  = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let x        = CW / 2 - total / 2;
  words.forEach((word, i) => {
    const wProgress = Math.max(0, Math.min(1, (ap - i * step) / step));
    const isActive  = Math.floor(ap / step) === i;
    const scl       = wProgress < 0.5 ? wProgress / 0.5 * 1.2 : 1.2 - (wProgress - 0.5) / 0.5 * 0.2;
    const wx        = x + widths[i] / 2;
    if (wProgress > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(wProgress * 5, 1);
      ctx.translate(wx, y);
      ctx.scale(scl, scl);
      if (isActive) {
        const pad = 8 * SCALE;
        ctx.fillStyle = getTplHL();
        roundRect(ctx, -widths[i] / 2 - pad, -sz * 0.56, widths[i] + pad * 2, sz * 1.12, 6 * SCALE);
        ctx.fill();
        ctx.fillStyle = '#111'; ctx.fillText(word, -widths[i] / 2, 0);
      } else {
        ctx.lineWidth = 7 * SCALE; ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.strokeText(word, -widths[i] / 2, 0);
        ctx.fillStyle = getTplColor(); ctx.fillText(word, -widths[i] / 2, 0);
      }
      ctx.restore();
    }
    x += widths[i] + sp;
  });
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑮ Underline — 하단 밑줄 강조
   ────────────────────────────────────────────────────────── */
function subStyle_Underline(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const sz    = getTplFontSz(68);
  const y     = subY(pos) + (1 - eased) * 20 * SCALE;
  const alpha = Math.min(ap * 3, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `800 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 7 * SCALE; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.strokeText(text, CW / 2, y);
  ctx.fillStyle = getTplColor(); ctx.fillText(text, CW / 2, y);
  const tw  = ctx.measureText(text).width;
  const ulW = tw * Math.min(ap * 2.2, 1);
  const ulY = y + sz * 0.62;
  ctx.strokeStyle = getTplHL();
  ctx.lineWidth   = 4 * SCALE;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(CW / 2 - tw / 2, ulY);
  ctx.lineTo(CW / 2 - tw / 2 + ulW, ulY);
  ctx.stroke();
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑯ Kinetic — 각 단어가 다른 방향에서 날아옴
   ────────────────────────────────────────────────────────── */
function subStyle_Kinetic(text, ap) {
  const words = text.split(/\s+/).filter(Boolean);
  const baseY = CH - 210 * SCALE;
  const sz    = getTplFontSz(70);
  const step  = 0.5 / words.length;
  ctx.save();
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const widths = words.map(w => ctx.measureText(w).width);
  const sp     = sz * 0.26;
  const total  = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let x        = CW / 2 - total / 2;
  const dirs   = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  words.forEach((word, i) => {
    const wProg    = Math.max(0, Math.min(1, (ap - i * step) / (step * 1.8)));
    const eW       = ease(wProg);
    const [dx, dy] = dirs[i % 4];
    const ox       = dx * (1 - eW) * 60 * SCALE;
    const oy       = dy * (1 - eW) * 40 * SCALE;
    const wx       = x + widths[i] / 2;
    if (wProg > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(wProg * 4, 1);
      ctx.lineWidth = 8 * SCALE; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.95)';
      ctx.strokeText(word, wx + ox, baseY + oy);
      ctx.fillStyle = i % 2 === 0 ? getTplColor() : getTplHL();
      ctx.fillText(word, wx + ox, baseY + oy);
      ctx.restore();
    }
    x += widths[i] + sp;
  });
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑰ Stamp — 도장 찍히는 효과
   ────────────────────────────────────────────────────────── */
function subStyle_Stamp(text, ap) {
  const y    = CH / 2;
  const sz   = getTplFontSz(92);
  const scl  = ap < 0.4 ? 2.0 - (ap / 0.4) * 1.0 : 1.0;
  const alpha = Math.min(ap * 8, 1);
  const rot  = ap < 0.4 ? (0.4 - ap) / 0.4 * 0.08 : 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(CW / 2, y);
  ctx.scale(scl, scl);
  ctx.rotate(rot);
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw  = ctx.measureText(text).width;
  const pad = 20 * SCALE;
  ctx.strokeStyle = getTplHL(); ctx.lineWidth = 6 * SCALE;
  roundRect(ctx, -tw / 2 - pad, -sz * 0.62 - pad * 0.5, tw + pad * 2, sz * 1.24 + pad, 8 * SCALE);
  ctx.stroke();
  ctx.lineWidth = 10 * SCALE; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.strokeText(text, 0, 0);
  ctx.fillStyle = getTplColor(); ctx.fillText(text, 0, 0);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑱ ShadowPop — 긴 그림자 레이어드
   ────────────────────────────────────────────────────────── */
function subStyle_ShadowPop(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const sz    = getTplFontSz(72);
  const y     = subY(pos) + (1 - eased) * 28 * SCALE;
  const alpha = Math.min(ap * 3, 1);
  const hl    = getTplHL();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `900 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  [6 * SCALE, 4 * SCALE, 2 * SCALE, 0].forEach(offset => {
    ctx.fillStyle = offset > 0 ? `rgba(0,0,0,${0.4 - offset * 0.008})` : getTplColor();
    ctx.fillText(text, CW / 2 + offset, y + offset);
  });
  ctx.strokeStyle = hl; ctx.lineWidth = 2 * SCALE;
  ctx.strokeText(text, CW / 2, y);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑲ Minimal — 얇고 깔끔
   ────────────────────────────────────────────────────────── */
function subStyle_Minimal(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.0, 1));
  const sz    = getTplFontSz(58);
  const y     = subY(pos) + (1 - eased) * 16 * SCALE;
  const alpha = eased;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `600 ${sz}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(0, y - sz * 0.72, CW, sz * 1.44);
  ctx.fillStyle = getTplHL();
  ctx.fillRect(20 * SCALE, y - sz * 0.52, 4 * SCALE, sz * 1.04);
  ctx.fillStyle = getTplColor();
  ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────
   ⑳ Retro — 레트로 TV 스타일
   ────────────────────────────────────────────────────────── */
function subStyle_Retro(text, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const sz    = getTplFontSz(66);
  const y     = CH - 200 * SCALE + (1 - eased) * 20 * SCALE;
  const alpha = Math.min(ap * 4, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `900 ${sz}px "Noto Sans KR", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw  = ctx.measureText(text).width;
  const pad = { x: 22 * SCALE, y: 12 * SCALE };
  ctx.fillStyle = getTplHL();
  ctx.fillRect(CW / 2 - tw / 2 - pad.x, y - sz * 0.6 - pad.y, tw + pad.x * 2, sz * 1.2 + pad.y * 2);
  ctx.fillStyle = '#111';
  ctx.fillText(text, CW / 2, y);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let scanY = y - sz; scanY < y + sz; scanY += 4 * SCALE) {
    ctx.fillRect(CW / 2 - tw / 2 - pad.x, scanY, tw + pad.x * 2, 2 * SCALE);
  }
  ctx.restore();
}

/* ── CapCut / TikTok 스타일 텍스트 렌더러 ───────────────── */
function drawTrendyText(text, x, y) {
  if (!text) return;
  const style = getTrendyStyle();
  ctx.save();
  ctx.font = style.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // 반투명 배경 박스 (bgColor가 있는 경우)
  if (style.bgColor) {
    const tw = ctx.measureText(text).width;
    const ph = parseInt(style.font) || 68;
    ctx.fillStyle = style.bgColor;
    roundRect(ctx, x - tw / 2 - 20, y - ph * 0.62, tw + 40, ph * 1.24, 12);
    ctx.fill();
  }
  // 외곽선 + 그림자
  if (style.strokeWidth > 0) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = style.strokeWidth;
    ctx.strokeStyle = style.stroke;
    ctx.shadowColor = style.shadow;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.strokeText(text, x, y);
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = style.color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ── MOOVLOG 배지 ────────────────────────────────────────── */
function drawTopBadge() {
  const badge = getTplStyle().badge;
  const bgColor  = badge?.bg  || 'rgba(0,0,0,0.50)';
  const dotColor = badge?.dot || '#ff6b9d';
  const S = SCALE;
  ctx.save();
  ctx.fillStyle = bgColor; roundRect(ctx, 20*S, 42*S, 225*S, 54*S, 27*S); ctx.fill();
  ctx.fillStyle = dotColor; ctx.shadowColor = dotColor; ctx.shadowBlur = 10*S;
  ctx.beginPath(); ctx.arc(50*S, 69*S, 7*S, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.font = `bold ${Math.round(27*S)}px "Inter", sans-serif`;
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('MOOVLOG', 66*S, 69*S);
  ctx.restore();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);   c.arcTo(x + w, y,     x + w, y + r,     r);
  c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);   c.arcTo(x,     y + h, x,     y + h - r, r);
  c.lineTo(x, y + r);       c.arcTo(x,     y,     x + r, y,         r);
  c.closePath();
}

/* ────────────────────────────────────────────────────────────
   씬 카드
   ──────────────────────────────────────────────────────────── */
// 시간 형식화: 초 -> HH:MM:SS
function pad2(n) { return String(n).padStart(2, '0'); }
function formatDuration(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  // 시간 단위이면서 1시간 이상일 때만 HH:MM:SS, 그렇지 않으면 MM:SS로 표시
  if (hh > 0) return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
  return `${pad2(mm)}:${pad2(ss)}`;
}
function buildSceneCards() {
  D.sceneList.innerHTML = '';
  S.script.scenes.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'scard'; d.id = `sc${i}`;
    const capDisplay = s.caption2 ? `${esc(s.caption1 || s.subtitle)} / ${esc(s.caption2)}` : esc(s.caption1 || s.subtitle);
    const durText = formatDuration(Math.round(s.duration || 0));
    d.innerHTML = `<div class="scard-num">SCENE ${i + 1} · ${durText} · #${(s.idx ?? 0) + 1} · ${s.subtitle_style || 'detail'}<button onclick="openMiniEditor(${i})" style="float:right;background:none;border:1px solid #555;border-radius:6px;color:#a78bfa;padding:1px 8px;font-size:.72rem;cursor:pointer;margin-top:-1px;">수정</button></div><div class="scard-sub">${capDisplay}</div><div class="scard-nar">${esc(s.narration)}</div>`;
    D.sceneList.appendChild(d);
  });
}

/* ── 미니 씬 에디터 ─────────────────────────────────────── */
let _editIdx = -1;
function openMiniEditor(i) {
  if (!S.script?.scenes?.[i]) return;
  _editIdx = i;
  const sc = S.script.scenes[i];
  const modal = document.getElementById('editModal');
  document.getElementById('editModalTitle').textContent = `SCENE ${i + 1} 편집`;
  document.getElementById('editCaption').value   = sc.caption1 || sc.subtitle || '';
  document.getElementById('editNarration').value = sc.narration || '';
  const durEl = document.getElementById('editDuration');
  if (durEl) durEl.value = sc.duration > 0 ? sc.duration.toFixed(1) : '3.0';
  modal.style.display = 'flex';
}
function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  _editIdx = -1;
}
async function saveEditModal() {
  if (_editIdx < 0 || !S.script?.scenes?.[_editIdx]) return;
  const sc = S.script.scenes[_editIdx];
  const si  = _editIdx;
  const newCap = document.getElementById('editCaption').value.trim();
  const newNar = document.getElementById('editNarration').value.trim();
  // 써 재생 길이 직접 수정
  const durEl = document.getElementById('editDuration');
  if (durEl) {
    const nd = parseFloat(durEl.value);
    if (!isNaN(nd) && nd >= 0.5) sc.duration = nd;
  }

  if (newCap) { sc.caption1 = newCap; sc.subtitle = newCap; }

  if (newNar && newNar !== sc.narration) {
    sc.narration = newNar;
    const titleEl = document.getElementById('editModalTitle');
    titleEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 음성 재합성 중...';
    try {
      const text = preprocessNarration(newNar);
      let newBuf = null;
      if (_TYPECAST_KEYS.length > 0) {
        // 미니 에디터에서도 7개 키를 끝까지 시도
        let tcErr = null;
        for (let attempt = 0; attempt < _TYPECAST_KEYS.length; attempt++) {
          try { newBuf = await fetchTypeCastTTS(text); break; }
          catch (e2) { tcErr = e2; rotateTypeCastKey(); }
        }
        if (!newBuf) throw tcErr || new Error('모든 Typecast 키 소진');
      } else {
        newBuf = await fetchTTSWithRetry(text, si);
      }
      if (S.audioBuffers) S.audioBuffers[si] = newBuf;
      if (newBuf?.duration > 0) {
        sc.duration = Math.max(1.5, Math.round((newBuf.duration + 0.15) * 10) / 10);
      }
      toast(`SCENE ${si + 1} 음성 재합성 완료!`, 'suc');
    } catch (e) {
      toast(`음성 재생성 실패: ${e.message}`, 'err');
    }
  } else {
    toast(`SCENE ${si + 1} 수정 완료`, 'suc');
  }

  closeEditModal();
  buildSceneCards();
  highlightScene(S.scene);
  renderFrame(S.scene, 0);
}
function highlightScene(i) {
  document.querySelectorAll('.scard').forEach(c => c.classList.remove('active'));
  const c = g(`sc${i}`); if (c) { c.classList.add('active'); c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  activateDot(i);
}

/* ════════════════════════════════════════════════════════════
   EXPORT — WebCodecs 비실시간 저장 (녹화 없음)
   Chrome 94+ : VideoEncoder + AudioEncoder + webm-muxer
   폴백         : MediaRecorder (구형 브라우저)
   ════════════════════════════════════════════════════════════ */
async function doExport() {
  if (S.exporting) return;
  if (!S.script || !S.loaded.length) { toast('먼저 영상을 생성해주세요', 'err'); return; }
  S.exporting = true;
  pausePlay();
  if (!audioCtx) ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
  const hasWebCodecs = (
    typeof VideoEncoder !== 'undefined' &&
    typeof AudioEncoder !== 'undefined' &&
    typeof VideoEncoder.isConfigSupported === 'function' &&
    (typeof window.WebmMuxer !== 'undefined' || typeof window.Mp4Muxer !== 'undefined')
  );

  // iOS Safari: canvas.captureStream() 미지원, WebCodecs 미지원
  if (isIOS && !hasWebCodecs) {
    toast('iOS Safari에서는 Chrome 앱을 이용해 저장해주세요', 'err');
    S.exporting = false;
    D.dlBtn.disabled = false;
    D.dlBtn.innerHTML = '<i class="fas fa-download"></i> 영상 저장하기';
    return;
  }

  D.dlBtn.disabled = true;
  D.dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 준비 중...';

  try {
    if (hasWebCodecs) await doExportWebCodecs();
    else              await doExportMediaRecorder();
  } catch (err) {
    console.error('[Export]', err);
    toast('저장 오류: ' + err.message, 'err');
    D.dlBtn.disabled = false;
    D.dlBtn.innerHTML = '<i class="fas fa-download"></i> 영상 저장하기';
  } finally {
    S.exporting = false;
  }
}

/* ── WebCodecs 경로 ──────────────────────────────────────── */
async function doExportWebCodecs() {
  const FPS      = 30;
  const totalDur = S.script.scenes.reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);
  const nFrames  = Math.ceil(totalDur * FPS);
  const hasAudio = S.audioBuffers.some(b => b !== null);

  // 0. 코덱 자동 감지: MP4(H.264 High) 우선 → WebM(VP9/VP8) 폴백
  const VIDEO_BITRATE = 16_000_000; // 16Mbps — 인스타 Reels 권장값
  const AUDIO_BITRATE = 192_000;    // 192kbps
  D.dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 코덱 확인 중...';
  let fmt = null;
  // MP4 (H.264 High) — 모든 기기·SNS 호환
  if (typeof window.Mp4Muxer !== 'undefined') {
    for (const vc of [
      { enc: 'avc1.640033', mux: 'avc' },  // H.264 High L5.1 (1080p60)
      { enc: 'avc1.4d0033', mux: 'avc' },  // H.264 Main L5.1
      { enc: 'avc1.42001f', mux: 'avc' },  // H.264 Baseline (fallback)
    ]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: VIDEO_BITRATE, framerate: FPS });
        if (s.supported) { fmt = { vc, MuxLib: window.Mp4Muxer, ext: 'mp4', mime: 'video/mp4', ac: { enc: 'mp4a.40.2', mux: 'aac' } }; break; }
      } catch {}
    }
    if (fmt) {
      try { const as = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 1, bitrate: AUDIO_BITRATE }); if (!as.supported) fmt = null; } catch { fmt = null; }
    }
  }
  // WebM (VP9) 폴백
  if (!fmt && typeof window.WebmMuxer !== 'undefined') {
    for (const vc of [{ enc: 'vp09.00.41.08', mux: 'V_VP9' }, { enc: 'vp09.00.31.08', mux: 'V_VP9' }, { enc: 'vp08.00.41.08', mux: 'V_VP8' }]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: VIDEO_BITRATE, framerate: FPS });
        if (s.supported) { fmt = { vc, MuxLib: window.WebmMuxer, ext: 'webm', mime: 'video/webm', ac: { enc: 'opus', mux: 'A_OPUS' } }; break; }
      } catch {}
    }
  }
  if (!fmt) throw new Error('지원하는 코덱이 없습니다. Chrome을 이용해주세요.');

  // 1. 오디오 사전 렌더링
  let pcm = null;
  if (hasAudio) {
    D.dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 음성 처리 중... 3%';
    try { pcm = await prerenderAudio(totalDur); }
    catch (e) { console.warn('[Export] 오디오 렌더 실패:', e.message); }
  }

  // 2. Muxer 초기화
  const { Muxer, ArrayBufferTarget } = fmt.MuxLib;
  const muxTarget = new ArrayBufferTarget();
  const muxer     = new Muxer({
    target:   muxTarget,
    video:    { codec: fmt.vc.mux, width: CW, height: CH, frameRate: FPS },
    ...(pcm ? { audio: { codec: fmt.ac.mux, numberOfChannels: 1, sampleRate: 48000 } } : {}),
    firstTimestampBehavior: 'offset',
    ...(fmt.ext === 'mp4' ? { fastStart: 'in-memory' } : {}),
  });

  // 3. VideoEncoder
  const videoEnc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error:  err => { throw err; },
  });
  videoEnc.configure({ codec: fmt.vc.enc, width: CW, height: CH, bitrate: VIDEO_BITRATE, framerate: FPS,
    latencyMode: 'quality', bitrateMode: 'variable' }); // VBR: 화질/용량 최적화

  // 4. 프레임별 렌더 + 인코딩
  for (let f = 0; f < nFrames; f++) {
    renderFrameAtTime(f / FPS);
    const vf = new VideoFrame(D.canvas, {
      timestamp: Math.round(f * 1_000_000 / FPS),
      duration:  Math.round(1_000_000 / FPS),
    });
    // 백프레셔: 인코더 큐 30프레임 초과 시 대기 (모바일 OOM 방지)
    if (videoEnc.encodeQueueSize > 30) {
      await new Promise(resolve => {
        const checkQ = () => videoEnc.encodeQueueSize <= 10 ? resolve() : setTimeout(checkQ, 10);
        checkQ();
      });
    }
    videoEnc.encode(vf, { keyFrame: f % (FPS * 2) === 0 });
    vf.close();
    if (f % 12 === 0) {
      const pct = Math.round(f / nFrames * (pcm ? 65 : 90));
      D.dlBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 인코딩 중... ${pct}%`;
      await sleep(0);
    }
  }
  await videoEnc.flush(); videoEnc.close();

  // 5. AudioEncoder
  if (pcm) {
    D.dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 음성 인코딩 중... 70%';
    const audioEnc = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error:  err => { throw err; },
    });
    audioEnc.configure({ codec: fmt.ac.enc, sampleRate: 48000, numberOfChannels: 1, bitrate: 192_000 });
    const CHUNK = 1920; // 40ms @48kHz
    for (let i = 0; i < pcm.length; i += CHUNK) {
      const slice = pcm.slice(i, Math.min(i + CHUNK, pcm.length));
      const ad = new AudioData({
        format: 'f32', sampleRate: 48000, numberOfFrames: slice.length,
        numberOfChannels: 1, timestamp: Math.round(i * 1_000_000 / 48000),
        data: slice.buffer,
      });
      audioEnc.encode(ad); ad.close();
      if (i % (CHUNK * 30) === 0) await sleep(0);
    }
    await audioEnc.flush(); audioEnc.close();
  }

  // 6. 최종화
  D.dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 파일 생성 중... 98%';
  await sleep(80);
  muxer.finalize();
  const { buffer } = muxTarget;
  if (!buffer || buffer.byteLength < 1000) throw new Error('영상 데이터 생성 실패');

  const _expBlob = new Blob([buffer], { type: fmt.mime });
  const _expExt  = fmt.ext;
  downloadBlob(_expBlob, `moovlog_${sanitizeName()}.${_expExt}`);
  D.dlBtn.disabled  = false;
  D.dlBtn.innerHTML = '<i class="fas fa-download"></i> 다시 저장하기';
  toast(pcm ? `✓ AI 음성 포함 ${_expExt.toUpperCase()} 영상 저장 완료!` : `✓ ${_expExt.toUpperCase()} 영상 저장 완료!`, 'ok');
  uploadGeneratedVideo(_expBlob, _expExt).catch(() => {});
}

/* ── MediaRecorder 폴백 ──────────────────────────────────── */
async function doExportMediaRecorder() {
  toast('WebCodecs 미지원 → 녹화 방식으로 저장합니다. 저장이 끝날 때까지 탭을 닫거나 다른 화면 전환하지 마세요!', 'inf');
  const totalDur = S.script.scenes.reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);

  // captureStream 지원 체크
  if (typeof D.canvas.captureStream !== 'function') {
    toast('이 브라우저는 영상 저장을 지원하지 않습니다. Chrome을 이용해주세요', 'err');
    D.dlBtn.disabled = false;
    D.dlBtn.innerHTML = '<i class="fas fa-download"></i> 영상 저장하기';
    return;
  }
  const mime     = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const recExt   = mime.includes('mp4') ? 'mp4' : 'webm';
  const hasAudio = S.audioBuffers.some(b => b !== null);
  const cs       = D.canvas.captureStream(30);
  const stream   = hasAudio
    ? new MediaStream([...cs.getVideoTracks(), ...audioMixDest.stream.getAudioTracks()])
    : cs;

  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16_000_000 });
  const chunks   = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    if (D.recStatus) D.recStatus.hidden = true;
    const blob = new Blob(chunks, { type: mime });
    if (blob.size < 1000) { toast('영상 데이터 없음. 다시 시도해주세요', 'err'); return; }
    downloadBlob(blob, `moovlog_${sanitizeName()}.${recExt}`);
    D.dlBtn.disabled  = false;
    D.dlBtn.innerHTML = '<i class="fas fa-download"></i> 다시 저장하기';
    toast(hasAudio ? '✓ 음성 포함 영상 저장 완료!' : '✓ 영상 저장 완료!', 'ok');
    uploadGeneratedVideo(blob, recExt).catch(() => {});
  };

  if (D.recStatus) { D.recStatus.hidden = false; }
  recorder.start(100);
  let elapsed = 0;
  const timerI = setInterval(() => {
    elapsed++;
    const p = Math.min(Math.round(elapsed / totalDur * 100), 97);
    D.dlBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 녹화 중... ${p}%`;
    if (D.recTimer) { const m = Math.floor(elapsed / 60); D.recTimer.textContent = `${m}:${String(elapsed % 60).padStart(2, '0')}`; }
  }, 1000);

  await exportRenderLoop();
  clearInterval(timerI);
  await sleep(500); recorder.stop();
}
async function exportRenderLoop() {
  const sc = S.script.scenes; let si = 0, ts = null;
  playSceneAudio(0, true);
  return new Promise(resolve => {
    const frame = now => {
      if (!ts) ts = now;
      const dur  = (sc[si].duration > 0 && isFinite(sc[si].duration)) ? sc[si].duration : 3;
      const el   = (now - ts) / 1000, prog = Math.min(el / dur, 1);
      const _abuf = S.audioBuffers?.[si]; const _adur = _abuf?.duration ?? null;
      const _stgt = (_adur && _adur < dur) ? Math.max(_adur / dur, 0.20) : 1.0; // 0.40→0.20: 짧은 오디오에서도 자막 강제 정지 방지
      S.subAnimProg = Math.min(prog / _stgt, 1);
      const TD = Math.min(0.28, dur * 0.15);
      try {
        if (el >= dur - TD && si < sc.length - 1) drawTransition(si, Math.min((el - (dur - TD)) / TD, 1));
        else renderFrame(si, prog);
      } catch (err) {
        console.warn('[exportRenderLoop] 렌더 에러:', err.message);
      }
      if (prog >= 1) {
        if (si < sc.length - 1) {
          const _prevEx = getMedia(sc[si]);
          si++; ts = now; S.subAnimProg = 0;
          // 🚀 내보내기에서도 동일한 스마트 점프 적용
          const _nextEx = getMedia(sc[si]);
          if (_nextEx?.type === 'video' && _nextEx.src) {
            if (S.files.length === 1) {
              // 🚀 Proportional Sync (export용)
              const _totalDurEx = sc.reduce((a, s) => a + (s.duration > 0 ? s.duration : 3), 0);
              const _elapsedEx  = sc.slice(0, si).reduce((a, s) => a + (s.duration > 0 ? s.duration : 3), 0);
              const _vd = isFinite(_nextEx.src.duration) ? _nextEx.src.duration : 0;
              if (_vd > 0 && _totalDurEx > 0) _nextEx.src.currentTime = (_elapsedEx / _totalDurEx) * _vd;
            } else if (_prevEx !== _nextEx) {
              _nextEx.src.currentTime = 0;
            }
          }
          playSceneAudio(si, true);
        } else { resolve(); return; }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

/* ── WAV 오디오만 저장 ────────────────────────────────────── */
async function doExportAudio() {
  if (!S.audioBuffers?.some(b => b)) { toast('AI 음성이 없습니다. 먼저 영상을 생성해주세요', 'err'); return; }
  if (!D.dlAudioBtn) return;
  D.dlAudioBtn.disabled = true;
  D.dlAudioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 음성 처리 중...';
  try {
    const totalDur = S.script.scenes.reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);
    const pcm = await prerenderAudio(totalDur);
    const wav = encodeWav(pcm, 48000);
    downloadBlob(new Blob([wav], { type: 'audio/wav' }), `moovlog_audio_${sanitizeName()}.wav`);
    toast('✓ AI 음성 WAV 저장 완료', 'ok');
  } catch (e) {
    toast('음성 저장 오류: ' + e.message, 'err');
  } finally {
    D.dlAudioBtn.disabled = false;
    D.dlAudioBtn.innerHTML = '<i class="fas fa-music"></i> 음성만 저장 (WAV)';
  }
}
function encodeWav(f32, sr) {
  const N = f32.length, bps = 16, ch = 1;
  const byteRate = sr * ch * bps / 8, blockAlign = ch * bps / 8;
  const dataSize = N * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const ws = (off, s) => [...s].forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)));
  ws(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, byteRate, true);
  v.setUint16(32, blockAlign, true); v.setUint16(34, bps, true);
  ws(36, 'data'); v.setUint32(40, dataSize, true);
  for (let i = 0; i < N; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buf;
}

/* ════════════════════════════════════════════════════════════
   Firebase Storage / Firestore 업로드 유틸
   window.FB_* 는 index.html <script type="module">에서 주입
   ════════════════════════════════════════════════════════════ */
async function _fbUpload(blob, storagePath) {
  if (!window.FB_storage || !window.FB_ref || !window.FB_upload || !window.FB_dlUrl) return null;
  try {
    const storRef = window.FB_ref(window.FB_storage, storagePath);
    const snap    = await window.FB_upload(storRef, blob);
    const url     = await window.FB_dlUrl(snap.ref);
    console.log('[Firebase ✓]', storagePath);
    return url;
  } catch (e) {
    console.warn('[Firebase] 업로드 실패:', storagePath, e.message);
    return null;
  }
}

async function _fbLog(videoUrl, ext) {
  if (!window.FB_db || !window.FB_col || !window.FB_addDoc || !window.FB_ts) return;
  try {
    await window.FB_addDoc(window.FB_col(window.FB_db, 'generations'), {
      restaurant:  D.restName?.value || '',
      template:    selectedTemplate || 'auto',
      videoUrl,
      ext,
      fileCount:   S.files?.length || 0,
      sceneCount:  S.script?.scenes?.length || 0,
      version:     APP_VERSION,
      createdAt:   window.FB_ts(),
    });
    // sessions 컬렉션 문서에 videoUrl 업데이트 (최근 영상 재생에 활용)
    if (_sessionDocId && window.FB_docFn && window.FB_updateDoc) {
      await window.FB_updateDoc(window.FB_docFn(_sessionDocId), { videoUrl, ext });
    }
  } catch (e) {
    console.warn('[Firebase] Firestore 기록 실패:', e.message);
  }
}

// sessions 컬렉션에 생성 스크립트 메타 저장 (영상 저장 전단계)
async function saveSession(script) {
  if (!window.FB_db || !window.FB_col || !window.FB_addDoc || !window.FB_ts) return;
  _sessionDocId = null;
  try {
    const docRef = await window.FB_addDoc(window.FB_col(window.FB_db, 'sessions'), {
      restaurant: D.restName?.value || '',
      template:   selectedTemplate || 'auto',
      sceneCount: script.scenes.length,
      title:      script.title || '',
      version:    APP_VERSION,
      videoUrl:   null,
      ext:        null,
      createdAt:  window.FB_ts(),
    });
    _sessionDocId = docRef.id;
    console.log('[Firebase] 세션 저장 완료:', _sessionDocId);
  } catch (e) {
    console.warn('[Firebase] 세션 저장 실패:', e.message);
  }
}

// sessions 컬렉션에서 가장 최근 videoUrl 있는 세션 로드
async function loadRecentSession() {
  if (!window.FB_db || !window.FB_getDocs || !window.FB_query ||
      !window.FB_orderBy || !window.FB_limitQ) return;
  try {
    const q = window.FB_query(
      window.FB_col(window.FB_db, 'sessions'),
      window.FB_orderBy('createdAt', 'desc'),
      window.FB_limitQ(5)
    );
    const snap = await window.FB_getDocs(q);
    if (snap.empty) return;
    let latest = null;
    snap.forEach(d => { if (!latest && d.data().videoUrl) latest = { id: d.id, ...d.data() }; });
    if (latest) showRecentSession(latest);
  } catch (e) {
    console.warn('[Firebase] 최근 세션 로드 실패:', e.message);
  }
}

// 최근 세션 카드 UI 표시
function showRecentSession(session) {
  const wrap     = document.getElementById('recentSession');
  const video    = document.getElementById('recentVideo');
  const nameEl   = document.getElementById('recentName');
  const dateEl   = document.getElementById('recentDate');
  const closeBtn = document.getElementById('recentCloseBtn');
  if (!wrap || !video) return;
  video.src = session.videoUrl;
  if (nameEl) nameEl.textContent = session.restaurant
    ? `${session.restaurant} · ${session.sceneCount || 0}컷`
    : `생성 영상 · ${session.sceneCount || 0}컷`;
  if (dateEl) {
    const d = session.createdAt?.toDate?.() || new Date();
    dateEl.textContent = d.toLocaleDateString('ko-KR',
      { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  if (closeBtn) closeBtn.onclick = () => { wrap.hidden = true; };
  wrap.hidden = false;
}

// 생성된 영상 Blob → Storage 업로드 + Firestore 로그
async function uploadGeneratedVideo(blob, ext) {
  const session = `${Date.now()}_${(D.restName?.value || 'noname').replace(/\s+/g, '_')}`;
  const url = await _fbUpload(blob, `generated/${session}/video.${ext}`);
  if (url) await _fbLog(url, ext);
  return url;
}

// 원본 파일(이미지/영상) → Storage 업로드 (백그라운드)
function uploadOriginalsInBackground() {
  if (!window.FB_storage) return;
  const session = `${Date.now()}_${(D.restName?.value || 'noname').replace(/\s+/g, '_')}`;
  S.files.forEach((m, i) => {
    const ext  = (m.file.name.split('.').pop() || 'bin').toLowerCase();
    _fbUpload(m.file, `originals/${session}/${i}_${m.file.name}`);
  });
}

/* ── helpers ─────────────────────────────────────────────── */
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 8000);
}
function sanitizeName() { return (D.restName?.value || 'video').replace(/\s+/g, '_') + '_' + Date.now(); }

/* ── UI 유틸 ─────────────────────────────────────────────── */
function goBack() {
  pausePlay();
  D.resultWrap.hidden = true;
  D.makeBtn.disabled = false;
  S.files = []; S.loaded = []; S.script = null; S.audioBuffers = [];
  S.currentAudio = null; S.scene = 0; S.startTs = null; S.subAnimProg = 0;
  D.thumbGrid.innerHTML = '';
  D.sceneList.innerHTML = '';
  if (D.dlAudioBtn) { D.dlAudioBtn.disabled = false; D.dlAudioBtn.innerHTML = '<i class="fas fa-music"></i> 음성만 저장 (WAV)'; }
  if (D.sceneDots) D.sceneDots.innerHTML = '';
  if (D.vProgText) D.vProgText.textContent = '0%';
  if (D.bgmBadge) D.bgmBadge.hidden = true;
  const styleBadge = document.getElementById('autoStyleBadge');
  if (styleBadge) styleBadge.hidden = true;
  updateStepUI(1);
}
function showLoad() { D.loadWrap.hidden = false; }
function hideLoad() { D.loadWrap.hidden = true; }
function setStep(n, title, sub) {
  D.loadTitle.textContent = title || ''; D.loadSub.textContent = sub || '';
  const items    = [D.ls1, D.ls2, D.ls3, D.ls4];
  const statuses = [D.ls1s, D.ls2s, D.ls3s, D.ls4s];
  const activeLabels = ['분석중...', '생성중...', '음성 생성중...', '렌더링중...'];
  items.forEach((el, i) => {
    if (!el) return;
    el.classList.toggle('active', i === n - 1);
    if (i < n - 1) el.classList.add('done');
    if (statuses[i]) statuses[i].textContent = i === n - 1 ? activeLabels[i] : i < n - 1 ? '완료' : '대기중';
  });
}
function doneStep(n) {
  const el = [D.ls1, D.ls2, D.ls3, D.ls4][n - 1];
  const st = [D.ls1s, D.ls2s, D.ls3s, D.ls4s][n - 1];
  const ch = [D.ls1c, D.ls2c, D.ls3c, D.ls4c][n - 1];
  if (el) { el.classList.remove('active'); el.classList.add('done'); }
  if (st) st.textContent = '완료';
  if (ch) ch.style.opacity = '1';
}
function updateStepUI(n) {
  for (let i = 1; i <= 3; i++) {
    const el = g('si' + i);
    if (!el) continue;
    el.classList.toggle('active', i === n);
    el.classList.toggle('done', i < n);
  }
}
function buildSceneDots() {
  if (!D.sceneDots || !S.script?.scenes) return;
  D.sceneDots.innerHTML = '';
  S.script.scenes.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'sd' + (i === 0 ? ' active' : '');
    d.id = 'sd' + i;
    D.sceneDots.appendChild(d);
  });
}
function activateDot(si) {
  document.querySelectorAll('.sd').forEach((d, i) => d.classList.toggle('active', i === si));
}
function updateAudioStatus(mode) {
  if (!D.audioStatus) return;
  D.audioStatus.innerHTML = mode === 'google-tts'
    ? '<i class="fas fa-microphone-alt"></i> AI 남성 보이스 포함 (Gemini TTS Fenrir)'
    : '<i class="fas fa-microphone"></i> 웹 음성 합성 (폴백)';
  D.audioStatus.style.color = mode === 'google-tts' ? '#4ade80' : '#888';
  if (D.audioBadgeText) D.audioBadgeText.textContent = mode === 'google-tts' ? 'AI 보이스' : '웹 음성';
  if (D.audioBadge) D.audioBadge.style.background = mode === 'google-tts' ? 'rgba(74,222,128,0.15)' : 'rgba(100,100,100,0.2)';
}
function toast(msg, type = 'inf') {
  const icons = { ok: 'fa-check-circle', err: 'fa-exclamation-circle', inf: 'fa-info-circle' };
  const el = document.createElement('div'); el.className = `toast ${type}`;
  el.innerHTML = `<i class="fas ${icons[type] || icons.inf}"></i><span>${msg}</span>`;
  D.toasts.appendChild(el);
  setTimeout(() => { el.style.animation = 'tOut .3s ease forwards'; setTimeout(() => el.remove(), 350); }, 4000);
}
function ease(t)  { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function esc(s)   { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

document.addEventListener('click', () => { if (audioCtx?.state === 'suspended') audioCtx.resume(); });

/* ════════════════════════════════════════════════════════════
   멀티 플랫폼 화면 비율 동적 전환
   ════════════════════════════════════════════════════════════ */
window.changeAspectRatio = function(ratio, btnEl) {
  if      (ratio === '9:16') { CW = 1080; CH = 1920; }
  else if (ratio === '1:1')  { CW = 1080; CH = 1080; }
  else if (ratio === '16:9') { CW = 1920; CH = 1080; }
  // SCALE은 짧은 쪽 기준 720 분의 1로 재계산
  SCALE = Math.min(CW, CH) / 720;
  D.canvas.width  = CW;
  D.canvas.height = CH;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // 버튼 활성화 표시 업데이트
  document.querySelectorAll('.ratio-btn').forEach(b => {
    b.style.background = 'rgba(255,255,255,0.1)';
    b.style.color = '#888';
  });
  if (btnEl) { btnEl.style.background = 'linear-gradient(135deg,#7c3aed,#a855f7)'; btnEl.style.color = '#fff'; }
  // 현재 씬 즉시 리렌더
  if (S.script && S.loaded.length) renderFrame(S.scene, S.subAnimProg);
  toast(`화면 비율 ${ratio} 적용`, 'ok');
};
