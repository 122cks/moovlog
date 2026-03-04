'use strict';

/* ============================================================
   무브먼트 Shorts Creator — script.js
   Gemini AI 스크립트 생성 + Canvas 숏폼 렌더러
   ============================================================ */

// ── Canvas 해상도 ────────────────────────────────────────────
const CANVAS_W = 720;
const CANVAS_H = 1280;

// ── DOM 헬퍼 ────────────────────────────────────────────────
const $ = id => document.getElementById(id);

/* ============================================================
   상태 관리
   ============================================================ */
// ── API 키 (고정) ────────────────────────────────────────────
const GEMINI_API_KEY = 'AIzaSyA-QrlNLTWEB-6fL0KE4OvodqXTalnvMHs';

const App = {
  apiKey:         GEMINI_API_KEY,
  mediaFiles:     [],          // { file, url, type('image'|'video') }
  loadedMedia:    [],          // { img|vid, type }
  scriptData:     null,        // { videoTitle, scenes[] }
  subtitleStyle:  'white',
  sceneDuration:  4,
  transition:     'fade',
  narrationLang:  'ko-KR',
  narrationSpeed: 1.0,

  // 플레이어 상태
  playing:         false,
  muted:           false,
  currentScene:    0,
  sceneStartTs:    null,       // performance.now() 기준 씬 시작 시각
  animFrame:       null,

  // 녹화
  recorder:        null,
  recordChunks:    [],
  recordInterval:  null,
  recordSeconds:   0,
};

/* ============================================================
   DOM 참조
   ============================================================ */
const dom = {
  uploadZone:      $('uploadZone'),
  mediaInput:      $('mediaInput'),
  mediaGrid:       $('mediaPreviewGrid'),

  videoTitle:      $('videoTitle'),
  videoContent:    $('videoContent'),
  videoHashtags:   $('videoHashtags'),
  sceneDuration:   $('sceneDuration'),
  transitionFx:    $('transitionEffect'),
  narrationLang:   $('narrationLang'),
  narrationSpeed:  $('narrationSpeed'),
  styleGroup:      $('subtitleStyleGroup'),

  generateBtn:     $('generateBtn'),
  loadingOverlay:  $('loadingOverlay'),
  loadingSub:      $('loadingSubText'),

  stepPreview:     $('stepPreview'),
  canvas:          $('shortsCanvas'),
  progressBar:     $('progressBar'),
  overlayTitle:    $('overlayTitle'),
  overlayHashtags: $('overlayHashtags'),

  playPauseBtn:    $('playPauseBtn'),
  playIcon:        $('playIcon'),
  replayBtn:       $('replayBtn'),
  muteBtn:         $('muteBtn'),
  muteIcon:        $('muteIcon'),

  scriptToggle:    $('scriptToggleBtn'),
  scriptContent:   $('scriptContent'),
  scriptChevron:   $('scriptChevron'),
  sceneList:       $('scriptSceneList'),

  exportBtn:       $('exportBtn'),
  recordBtn:       $('recordBtn'),
  recordStatus:    $('recordStatus'),
  recordTimer:     $('recordTimer'),

  toastContainer:  $('toastContainer'),
};

// Canvas 컨텍스트
dom.canvas.width  = CANVAS_W;
dom.canvas.height = CANVAS_H;
const ctx = dom.canvas.getContext('2d');

/* ============================================================
   초기화
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  bindUI();
});



/* ============================================================
   이벤트 바인딩
   ============================================================ */
function bindUI() {
  // 업로드 (label 클릭은 자체 처리되므로 uploadZone 전체 클릭과 중복 방지)
  dom.uploadZone.addEventListener('click', e => {
    if (e.target.closest('.upload-label-btn')) return;
    dom.mediaInput.click();
  });
  dom.uploadZone.addEventListener('dragover',  e => { e.preventDefault(); dom.uploadZone.classList.add('drag-over'); });
  dom.uploadZone.addEventListener('dragleave', () => dom.uploadZone.classList.remove('drag-over'));
  dom.uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    dom.uploadZone.classList.remove('drag-over');
    handleFiles(Array.from(e.dataTransfer.files));
  });
  dom.mediaInput.addEventListener('change', e => handleFiles(Array.from(e.target.files)));

  // 자막 스타일 선택
  dom.styleGroup.querySelectorAll('.style-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      dom.styleGroup.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      App.subtitleStyle = btn.dataset.style;
    })
  );

  // 생성
  dom.generateBtn.addEventListener('click', generate);

  // 플레이어 컨트롤
  dom.playPauseBtn.addEventListener('click', togglePlay);
  dom.replayBtn.addEventListener('click', replay);
  dom.muteBtn.addEventListener('click', toggleMute);

  // 스크립트 패널
  dom.scriptToggle.addEventListener('click', () => {
    const hidden = dom.scriptContent.hidden;
    dom.scriptContent.hidden = !hidden;
    dom.scriptChevron.classList.toggle('open', hidden);
  });

  // 내보내기
  dom.exportBtn.addEventListener('click', exportSilent);
  dom.recordBtn.addEventListener('click', toggleRecord);
}

/* ============================================================
   파일 업로드
   ============================================================ */
function handleFiles(files) {
  const allowed = f => f.type.startsWith('image/') || f.type.startsWith('video/');
  const valid   = files.filter(allowed);
  if (!valid.length) return;
  if (App.mediaFiles.length + valid.length > 10) {
    toast('최대 10개까지 업로드 가능합니다', 'error'); return;
  }
  valid.forEach(f => App.mediaFiles.push({ file: f, url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image' }));
  renderGrid();
  dom.mediaInput.value = '';
}

function renderGrid() {
  dom.mediaGrid.innerHTML = '';
  App.mediaFiles.forEach((m, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'media-thumb';

    if (m.type === 'image') {
      const img = document.createElement('img');
      img.src = m.url; img.alt = '';
      wrap.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = m.url; vid.muted = true; vid.preload = 'metadata';
      wrap.appendChild(vid);
    }

    const badge = document.createElement('span');
    badge.className = 'media-thumb-badge';
    badge.textContent = `${i + 1}`;
    wrap.appendChild(badge);

    const del = document.createElement('button');
    del.className = 'media-remove-btn';
    del.innerHTML = '<i class="fas fa-times"></i>';
    del.addEventListener('click', e => { e.stopPropagation(); removeMedia(i); });
    wrap.appendChild(del);

    dom.mediaGrid.appendChild(wrap);
  });
}

function removeMedia(idx) {
  URL.revokeObjectURL(App.mediaFiles[idx].url);
  App.mediaFiles.splice(idx, 1);
  renderGrid();
}

/* ============================================================
   Gemini API 호출
   ============================================================ */
async function callGemini(userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${App.apiKey}`;
  const res  = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.85, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API 오류 (${res.status})`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini 응답이 비어 있습니다');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

/* ============================================================
   스크립트 생성 메인
   ============================================================ */
async function generate() {
  if (!App.mediaFiles.length) {
    toast('이미지 또는 영상을 하나 이상 업로드해주세요', 'error'); return;
  }

  // 설정값 읽기
  App.sceneDuration   = +dom.sceneDuration.value;
  App.transition      = dom.transitionFx.value;
  App.narrationLang   = dom.narrationLang.value;
  App.narrationSpeed  = +dom.narrationSpeed.value;

  const title    = dom.videoTitle.value.trim()    || '나의 브이로그';
  const content  = dom.videoContent.value.trim()  || '오늘의 일상을 담은 숏폼 영상입니다.';
  const hashtags = dom.videoHashtags.value.trim() || '';
  const n        = App.mediaFiles.length;
  const langName = App.narrationLang === 'ko-KR' ? '한국어' : 'English';

  const prompt = `당신은 유튜브 숏츠 / 인스타그램 릴스 전문 스크립트 라이터입니다.
아래 정보로 매력적인 숏폼 영상 스크립트를 JSON 형식으로만 응답하세요.

[입력 정보]
- 영상 제목: ${title}
- 블로그 내용: ${content}
- 해시태그: ${hashtags || '없음'}
- 사용 가능한 이미지·영상 수: ${n}개 (0 ~ ${n - 1} 인덱스)
- 장면당 시간: ${App.sceneDuration}초
- 나레이션 언어: ${langName}

[작성 규칙]
1. scenes 배열에 정확히 ${n}개의 장면을 만드세요.
2. 각 장면의 image_index는 0~${n - 1} 범위.
3. subtitle: 화면에 표시될 자막. 15자 이내. 임팩트 있게.
4. narration: TTS로 읽힐 나레이션. 자연스럽고 활기차게. ${langName}로 작성.
5. 첫 장면은 강렬한 훅(hook)으로 시작하세요.
6. 마지막 장면에는 좋아요·구독 유도 문구를 넣으세요.
7. effect: "zoom-in" | "zoom-out" | "pan-left" | "pan-right" 중 하나.

[응답 형식 — JSON만 반환, 마크다운 코드블록 없이]
{
  "videoTitle": "${title}",
  "scenes": [
    {
      "image_index": 0,
      "duration": ${App.sceneDuration},
      "subtitle": "자막 텍스트",
      "narration": "나레이션 텍스트",
      "effect": "zoom-in"
    }
  ]
}`;

  setLoading(true, 'Gemini AI가 스크립트를 작성 중입니다...');
  try {
    setSub('이미지와 내용을 분석하는 중...');
    const result = await callGemini(prompt);
    if (!Array.isArray(result.scenes) || !result.scenes.length) throw new Error('장면 데이터가 없습니다');

    App.scriptData = result;

    setSub('이미지를 불러오는 중...');
    await preloadAllMedia();

    setLoading(false);
    buildSceneList();
    setupPreview();
    dom.stepPreview.hidden = false;
    dom.stepPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('스크립트 생성 완료! ▶ 재생해보세요 🎬', 'success');
  } catch (err) {
    setLoading(false);
    console.error(err);
    toast('오류: ' + err.message, 'error');
  }
}

function setLoading(show, msg = '') {
  dom.loadingOverlay.hidden = !show;
  if (msg) dom.loadingSub.textContent = msg;
  dom.generateBtn.disabled = show;
}

function setSub(text) { dom.loadingSub.textContent = text; }

/* ============================================================
   미디어 프리로드
   ============================================================ */
async function preloadAllMedia() {
  App.loadedMedia = [];
  for (const m of App.mediaFiles) {
    if (m.type === 'image') {
      const img = await loadImg(m.url);
      App.loadedMedia.push({ type: 'image', src: img });
    } else {
      const vid = document.createElement('video');
      vid.src = m.url; vid.muted = true; vid.loop = true; vid.playsInline = true;
      await new Promise(r => { vid.onloadeddata = r; vid.onerror = r; setTimeout(r, 4000); });
      App.loadedMedia.push({ type: 'video', src: vid });
    }
  }
}

function loadImg(url) {
  return new Promise((ok, fail) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = fail;
    i.src = url;
  });
}

/* ============================================================
   장면 목록 렌더링
   ============================================================ */
function buildSceneList() {
  dom.sceneList.innerHTML = '';
  App.scriptData.scenes.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'scene-card';
    card.id = `sc-${i}`;
    card.innerHTML = `
      <div class="scene-num">SCENE ${i + 1} &nbsp;·&nbsp; 이미지 #${s.image_index + 1} &nbsp;·&nbsp; ${s.duration}s</div>
      <div class="scene-subtitle">${esc(s.subtitle)}</div>
      <div class="scene-narration">${esc(s.narration)}</div>
      <div class="scene-meta"><span class="scene-tag">${esc(s.effect || 'zoom-in')}</span></div>
    `;
    dom.sceneList.appendChild(card);
  });
}

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ============================================================
   미리보기 세팅
   ============================================================ */
function setupPreview() {
  dom.overlayTitle.textContent    = App.scriptData.videoTitle || '';
  dom.overlayHashtags.textContent = dom.videoHashtags.value.trim();
  dom.progressBar.style.width     = '0%';
  App.currentScene = 0;
  App.playing      = false;
  App.sceneStartTs = null;
  updatePlayIcon(false);
  renderFrame(0, 0);     // 첫 프레임 그리기
}

/* ============================================================
   플레이어 컨트롤
   ============================================================ */
function togglePlay() {
  if (App.playing) pausePlayback();
  else             startPlayback();
}

function startPlayback() {
  if (!App.scriptData) return;
  App.playing      = true;
  App.sceneStartTs = performance.now();
  updatePlayIcon(true);
  if (!App.muted) speakScene(App.currentScene);
  runLoop();
}

function pausePlayback() {
  App.playing = false;
  if (App.animFrame) cancelAnimationFrame(App.animFrame);
  stopSpeech();
  updatePlayIcon(false);
}

function replay() {
  stopSpeech();
  if (App.animFrame) cancelAnimationFrame(App.animFrame);
  App.playing       = false;
  App.currentScene  = 0;
  App.sceneStartTs  = null;
  dom.progressBar.style.width = '0%';
  highlightScene(0);
  renderFrame(0, 0);
  updatePlayIcon(false);
  setTimeout(startPlayback, 80);
}

function toggleMute() {
  App.muted = !App.muted;
  dom.muteIcon.className = App.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  if (App.muted) stopSpeech();
  else if (App.playing) speakScene(App.currentScene);
}

function updatePlayIcon(playing) {
  dom.playIcon.className = playing ? 'fas fa-pause' : 'fas fa-play';
}

/* ============================================================
   애니메이션 루프
   ============================================================ */
function runLoop() {
  const tick = now => {
    if (!App.playing) return;

    const scenes  = App.scriptData.scenes;
    const scene   = scenes[App.currentScene];
    const elapsed = (now - App.sceneStartTs) / 1000;
    const dur     = scene.duration || App.sceneDuration;
    const prog    = Math.min(elapsed / dur, 1);

    // 전체 진행률 계산
    const total   = scenes.reduce((s, c) => s + (c.duration || App.sceneDuration), 0);
    const done    = scenes.slice(0, App.currentScene).reduce((s, c) => s + (c.duration || App.sceneDuration), 0);
    dom.progressBar.style.width = ((done + elapsed) / total * 100) + '%';

    // 전환 구간
    const TD = 0.45;
    if (elapsed >= dur - TD && App.currentScene < scenes.length - 1) {
      drawTransition(App.currentScene, (elapsed - (dur - TD)) / TD);
    } else {
      renderFrame(App.currentScene, prog);
    }

    // 다음 씬으로
    if (prog >= 1) {
      if (App.currentScene < scenes.length - 1) {
        App.currentScene++;
        App.sceneStartTs = now;
        highlightScene(App.currentScene);
        if (!App.muted) speakScene(App.currentScene);
      } else {
        // 영상 끝
        renderFrame(App.currentScene, 1);
        dom.progressBar.style.width = '100%';
        App.playing = false;
        updatePlayIcon(false);
        stopSpeech();
        if (App.recorder?.state === 'recording') finishRecording();
        return;
      }
    }

    App.animFrame = requestAnimationFrame(tick);
  };
  App.animFrame = requestAnimationFrame(tick);
}

/* ============================================================
   Canvas 렌더링
   ============================================================ */
function renderFrame(sceneIdx, prog) {
  const scene  = App.scriptData.scenes[sceneIdx];
  const media  = mediaForScene(scene);
  const effect = scene.effect || 'zoom-in';

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawMedia(media, effect, prog);
  drawGradientOverlay();
  drawSubtitle(scene.subtitle || '', App.subtitleStyle);
}

function drawTransition(fromIdx, t) {
  const scenes = App.scriptData.scenes;
  switch (App.transition) {
    case 'slide': {
      const cm = mediaForScene(scenes[fromIdx]);
      const nm = mediaForScene(scenes[fromIdx + 1]);
      ctx.save(); ctx.translate(-CANVAS_W * ease(t), 0);
      drawMedia(cm, scenes[fromIdx].effect || 'zoom-in', 1);
      drawGradientOverlay();
      drawSubtitle(scenes[fromIdx].subtitle || '', App.subtitleStyle);
      ctx.restore();
      ctx.save(); ctx.translate(CANVAS_W * (1 - ease(t)), 0);
      drawMedia(nm, scenes[fromIdx + 1].effect || 'zoom-in', 0);
      drawGradientOverlay();
      drawSubtitle(scenes[fromIdx + 1].subtitle || '', App.subtitleStyle);
      ctx.restore();
      break;
    }
    case 'zoom': {
      renderFrame(fromIdx, 1);
      ctx.save();
      const sc = 0.85 + ease(t) * 0.15;
      ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
      ctx.scale(sc, sc);
      ctx.globalAlpha = ease(t);
      ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);
      renderFrame(fromIdx + 1, 0);
      ctx.restore();
      break;
    }
    default: { // fade
      renderFrame(fromIdx, 1);
      ctx.save(); ctx.globalAlpha = ease(t);
      renderFrame(fromIdx + 1, 0);
      ctx.restore();
    }
  }
}

function mediaForScene(scene) {
  const idx = (scene.image_index ?? 0) % App.loadedMedia.length;
  return App.loadedMedia[idx] || null;
}

function drawMedia(media, effect, prog) {
  if (!media) {
    ctx.fillStyle = '#111122';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    return;
  }

  let scale = 1, ox = 0, oy = 0;
  const e = ease(prog);

  if      (effect === 'zoom-in')  scale = 1.0 + e * 0.10;
  else if (effect === 'zoom-out') scale = 1.10 - e * 0.10;
  else if (effect === 'pan-left') { scale = 1.08; ox = -e * CANVAS_W * 0.04; }
  else if (effect === 'pan-right'){ scale = 1.08; ox =  e * CANVAS_W * 0.04; }
  else                             scale = 1.05;

  const src = media.type === 'video' ? media.src : media.src;
  const sw  = media.type === 'video' ? (media.src.videoWidth  || CANVAS_W) : media.src.naturalWidth;
  const sh  = media.type === 'video' ? (media.src.videoHeight || CANVAS_H) : media.src.naturalHeight;
  const r   = Math.max(CANVAS_W / sw, CANVAS_H / sh);
  const dw  = sw * r, dh = sh * r;

  ctx.save();
  ctx.translate(CANVAS_W / 2 + ox, CANVAS_H / 2 + oy);
  ctx.scale(scale, scale);
  ctx.drawImage(src, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawGradientOverlay() {
  // 상단 살짝
  const top = ctx.createLinearGradient(0, 0, 0, CANVAS_H * 0.25);
  top.addColorStop(0, 'rgba(0,0,0,0.35)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H * 0.25);

  // 하단
  const bot = ctx.createLinearGradient(0, CANVAS_H * 0.5, 0, CANVAS_H);
  bot.addColorStop(0, 'rgba(0,0,0,0)');
  bot.addColorStop(1, 'rgba(0,0,0,0.80)');
  ctx.fillStyle = bot;
  ctx.fillRect(0, CANVAS_H * 0.5, CANVAS_W, CANVAS_H * 0.5);
}

function drawSubtitle(text, style) {
  if (!text) return;

  ctx.font          = 'bold 52px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'middle';

  const maxW = CANVAS_W - 90;
  const lines = breakLines(text, maxW);
  const lineH = 68;
  const totalH = lines.length * lineH;
  const baseY  = CANVAS_H - 200 - totalH / 2;

  lines.forEach((line, i) => {
    const x = CANVAS_W / 2;
    const y = baseY + i * lineH;

    switch (style) {
      case 'yellow':
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, x, y);
        ctx.fillStyle = '#FFE400';
        ctx.fillText(line, x, y);
        break;

      case 'gradient': {
        const g = ctx.createLinearGradient(x - 180, y, x + 180, y);
        g.addColorStop(0, '#ff4d6d');
        g.addColorStop(1, '#c77dff');
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 6;
        ctx.strokeText(line, x, y);
        ctx.fillStyle = g;
        ctx.fillText(line, x, y);
        break;
      }

      case 'outline':
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 9;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, x, y);
        ctx.fillStyle = '#fff';
        ctx.fillText(line, x, y);
        break;

      default: { // white (기본)
        const m  = ctx.measureText(line);
        const bw = m.width + 36;
        const bh = 60;
        pill(x - bw / 2, y - bh / 2, bw, bh, 12);
        ctx.fillStyle = 'rgba(0,0,0,0.50)';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, x, y);
      }
    }
  });
}

function breakLines(text, maxW) {
  ctx.font = 'bold 52px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif';
  // 한국어는 글자 단위로도 분리
  const words = text.split(/ |\u00a0/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur); cur = w;
    } else { cur = test; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function pill(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

/* ============================================================
   TTS 나레이션 (Web Speech API)
   ============================================================ */
function speakScene(idx) {
  if (!('speechSynthesis' in window)) return;
  stopSpeech();
  const sc = App.scriptData?.scenes?.[idx];
  if (!sc?.narration) return;

  const u    = new SpeechSynthesisUtterance(sc.narration);
  u.lang     = App.narrationLang;
  u.rate     = App.narrationSpeed;
  u.pitch    = 1.05;
  u.volume   = 0.95;
  window.speechSynthesis.speak(u);
}

function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/* ============================================================
   씬 카드 하이라이트
   ============================================================ */
function highlightScene(idx) {
  document.querySelectorAll('.scene-card').forEach(c => c.classList.remove('active'));
  const card = $(`sc-${idx}`);
  if (card) { card.classList.add('active'); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

/* ============================================================
   내보내기 (무음 자동 녹화)
   ============================================================ */
async function exportSilent() {
  if (!App.scriptData || !App.loadedMedia.length) {
    toast('스크립트를 먼저 생성해주세요', 'error'); return;
  }
  dom.exportBtn.disabled = true;
  toast('영상 녹화 시작... 잠시 기다려주세요 ⏳', 'info');

  const stream   = dom.canvas.captureStream(30);
  const mimeType = getSupportedMime();
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks   = [];

  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    download(new Blob(chunks, { type: mimeType }), `moovlog_shorts_${Date.now()}.webm`);
    dom.exportBtn.disabled = false;
    toast('✓ 영상 다운로드 완료!', 'success');
  };

  recorder.start(100);
  await playbackForExport();
  recorder.stop();
}

function playbackForExport() {
  return new Promise(resolve => {
    const scenes = App.scriptData.scenes;
    let idx = 0, startTs = null;

    const tick = now => {
      if (!startTs) startTs = now;
      const sc      = scenes[idx];
      const dur     = sc.duration || App.sceneDuration;
      const elapsed = (now - startTs) / 1000;
      const prog    = Math.min(elapsed / dur, 1);
      const TD      = 0.45;

      if (elapsed >= dur - TD && idx < scenes.length - 1) {
        drawTransition(idx, (elapsed - (dur - TD)) / TD);
      } else {
        renderFrame(idx, prog);
      }

      if (prog >= 1) {
        if (idx < scenes.length - 1) { idx++; startTs = now; }
        else                          { resolve(); return; }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ============================================================
   나레이션 포함 녹화
   ============================================================ */
function toggleRecord() {
  if (App.recorder?.state === 'recording') {
    finishRecording();
  } else {
    beginRecording();
  }
}

function beginRecording() {
  if (!App.scriptData || !App.loadedMedia.length) {
    toast('스크립트를 먼저 생성해주세요', 'error'); return;
  }

  const stream   = dom.canvas.captureStream(30);
  const mimeType = getSupportedMime();
  App.recorder    = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  App.recordChunks = [];
  App.recordSeconds = 0;

  App.recorder.ondataavailable = e => { if (e.data.size > 0) App.recordChunks.push(e.data); };
  App.recorder.onstop = () => {
    clearInterval(App.recordInterval);
    download(new Blob(App.recordChunks, { type: mimeType }), `moovlog_narration_${Date.now()}.webm`);
    dom.recordStatus.hidden = true;
    dom.recordBtn.innerHTML = '<i class="fas fa-circle-dot"></i> 나레이션 포함 녹화';
    toast('✓ 나레이션 포함 녹화 완료!', 'success');
  };

  App.recorder.start(100);
  dom.recordStatus.hidden = false;
  dom.recordBtn.innerHTML = '<i class="fas fa-stop"></i> 녹화 중지';

  App.recordInterval = setInterval(() => {
    App.recordSeconds++;
    const m = Math.floor(App.recordSeconds / 60);
    const s = String(App.recordSeconds % 60).padStart(2, '0');
    dom.recordTimer.textContent = `${m}:${s}`;
  }, 1000);

  replay();   // 처음부터 재생 (TTS + 캔버스 동시에)
  toast('🔴 녹화 시작! 영상이 끝나면 자동 저장됩니다', 'info');
}

function finishRecording() {
  if (App.recorder?.state === 'recording') App.recorder.stop();
  pausePlayback();
}

/* ============================================================
   유틸리티
   ============================================================ */
function getSupportedMime() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  dom.toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => el.remove(), 350);
  }, 3800);
}
