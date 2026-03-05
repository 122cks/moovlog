'use strict';
/* ============================================================
   무브먼트 Shorts Creator v4 — script.js
   ✅ 4-Process Pipeline:
     1. Vision Analysis   → Gemini 2.0 Flash 이미지/영상 분석
     2. Editing&Scripting → JSON 스토리보드 + SNS 태그 생성
     3. Programmatic Edit → Canvas Ken Burns Effect + 반투명 자막
     4. Audio Synthesis   → Google TTS Wavenet + AudioContext 합성
   ============================================================ */

/* ── API 설정 ─────────────────────────────────────────────── */
const GEMINI_KEY  = '__GEMINI_KEY__';
// ✅ 2026년 최신 모델 - Vision에 가장 뛰어난 모델
const GEMINI_URL  = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
// ✅ Gemini TTS - AI Studio 키로 동작하는 음성 합성
const GEMINI_TTS_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_KEY}`;

const CW = 720, CH = 1280;

const g = id => document.getElementById(id);
const D = {
  dropArea:   g('dropArea'),   fileInput: g('fileInput'),
  thumbGrid:  g('thumbGrid'),  restName:  g('restName'),
  makeBtn:    g('makeBtn'),
  loadWrap:   g('loadingWrap'),loadTitle: g('loadTitle'),
  loadSub:    g('loadSub'),    ls1: g('ls1'), ls2: g('ls2'), ls3: g('ls3'),
  resultWrap: g('resultWrap'), canvas:    g('vc'),
  vProg:      g('vProg'),      playBtn:   g('playBtn'),
  playIco:    g('playIco'),    replayBtn: g('replayBtn'),
  muteBtn:    g('muteBtn'),    muteIco:   g('muteIco'),
  sceneList:  g('sceneList'),  dlBtn:     g('dlBtn'),
  recStatus:  g('recStatus'),  recTimer:  g('recTimer'),
  reBtn:      g('reBtn'),      toasts:    g('toasts'),
  audioStatus:g('audioStatus'),
  // SNS 태그
  snsWrap:    g('snsWrap'),
  tagNaver:   g('tagNaver'),   tagYoutube: g('tagYoutube'),
  tagInsta:   g('tagInsta'),   tagTiktok:  g('tagTiktok'),
};

const ctx = D.canvas.getContext('2d');
D.canvas.width = CW; D.canvas.height = CH;

/* ── AudioContext ─────────────────────────────────────────── */
let audioCtx = null, audioMixDest = null, useTTSApi = true;
function ensureAudio() {
  if (audioCtx) return;
  audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
  audioMixDest = audioCtx.createMediaStreamDestination();
}

/* ── 앱 상태 ─────────────────────────────────────────────── */
const S = {
  files: [], loaded: [], script: null, audioBuffers: [],
  currentAudio: null, playing: false, muted: false,
  scene: 0, startTs: null, raf: null, subCharIdx: 0, subTimer: null,
};

/* ── 초기화 ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  D.dropArea.addEventListener('dragover', e => { e.preventDefault(); D.dropArea.classList.add('over'); });
  D.dropArea.addEventListener('dragleave', () => D.dropArea.classList.remove('over'));
  D.dropArea.addEventListener('drop', e => { e.preventDefault(); D.dropArea.classList.remove('over'); addFiles([...e.dataTransfer.files]); });
  D.dropArea.addEventListener('click', e => { if (!e.target.closest('.pick-btn')) D.fileInput.click(); });
  D.fileInput.addEventListener('change', e => { addFiles([...e.target.files]); D.fileInput.value = ''; });
  D.makeBtn.addEventListener('click',   startMake);
  D.playBtn.addEventListener('click',   togglePlay);
  D.replayBtn.addEventListener('click', doReplay);
  D.muteBtn.addEventListener('click',   toggleMute);
  D.dlBtn.addEventListener('click',     doExport);
  D.reBtn.addEventListener('click',     goBack);
  // SNS 복사 버튼
  document.querySelectorAll('.sns-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target?.textContent) return;
      navigator.clipboard.writeText(target.textContent).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> 복사됨';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> 복사'; btn.classList.remove('copied'); }, 2000);
      }).catch(() => {
        // 폴백: 선택
        const range = document.createRange();
        range.selectNodeContents(target);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        toast('텍스트를 선택했습니다. Ctrl+C로 복사하세요', 'inf');
      });
    });
  });
  if ('speechSynthesis' in window) setTimeout(() => speechSynthesis.getVoices(), 500);
});

/* ── 파일 업로드 ─────────────────────────────────────────── */
function addFiles(files) {
  const valid = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
  if (!valid.length) return;
  if (S.files.length + valid.length > 10) { toast('최대 10개까지 가능합니다', 'err'); return; }
  valid.forEach(f => S.files.push({ file: f, url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image' }));
  renderThumbs();
}
function renderThumbs() {
  D.thumbGrid.innerHTML = '';
  S.files.forEach((m, i) => {
    const w = document.createElement('div'); w.className = 'ti';
    const el = m.type === 'image'
      ? Object.assign(document.createElement('img'), { src: m.url })
      : Object.assign(document.createElement('video'), { src: m.url, muted: true, preload: 'metadata' });
    const badge = Object.assign(document.createElement('span'), { className: 'ti-badge', textContent: i + 1 });
    const del = document.createElement('button'); del.className = 'ti-del';
    del.innerHTML = '<i class="fas fa-times"></i>';
    del.onclick = ev => { ev.stopPropagation(); S.files.splice(i, 1); renderThumbs(); };
    w.append(el, badge, del); D.thumbGrid.appendChild(w);
  });
}

/* ════════════════════════════════════════════════════════════
   PIPELINE — 메인 제작 플로우
   1. Vision Analysis → 2. Scripting → 3. Audio → 4. Render
   ════════════════════════════════════════════════════════════ */
async function startMake() {
  if (!S.files.length) { toast('이미지 또는 영상을 올려주세요', 'err'); return; }
  const name = D.restName.value.trim();
  if (!name) { toast('음식점 이름을 입력해주세요', 'err'); D.restName.focus(); return; }
  D.makeBtn.disabled = true;
  if (D.snsWrap) D.snsWrap.hidden = true;
  showLoad();
  ensureAudio();
  try {
    /* ── STEP 1: Vision Analysis ─────────────────────────── */
    setStep(1, '시각 자료 분석 중...', 'Gemini 2.0 Flash가 이미지·영상을 인식합니다');
    const analysis = await visionAnalysis(name);
    doneStep(1);

    /* ── STEP 2: Editing & Scripting ─────────────────────── */
    setStep(2, '스토리보드 & SNS 태그 생성 중...', 'AI가 편집안과 자막을 설계합니다');
    const script = await generateScript(name, analysis);
    S.script = script;
    doneStep(2);

    /* ── STEP 3 (일부): Audio Synthesis ─────────────────── */
    setStep(3, 'AI 목소리 합성 중...', `${script.scenes.length}개 씬 TTS 생성`);
    S.audioBuffers = await generateAllTTS(script.scenes);
    doneStep(3);

    /* ── STEP 4: Programmatic Editing (Canvas Render) ──── */
    setStep(3, '영상 렌더링 준비 중...', 'Ken Burns 효과 · 자막 레이아웃 설정');
    await preload(); buildSceneCards(); await sleep(400);

    // SNS 태그 표시
    buildSNSTags(script);

    hideLoad();
    D.resultWrap.hidden = false;
    setupPlayer();
    setTimeout(startPlay, 300);
  } catch (err) {
    hideLoad(); D.makeBtn.disabled = false;
    console.error(err); toast('오류: ' + (err.message || '알 수 없는 오류'), 'err');
  }
}

/* ════════════════════════════════════════════════════════════
   STEP 1 — Vision Analysis (Gemini 2.0 Flash Vision)
   맛집 분위기·음식 종류·특징 키워드 추출
   ════════════════════════════════════════════════════════════ */
async function visionAnalysis(restaurantName) {
  const images = S.files.filter(f => f.type === 'image').slice(0, 6);
  if (!images.length) return { keywords: [restaurantName, '맛집', '음식'], mood: '활기찬' };

  const imgParts = [];
  for (const img of images) {
    const b64 = await fileToBase64(img.file);
    imgParts.push({ inline_data: { mime_type: img.file.type || 'image/jpeg', data: b64 } });
  }

  const prompt = `당신은 한국 맛집 전문 영상 분석 AI입니다.
업로드된 음식 사진들을 정밀 분석하여 아래 JSON을 반환하세요.
음식점: "${restaurantName}"

[정밀 분석 항목]
1. 음식 종류·메뉴명 (구체적 명칭: 된장찌개 X → 돌솥 된장찌개 O)
2. 식재료 색감·플레이팅 스타일 (윤기, 두께, 볼륨감, 스팀 등)
3. 분위기 (모던/전통/캐주얼/힙/고급/포장마차/이자카야 등)
4. 사람들이 이 음식을 보면 느끼는 감각적 반응 (군침, 궁금증, 설렘)
5. 틱톡·인스타 바이럴 가능성이 높은 시각 포인트

JSON만 반환:
{"keywords":["키워드1","키워드2","키워드3","키워드4","키워드5"],"mood":"분위기","menu":["메뉴1","메뉴2"],"visual_hook":"식욕 자극 포인트 1문장 (예: 두께 3cm 흑돼지 삼겹살에서 기름이 지글지글)","viral_angle":"바이럴 각도 1문장"}`;

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [...imgParts, { text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Vision API ${res.status}`); }
  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

/* ════════════════════════════════════════════════════════════
   STEP 2 — Editing & Scripting
   스토리보드 JSON + 플랫폼별 SNS 태그 생성
   ════════════════════════════════════════════════════════════ */
async function generateScript(restaurantName, analysis) {
  const images = S.files.filter(f => f.type === 'image').slice(0, 4);
  const imgParts = [];
  for (const img of images) {
    const b64 = await fileToBase64(img.file);
    imgParts.push({ inline_data: { mime_type: img.file.type || 'image/jpeg', data: b64 } });
  }

  const sceneCount = Math.max(S.files.length, 4);
  const keywords   = (analysis.keywords || [restaurantName]).join(', ');
  const menu       = (analysis.menu || []).join(', ') || restaurantName;
  const hook       = analysis.visual_hook || '';

  const prompt = `당신은 한국 맛집 SNS 크리에이터 "무브먼트(moovlog)" 전문 PD입니다.
채널: 인천·서울·부천 맛집 소개 / 유튜브쇼츠·인스타릴스·틱톡

[분석된 시각 정보]
음식점: ${restaurantName}
키워드: ${keywords}
메뉴: ${menu}
시각적 훅: ${hook}

[영상 스토리보드 규칙]
- 총 씬: ${sceneCount}개
- 첫 씬: 강한 훅 ("이거 진짜?", "여기 알아?", "지금 안 오면 후회함")
- 중간 씬: 음식 묘사 (육즙 폭발, 바삭, 진한 국물 등 식욕 자극)
- 마지막 씬: 좋아요·팔로우 CTA
- 자막: 10자 이내, 임팩트
- 나레이션: 한국어 1~2문장, 친근하고 활기찬 남성 톤
- effect: zoom-in|zoom-out|pan-left|pan-right (Ken Burns Effect)
- duration: 3~6 정수
- idx: 0~${S.files.length-1}

[SNS 태그 (각 플랫폼 특성에 맞게)]
- naver_clip_tags: 네이버 클립용 태그, 총 300자 이내, #태그 형식, 맛집·지역·음식 중심
- youtube_shorts_tags: 유튜브쇼츠용, 총 100자 이내, #태그 형식
- instagram_caption: 인스타릴스 캡션, 2~3줄 소개문 + 해시태그 10개
- tiktok_tags: 틱톡용 핵심 태그 5개, #태그 형식

JSON만 반환:
{
  "title": "제목",
  "hashtags": "#맛집 #${restaurantName.replace(/\s/g,'')} #무브먼트 + 관련태그",
  "naver_clip_tags": "#태그1 #태그2 ...",
  "youtube_shorts_tags": "#태그1 #태그2 ...",
  "instagram_caption": "캡션 내용\\n\\n#태그1 #태그2 ...",
  "tiktok_tags": "#태그1 #태그2 #태그3 #태그4 #태그5",
  "scenes": [
    {"idx":0,"duration":4,"subtitle":"자막","narration":"나레이션","effect":"zoom-in"}
  ]
}`;

  const parts = [...imgParts, { text: prompt }];
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.9, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Script API ${res.status}`); }
  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const obj  = JSON.parse(raw.replace(/```json|```/g, '').trim());
  if (!Array.isArray(obj.scenes) || !obj.scenes.length) throw new Error('스크립트 데이터 오류');
  return obj;
}

function fileToBase64(file) {
  return new Promise((ok, fail) => { const r = new FileReader(); r.onload = e => ok(e.target.result.split(',')[1]); r.onerror = fail; r.readAsDataURL(file); });
}

/* ── SNS 태그 카드 빌드 ──────────────────────────────────── */
function buildSNSTags(script) {
  if (!D.snsWrap) return;
  const fill = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  };
  fill('tagNaver',   script.naver_clip_tags   || '');
  fill('tagYoutube', script.youtube_shorts_tags || '');
  fill('tagInsta',   script.instagram_caption  || '');
  fill('tagTiktok',  script.tiktok_tags         || '');
  D.snsWrap.hidden = false;
}

/* ════════════════════════════════════════════════════════════
   STEP 3 — Audio Synthesis (Google TTS Wavenet)
   ════════════════════════════════════════════════════════════ */
async function generateAllTTS(scenes) {
  const buffers = [];
  let hasErr = false;
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (!sc.narration || !useTTSApi) { buffers.push(null); continue; }
    try { buffers.push(await fetchGoogleTTS(sc.narration)); }
    catch (err) {
      console.warn(`TTS 씬${i+1} 실패:`, err.message);
      hasErr = true; useTTSApi = false; buffers.push(null);
    }
  }
  if (hasErr || !useTTSApi) {
    updateAudioStatus('web-speech'); toast('AI 음성: 웹 음성 합성으로 재생됩니다', 'inf');
  } else {
    updateAudioStatus('google-tts'); toast('AI 음성 생성 완료 ✓ (영상에 포함)', 'ok');
  }
  return buffers;
}
// ✅ Gemini TTS - 낮고 굵은 남성 목소리 (Charon 보이스)
async function fetchGoogleTTS(text) {
  const res = await fetch(GEMINI_TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: '낮고 굵은 남성 목소리로 천천히 자신감 있게 읽어주세요. 성조는 낮게 유지하세요.' }]
      },
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }, // 낮고 굵은 남성 보이스
        },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `TTS ${res.status}`);
  const part = data?.candidates?.[0]?.content?.parts?.[0];
  if (!part?.inlineData?.data) throw new Error('TTS 응답 없음');
  return decodePCMAudio(part.inlineData.data, part.inlineData.mimeType);
}

// PCM(24kHz 16bit) 또는 일반 오디오 디코딩
function decodePCMAudio(b64, mimeType) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (mimeType && mimeType.includes('pcm')) {
    const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || '24000');
    const samples = bytes.length / 2;
    const audioBuffer = audioCtx.createBuffer(1, samples, sampleRate);
    const ch = audioBuffer.getChannelData(0);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < samples; i++) ch[i] = view.getInt16(i * 2, true) / 32768;
    return Promise.resolve(audioBuffer);
  }
  return audioCtx.decodeAudioData(bytes.buffer.slice());
}

function playSceneAudio(si, capture = false) {
  stopAudio();
  const buf = S.audioBuffers?.[si];
  if (buf && audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 1.0; // ✅ 자연 속도 유지 (빠르게 하면 남성 낮은 음이 올라감)
    src.connect(audioCtx.destination);
    if (capture) src.connect(audioMixDest);
    src.start(); S.currentAudio = src;
  } else if (!S.muted) {
    const sc = S.script?.scenes?.[si];
    if (sc?.narration) {
      const u = new SpeechSynthesisUtterance(sc.narration);
      u.lang = 'ko-KR'; u.pitch = 0.5; u.rate = 1.1; // ✅ 낮은 남성 톤 (pitch 0.5)
      const voices = speechSynthesis.getVoices();
      const male = voices.find(v => v.lang.startsWith('ko') && /male|남|Man/i.test(v.name)) || voices.find(v => v.lang.startsWith('ko'));
      if (male) u.voice = male;
      speechSynthesis.speak(u);
    }
  }
}
function stopAudio() {
  if (S.currentAudio) { try { S.currentAudio.stop(); } catch {} S.currentAudio = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/* ── 미디어 프리로드 ─────────────────────────────────────── */
async function preload() {
  S.loaded = [];
  for (const m of S.files) {
    if (m.type === 'image') {
      const img = await new Promise((ok, fail) => { const i = new Image(); i.src = m.url; i.onload = () => ok(i); i.onerror = fail; });
      S.loaded.push({ type: 'image', src: img });
    } else {
      const vid = Object.assign(document.createElement('video'), { src: m.url, muted: true, loop: true, playsInline: true });
      await new Promise(r => { vid.onloadeddata = r; vid.onerror = r; setTimeout(r, 5000); });
      S.loaded.push({ type: 'video', src: vid });
    }
  }
}

/* ── 플레이어 제어 ───────────────────────────────────────── */
function setupPlayer() { S.playing = false; S.scene = 0; S.startTs = null; D.vProg.style.width = '0%'; renderFrame(0, 0); setPlayIcon(false); }
function togglePlay()  { S.playing ? pausePlay() : startPlay(); }
function startPlay()   {
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  S.playing = true; S.startTs = performance.now(); setPlayIcon(true);
  if (!S.muted) playSceneAudio(S.scene);
  startSubAnim(S.scene); tick();
}
function pausePlay()   { S.playing = false; if (S.raf) cancelAnimationFrame(S.raf); stopAudio(); clearSubAnim(); setPlayIcon(false); }
function doReplay()    { pausePlay(); S.scene = 0; S.startTs = null; D.vProg.style.width = '0%'; renderFrame(0,0); highlightScene(0); setTimeout(startPlay, 80); }
function toggleMute()  {
  S.muted = !S.muted;
  D.muteIco.className = S.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  if (S.muted) stopAudio(); else if (S.playing) playSceneAudio(S.scene);
}
function setPlayIcon(pl) { D.playIco.className = pl ? 'fas fa-pause' : 'fas fa-play'; }

/* ── 애니메이션 루프 ─────────────────────────────────────── */
function tick() {
  const run = now => {
    if (!S.playing) return;
    const scenes = S.script.scenes, sc = scenes[S.scene];
    const dur = sc.duration, el = (now - S.startTs) / 1000, prog = Math.min(el / dur, 1);
    const total = scenes.reduce((a,s) => a+s.duration, 0);
    const done  = scenes.slice(0, S.scene).reduce((a,s) => a+s.duration, 0);
    D.vProg.style.width = ((done + el) / total * 100) + '%';
    const TD = 0.35;
    if (el >= dur - TD && S.scene < scenes.length - 1) drawTransition(S.scene, (el-(dur-TD))/TD);
    else renderFrame(S.scene, prog);
    if (prog >= 1) {
      if (S.scene < scenes.length - 1) {
        S.scene++; S.startTs = now; highlightScene(S.scene);
        if (!S.muted) playSceneAudio(S.scene); startSubAnim(S.scene);
      } else {
        D.vProg.style.width = '100%'; S.playing = false; stopAudio(); clearSubAnim(); setPlayIcon(false); return;
      }
    }
    S.raf = requestAnimationFrame(run);
  };
  S.raf = requestAnimationFrame(run);
}

/* ════════════════════════════════════════════════════════════
   STEP 4 — Programmatic Editing (Canvas)
   Ken Burns Effect + 반투명 자막 박스
   ════════════════════════════════════════════════════════════ */
function renderFrame(si, prog) {
  const sc = S.script.scenes[si], media = getMedia(sc);
  ctx.clearRect(0, 0, CW, CH);
  drawMedia(media, sc.effect, prog);   // Ken Burns Effect
  drawVignetteGrad();
  drawSubtitle(sc.subtitle, S.subCharIdx);  // 반투명 박스 자막
  drawHashtags();
  if (si === 0) drawTopBadge();
}
function drawTransition(fi, t) {
  const e = ease(t); ctx.save(); renderFrame(fi, 1); ctx.globalAlpha = e; renderFrame(fi+1, 0); ctx.restore();
}
function getMedia(sc) { return S.loaded.length ? S.loaded[(sc.idx??0) % S.loaded.length] : null; }

/* ── Ken Burns Effect ────────────────────────────────────── */
function drawMedia(media, effect, prog) {
  if (!media) { ctx.fillStyle='#111'; ctx.fillRect(0,0,CW,CH); return; }
  const e = ease(prog); let sc=1, ox=0, oy=0;
  // Ken Burns: 부드러운 줌 + 패닝 (천천히 확대/축소)
  switch (effect) {
    case 'zoom-in':    sc = 1.0 + e * 0.10; break;               // 서서히 확대
    case 'zoom-out':   sc = 1.10 - e * 0.10; break;              // 서서히 축소
    case 'pan-left':   sc = 1.08; ox = (1 - e) * CW * 0.06; break; // 오른쪽→왼쪽
    case 'pan-right':  sc = 1.08; ox = -(1 - e) * CW * 0.06; break;// 왼쪽→오른쪽
    default:           sc = 1.04 + e * 0.04;
  }
  const el = media.src;
  const sw = media.type==='video' ? (el.videoWidth||CW)  : el.naturalWidth;
  const sh = media.type==='video' ? (el.videoHeight||CH) : el.naturalHeight;
  const r  = Math.max(CW/sw, CH/sh), dw = sw*r, dh = sh*r;
  ctx.save();
  ctx.translate(CW/2 + ox, CH/2 + oy);
  ctx.scale(sc, sc);
  ctx.drawImage(el, -dw/2, -dh/2, dw, dh);
  ctx.restore();
}

function drawVignetteGrad() {
  const top = ctx.createLinearGradient(0, 0, 0, CH*0.28);
  top.addColorStop(0, 'rgba(0,0,0,0.50)'); top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, CW, CH*0.28);
  const bot = ctx.createLinearGradient(0, CH*0.45, 0, CH);
  bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = bot; ctx.fillRect(0, CH*0.45, CW, CH*0.55);
}

/* ── 자막: 반투명 검은 박스 + 글자별 등장 ───────────────── */
function drawSubtitle(text, charLimit) {
  if (!text) return;
  const visible = text.slice(0, charLimit === undefined ? text.length : charLimit);
  if (!visible) return;

  ctx.save();
  ctx.font = 'bold 68px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const x  = CW / 2;
  const y  = CH - 230;
  const tw = ctx.measureText(visible).width;

  // ✅ 반투명 검은 박스 (가독성 향상)
  const padX = 36, padY = 20;
  const boxW = tw + padX * 2;
  const boxH = 90;
  const boxX = x - boxW / 2;
  const boxY = y - boxH / 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
  roundRect(ctx, boxX, boxY, boxW, boxH, 12);
  ctx.fill();

  // 좌측 포인트 바
  const barGrd = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
  barGrd.addColorStop(0, '#ff4d6d'); barGrd.addColorStop(1, '#c77dff');
  ctx.fillStyle = barGrd;
  roundRect(ctx, boxX, boxY + 8, 4, boxH - 16, 2);
  ctx.fill();

  // 흰색 텍스트
  ctx.fillStyle   = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur  = 4;
  ctx.fillText(visible, x, y);

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}

function drawHashtags() {
  if (!S.script?.hashtags) return;
  ctx.save();
  ctx.font = '24px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(S.script.hashtags, CW/2, CH - 68);
  ctx.restore();
}
function drawTopBadge() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(28, 52, 190, 40);
  ctx.font = 'bold 26px "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('MOOVLOG', 42, 72);
  ctx.restore();
}

/* ── 자막 글자 등장 타이머 ─────────────────────────────── */
function startSubAnim(si) {
  clearSubAnim();
  const sc = S.script.scenes[si], len = (sc.subtitle||'').length;
  const step = Math.max(50, (sc.duration * 1000) / (len + 3));
  S.subCharIdx = 0;
  S.subTimer = setInterval(() => { if (S.subCharIdx < len) S.subCharIdx++; else clearSubAnim(); }, step);
}
function clearSubAnim() { if(S.subTimer){clearInterval(S.subTimer);S.subTimer=null;} S.subCharIdx=9999; }

/* ── 씬 카드 ─────────────────────────────────────────────── */
function buildSceneCards() {
  D.sceneList.innerHTML = '';
  S.script.scenes.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'scard'; d.id = `sc${i}`;
    d.innerHTML = `<div class="scard-num">SCENE ${i+1} · ${s.duration}s · #${(s.idx??0)+1}</div><div class="scard-sub">${esc(s.subtitle)}</div><div class="scard-nar">${esc(s.narration)}</div>`;
    D.sceneList.appendChild(d);
  });
}
function highlightScene(i) {
  document.querySelectorAll('.scard').forEach(c=>c.classList.remove('active'));
  const c = g(`sc${i}`); if(c){c.classList.add('active');c.scrollIntoView({behavior:'smooth',block:'nearest'});}
}

/* ── 영상 내보내기 (원클릭 즉시 저장) ─────────────────────── */
async function doExport() {
  if (!S.script || !S.loaded.length) { toast('먼저 영상을 생성해주세요','err'); return; }
  if (!audioCtx) ensureAudio();
  if (audioCtx.state==='suspended') await audioCtx.resume();

  // UI: 저장 중 표시
  D.dlBtn.disabled = true;
  D.dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
  if (D.recStatus) D.recStatus.hidden = false;

  const mime = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
    .find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const canvasStream = D.canvas.captureStream(30);
  const hasAudio = S.audioBuffers.some(b => b !== null);
  const recStream = hasAudio
    ? new MediaStream([...canvasStream.getVideoTracks(), ...audioMixDest.stream.getAudioTracks()])
    : canvasStream;

  const recorder = new MediaRecorder(recStream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    if (D.recStatus) D.recStatus.hidden = true;
    D.dlBtn.disabled = false;
    D.dlBtn.innerHTML = '<i class="fas fa-download"></i> 영상 저장하기';
    const blob = new Blob(chunks, { type: mime });
    const name = `moovlog_${(D.restName.value||'video').replace(/\s/g,'_')}_${Date.now()}.webm`;
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    toast(hasAudio ? '✓ AI 음성 포함 영상 저장!' : '✓ 영상 저장 완료!', 'ok');
  };

  recorder.start(100);
  // 일시정지 중이면 재생 시작
  if (!S.playing) { pausePlay(); }
  await exportRender();
  await sleep(200);
  recorder.stop();
}
async function exportRender() {
  const scenes = S.script.scenes; let si=0, ts=null;
  playSceneAudio(0, true); clearSubAnim(); S.subCharIdx=9999;
  return new Promise(resolve => {
    const frame = now => {
      if(!ts) ts=now;
      const sc=scenes[si], dur=sc.duration, el=(now-ts)/1000, prog=Math.min(el/dur,1);
      const TD=0.35;
      if(el>=dur-TD&&si<scenes.length-1) drawTransition(si,(el-(dur-TD))/TD);
      else renderFrame(si,prog);
      if(prog>=1){
        if(si<scenes.length-1){ si++; ts=now; playSceneAudio(si,true); }
        else { resolve(); return; }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

/* ── UI 유틸 ─────────────────────────────────────────────── */
function goBack() { pausePlay(); clearSubAnim(); D.resultWrap.hidden=true; D.makeBtn.disabled=false; }
function showLoad() { D.loadWrap.hidden=false; }
function hideLoad() { D.loadWrap.hidden=true; }
function setStep(n,title,sub) {
  D.loadTitle.textContent=title||''; D.loadSub.textContent=sub||'';
  [D.ls1,D.ls2,D.ls3].forEach((el,i)=>{ el.classList.toggle('active',i===n-1); if(i<n-1) el.classList.add('done'); });
}
function doneStep(n) { const el=[D.ls1,D.ls2,D.ls3][n-1]; if(el){el.classList.remove('active');el.classList.add('done');} }
function updateAudioStatus(mode) {
  if(!D.audioStatus) return;
  D.audioStatus.innerHTML = mode==='google-tts' ? '<i class="fas fa-microphone-alt"></i> AI 음성 포함 (Wavenet)' : '<i class="fas fa-microphone"></i> 웹 음성 합성';
  D.audioStatus.style.color = mode==='google-tts' ? '#4ade80' : '#a0a0a0';
}
function toast(msg,type='inf') {
  const icons={ok:'fa-check-circle',err:'fa-exclamation-circle',inf:'fa-info-circle'};
  const el=document.createElement('div'); el.className=`toast ${type}`;
  el.innerHTML=`<i class="fas ${icons[type]||icons.inf}"></i><span>${msg}</span>`;
  D.toasts.appendChild(el);
  setTimeout(()=>{ el.style.animation='tOut .3s ease forwards'; setTimeout(()=>el.remove(),350); },3500);
}
function ease(t) { return t<0.5?2*t*t:-1+(4-2*t)*t; }
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.addEventListener('click',()=>{ if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume(); });
