'use strict';
/* ============================================================
   무브먼트 Shorts Creator v2 — script.js
   이미지/영상 업로드 + 음식점 이름 → Gemini Vision 분석
   → 자동 자막·나레이션·Canvas 영상 렌더링·다운로드
   ============================================================ */

const GEMINI_API_KEY = 'AIzaSyA-QrlNLTWEB-6fL0KE4OvodqXTalnvMHs';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// 캔버스 해상도 (9:16 세로)
const CW = 720, CH = 1280;

const g  = id => document.getElementById(id);
const dom = {
  dropArea:  g('dropArea'),
  fileInput: g('fileInput'),
  thumbGrid: g('thumbGrid'),
  restName:  g('restName'),
  makeBtn:   g('makeBtn'),
  // 로딩
  loadWrap:  g('loadingWrap'),
  loadTitle: g('loadTitle'),
  loadSub:   g('loadSub'),
  ls1: g('ls1'), ls2: g('ls2'), ls3: g('ls3'),
  // 결과
  resultWrap: g('resultWrap'),
  canvas:     g('vc'),
  vProg:      g('vProg'),
  playBtn:    g('playBtn'),
  playIco:    g('playIco'),
  replayBtn:  g('replayBtn'),
  muteBtn:    g('muteBtn'),
  muteIco:    g('muteIco'),
  sceneList:  g('sceneList'),
  dlBtn:      g('dlBtn'),
  recStatus:  g('recStatus'),
  recTimer:   g('recTimer'),
  reBtn:      g('reBtn'),
  toasts:     g('toasts'),
};

const ctx = dom.canvas.getContext('2d');
dom.canvas.width  = CW;
dom.canvas.height = CH;

/* ── 앱 상태 ─────────────────────────────────────────────── */
const S = {
  files:       [],   // { file, url, type }
  loaded:      [],   // { type, src (img|vid) }
  script:      null, // { title, hashtags, scenes[] }
  playing:     false,
  muted:       false,
  scene:       0,
  startTs:     null,
  raf:         null,
  // 자막 애니메이션
  subWords:    [],
  subWIdx:     0,
  subTimer:    null,
};

/* ── 초기화 ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', bindUI);

function bindUI() {
  // 드래그 앤 드롭
  dom.dropArea.addEventListener('dragover', e => { e.preventDefault(); dom.dropArea.classList.add('over'); });
  dom.dropArea.addEventListener('dragleave', () => dom.dropArea.classList.remove('over'));
  dom.dropArea.addEventListener('drop', e => {
    e.preventDefault(); dom.dropArea.classList.remove('over');
    addFiles([...e.dataTransfer.files]);
  });
  dom.dropArea.addEventListener('click', e => {
    if (!e.target.closest('.pick-btn')) dom.fileInput.click();
  });
  dom.fileInput.addEventListener('change', e => { addFiles([...e.target.files]); dom.fileInput.value = ''; });

  // 제작 버튼
  dom.makeBtn.addEventListener('click', startMake);

  // 플레이어
  dom.playBtn.addEventListener('click',   togglePlay);
  dom.replayBtn.addEventListener('click', doReplay);
  dom.muteBtn.addEventListener('click',   toggleMute);

  // 다운로드 / 다시 만들기
  dom.dlBtn.addEventListener('click', doExport);
  dom.reBtn.addEventListener('click', goBack);
}

/* ── 파일 추가 ───────────────────────────────────────────── */
function addFiles(files) {
  const allowed = f => f.type.startsWith('image/') || f.type.startsWith('video/');
  const valid   = files.filter(allowed);
  if (!valid.length) return;
  if (S.files.length + valid.length > 10) { toast('최대 10개까지 가능합니다', 'err'); return; }
  valid.forEach(f => S.files.push({ file: f, url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image' }));
  renderThumbs();
}

function renderThumbs() {
  dom.thumbGrid.innerHTML = '';
  S.files.forEach((m, i) => {
    const d = document.createElement('div');
    d.className = 'ti';
    if (m.type === 'image') {
      const img = document.createElement('img'); img.src = m.url;
      d.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = m.url; vid.muted = true; vid.preload = 'metadata';
      d.appendChild(vid);
    }
    const badge = Object.assign(document.createElement('span'), { className: 'ti-badge', textContent: i + 1 });
    const del   = Object.assign(document.createElement('button'), { className: 'ti-del', innerHTML: '<i class="fas fa-times"></i>' });
    del.addEventListener('click', ev => { ev.stopPropagation(); S.files.splice(i, 1); renderThumbs(); });
    d.append(badge, del);
    dom.thumbGrid.appendChild(d);
  });
}

/* ── 메인 제작 흐름 ──────────────────────────────────────── */
async function startMake() {
  if (!S.files.length) { toast('이미지 또는 영상을 업로드해주세요', 'err'); return; }
  const name = dom.restName.value.trim();
  if (!name) { toast('음식점 이름을 입력해주세요', 'err'); dom.restName.focus(); return; }

  dom.makeBtn.disabled = true;
  showLoading();

  try {
    // STEP 1: Gemini Vision 분석
    setStep(1);
    setLoad('Gemini가 이미지를 분석 중...', '음식 사진을 인식하고 있습니다');
    const script = await analyzeAndGenerate(name);
    S.script = script;
    doneStep(1);

    // STEP 2: 미디어 프리로드
    setStep(2);
    setLoad('스크립트 완성', `${script.scenes.length}개 장면이 생성되었습니다`);
    await preload();
    doneStep(2);

    // STEP 3: Canvas 렌더링 준비
    setStep(3);
    setLoad('영상 렌더링 준비 중...', '첫 프레임을 준비합니다');
    buildSceneCards();
    await sleep(600);
    doneStep(3);

    hideLoading();
    setupPlayer();
    dom.resultWrap.hidden = false;
    setTimeout(() => startPlay(), 400);

  } catch (err) {
    hideLoading();
    dom.makeBtn.disabled = false;
    console.error(err);
    toast('오류: ' + err.message, 'err');
  }
}

/* ── Gemini Vision API ───────────────────────────────────── */
async function analyzeAndGenerate(restaurantName) {
  // 이미지 최대 4장을 base64로 변환
  const images = S.files.filter(f => f.type === 'image').slice(0, 4);
  const imgParts = [];

  for (const img of images) {
    const b64 = await fileToBase64(img.file);
    const mime = img.file.type || 'image/jpeg';
    imgParts.push({ inline_data: { mime_type: mime, data: b64 } });
  }

  const textPrompt = `당신은 한국 인플루언서 "${restaurantName}"의 숏폼 영상 전문 PD입니다.
위 음식 이미지들을 분석하여, 유튜브 숏츠 / 인스타그램 릴스용 영상 스크립트를 작성하세요.

[지시사항]
- 총 장면 수: 이미지·영상 개수에 맞게 ${S.files.length}개
- 각 장면마다 이미지 인덱스(0~${S.files.length - 1})를 지정하세요
- 영상 톤: 활기차고 식욕을 자극하는 무브먼트 블로그 스타일 (남성 나레이터 느낌)
- 자막: 임팩트 있는 한국어, 10자 이내
- 나레이션: 자연스러운 한국어, 1~2문장
- 첫 장면은 강력한 훅(hook)으로 시작
- 마지막 장면은 좋아요·구독 유도
- effect는 "zoom-in" | "zoom-out" | "pan-left" | "pan-right" 중 선택
- duration은 각 나레이션 길이에 맞게 3~6 사이 정수

[JSON만 반환. 다른 텍스트 없이]
{
  "title": "${restaurantName} 맛집 탐방",
  "hashtags": "#맛집 #${restaurantName.replace(/\s/g,'')} #서울맛집 #무브먼트",
  "scenes": [
    {
      "idx": 0,
      "duration": 4,
      "subtitle": "자막 텍스트",
      "narration": "나레이션 텍스트",
      "effect": "zoom-in"
    }
  ]
}`;

  const parts = [...imgParts, { text: textPrompt }];

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.85,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `API 오류 (${res.status})`);
  }

  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed.scenes) || !parsed.scenes.length) throw new Error('장면 데이터가 없습니다');
  return parsed;
}

function fileToBase64(file) {
  return new Promise((ok, fail) => {
    const r = new FileReader();
    r.onload  = e => ok(e.target.result.split(',')[1]);
    r.onerror = fail;
    r.readAsDataURL(file);
  });
}

/* ── 미디어 프리로드 ─────────────────────────────────────── */
async function preload() {
  S.loaded = [];
  for (const m of S.files) {
    if (m.type === 'image') {
      const img = await loadImg(m.url);
      S.loaded.push({ type: 'image', src: img });
    } else {
      const vid = document.createElement('video');
      vid.src = m.url; vid.muted = true; vid.loop = true; vid.playsInline = true;
      await new Promise(r => { vid.onloadeddata = r; vid.onerror = r; setTimeout(r, 5000); });
      S.loaded.push({ type: 'video', src: vid });
    }
  }
}

const loadImg = url => new Promise((ok, fail) => {
  const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = url;
});

/* ── 씬 카드 목록 ───────────────────────────────────────── */
function buildSceneCards() {
  dom.sceneList.innerHTML = '';
  S.script.scenes.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'scard';
    d.id = `sc${i}`;
    d.innerHTML = `
      <div class="scard-num">SCENE ${i + 1} · ${s.duration}s · #${s.idx + 1}</div>
      <div class="scard-sub">${esc(s.subtitle)}</div>
      <div class="scard-nar">${esc(s.narration)}</div>
    `;
    dom.sceneList.appendChild(d);
  });
}

/* ── 플레이어 세팅 ──────────────────────────────────────── */
function setupPlayer() {
  S.playing = false; S.scene = 0; S.startTs = null;
  dom.vProg.style.width = '0%';
  renderFrame(0, 0);
  setPlayIcon(false);
}

/* ── 재생 컨트롤 ────────────────────────────────────────── */
function togglePlay() { S.playing ? pausePlay() : startPlay(); }

function startPlay() {
  S.playing = true; S.startTs = performance.now();
  setPlayIcon(true);
  if (!S.muted) speakScene(S.scene);
  tick();
}

function pausePlay() {
  S.playing = false;
  if (S.raf) cancelAnimationFrame(S.raf);
  stopSpeech();
  setPlayIcon(false);
}

function doReplay() {
  stopSpeech();
  if (S.raf) cancelAnimationFrame(S.raf);
  S.playing = false; S.scene = 0; S.startTs = null;
  dom.vProg.style.width = '0%';
  highlightScene(0);
  renderFrame(0, 0);
  setPlayIcon(false);
  clearSubAnim();
  setTimeout(startPlay, 80);
}

function toggleMute() {
  S.muted = !S.muted;
  dom.muteIco.className = S.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  if (S.muted) stopSpeech();
  else if (S.playing) speakScene(S.scene);
}

function setPlayIcon(pl) { dom.playIco.className = pl ? 'fas fa-pause' : 'fas fa-play'; }

/* ── 애니메이션 루프 ─────────────────────────────────────── */
function tick() {
  const run = now => {
    if (!S.playing) return;
    const scenes = S.script.scenes;
    const sc     = scenes[S.scene];
    const dur    = sc.duration;
    const el     = (now - S.startTs) / 1000;
    const prog   = Math.min(el / dur, 1);

    // 전체 진행률
    const total = scenes.reduce((a, s) => a + s.duration, 0);
    const done  = scenes.slice(0, S.scene).reduce((a, s) => a + s.duration, 0);
    dom.vProg.style.width = ((done + el) / total * 100) + '%';

    const TD = 0.4;
    if (el >= dur - TD && S.scene < scenes.length - 1) {
      drawTransition(S.scene, (el - (dur - TD)) / TD);
    } else {
      renderFrame(S.scene, prog);
    }

    if (prog >= 1) {
      if (S.scene < scenes.length - 1) {
        S.scene++;
        S.startTs = now;
        highlightScene(S.scene);
        if (!S.muted) speakScene(S.scene);
        startSubAnim(S.scene);
      } else {
        // 끝
        dom.vProg.style.width = '100%';
        S.playing = false;
        stopSpeech();
        clearSubAnim();
        setPlayIcon(false);
        if (S._exportResolve) { S._exportResolve(); S._exportResolve = null; }
        return;
      }
    }
    S.raf = requestAnimationFrame(run);
  };
  S.raf = requestAnimationFrame(run);
}

/* ── Canvas 렌더 ─────────────────────────────────────────── */
function renderFrame(si, prog) {
  const sc    = S.script.scenes[si];
  const media = getMedia(sc);
  ctx.clearRect(0, 0, CW, CH);
  drawMedia(media, sc.effect, prog);
  drawGrad();
  drawSubtitle(sc.subtitle, prog, si === S.scene ? S.subWIdx : 9999);
  drawHashtags();
}

function drawTransition(fi, t) {
  const scenes = S.script.scenes;
  const e = ease(t);
  // 크로스페이드
  renderFrame(fi, 1);
  ctx.save(); ctx.globalAlpha = e;
  renderFrame(fi + 1, 0);
  ctx.restore();
}

function getMedia(sc) {
  const idx = (sc.idx ?? 0) % S.loaded.length;
  return S.loaded[idx] || null;
}

function drawMedia(media, effect, prog) {
  if (!media) { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, CW, CH); return; }
  const e = ease(prog);
  let sc = 1, ox = 0, oy = 0;
  if      (effect === 'zoom-in')  sc = 1.0 + e * 0.09;
  else if (effect === 'zoom-out') sc = 1.09 - e * 0.09;
  else if (effect === 'pan-left') { sc = 1.08; ox = -e * CW * 0.05; }
  else if (effect === 'pan-right'){ sc = 1.08; ox =  e * CW * 0.05; }

  const el  = media.src;
  const sw  = media.type === 'video' ? (el.videoWidth  || CW) : el.naturalWidth;
  const sh  = media.type === 'video' ? (el.videoHeight || CH) : el.naturalHeight;
  const r   = Math.max(CW / sw, CH / sh);
  const dw  = sw * r, dh = sh * r;
  ctx.save();
  ctx.translate(CW / 2 + ox, CH / 2 + oy);
  ctx.scale(sc, sc);
  ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawGrad() {
  // 상단
  const top = ctx.createLinearGradient(0, 0, 0, CH * 0.3);
  top.addColorStop(0, 'rgba(0,0,0,0.45)'); top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, CW, CH * 0.3);
  // 하단
  const bot = ctx.createLinearGradient(0, CH * 0.45, 0, CH);
  bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = bot; ctx.fillRect(0, CH * 0.45, CW, CH * 0.55);
}

/* ── 자막 (단어별 등장 애니메이션) ── */
function drawSubtitle(text, prog, wordLimit) {
  if (!text) return;

  const words = text.split('');  // 한 글자씩
  const visible = words.slice(0, wordLimit === 9999 ? words.length : wordLimit);
  if (!visible.length) return;

  const displayText = visible.join('');

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = 'bold 68px "Noto Sans KR", sans-serif';

  const x = CW / 2;
  const y = CH - 200;

  // 텍스트 쉐도우 효과 (여러 번 그리기)
  for (let i = 3; i >= 0; i--) {
    ctx.globalAlpha = 0.15 * (4 - i);
    ctx.fillStyle   = '#000';
    ctx.fillText(displayText, x + i, y + i);
  }
  ctx.globalAlpha = 1;

  // 흰색 자막 (stroke + fill)
  ctx.lineWidth   = 8;
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(displayText, x, y);
  ctx.fillStyle   = '#ffffff';
  ctx.fillText(displayText, x, y);

  // 자막 아래 가는 선 (포인트)
  const tw = ctx.measureText(displayText).width;
  const lineY = y + 46;
  const lg = ctx.createLinearGradient(x - tw / 2, 0, x + tw / 2, 0);
  lg.addColorStop(0,   'rgba(255,77,109,0)');
  lg.addColorStop(0.5, 'rgba(255,77,109,0.9)');
  lg.addColorStop(1,   'rgba(199,125,255,0)');
  ctx.globalAlpha = Math.min(1, wordLimit / Math.max(text.length, 1));
  ctx.strokeStyle = lg;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - tw / 2, lineY); ctx.lineTo(x + tw / 2, lineY); ctx.stroke();

  ctx.restore();
}

function drawHashtags() {
  if (!S.script?.hashtags) return;
  ctx.save();
  ctx.font         = '28px "Noto Sans KR", sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.55)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(S.script.hashtags, CW / 2, CH - 60);
  ctx.restore();
}

/* ── 자막 글자별 등장 타이머 ─────────────────────────────── */
function startSubAnim(si) {
  clearSubAnim();
  const sc   = S.script.scenes[si];
  const text = sc.subtitle || '';
  const dur  = sc.duration * 1000;
  const step = Math.max(60, dur / (text.length + 2));
  S.subWIdx  = 0;
  S.subTimer = setInterval(() => {
    if (S.subWIdx < text.length) { S.subWIdx++; }
    else clearSubAnim();
  }, step);
}

function clearSubAnim() {
  if (S.subTimer) { clearInterval(S.subTimer); S.subTimer = null; }
  S.subWIdx = 9999;
}

/* ── TTS (한국어 남성 목소리) ─────────────────────────────── */
function speakScene(si) {
  if (!('speechSynthesis' in window)) return;
  stopSpeech();
  const sc = S.script?.scenes?.[si];
  if (!sc?.narration) return;

  const u    = new SpeechSynthesisUtterance(sc.narration);
  u.lang     = 'ko-KR';
  u.rate     = 1.0;
  u.pitch    = 0.85;   // 낮게 → 남성 느낌
  u.volume   = 1.0;

  // 남성 목소리 선택 시도
  const voices = window.speechSynthesis.getVoices();
  const maleKo = voices.find(v =>
    v.lang.startsWith('ko') && /male|남|Man|man/i.test(v.name)
  ) || voices.find(v => v.lang.startsWith('ko') && v.name.includes('Google')) 
    || voices.find(v => v.lang.startsWith('ko'));
  if (maleKo) u.voice = maleKo;

  window.speechSynthesis.speak(u);
}

function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/* ── 씬 카드 하이라이트 ─────────────────────────────────── */
function highlightScene(i) {
  document.querySelectorAll('.scard').forEach(c => c.classList.remove('active'));
  const c = g(`sc${i}`);
  if (c) { c.classList.add('active'); c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

/* ── 영상 내보내기 ───────────────────────────────────────── */
async function doExport() {
  if (!S.script || !S.loaded.length) { toast('먼저 영상을 생성해주세요', 'err'); return; }
  dom.dlBtn.disabled = true;
  dom.recStatus.hidden = false;

  let sec = 0;
  const interval = setInterval(() => {
    sec++; const m = Math.floor(sec / 60); const s = String(sec % 60).padStart(2, '0');
    dom.recTimer.textContent = `${m}:${s}`;
  }, 1000);

  const mimeType = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const stream   = dom.canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  const chunks   = [];

  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    clearInterval(interval);
    dom.recStatus.hidden  = true;
    dom.dlBtn.disabled    = false;
    const blob = new Blob(chunks, { type: mimeType });
    const a    = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `moovlog_${Date.now()}.webm`,
    });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('✓ 영상 저장 완료!', 'ok');
  };

  recorder.start(200);

  // 오프라인 렌더링
  await renderForExport();
  recorder.stop();
}

function renderForExport() {
  return new Promise(resolve => {
    const scenes = S.script.scenes;
    let si = 0, ts = null;

    const frame = now => {
      if (!ts) ts = now;
      const sc   = scenes[si];
      const dur  = sc.duration;
      const el   = (now - ts) / 1000;
      const prog = Math.min(el / dur, 1);
      const TD   = 0.4;

      if (el >= dur - TD && si < scenes.length - 1) {
        drawTransition(si, (el - (dur - TD)) / TD);
      } else {
        renderFrame(si, prog);
      }

      if (prog >= 1) {
        if (si < scenes.length - 1) { si++; ts = now; }
        else { resolve(); return; }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

/* ── 뒤로 가기 ──────────────────────────────────────────── */
function goBack() {
  pausePlay();
  clearSubAnim();
  dom.resultWrap.hidden = true;
  dom.makeBtn.disabled  = false;
}

/* ── 로딩 UI ─────────────────────────────────────────────── */
function showLoading() { dom.loadWrap.hidden = false; }
function hideLoading() { dom.loadWrap.hidden = true; }
function setLoad(title, sub) { dom.loadTitle.textContent = title; dom.loadSub.textContent = sub; }
function setStep(n) {
  [dom.ls1, dom.ls2, dom.ls3].forEach((el, i) => {
    el.classList.toggle('active', i === n - 1);
  });
}
function doneStep(n) {
  [dom.ls1, dom.ls2, dom.ls3][n - 1]?.classList.replace('active', 'done');
}

/* ── 유틸 ────────────────────────────────────────────────── */
function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function toast(msg, type = 'inf') {
  const icons = { ok: 'fa-check-circle', err: 'fa-exclamation-circle', inf: 'fa-info-circle' };
  const el = Object.assign(document.createElement('div'), {
    className: `toast ${type}`,
    innerHTML: `<i class="fas ${icons[type]}"></i><span>${msg}</span>`,
  });
  dom.toasts.appendChild(el);
  setTimeout(() => { el.style.animation = 'tOut .3s ease forwards'; setTimeout(() => el.remove(), 350); }, 3500);
}

// 음성 목록 미리 로드 (일부 브라우저 필요)
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {};
  window.speechSynthesis.getVoices();
}
