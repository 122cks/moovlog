'use strict';
/* ============================================================
   무브먼트 Shorts Creator v7 — script.js
   Build: 2026-03-07T00:00:00+09:00
   ============================================================ */

/* ── 버전 정보 ───────────────────────────────── */
const APP_VERSION  = 'v12';
const APP_BUILD_TS = '2026-03-07 KST';

/* ── API ─────────────────────────────────────────────────── */
const _INJECTED_KEY = '__GEMINI_KEY__';
let geminiKey = _INJECTED_KEY.includes('__') ? (localStorage.getItem('moovlog_gemini_key') || '') : _INJECTED_KEY;
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

/* ── Canvas ──────────────────────────────────────────────── */
const CW = 1080, CH = 1920;       // 유튜브 쇼츠·틱톡·릴스 권장 해상도
const SCALE = CW / 720;            // 1.5 — 모든 px 좌표 기준 스케일
const AUTO_EXPORT_ON_CREATE = true;
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
};
const ctx = D.canvas.getContext('2d');
D.canvas.width = CW; D.canvas.height = CH;

/* ── Audio ───────────────────────────────────────────────── */
let audioCtx = null, audioMixDest = null;
function ensureAudio() {
  if (audioCtx) return;
  audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
  audioMixDest = audioCtx.createMediaStreamDestination();
}

/* ── Template / Hook 전역 상태 (Instagram/TikTok 스타일) ── */
let selectedTemplate = 'aesthetic';
let selectedHook     = 'question';
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
  },
  viral: {
    overlay:    { top: 'rgba(0,0,0,0.05)',        bottom: 'rgba(0,0,0,0.45)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#FF2D55',  fontSize: 1.08 },
    transition: 'wipe',
    letterbox:  false,
    badge:      { bg: 'rgba(255,45,85,0.75)',     dot: '#FFFFFF' },
  },
  aesthetic: {
    overlay:    { top: 'rgba(255,220,180,0.08)',  bottom: 'rgba(0,0,0,0.40)' },
    subtitle:   { color: '#FFF5E4', hlColor: '#FFB347',  fontSize: 1.0 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.45)',         dot: '#ff6b9d' },
  },
  mukbang: {
    overlay:    { top: 'rgba(0,0,0,0.10)',        bottom: 'rgba(0,0,0,0.50)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#FFE033',  fontSize: 1.05 },
    transition: 'zoom',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.5)',          dot: '#FF6B35' },
  },
  vlog: {
    overlay:    { top: 'rgba(0,0,0,0.08)',        bottom: 'rgba(0,0,0,0.38)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#7FDBFF',  fontSize: 0.96 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.45)',         dot: '#7FDBFF' },
  },
  review: {
    overlay:    { top: 'rgba(0,0,0,0.12)',        bottom: 'rgba(0,0,0,0.50)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#FFD700',  fontSize: 1.0 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.5)',          dot: '#FFD700' },
  },
  story: {
    overlay:    { top: 'rgba(0,0,0,0.10)',        bottom: 'rgba(0,0,0,0.45)' },
    subtitle:   { color: '#FFF9F0', hlColor: '#FF9F7F',  fontSize: 1.0 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,0,0.45)',         dot: '#FF9F7F' },
  },
  info: {
    overlay:    { top: 'rgba(0,0,0,0.20)',        bottom: 'rgba(0,0,0,0.55)' },
    subtitle:   { color: '#FFFFFF',   hlColor: '#00E5FF',  fontSize: 0.95 },
    transition: 'fade',
    letterbox:  false,
    badge:      { bg: 'rgba(0,0,50,0.6)',         dot: '#00E5FF' },
  },
};
function getTplStyle() {
  return TEMPLATE_STYLES[selectedTemplate] || TEMPLATE_STYLES.aesthetic;
}

/* ── 숏폼 훅 풀 (틱톡 스타일 첫 씬 참고) ───────────────── */
const HOOK_POOL = [
  '이거 왜 유명한지 알았다', '여기 모르면 손해', '이거 진짜 미쳤다',
  '줄 서는 이유 있음', '아는 사람만 안다', '진짜 실화임?',
  '여기 왜 이제 왔지', '내 최애 맛집 생김',
];

/* ── 자막 분할 (5~12자 틱톡 스타일) ──────────────────────── */
function splitCaptions(text) {
  if (!text) return [text || '', ''];
  const stripped = text.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim();
  if (stripped.length <= 10) return [text, ''];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    const mid = Math.ceil(text.length / 2);
    return [text.slice(0, mid), text.slice(mid)];
  }
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

/* ── State ───────────────────────────────────────────────── */
const S = {
  files: [], loaded: [], script: null, audioBuffers: [],
  currentAudio: null, playing: false, muted: false,
  scene: 0, startTs: null, raf: null,
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
  updateStepUI(1);
  const verEl = document.getElementById('appVersion');
  if (verEl) verEl.textContent = `${APP_VERSION} · ${APP_BUILD_TS}`;
  document.querySelectorAll('.sns-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.target);
      if (!el?.textContent) return;
      navigator.clipboard.writeText(el.textContent).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> 복사됨'; btn.classList.add('copied');
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
});

/* ── Template Picker UI ─────────────────────────────────── */
function renderTemplatePicker() {
  const container = document.getElementById('tplPicker');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(TEMPLATE_NAMES).forEach(([key, label]) => {
    const btn = document.createElement('button');
    btn.className = 'tpl-chip' + (key === selectedTemplate ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      selectedTemplate = key;
      container.querySelectorAll('.tpl-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      // 미리보기 중이면 현재 씬 다시 렌더
      if (S.script && S.script.scenes.length) {
        renderFrame(S.scene, S.subAnimProg > 0 ? 1 : 0);
      }
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
  try {
    setStep(1, '이미지 분석 + 스타일 자동 선택 중...', 'AI가 최적의 템플릿과 훅을 찾고 있습니다');
    const analysis = await visionAnalysis(name);
    // AI 자동 스타일 선택
    if (analysis.recommended_template && TEMPLATE_HINTS[analysis.recommended_template]) {
      selectedTemplate = analysis.recommended_template;
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
    toast(`AI 추천: ${TEMPLATE_NAMES[selectedTemplate] || selectedTemplate}`, 'inf');
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
    // 오디오 실제 길이로 씬 duration 완전 동기화 (항상 적용)
    for (let i = 0; i < script.scenes.length; i++) {
      const sc  = script.scenes[i];
      const buf = S.audioBuffers[i];
      if (buf && buf.duration > 0) {
        sc.duration = Math.round((buf.duration + 0.3) * 10) / 10;
      }
      // caption1 / caption2 초기화 (AI가 제공 또는 splitCaptions 분할)
      if (!sc.caption1) {
        const sub = sc.subtitle || '';
        const [c1, c2] = splitCaptions(sub);
        sc.caption1 = c1; sc.caption2 = c2;
      } else if (!sc.caption2) {
        sc.caption2 = '';
      }
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
  const imgs = S.files.filter(f => f.type === 'image').slice(0, 8);
  const parts = [];
  if (imgs.length) {
    for (const img of imgs) { const b64 = await toB64(img.file); parts.push({ inline_data: { mime_type: img.file.type || 'image/jpeg', data: b64 } }); }
  } else {
    // 비디오만 있을 경우: 프레임 추출해서 이미지처럼 분석
    const videos = S.files.filter(f => f.type === 'video');
    if (!videos.length) return { keywords: [restaurantName, '맛집'], mood: '감성적인', per_image: [], recommended_order: [] };
    for (const vf of videos.slice(0, 2)) {
      try {
        const frames = await extractVideoFramesB64(vf.file, 4);
        for (const fr of frames) parts.push({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } });
      } catch (e) { console.warn('[Vision] 비디오 프레임 추출 실패:', e.message); }
    }
    if (!parts.length) return { keywords: [restaurantName, '맛집'], mood: '감성적인', per_image: [], recommended_order: [] };
  }
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
  const totalTarget = Math.min(Math.max(S.files.length * 3 + 6, 22), 42);

  const sampleImgs = S.files.filter(f => f.type === 'image').slice(0, 4);
  const imgParts = [];
  for (const img of sampleImgs) { const b64 = await toB64(img.file); imgParts.push({ inline_data: { mime_type: img.file.type || 'image/jpeg', data: b64 } }); }
  if (!imgParts.length) {
    // 비디오만 있을 경우 대표 프레임 추출
    const vidFiles = S.files.filter(f => f.type === 'video').slice(0, 2);
    for (const vf of vidFiles) {
      try {
        const frames = await extractVideoFramesB64(vf.file, 2);
        for (const fr of frames) imgParts.push({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } });
      } catch (e) { console.warn('[generateScript] 비디오 프레임 추출 실패:', e.message); }
    }
  }

  const prompt = `당신은 팔로워 50만+ 한국 맛집 인스타그램·유튜브 Shorts 전문 감독 "무브먼트(MOOVLOG)"입니다.
인천·서울·부천·경기 맛집 채널 / 매 영상 조회수 10만+ 달성하는 최상위 크리에이터.

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
■ 씬1 Hook (2~3s): 첫 1.5초 안에 시청자를 멈추게 하는 임팩트.
  → 질문형: "이거 진짜야?" / 충격형: "이 가격에 이게 나온다고?" / FOMO: "이거 모르면 손해"
  → 나레이션: 강렬, 짧게, 의문형이나 감탄으로 끝내기
■ 씬2 Context (3~4s): 공간·무드 감성 소개. 보는 사람이 가고 싶게 만들기.
  → "인천에 이런 곳이?" / "여기 분위기 미쳤는데" 스타일
■ 씬3 Hero (4~5s): 대표 메뉴 클로즈업. 육즙·윤기·볼륨감·색감 감각 묘사 극대화.
  → "바삭하고 촉촉한" / "육즙이 터지는" / "보기만 해도 침 고이는" 표현 활용
■ 씬4~N-1 Detail (3~4s): 음식 디테일. 질감·온도·냄새·두께 입체적 묘사.
  → 관객이 직접 먹는 것처럼 몰입감 있게
■ 씬N CTA (2~3s): 저장·팔로우 유도. 구체적 행동 지시.
  → "저장 안 하면 나중에 못 옴 💾" / "팔로우하면 맛집 다 알려드림 🙏" / "여기 꼭 가봐 진심"

[★ 틱톡 스타일 자막 규칙 — 핵심]
- caption1: 씬 전반부 자막. 5~10자, 실제 사람 말투, 광고 금지, 감탄/의문형 허용. 이모지 선택적.
  예: "이거 뭐냐", "비주얼 미쳤다", "진짜임?", "여기 실화", "🔥 대박이다"
- caption2: 씬 후반부 자막. 5~10자, caption1 반응/이어지는 포인트. 없으면 빈문자열 허용.
  예: "진짜 맛있다", "여기 또 온다", "저장각이다", "이건 찐이야"
- subtitle_style: "hook"(훅)|"detail"(디테일)|"hero"(대표메뉴)|"cta"(콜투액션)
- subtitle_position: "center"|"lower"|"upper"
- narration: 구어체 남성 성우 스타일, 입맛 당기는 감각 묘사, 글자 수 ≤ duration×8
  금지: 존댓말 / 허용: 반말·감탄·의성어 (바삭, 촉촉, 쫄깃, 고소, 진한, 육즙, 실화, 미쳤다)
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
{"title":"제목","hashtags":"#태그들","naver_clip_tags":"...","youtube_shorts_tags":"...","instagram_caption":"...","tiktok_tags":"...","scenes":[{"idx":0,"duration":3,"caption1":"이거 실화임?","caption2":"진짜 미쳤다","subtitle_style":"hook","subtitle_position":"center","narration":"진짜 이 가격에 이게 나온다고?","effect":"zoom-out"}]}`;

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
      const dur = isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 0;
      if (!dur) { URL.revokeObjectURL(url); resolve([]); return; }
      const c = document.createElement('canvas'); c.width = 360; c.height = 640;
      const cx = c.getContext('2d');
      const frames = [], times = Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * dur);
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
function buildSNSTags(script) {
  if (!D.snsWrap) return;
  const fill = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t || ''; };
  fill('tagNaver', script.naver_clip_tags || ''); fill('tagYoutube', script.youtube_shorts_tags || '');
  fill('tagInsta', script.instagram_caption || ''); fill('tagTiktok', script.tiktok_tags || '');
  D.snsWrap.hidden = false;
}

/* ════════════════════════════════════════════════════════════
   STEP 3 — TTS: Gemini Charon→Fenrir→Orus (남성) + Web Speech 폴백
   각 씬 독립 처리: 한 씬 실패해도 나머지 씬은 계속 시도
   ════════════════════════════════════════════════════════════ */
async function generateAllTTS(scenes) {
  const buffers = [];
  let successCount = 0, failCount = 0;
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (!sc.narration) { buffers.push(null); continue; }
    try {
      const buf = await fetchGeminiTTS(sc.narration);
      buffers.push(buf);
      successCount++;
    } catch (err) {
      const msg = err.message || '';
      console.warn(`[TTS] 씬${i + 1} 실패:`, msg);
      // 권한/모델 오류는 첫 실패에서 바로 토스트 + 전체 중단
      if (msg.includes('TTS_403')) {
        toast('AI 보이스: API 키에 TTS 권한이 없습니다 — 무음으로 진행', 'inf');
        while (buffers.length < scenes.length) buffers.push(null);
        return buffers;
      }
      if (msg.includes('TTS_400') || msg.includes('TTS_404')) {
        toast(`AI 보이스 오류 (${msg.replace('TTS_','HTTP ')}) — 무음으로 진행`, 'inf');
        while (buffers.length < scenes.length) buffers.push(null);
        return buffers;
      }
      failCount++;
      buffers.push(null);
    }
  }
  if (successCount === 0) {
    console.warn('[TTS] 모든 씬 실패 — 무음으로 진행');
    toast('AI 보이스 실패: 무음 영상으로 진행합니다', 'inf');
  } else if (failCount > 0) {
    toast(`AI 남성 보이스 ${successCount}/${scenes.length}씬 성공 (${failCount}씬 무음)`, 'inf');
  } else {
    toast(`AI 남성 보이스 ${successCount}씬 생성 완료 ✓`, 'ok');
  }
  if (successCount > 0) updateAudioStatus('google-tts');
  return buffers;
}

// Gemini TTS: 모델 2개 × 비이스 4개 단계적 시도
async function fetchGeminiTTS(text) {
  if (!text?.trim()) throw new Error('빈 텍스트');
  const voices = ['Charon', 'Fenrir', 'Kore', 'Orus'];
  const ttsModels = ['gemini-2.5-flash-preview-tts'];
  let lastErr;
  for (const model of ttsModels) {
    const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    for (const voiceName of voices) {
      try {
        const res = await fetch(ttsUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: '당신은 한국어 전문 남성 성우입니다. 타입캐스트 프리미엄 스타일 — 중저음의 자연스러운 발음, 맛집 콘텐츠에 적합한 감각적 표현. 반말 허용, 감탄사와 의성어를 생동감 있게 진달하세요.' }] },
            contents: [{ parts: [{ text: text.trim() }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error?.message || `HTTP ${res.status}`;
          console.warn(`[TTS] ${model}/${voiceName} ${res.status}:`, msg);
          if (res.status === 403) throw new Error(`TTS_403: ${msg}`);
          if (res.status === 404 || res.status === 400) { lastErr = new Error(msg); break; }
          throw new Error(msg);
        }
        const part = data?.candidates?.[0]?.content?.parts?.[0];
        if (!part?.inlineData?.data) throw new Error('응답 오디오 데이터 없음');
        const buf = await decodePCMAudio(part.inlineData.data, part.inlineData.mimeType || 'audio/L16;rate=24000');
        if (!buf || buf.length === 0) throw new Error('빈 오디오 버퍼');
        console.log(`[TTS] 성공: ${model}/${voiceName}`);
        return buf;
      } catch (e) {
        console.warn(`[TTS] ${model}/${voiceName} 실패:`, e.message);
        lastErr = e;
        if (e.message?.startsWith('TTS_403')) throw e;
      }
    }
  }
  throw lastErr || new Error('TTS 전체 실패');
}

function decodePCMAudio(b64, mimeType) {
  if (!audioCtx) ensureAudio();
  const binary = atob(b64), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  // Gemini TTS 반환 포맷: audio/L16;codec=pcm;rate=24000 또는 audio/pcm;rate=24000
  const isPCM = mimeType?.includes('pcm') || mimeType?.includes('L16') || mimeType?.includes('linear');
  if (isPCM) {
    const sr = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || '24000');
    const n  = Math.floor(bytes.length / 2);
    if (n < 1) throw new Error('PCM 데이터 없음');
    const buf = audioCtx.createBuffer(1, n, sr);
    const ch  = buf.getChannelData(0);
    const dv  = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i < n; i++) ch[i] = dv.getInt16(i * 2, true) / 32768;
    return Promise.resolve(buf);
  }
  // WAV / other: decodeAudioData, 실패 시 raw PCM16 재시도
  const arrayBuf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return audioCtx.decodeAudioData(arrayBuf).catch(() => {
    const n2 = Math.floor(bytes.length / 2);
    if (n2 < 1) throw new Error('오디오 디코딩 실패');
    const buf2 = audioCtx.createBuffer(1, n2, 24000);
    const ch2  = buf2.getChannelData(0);
    const dv2  = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let j = 0; j < n2; j++) ch2[j] = dv2.getInt16(j * 2, true) / 32768;
    return buf2;
  });
}

// OfflineAudioContext로 전체 오디오 사전 렌더링 (추후 export용)
async function prerenderAudio(totalDur) {
  const SR  = 48000;
  const off = new OfflineAudioContext(1, Math.ceil(SR * totalDur), SR);
  let offset = 0;
  for (let i = 0; i < S.script.scenes.length; i++) {
    const buf = S.audioBuffers[i];
    if (buf) {
      const src = off.createBufferSource();
      src.buffer = buf; // OfflineAudioCtx가 SR 자동 변환
      src.connect(off.destination); src.start(offset);
    }
    offset += S.script.scenes[i].duration;
  }
  const rendered = await off.startRendering();
  return rendered.getChannelData(0); // Float32Array@48kHz
}

function playSceneAudio(si, capture = false) {
  stopAudio();
  const buf = S.audioBuffers?.[si];
  if (buf && audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const src = audioCtx.createBufferSource();
    src.buffer = buf; src.playbackRate.value = 1.0;
    src.connect(audioCtx.destination);
    if (capture && audioMixDest) src.connect(audioMixDest);
    src.start(); S.currentAudio = src;
  } else {
    // AI TTS 없음 → Web Speech 자동 폴백 (재생 중단 없음)
    if (!capture && S.script?.scenes?.[si]) playWebSpeech(S.script.scenes[si]);
    console.warn(`[Audio] 씬 ${si + 1} AI 오디오 없음: Web Speech 폴백`);
  }
}
// Web Speech 폴백 — AI TTS 실패 시 자동 호출, 남성 없어도 한국어 음성 사용
function playWebSpeech(sc) {
  if (!sc?.narration || typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(sc.narration);
  u.lang = 'ko-KR'; u.pitch = 0.1; u.rate = 0.85; u.volume = 1;
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
        S.loaded.push({ type: 'video', src: vid });
      }
    }
  }
}

/* ── Player ──────────────────────────────────────────────── */
function setupPlayer() { S.playing = false; S.scene = 0; S.startTs = null; S.subAnimProg = 0; D.vProg.style.width = '0%'; renderFrame(0, 0); setPlayIcon(false); }
function togglePlay()  { S.playing ? pausePlay() : startPlay(); }
function startPlay() {
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  S.playing = true; S.startTs = performance.now(); S.subAnimProg = 0;
  setPlayIcon(true); if (!S.muted) playSceneAudio(S.scene); tick();
}
function pausePlay()  { S.playing = false; if (S.raf) cancelAnimationFrame(S.raf); stopAudio(); setPlayIcon(false); }
function doReplay()   { pausePlay(); S.scene = 0; S.startTs = null; S.subAnimProg = 0; D.vProg.style.width = '0%'; renderFrame(0, 0); highlightScene(0); setTimeout(startPlay, 80); }
function toggleMute() {
  S.muted = !S.muted;
  D.muteIco.className = S.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  if (S.muted) stopAudio(); else if (S.playing) playSceneAudio(S.scene);
}
function setPlayIcon(pl) { D.playIco.className = pl ? 'fas fa-pause' : 'fas fa-play'; }

/* ── Tick loop ───────────────────────────────────────────── */
function tick() {
  const run = now => {
    if (!S.playing) return;
    const sc = S.script.scenes[S.scene];
    const dur = sc.duration, el = (now - S.startTs) / 1000, prog = Math.min(el / dur, 1);
    const total = S.script.scenes.reduce((a, s) => a + s.duration, 0);
    const done  = S.script.scenes.slice(0, S.scene).reduce((a, s) => a + s.duration, 0);
    const pct   = (done + el) / total * 100;
    D.vProg.style.width = pct + '%';
    const vProgEl = document.getElementById('vProgText');
    if (vProgEl) vProgEl.textContent = Math.floor(pct) + '%';
    S.subAnimProg = Math.min(prog * 2.8, 1);
    const TD = 0.28;
    if (el >= dur - TD && S.scene < S.script.scenes.length - 1)
      drawTransition(S.scene, (el - (dur - TD)) / TD);
    else renderFrame(S.scene, prog);
    if (prog >= 1) {
      if (S.scene < S.script.scenes.length - 1) {
        S.scene++; S.startTs = now; S.subAnimProg = 0; highlightScene(S.scene);
        if (!S.muted) playSceneAudio(S.scene);
      } else {
        D.vProg.style.width = '100%'; S.playing = false; stopAudio(); setPlayIcon(false); return;
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
  // [강화1] 씬 분위기 색상 오버레이
  drawMoodOverlay(sc.subtitle_style, Math.min(prog * 3, 1));
  // [강화2] Hero 씬: 시네마틱 레터박스 + 스파클
  if (sc.subtitle_style === 'hero') {
    drawLetterbox(Math.min(prog * 4, 1));
    drawSparkles(prog);
  }
  drawSubtitle(sc, sap, prog);
  if (si === 0) drawTopBadge();
}
function drawTransition(fi, t) {
  const e = ease(t);
  const nextStyle = S.script.scenes[fi + 1]?.subtitle_style || 'detail';
  const tplMode   = getTplStyle().transition || 'fade';
  if (nextStyle === 'hero') {
    renderFrame(fi, 1);
    ctx.save();
    ctx.globalAlpha = e;
    ctx.translate(CW / 2, CH / 2);
    ctx.scale(0.88 + e * 0.12, 0.88 + e * 0.12);
    ctx.translate(-CW / 2, -CH / 2);
    renderFrame(fi + 1, 0, 0, true);
    ctx.restore();
  } else if (nextStyle === 'hook' || tplMode === 'wipe') {
    // wipe (세로 슬라이드)
    renderFrame(fi, 1);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, CH * (1 - e), CW, CH * e); ctx.clip();
    renderFrame(fi + 1, 0, 0, true);
    ctx.restore();
  } else if (nextStyle === 'cta' || tplMode === 'zoom') {
    // zoom crossfade
    renderFrame(fi, 1);
    ctx.save();
    ctx.globalAlpha = e;
    ctx.translate(CW / 2, CH / 2);
    ctx.scale(1.0 + e * 0.05, 1.0 + e * 0.05);
    ctx.translate(-CW / 2, -CH / 2);
    renderFrame(fi + 1, 0, 0, true);
    ctx.restore();
  } else {
    // 기본 crossfade (fade)
    renderFrame(fi, 1);
    ctx.save(); ctx.globalAlpha = e; renderFrame(fi + 1, 0, 0, true); ctx.restore();
  }
}
// 특정 시간 t(초)에 해당하는 프레임 렌더링 (export용, 실시간 불필요)
function renderFrameAtTime(t) {
  let elapsed = 0;
  const sc = S.script.scenes;
  for (let i = 0; i < sc.length; i++) {
    const dur = sc[i].duration;
    if (t < elapsed + dur || i === sc.length - 1) {
      const prog        = Math.max(0, Math.min((t - elapsed) / dur, 1));
      const subAnimProg = Math.min(prog * 2.8, 1);
      const prevSubAnim = S.subAnimProg;
      S.subAnimProg = subAnimProg;
      const media       = getMedia(sc[i]);
      ctx.clearRect(0, 0, CW, CH);
      drawMedia(media, sc[i].effect, prog);
      drawVignetteGrad();
      drawMoodOverlay(sc[i].subtitle_style, Math.min(prog * 3, 1));
      if (sc[i].subtitle_style === 'hero') {
        drawLetterbox(Math.min(prog * 4, 1));
        drawSparkles(prog);
      }
      drawSubtitle(sc[i], subAnimProg, prog);
      if (i === 0) drawTopBadge();
      S.subAnimProg = prevSubAnim;
      return;
    }
    elapsed += dur;
  }
}
function getMedia(sc) { return S.loaded.length ? S.loaded[(sc.idx ?? 0) % S.loaded.length] : null; }

/* ── Ken Burns (6종) ─────────────────────────────────────── */
function drawMedia(media, effect, prog) {
  if (!media) { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, CW, CH); return; }
  if (media.type === 'video') {
    const vid = media.src;
    // 비디오가 재생 가능 상태가 아니면 블랙 프레임으로 대체
    if (vid._loadFailed || vid.readyState < 2) {
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, CW, CH); return;
    }
    if (vid.paused) vid.play().catch(() => {});
  }
  const e = ease(prog); let sc = 1, ox = 0, oy = 0;
  // [강화4] Ken Burns 8종으로 확장
  switch (effect) {
    case 'zoom-in':       sc = 1.0 + e * 0.12; break;
    case 'zoom-in-slow':  sc = 1.0 + e * 0.06; break;
    case 'zoom-out':      sc = 1.12 - e * 0.12; break;
    case 'pan-left':      sc = 1.09; ox = (1 - e) * CW * 0.08; break;
    case 'pan-right':     sc = 1.09; ox = -(1 - e) * CW * 0.08; break;
    case 'float-up':      sc = 1.06; oy = (1 - e) * CH * 0.05; break;
    case 'pan-up':        sc = 1.08; oy = (1 - e) * CH * 0.06; break;  // 새로 추가
    case 'zoom-pan':      sc = 1.0 + e * 0.08; ox = (0.5 - e) * CW * 0.06; break; // 새로 추가
    default:              sc = 1.04 + e * 0.04;
  }
  const el = media.src;
  const sw = media.type === 'video' ? (el.videoWidth  || CW) : el.naturalWidth;
  const sh = media.type === 'video' ? (el.videoHeight || CH) : el.naturalHeight;
  const r  = Math.max(CW / sw, CH / sh), dw = sw * r, dh = sh * r;
  ctx.save();
  ctx.translate(CW / 2 + ox, CH / 2 + oy); ctx.scale(sc, sc);
  try {
    ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
  } catch (e) {
    console.warn('[drawMedia] drawImage 실패:', e.message);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
  }
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
  const bot = ctx.createLinearGradient(0, CH * 0.36, 0, CH);
  bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(0.5, 'rgba(0,0,0,0.20)'); bot.addColorStop(1, botColor);
  ctx.fillStyle = bot; ctx.fillRect(0, CH * 0.36, CW, CH * 0.64);
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
   SUBTITLE SYSTEM — 4 Instagram Reels 스타일 + 애니메이션
   animProg: 0=시작, 1=완전 표시
   ════════════════════════════════════════════════════════════ */
function drawSubtitle(sc, animProg, sceneProg) {
  // 씬 진행도 50% 기준으로 caption1 → caption2 전환 (없으면 subtitle fallback)
  let text, localAnim;
  const c2 = sc.caption2;
  if (c2 && sceneProg !== undefined && sceneProg >= 0.5) {
    text      = c2;
    localAnim = Math.min((sceneProg - 0.5) * 5.6, 1); // 후반부 애니메이션 리셋
  } else {
    text      = sc.caption1 || sc.subtitle;
    localAnim = animProg;
  }
  if (!text) return;
  ctx.save();
  switch (sc.subtitle_style || 'detail') {
    case 'hook':   drawSubHook  (text, sc.subtitle_position || 'center', localAnim); break;
    case 'hero':   drawSubHero  (text, localAnim); break;
    case 'cta':    drawSubCTA   (text, localAnim); break;
    default:       drawSubDetail(text, sc.subtitle_position || 'lower', localAnim);
  }
  ctx.restore();
}

/* ── CapCut 스타일 공통 렌더러 ────────────────────────────────
   hlIdx: 강조할 단어 인덱스 (null = 없음)
   단어별 순차 팝인 + 오버슛 바운스 + 두꺼운 검은 스트로크
   ──────────────────────────────────────────────────────────── */
function capWords(text, cx, cy, maxSz, color, hlIdx, ap) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return;
  ctx.save();
  const tplSub  = getTplStyle().subtitle;
  const fScale  = tplSub?.fontSize || 1.0;
  const hlColor = tplSub?.hlColor  || '#FFE033';
  let sz = maxSz * fScale;
  ctx.font = `900 ${sz}px "Noto Sans KR", Impact, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let wM = words.map(w => ctx.measureText(w).width);
  const sp = () => sz * 0.28;
  const tot = () => wM.reduce((a, b) => a + b, 0) + sp() * (words.length - 1);
  // 캔버스 폭 초과 시 자동 축소
  if (tot() > CW - SCALE * 56) {
    sz = Math.max(SCALE * 34, Math.floor(sz * (CW - SCALE * 56) / tot()));
    ctx.font = `900 ${sz}px "Noto Sans KR", Impact, sans-serif`;
    wM = words.map(w => ctx.measureText(w).width);
  }
  const N  = words.length;
  const step = 0.55 / N;
  const sw   = Math.max(sz * 0.11, SCALE * 6);
  let x = cx - tot() / 2;
  words.forEach((word, i) => {
    const wProg = Math.max(0, Math.min(1, (ap - i * step) / (step * 1.65)));
    const drawX = x;
    x += wM[i] + sp();
    if (wProg <= 0) return;
    // Overshoot bounce: 0 → 1.18 → 1.0
    const scl = wProg < 0.6 ? (wProg / 0.6) * 1.18 : 1.18 - ((wProg - 0.6) / 0.4) * 0.18;
    const alpha = Math.min(wProg * 4, 1);
    const wx = drawX + wM[i] / 2;
    const isHL = (i === hlIdx);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(wx, cy); ctx.scale(scl, scl);
    if (isHL) {
      // 하이라이트 박스 (템플릿 hlColor) + 검정 텍스트
      const pad = 9;
      ctx.fillStyle = hlColor;
      roundRect(ctx, -wM[i] / 2 - pad, -sz * 0.58, wM[i] + pad * 2, sz * 1.16, 7); ctx.fill();
      ctx.lineWidth = sw * 0.35; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.strokeText(word, -wM[i] / 2, 0);
      ctx.fillStyle = '#111'; ctx.fillText(word, -wM[i] / 2, 0);
    } else {
      // 흰색(또는 color) + 두꺼운 검정 스트로크
      ctx.lineWidth = sw; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.97)';
      ctx.strokeText(word, -wM[i] / 2, 0);
      ctx.fillStyle = color; ctx.fillText(word, -wM[i] / 2, 0);
    }
    ctx.restore();
  });
  ctx.restore();
}

/* 자막 영역 그라데이션 배경 (0.70 → 0.22로 대폭 감소) */
function drawSubtitleBg(cy, lineH, alpha) {
  const h = lineH * 1.8;
  const g = ctx.createLinearGradient(0, cy - h * 0.55, 0, cy + h * 0.55);
  g.addColorStop(0,    `rgba(0,0,0,0)`);
  g.addColorStop(0.28, `rgba(0,0,0,${0.22 * alpha})`);
  g.addColorStop(0.72, `rgba(0,0,0,${0.22 * alpha})`);
  g.addColorStop(1,    `rgba(0,0,0,0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, cy - h * 0.55, CW, h * 1.1);
}

/* ① Hook — CapCut 최대 임팩트: 첫 단어 노란 강조 + 배경 */
function drawSubHook(text, pos, ap) {
  const y = pos === 'upper' ? CH * 0.22 : pos === 'center' ? CH * 0.50 : CH * 0.72;
  drawSubtitleBg(y, SCALE * 82, Math.min(ap * 3, 1));
  capWords(text, CW / 2, y, SCALE * 82, '#FFFFFF', 0, ap);
}

/* ② Detail — CapCut 기본: 슬라이드업 + 흰 텍스트 + 배경 */
function drawSubDetail(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const baseY = pos === 'upper' ? CH * 0.18 : pos === 'center' ? CH * 0.50 : CH - SCALE * 200;
  const y     = baseY + (1 - eased) * SCALE * 30;
  drawSubtitleBg(y, SCALE * 64, Math.min(ap * 3, 1));
  capWords(text, CW / 2, y, SCALE * 64, '#FFFFFF', null, ap);
}

/* ③ Hero — CapCut 대형: 마지막 단어 클라이맥스 강조 + 배경 */
function drawSubHero(text, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const y     = CH - SCALE * 188 + (1 - eased) * SCALE * 24;
  const words = text.split(/\s+/).filter(Boolean);
  drawSubtitleBg(y, SCALE * 76, Math.min(ap * 3, 1));
  capWords(text, CW / 2, y, SCALE * 76, '#FFFFFF', words.length - 1, ap);
}

/* ④ CTA — CapCut 콜투액션 + 파워풀 바운스 + 배경 */
function drawSubCTA(text, ap) {
  const eased  = ease(Math.min(ap * 2.5, 1));
  const bounce = ap < 0.4 ? Math.sin(ap * Math.PI * 2.5) * SCALE * 12 : 0;
  const y      = CH - SCALE * 128 + (1 - eased) * SCALE * 28 - bounce;
  drawSubtitleBg(y, SCALE * 68, Math.min(ap * 3, 1));
  capWords(text, CW / 2, y, SCALE * 68, getTplStyle().subtitle?.hlColor || '#FFE033', 0, ap);
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
function buildSceneCards() {
  D.sceneList.innerHTML = '';
  S.script.scenes.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'scard'; d.id = `sc${i}`;
    const capDisplay = s.caption2 ? `${esc(s.caption1 || s.subtitle)} / ${esc(s.caption2)}` : esc(s.caption1 || s.subtitle);
    d.innerHTML = `<div class="scard-num">SCENE ${i + 1} · ${s.duration}s · #${(s.idx ?? 0) + 1} · ${s.subtitle_style || 'detail'}</div><div class="scard-sub">${capDisplay}</div><div class="scard-nar">${esc(s.narration)}</div>`;
    D.sceneList.appendChild(d);
  });
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
  const totalDur = S.script.scenes.reduce((a, s) => a + s.duration, 0);
  const nFrames  = Math.ceil(totalDur * FPS);
  const hasAudio = S.audioBuffers.some(b => b !== null);

  // 0. 코덱 자동 감지: MP4(H264 High) 우선 → WebM(VP9/VP8) 폴백
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
    latencyMode: 'quality', bitrateMode: 'constant' });

  // 4. 프레임별 렌더 + 인코딩
  for (let f = 0; f < nFrames; f++) {
    renderFrameAtTime(f / FPS);
    const vf = new VideoFrame(D.canvas, {
      timestamp: Math.round(f * 1_000_000 / FPS),
      duration:  Math.round(1_000_000 / FPS),
    });
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
      const slice = new Float32Array(pcm.subarray(i, Math.min(i + CHUNK, pcm.length)));
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

  downloadBlob(new Blob([buffer], { type: fmt.mime }), `moovlog_${sanitizeName()}.${fmt.ext}`);
  D.dlBtn.disabled  = false;
  D.dlBtn.innerHTML = '<i class="fas fa-download"></i> 다시 저장하기';
  toast(pcm ? `✓ AI 음성 포함 ${fmt.ext.toUpperCase()} 영상 저장 완료!` : `✓ ${fmt.ext.toUpperCase()} 영상 저장 완료!`, 'ok');
}

/* ── MediaRecorder 폴백 ──────────────────────────────────── */
async function doExportMediaRecorder() {
  toast('WebCodecs 미지원 → 녹화 방식으로 저장합니다', 'inf');
  const totalDur = S.script.scenes.reduce((a, s) => a + s.duration, 0);

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
      const dur = sc[si].duration, el = (now - ts) / 1000, prog = Math.min(el / dur, 1);
      S.subAnimProg = Math.min(prog * 2.8, 1);
      const TD = 0.28;
      if (el >= dur - TD && si < sc.length - 1) drawTransition(si, (el - (dur - TD)) / TD);
      else renderFrame(si, prog);
      if (prog >= 1) {
        if (si < sc.length - 1) { si++; ts = now; S.subAnimProg = 0; playSceneAudio(si, true); }
        else { resolve(); return; }
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
    const totalDur = S.script.scenes.reduce((a, s) => a + s.duration, 0);
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
  if (D.snsWrap) D.snsWrap.hidden = true;
  const styleBadge = document.getElementById('autoStyleBadge');
  if (styleBadge) styleBadge.hidden = true;
  const bgmBadge = document.getElementById('bgmBadge');
  if (bgmBadge) bgmBadge.hidden = true;
  updateStepUI(1);
}
function showLoad() { D.loadWrap.hidden = false; }
function hideLoad() { D.loadWrap.hidden = true; }
function setStep(n, title, sub) {
  D.loadTitle.textContent = title || ''; D.loadSub.textContent = sub || '';
  const items   = [D.ls1, D.ls2, D.ls3, D.ls4];
  const statuses = [D.ls1s, D.ls2s, D.ls3s, D.ls4s];
  items.forEach((el, i) => {
    if (!el) return;
    el.classList.toggle('active', i === n - 1);
    if (i < n - 1) el.classList.add('done');
    if (statuses[i]) statuses[i].textContent = i === n - 1 ? '진행중...' : i < n - 1 ? '완료' : '대기중';
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
