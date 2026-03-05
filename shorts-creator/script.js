'use strict';
/* ============================================================
   무브먼트 Shorts Creator v5 — script.js
   ✅ Pipeline:
     1. Vision Analysis   → Gemini 2.5 Pro: 이미지별 타입/효과/순서 분석
     2. Scripting         → Instagram Reels 감성 스토리보드 + AI 타이밍
     3. Audio Synthesis   → Gemini TTS (Charon) 낮고 굵은 남성 보이스
     4. Canvas Render     → Ken Burns + 인스타 감성 자막 4종
     5. Export            → MediaRecorder → 즉시 자동 다운로드
   ============================================================ */

/* ── API 설정 ─────────────────────────────────────────────── */
const GEMINI_KEY = '__GEMINI_KEY__';
// Gemini 2.5 Pro (분석/스크립팅) — 실패 시 Flash 자동 폴백
const GEMINI_PRO_URL   = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`;
const GEMINI_FLASH_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
const GEMINI_TTS_URL   = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_KEY}`;

async function geminiPost(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${r.status}`); }
  return r.json();
}
async function geminiVision(body) {
  try { return await geminiPost(GEMINI_PRO_URL, body); }
  catch (e) { console.warn('Gemini Pro 실패, Flash 폴백:', e.message); return geminiPost(GEMINI_FLASH_URL, body); }
}

const CW = 720, CH = 1280;
const g = id => document.getElementById(id);
const D = {
  dropArea:    g('dropArea'),    fileInput:   g('fileInput'),
  thumbGrid:   g('thumbGrid'),   restName:    g('restName'),
  makeBtn:     g('makeBtn'),
  loadWrap:    g('loadingWrap'), loadTitle:   g('loadTitle'),
  loadSub:     g('loadSub'),     ls1: g('ls1'), ls2: g('ls2'), ls3: g('ls3'),
  resultWrap:  g('resultWrap'),  canvas:      g('vc'),
  vProg:       g('vProg'),       playBtn:     g('playBtn'),
  playIco:     g('playIco'),     replayBtn:   g('replayBtn'),
  muteBtn:     g('muteBtn'),     muteIco:     g('muteIco'),
  sceneList:   g('sceneList'),   dlBtn:       g('dlBtn'),
  recStatus:   g('recStatus'),   recTimer:    g('recTimer'),
  reBtn:       g('reBtn'),       toasts:      g('toasts'),
  audioStatus: g('audioStatus'),
  snsWrap:     g('snsWrap'),
  tagNaver:    g('tagNaver'),    tagYoutube:  g('tagYoutube'),
  tagInsta:    g('tagInsta'),    tagTiktok:   g('tagTiktok'),
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
  D.dropArea.addEventListener('dragover',  e => { e.preventDefault(); D.dropArea.classList.add('over'); });
  D.dropArea.addEventListener('dragleave', () => D.dropArea.classList.remove('over'));
  D.dropArea.addEventListener('drop',      e => { e.preventDefault(); D.dropArea.classList.remove('over'); addFiles([...e.dataTransfer.files]); });
  D.dropArea.addEventListener('click',     e => { if (!e.target.closest('.pick-btn')) D.fileInput.click(); });
  D.fileInput.addEventListener('change',   e => { addFiles([...e.target.files]); D.fileInput.value = ''; });
  D.makeBtn.addEventListener('click',      startMake);
  D.playBtn.addEventListener('click',      togglePlay);
  D.replayBtn.addEventListener('click',    doReplay);
  D.muteBtn.addEventListener('click',      toggleMute);
  D.dlBtn.addEventListener('click',        doExport);
  D.reBtn.addEventListener('click',        goBack);
  document.querySelectorAll('.sns-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target?.textContent) return;
      navigator.clipboard.writeText(target.textContent).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> 복사됨';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> 복사'; btn.classList.remove('copied'); }, 2000);
      }).catch(() => {
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
      ? Object.assign(document.createElement('img'),   { src: m.url })
      : Object.assign(document.createElement('video'), { src: m.url, muted: true, preload: 'metadata' });
    const badge = Object.assign(document.createElement('span'), { className: 'ti-badge', textContent: i + 1 });
    const del = document.createElement('button'); del.className = 'ti-del';
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
  D.makeBtn.disabled = true;
  if (D.snsWrap) D.snsWrap.hidden = true;
  useTTSApi = true;
  showLoad();
  ensureAudio();
  try {
    /* STEP 1 — 이미지 분석 */
    setStep(1, '이미지 분석 중...', 'Gemini 2.5 Pro가 각 컷을 정밀 분석합니다');
    const analysis = await visionAnalysis(name);
    doneStep(1);

    /* STEP 2 — Instagram Reels 스크립팅 */
    setStep(2, 'Instagram Reels 스토리보드 생성 중...', '감성 자막 · 컷 타이밍 · SNS 태그 AI 설계');
    const script = await generateScript(name, analysis);
    S.script = script;
    doneStep(2);

    /* STEP 3 — AI 보이스 */
    setStep(3, 'AI 보이스 합성 중...', `${script.scenes.length}컷 낮은 남성 나레이션 생성`);
    S.audioBuffers = await generateAllTTS(script.scenes);
    doneStep(3);

    /* STEP 4 — 렌더 준비 */
    setStep(3, '영상 렌더 준비 중...', '컷 배치 · 감성 자막 · 효과 적용');
    await preload(); buildSceneCards(); await sleep(400);
    buildSNSTags(script);

    hideLoad();
    D.resultWrap.hidden = false;
    setupPlayer();
    setTimeout(startPlay, 300);
  } catch (err) {
    hideLoad(); D.makeBtn.disabled = false;
    console.error(err);
    toast('오류: ' + (err.message || '알 수 없는 오류'), 'err');
  }
}

/* ════════════════════════════════════════════════════════════
   STEP 1 — Vision Analysis (Gemini 2.5 Pro)
   이미지별 타입 · 감성점수 · 최적 효과 · 추천 순서 분석
   ════════════════════════════════════════════════════════════ */
async function visionAnalysis(restaurantName) {
  const images = S.files.filter(f => f.type === 'image').slice(0, 8);
  if (!images.length) return { keywords: [restaurantName, '맛집'], mood: '감성적인', per_image: [], recommended_order: [] };

  const imgParts = [];
  for (const img of images) {
    const b64 = await fileToBase64(img.file);
    imgParts.push({ inline_data: { mime_type: img.file.type || 'image/jpeg', data: b64 } });
  }

  const prompt = `당신은 인스타그램 Reels 전문 비주얼 디렉터입니다.
음식점: "${restaurantName}" / 업로드 이미지 수: ${images.length}장

각 이미지를 순서대로 (이미지0, 이미지1...) 정밀 분석하세요.

[분석 기준]
- type: "hook"(시선강탈/서프라이즈), "hero"(대표메뉴 클로즈업), "detail"(식재료/디테일), "ambiance"(매장분위기/감성), "process"(요리/준비과정), "wide"(전체/공간샷)
- best_effect: "zoom-in"|"zoom-out"|"pan-left"|"pan-right"|"zoom-in-slow"|"float-up"
  (hero→zoom-in, ambiance→pan-left/right, detail→zoom-in-slow, hook→zoom-out, process→float-up)
- emotional_score: 1~10 (인스타 바이럴 감성 점수, 높을수록 앞에 배치)
- suggested_duration: 2~5 (초) — 클로즈업/디테일→3~4s, 분위기→4~5s, 훅/CTA→2~3s
- focus: 이 이미지의 핵심 포인트 한 문장

전체 요약:
- keywords: 핵심 키워드 5개
- mood: 감성 키워드 (예: "따뜻한 저녁빛", "힙한 골목 감성", "육즙 터지는 행복")
- menu: 발견된 메뉴명 목록
- visual_hook: 식욕/호기심 자극 포인트 (구체적이고 감각적으로)
- recommended_order: 이미지 인덱스 배열 (0부터, 감성 흐름+emotional_score 기준 정렬)

JSON만 반환:
{"keywords":["kw1","kw2","kw3","kw4","kw5"],"mood":"감성 키워드","menu":["메뉴1"],"visual_hook":"식욕자극","recommended_order":[0,1,2],"per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":3,"focus":"설명"}]}`;

  const data = await geminiVision({
    contents: [{ parts: [...imgParts, { text: prompt }] }],
    generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
  });
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

/* ════════════════════════════════════════════════════════════
   STEP 2 — Instagram Reels 스토리보드 (Gemini 2.5 Pro)
   감성 자막 · AI 타이밍 · SNS 태그 일괄 생성
   ════════════════════════════════════════════════════════════ */
async function generateScript(restaurantName, analysis) {
  const perImage        = analysis.per_image || [];
  const orderedIndices  = analysis.recommended_order?.length ? analysis.recommended_order : S.files.map((_, i) => i);
  const sceneCount      = Math.min(Math.max(S.files.length, 4), 10);

  const imgSummary = perImage.map(p =>
    `이미지${p.idx}(${p.type}): 감성${p.emotional_score}점, 효과:${p.best_effect}, 추천${p.suggested_duration}s, "${p.focus}"`
  ).join('\n');

  const sampleImgs = S.files.filter(f => f.type === 'image').slice(0, 4);
  const imgParts = [];
  for (const img of sampleImgs) {
    const b64 = await fileToBase64(img.file);
    imgParts.push({ inline_data: { mime_type: img.file.type || 'image/jpeg', data: b64 } });
  }

  const prompt = `당신은 인스타그램 Reels 전문 영상 PD "무브먼트(MOOVLOG)"입니다.
인천·서울·부천 맛집 채널 / 팔로워 10만+ 스타일로 제작하세요.

[음식점 정보]
이름: ${restaurantName}
분위기: ${analysis.mood || '감성적인'}
메뉴: ${(analysis.menu || []).join(', ') || restaurantName}
비주얼 훅: ${analysis.visual_hook || ''}
키워드: ${(analysis.keywords || []).join(', ')}

[컷 분석 결과]
${imgSummary || '이미지 분석 없음'}
권장 컷 순서: [${orderedIndices.join(',')}]

[Instagram Reels 영상 구성 원칙]
총 씬: ${sceneCount}개 (전체 25~35초 목표)
권장 컷 순서 우선, 스토리라인에 맞게 미세 조정 가능

씬 타입별 가이드:
①훅씬(2~3s):  "이거... 실화야?", "진짜 이 가격에?", "여기 숨겨진 맛집"
  subtitle_style: "hook", subtitle_position: "center"
②분위기씬(4~5s): 공간감/감성 묘사, 따뜻하고 시적으로
  subtitle_style: "detail", subtitle_position: "lower"
③음식 클로즈업(3~4s): 질감/온도감/색감 구체적으로 ("육즙이 뚝뚝", "바삭하게 올라오는")
  subtitle_style: "hero", subtitle_position: "lower"
④포인트씬(3~4s): 가장 인상적인 장면, 핵심 메시지
  subtitle_style: "detail"
⑤CTA씬(2~3s):  "저장하고 꼭 가봐 💾", "팔로우하면 다 알려줌 ㅋ", "나중에 가려고 저장 눌러둬"
  subtitle_style: "cta", subtitle_position: "lower"

[자막 규칙]
- subtitle: 8~15자, 이모지 1~2개, 임팩트 있게 (구어체, 친근하게)
- subtitle_style: "hook"|"detail"|"hero"|"cta"
- subtitle_position: "center"|"lower"|"upper"
- narration: 친근한 구어체 남성 톤 1~2문장 (글자수 ≤ duration×6)
- effect: 컷 분석의 best_effect 우선 적용
- duration: 컷 분석의 suggested_duration 우선, narration 길이 비례 (min:2, max:6)

[SNS 태그]
- naver_clip_tags: 300자 이내, 지역+음식+감성 중심, #태그 형식
- youtube_shorts_tags: 100자 이내, #태그 형식
- instagram_caption: 반말 감성 2~3줄 소개 + 줄바꿈 + 해시태그 12개 (이모지 포함)
- tiktok_tags: 핵심 5개, #태그 형식

JSON만 반환:
{
  "title":"제목",
  "hashtags":"#해시태그들",
  "naver_clip_tags":"...",
  "youtube_shorts_tags":"...",
  "instagram_caption":"...",
  "tiktok_tags":"...",
  "scenes":[
    {"idx":0,"duration":3,"subtitle":"🔥 이거 실화임?","subtitle_style":"hook","subtitle_position":"center","narration":"잠깐, 여기 이 가격에 이게 나온다고?","effect":"zoom-out"}
  ]
}`;

  const makeReq = async url => {
    const data = await geminiPost(url, {
      contents: [{ parts: [...imgParts, { text: prompt }] }],
      generationConfig: { temperature: 0.92, responseMimeType: 'application/json' },
    });
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const obj = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (!Array.isArray(obj.scenes) || !obj.scenes.length) throw new Error('스크립트 데이터 오류');
    return obj;
  };

  try { return await makeReq(GEMINI_PRO_URL); }
  catch (e) { console.warn('Pro scripting 실패, Flash 폴백:', e.message); return makeReq(GEMINI_FLASH_URL); }
}

function fileToBase64(file) {
  return new Promise((ok, fail) => {
    const r = new FileReader();
    r.onload = e => ok(e.target.result.split(',')[1]);
    r.onerror = fail;
    r.readAsDataURL(file);
  });
}

/* ── SNS 태그 카드 빌드 ──────────────────────────────────── */
function buildSNSTags(script) {
  if (!D.snsWrap) return;
  const fill = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text || ''; };
  fill('tagNaver',   script.naver_clip_tags    || '');
  fill('tagYoutube', script.youtube_shorts_tags || '');
  fill('tagInsta',   script.instagram_caption   || '');
  fill('tagTiktok',  script.tiktok_tags          || '');
  D.snsWrap.hidden = false;
}

/* ════════════════════════════════════════════════════════════
   STEP 3 — Audio Synthesis (Gemini TTS / Web Speech 폴백)
   ════════════════════════════════════════════════════════════ */
async function generateAllTTS(scenes) {
  const buffers = [];
  let hasErr = false;
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (!sc.narration || !useTTSApi) { buffers.push(null); continue; }
    try { buffers.push(await fetchGeminiTTS(sc.narration)); }
    catch (err) {
      console.warn(`TTS 씬${i + 1} 실패:`, err.message);
      hasErr = true; useTTSApi = false; buffers.push(null);
    }
  }
  if (hasErr || !useTTSApi) {
    updateAudioStatus('web-speech');
    toast('AI 음성: 웹 음성 합성으로 재생됩니다', 'inf');
  } else {
    updateAudioStatus('google-tts');
    toast('AI 음성 생성 완료 ✓', 'ok');
  }
  return buffers;
}

async function fetchGeminiTTS(text) {
  const res = await fetch(GEMINI_TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: '낮고 굵은 남성 목소리로 천천히 자신감 있게 읽어주세요. 성조는 낮게 유지하세요.' }] },
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `TTS ${res.status}`);
  const part = data?.candidates?.[0]?.content?.parts?.[0];
  if (!part?.inlineData?.data) throw new Error('TTS 응답 없음');
  return decodePCMAudio(part.inlineData.data, part.inlineData.mimeType);
}

function decodePCMAudio(b64, mimeType) {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (mimeType && mimeType.includes('pcm')) {
    const sampleRate  = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || '24000');
    const samples     = bytes.length / 2;
    const audioBuffer = audioCtx.createBuffer(1, samples, sampleRate);
    const ch          = audioBuffer.getChannelData(0);
    const view        = new DataView(bytes.buffer);
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
    src.playbackRate.value = 1.0;
    src.connect(audioCtx.destination);
    if (capture && audioMixDest) src.connect(audioMixDest);
    src.start();
    S.currentAudio = src;
  } else if (!S.muted) {
    const sc = S.script?.scenes?.[si];
    if (sc?.narration) {
      const u = new SpeechSynthesisUtterance(sc.narration);
      u.lang = 'ko-KR'; u.pitch = 0.5; u.rate = 1.1;
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
      const img = await new Promise((ok, fail) => {
        const i = new Image(); i.src = m.url; i.onload = () => ok(i); i.onerror = fail;
      });
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
function startPlay() {
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  S.playing = true; S.startTs = performance.now(); setPlayIcon(true);
  if (!S.muted) playSceneAudio(S.scene);
  startSubAnim(S.scene); tick();
}
function pausePlay()   { S.playing = false; if (S.raf) cancelAnimationFrame(S.raf); stopAudio(); clearSubAnim(); setPlayIcon(false); }
function doReplay()    { pausePlay(); S.scene = 0; S.startTs = null; D.vProg.style.width = '0%'; renderFrame(0, 0); highlightScene(0); setTimeout(startPlay, 80); }
function toggleMute() {
  S.muted = !S.muted;
  D.muteIco.className = S.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  if (S.muted) stopAudio(); else if (S.playing) playSceneAudio(S.scene);
}
function setPlayIcon(pl) { D.playIco.className = pl ? 'fas fa-pause' : 'fas fa-play'; }

/* ── 애니메이션 티커 ─────────────────────────────────────── */
function tick() {
  const run = now => {
    if (!S.playing) return;
    const scenes = S.script.scenes, sc = scenes[S.scene];
    const dur = sc.duration, el = (now - S.startTs) / 1000, prog = Math.min(el / dur, 1);
    const total = scenes.reduce((a, s) => a + s.duration, 0);
    const done  = scenes.slice(0, S.scene).reduce((a, s) => a + s.duration, 0);
    D.vProg.style.width = ((done + el) / total * 100) + '%';
    const TD = 0.30;
    if (el >= dur - TD && S.scene < scenes.length - 1) drawTransition(S.scene, (el - (dur - TD)) / TD);
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
   STEP 4 — Canvas Rendering
   Ken Burns (6 effects) + Instagram 감성 자막 4종
   ════════════════════════════════════════════════════════════ */
function renderFrame(si, prog) {
  const sc = S.script.scenes[si], media = getMedia(sc);
  ctx.clearRect(0, 0, CW, CH);
  drawMedia(media, sc.effect, prog);
  drawVignetteGrad();
  drawSubtitle(sc, S.subCharIdx);
  if (si === 0) drawTopBadge();
}
function drawTransition(fi, t) {
  const e = ease(t); ctx.save();
  renderFrame(fi, 1); ctx.globalAlpha = e;
  renderFrame(fi + 1, 0); ctx.restore();
}
function getMedia(sc) { return S.loaded.length ? S.loaded[(sc.idx ?? 0) % S.loaded.length] : null; }

/* ── Ken Burns Effect (6종) ─────────────────────────────── */
function drawMedia(media, effect, prog) {
  if (!media) { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, CW, CH); return; }
  const e = ease(prog);
  let sc = 1, ox = 0, oy = 0;
  switch (effect) {
    case 'zoom-in':      sc = 1.0 + e * 0.10; break;
    case 'zoom-in-slow': sc = 1.0 + e * 0.06; break;
    case 'zoom-out':     sc = 1.10 - e * 0.10; break;
    case 'pan-left':     sc = 1.08; ox = (1 - e) * CW * 0.07; break;
    case 'pan-right':    sc = 1.08; ox = -(1 - e) * CW * 0.07; break;
    case 'float-up':     sc = 1.06; oy = (1 - e) * CH * 0.04; break;
    default:             sc = 1.04 + e * 0.04;
  }
  const el = media.src;
  const sw = media.type === 'video' ? (el.videoWidth  || CW) : el.naturalWidth;
  const sh = media.type === 'video' ? (el.videoHeight || CH) : el.naturalHeight;
  const r  = Math.max(CW / sw, CH / sh), dw = sw * r, dh = sh * r;
  ctx.save();
  ctx.translate(CW / 2 + ox, CH / 2 + oy);
  ctx.scale(sc, sc);
  ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

/* ── 비네트 (영화적 분위기) ──────────────────────────────── */
function drawVignetteGrad() {
  const top = ctx.createLinearGradient(0, 0, 0, CH * 0.30);
  top.addColorStop(0, 'rgba(0,0,0,0.60)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, CW, CH * 0.30);

  const bot = ctx.createLinearGradient(0, CH * 0.38, 0, CH);
  bot.addColorStop(0,   'rgba(0,0,0,0)');
  bot.addColorStop(0.55,'rgba(0,0,0,0.70)');
  bot.addColorStop(1,   'rgba(0,0,0,0.92)');
  ctx.fillStyle = bot; ctx.fillRect(0, CH * 0.38, CW, CH * 0.62);
}

/* ════════════════════════════════════════════════════════════
   자막 시스템 — Instagram Reels 4가지 스타일
   ════════════════════════════════════════════════════════════ */
function drawSubtitle(sc, charLimit) {
  const text = sc.subtitle;
  if (!text) return;
  const visible = text.slice(0, charLimit === undefined ? text.length : charLimit);
  if (!visible) return;
  const style = sc.subtitle_style    || 'detail';
  const pos   = sc.subtitle_position || 'lower';
  ctx.save();
  switch (style) {
    case 'hook':   drawSubHook(visible, pos);   break;
    case 'hero':   drawSubHero(visible);         break;
    case 'cta':    drawSubCTA(visible);          break;
    default:       drawSubDetail(visible, pos);
  }
  ctx.restore();
}

/* ① Hook: 대형 그라디언트 텍스트 — 강렬한 첫 인상 */
function drawSubHook(text, pos) {
  ctx.font        = 'bold 84px "Noto Sans KR", sans-serif';
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  const y = pos === 'upper' ? CH * 0.22 : (pos === 'center' ? CH * 0.50 : CH * 0.72);

  // 그림자 레이어
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur  = 24;
  ctx.fillStyle   = '#ffffff';
  ctx.fillText(text, CW / 2, y + 4);
  ctx.shadowBlur  = 0;

  // 핑크-화이트-퍼플 그라디언트
  const grd = ctx.createLinearGradient(CW / 2 - 220, y, CW / 2 + 220, y);
  grd.addColorStop(0,   '#ff6b9d');
  grd.addColorStop(0.45,'#ffffff');
  grd.addColorStop(1,   '#c77dff');
  ctx.fillStyle = grd;
  ctx.fillText(text, CW / 2, y);
}

/* ② Detail: 하단 반투명 필 박스 — 감성 설명 */
function drawSubDetail(text, pos) {
  ctx.font        = 'bold 62px "Noto Sans KR", sans-serif';
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  const y = pos === 'upper' ? CH * 0.18 : (pos === 'center' ? CH * 0.50 : CH - 215);

  const tw   = ctx.measureText(text).width;
  const padX = 42, boxH = 86;
  const boxW = Math.min(tw + padX * 2, CW - 56);
  const boxX = CW / 2 - boxW / 2;
  const boxY = y - boxH / 2;

  // 반투명 배경
  ctx.fillStyle = 'rgba(8, 8, 16, 0.75)';
  roundRect(ctx, boxX, boxY, boxW, boxH, 16); ctx.fill();

  // 왼쪽 핑크-퍼플 액센트 바
  const barG = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
  barG.addColorStop(0, '#ff6b9d'); barG.addColorStop(1, '#c77dff');
  ctx.fillStyle = barG;
  roundRect(ctx, boxX, boxY + 10, 5, boxH - 20, 3); ctx.fill();

  // 텍스트
  ctx.fillStyle   = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur  = 6;
  ctx.fillText(text, CW / 2, y);
}

/* ③ Hero: 메인 메뉴 — 언더라인 그라디언트 */
function drawSubHero(text) {
  ctx.font        = 'bold 72px "Noto Sans KR", sans-serif';
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  const y = CH - 195;

  ctx.shadowColor = 'rgba(0,0,0,0.92)';
  ctx.shadowBlur  = 28;
  ctx.fillStyle   = '#ffffff';
  ctx.fillText(text, CW / 2, y);
  ctx.shadowBlur  = 0;

  // 그라디언트 언더라인
  const tw = ctx.measureText(text).width;
  const ug = ctx.createLinearGradient(CW / 2 - tw / 2, 0, CW / 2 + tw / 2, 0);
  ug.addColorStop(0, '#ff6b9d'); ug.addColorStop(1, '#c77dff');
  ctx.fillStyle = ug;
  ctx.fillRect(CW / 2 - tw / 2, y + 46, tw, 5);
}

/* ④ CTA: 하단 미니멀 — 팔로우/저장 유도 */
function drawSubCTA(text) {
  ctx.font        = 'bold 58px "Noto Sans KR", sans-serif';
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'bottom';
  const y = CH - 118;

  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = 'rgba(255,255,255,0.96)';
  ctx.fillText(text, CW / 2, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);   ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);   ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);       ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

/* ── 상단 MOOVLOG 배지 (인스타 감성) ─────────────────────── */
function drawTopBadge() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  roundRect(ctx, 22, 44, 218, 52, 26); ctx.fill();
  // 핑크 라이브 도트
  ctx.fillStyle = '#ff6b9d';
  ctx.shadowColor = '#ff6b9d'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(50, 70, 6, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // 텍스트
  ctx.font = 'bold 27px "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('MOOVLOG', 64, 70);
  ctx.restore();
}

/* ── 자막 글자별 등장 타이머 ────────────────────────────── */
function startSubAnim(si) {
  clearSubAnim();
  const sc = S.script.scenes[si], len = (sc.subtitle || '').length;
  const step = Math.max(38, (sc.duration * 680) / (len + 2));
  S.subCharIdx = 0;
  S.subTimer = setInterval(() => { if (S.subCharIdx < len) S.subCharIdx++; else clearSubAnim(); }, step);
}
function clearSubAnim() { if (S.subTimer) { clearInterval(S.subTimer); S.subTimer = null; } S.subCharIdx = 9999; }

/* ── 씬 카드 ─────────────────────────────────────────────── */
function buildSceneCards() {
  D.sceneList.innerHTML = '';
  S.script.scenes.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'scard'; d.id = `sc${i}`;
    d.innerHTML = `<div class="scard-num">SCENE ${i + 1} · ${s.duration}s · #${(s.idx ?? 0) + 1} · ${s.subtitle_style || 'detail'}</div><div class="scard-sub">${esc(s.subtitle)}</div><div class="scard-nar">${esc(s.narration)}</div>`;
    D.sceneList.appendChild(d);
  });
}
function highlightScene(i) {
  document.querySelectorAll('.scard').forEach(c => c.classList.remove('active'));
  const c = g(`sc${i}`); if (c) { c.classList.add('active'); c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

/* ════════════════════════════════════════════════════════════
   STEP 5 — Export (즉시 저장)
   pausePlay → MediaRecorder → exportRender → 자동 다운로드
   ════════════════════════════════════════════════════════════ */
async function doExport() {
  if (!S.script || !S.loaded.length) { toast('먼저 영상을 생성해주세요', 'err'); return; }

  // 기존 재생 완전 중지 후 녹화 시작
  pausePlay();
  if (!audioCtx) ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  D.dlBtn.disabled = true;
  D.dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 영상 제작 중... 0%';
  if (D.recStatus) D.recStatus.hidden = false;

  const totalDur = S.script.scenes.reduce((a, s) => a + s.duration, 0);
  let elapsed = 0;
  const timerInterval = setInterval(() => {
    elapsed++;
    const pct = Math.min(Math.round(elapsed / totalDur * 100), 97);
    if (D.dlBtn) D.dlBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 제작 중... ${pct}%`;
    if (D.recTimer) {
      const m = Math.floor(elapsed / 60), s = elapsed % 60;
      D.recTimer.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }
  }, 1000);

  const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const canvasStream = D.canvas.captureStream(30);
  const hasAudio     = S.audioBuffers.some(b => b !== null);
  const recStream    = hasAudio
    ? new MediaStream([...canvasStream.getVideoTracks(), ...audioMixDest.stream.getAudioTracks()])
    : canvasStream;

  const recorder = new MediaRecorder(recStream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    clearInterval(timerInterval);
    if (D.recStatus) D.recStatus.hidden = true;
    D.dlBtn.disabled = false;
    D.dlBtn.innerHTML = '<i class="fas fa-download"></i> 다시 저장하기';

    const blob = new Blob(chunks, { type: mime });
    if (blob.size < 1000) { toast('영상 데이터 없음. 다시 시도해주세요', 'err'); return; }

    const filename = `moovlog_${(D.restName.value || 'video').replace(/\s/g, '_')}_${Date.now()}.webm`;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 5000);
    toast(hasAudio ? '✓ AI 음성 포함 영상 저장 완료!' : '✓ 영상 저장 완료!', 'ok');
  };

  recorder.start(100);
  await exportRender();
  await sleep(600);
  recorder.stop();
}

async function exportRender() {
  const scenes = S.script.scenes;
  let si = 0, ts = null;
  playSceneAudio(0, true);
  clearSubAnim(); S.subCharIdx = 9999;
  return new Promise(resolve => {
    const frame = now => {
      if (!ts) ts = now;
      const sc = scenes[si], dur = sc.duration, el = (now - ts) / 1000, prog = Math.min(el / dur, 1);
      const TD = 0.30;
      if (el >= dur - TD && si < scenes.length - 1) drawTransition(si, (el - (dur - TD)) / TD);
      else renderFrame(si, prog);
      if (prog >= 1) {
        if (si < scenes.length - 1) { si++; ts = now; playSceneAudio(si, true); }
        else { resolve(); return; }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

/* ── UI 유틸 ─────────────────────────────────────────────── */
function goBack()     { pausePlay(); clearSubAnim(); D.resultWrap.hidden = true; D.makeBtn.disabled = false; }
function showLoad()   { D.loadWrap.hidden = false; }
function hideLoad()   { D.loadWrap.hidden = true; }
function setStep(n, title, sub) {
  D.loadTitle.textContent = title || '';
  D.loadSub.textContent   = sub   || '';
  [D.ls1, D.ls2, D.ls3].forEach((el, i) => {
    el.classList.toggle('active', i === n - 1);
    if (i < n - 1) el.classList.add('done');
  });
}
function doneStep(n) {
  const el = [D.ls1, D.ls2, D.ls3][n - 1];
  if (el) { el.classList.remove('active'); el.classList.add('done'); }
}
function updateAudioStatus(mode) {
  if (!D.audioStatus) return;
  D.audioStatus.innerHTML = mode === 'google-tts'
    ? '<i class="fas fa-microphone-alt"></i> AI 음성 포함 (Gemini TTS Charon)'
    : '<i class="fas fa-microphone"></i> 웹 음성 합성 (폴백)';
  D.audioStatus.style.color = mode === 'google-tts' ? '#4ade80' : '#a0a0a0';
}
function toast(msg, type = 'inf') {
  const icons = { ok: 'fa-check-circle', err: 'fa-exclamation-circle', inf: 'fa-info-circle' };
  const el = document.createElement('div'); el.className = `toast ${type}`;
  el.innerHTML = `<i class="fas ${icons[type] || icons.inf}"></i><span>${msg}</span>`;
  D.toasts.appendChild(el);
  setTimeout(() => { el.style.animation = 'tOut .3s ease forwards'; setTimeout(() => el.remove(), 350); }, 3800);
}
function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s)   { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

document.addEventListener('click', () => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); });
