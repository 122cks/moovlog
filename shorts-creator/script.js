'use strict';
/* ============================================================
   무브먼트 Shorts Creator v6 — script.js
   [Export]  WebCodecs 비실시간 인코딩 (녹화 없이 즉시 저장)
             OfflineAudioContext → 음성 100% 포함 보장
             MediaRecorder 자동 폴백 (WebCodecs 미지원 브라우저)
   [Voice]   Gemini TTS Charon → Fenrir → Orus 남성 폴백
             Web Speech 폴백: pitch=0.1 (최저음)
   [Subtitle] 4종 Instagram 애니메이션 (slide-up / scale-pop / bounce)
   [AI]      Gemini 2.5 Pro → Flash 폴백
             Hook→Context→Hero→Detail→CTA 내러티브 구조
   ============================================================ */

/* ── API ─────────────────────────────────────────────────── */
const GEMINI_KEY   = '__GEMINI_KEY__';
const GEMINI_PRO   = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`;
const GEMINI_FLASH = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
const GEMINI_TTS   = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_KEY}`;

async function apiPost(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || `${r.status}`); }
  return r.json();
}
async function geminiWithFallback(body) {
  try { return await apiPost(GEMINI_PRO, body); }
  catch (e) { console.warn('[Gemini] Pro → Flash 폴백:', e.message); return apiPost(GEMINI_FLASH, body); }
}

/* ── Canvas ──────────────────────────────────────────────── */
const CW = 720, CH = 1280;
const g  = id => document.getElementById(id);
const D  = {
  dropArea: g('dropArea'), fileInput: g('fileInput'), thumbGrid: g('thumbGrid'),
  restName: g('restName'), makeBtn: g('makeBtn'),
  loadWrap: g('loadingWrap'), loadTitle: g('loadTitle'), loadSub: g('loadSub'),
  ls1: g('ls1'), ls2: g('ls2'), ls3: g('ls3'),
  resultWrap: g('resultWrap'), canvas: g('vc'),
  vProg: g('vProg'), playBtn: g('playBtn'), playIco: g('playIco'),
  replayBtn: g('replayBtn'), muteBtn: g('muteBtn'), muteIco: g('muteIco'),
  sceneList: g('sceneList'), dlBtn: g('dlBtn'),
  recStatus: g('recStatus'), recTimer: g('recTimer'),
  reBtn: g('reBtn'), toasts: g('toasts'), audioStatus: g('audioStatus'),
  snsWrap: g('snsWrap'), tagNaver: g('tagNaver'), tagYoutube: g('tagYoutube'),
  tagInsta: g('tagInsta'), tagTiktok: g('tagTiktok'),
};
const ctx = D.canvas.getContext('2d');
D.canvas.width = CW; D.canvas.height = CH;

/* ── Audio ───────────────────────────────────────────────── */
let audioCtx = null, audioMixDest = null, useTTSApi = true;
function ensureAudio() {
  if (audioCtx) return;
  audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
  audioMixDest = audioCtx.createMediaStreamDestination();
}

/* ── State ───────────────────────────────────────────────── */
const S = {
  files: [], loaded: [], script: null, audioBuffers: [],
  currentAudio: null, playing: false, muted: false,
  scene: 0, startTs: null, raf: null,
  subAnimProg: 0,  // 0..1, subtitle animation progress per scene
};

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  D.dropArea.addEventListener('dragover',  e => { e.preventDefault(); D.dropArea.classList.add('over'); });
  D.dropArea.addEventListener('dragleave', () => D.dropArea.classList.remove('over'));
  D.dropArea.addEventListener('drop',      e => { e.preventDefault(); D.dropArea.classList.remove('over'); addFiles([...e.dataTransfer.files]); });
  D.dropArea.addEventListener('click',     e => { if (!e.target.closest('.pick-btn')) D.fileInput.click(); });
  D.fileInput.addEventListener('change',   e => { addFiles([...e.target.files]); D.fileInput.value = ''; });
  D.makeBtn.addEventListener('click',   startMake);
  D.playBtn.addEventListener('click',   togglePlay);
  D.canvas.addEventListener('click',    togglePlay);  // 모바일: 캔버스 탭으로 재생/일시정지
  D.replayBtn.addEventListener('click', doReplay);
  D.muteBtn.addEventListener('click',   toggleMute);
  D.dlBtn.addEventListener('click',     doExport);
  D.reBtn.addEventListener('click',     goBack);
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
  if ('speechSynthesis' in window) setTimeout(() => speechSynthesis.getVoices(), 500);
});

/* ── File Upload ─────────────────────────────────────────── */
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
  D.makeBtn.disabled = true;
  if (D.snsWrap) D.snsWrap.hidden = true;
  useTTSApi = true;
  showLoad(); ensureAudio();
  try {
    setStep(1, '이미지 정밀 분석 중...', 'Gemini 2.5 Pro가 각 컷을 분석합니다');
    const analysis = await visionAnalysis(name);
    doneStep(1);

    setStep(2, 'Instagram Reels 스토리보드 생성 중...', '훅→감성→클로즈업→CTA 내러티브 설계');
    const script = await generateScript(name, analysis);
    S.script = script;
    doneStep(2);

    setStep(3, 'AI 남성 보이스 합성 중...', `Gemini TTS Charon — ${script.scenes.length}컷`);
    S.audioBuffers = await generateAllTTS(script.scenes);
    doneStep(3);

    setStep(3, '렌더링 준비 중...', '컷 배치 · 애니메이션 · 효과 적용');
    await preload(); buildSceneCards(); await sleep(300);
    buildSNSTags(script);
    hideLoad(); D.resultWrap.hidden = false;
    setupPlayer(); setTimeout(startPlay, 300);
  } catch (err) {
    hideLoad(); D.makeBtn.disabled = false;
    console.error(err); toast('오류: ' + (err.message || '알 수 없는 오류'), 'err');
  }
}

/* ════════════════════════════════════════════════════════════
   STEP 1 — Vision Analysis (Gemini 2.5 Pro)
   이미지별 타입·감성·효과·순서 분석
   ════════════════════════════════════════════════════════════ */
async function visionAnalysis(restaurantName) {
  const imgs = S.files.filter(f => f.type === 'image').slice(0, 8);
  if (!imgs.length) return { keywords: [restaurantName, '맛집'], mood: '감성적인', per_image: [], recommended_order: [] };

  const parts = [];
  for (const img of imgs) { const b64 = await toB64(img.file); parts.push({ inline_data: { mime_type: img.file.type || 'image/jpeg', data: b64 } }); }

  const prompt = `당신은 인스타그램 Reels 전문 비주얼 디렉터입니다.
음식점: "${restaurantName}" / 이미지 ${imgs.length}장 (순서대로 이미지0, 이미지1...)

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

JSON만 반환:
{"keywords":["k1","k2","k3","k4","k5"],"mood":"감성","menu":["메뉴"],"visual_hook":"훅","recommended_order":[0,1,2],"per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":3,"focus":"설명"}]}`;

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

  const prompt = `당신은 팔로워 10만+ 인스타그램 Reels 전문 PD "무브먼트(MOOVLOG)"입니다.
인천·서울·부천 맛집 채널 / 감성적이고 트렌디한 영상 스타일.

[음식점]
이름: ${restaurantName}
분위기: ${analysis.mood || '감성적인'}
메뉴: ${(analysis.menu || []).join(', ') || restaurantName}
비주얼 훅: ${analysis.visual_hook || ''}
키워드: ${(analysis.keywords || []).join(', ')}

[컷 분석]
${imgSummary || '분석 없음'}
권장 순서: [${order.join(',')}]

[Instagram Reels 내러티브 구조 — 총 ${totalTarget}초 목표, ${S.files.length}씬]
씬1 (Hook 2~3s): 즉각적 시선 강탈. 질문형·반전형 강한 훅. "이거 진짜야?", "여기 이걸 팔아?", "무조건 저장해"
씬2 (Context 3~4s): 공간/무드 소개. 따뜻하고 감성적. 어디인지 암시.
씬3 (Hero 4~5s): 대표 메뉴 원샷. 색감·윤기·볼륨감 극대화. 식욕 최고조.
씬4~N-1 (Detail 3~4s): 디테일 컷. 질감·온도·두께·색감 감각적 묘사.
씬N (CTA 2~3s): "저장하고 꼭 가봐 💾", "팔로우하면 다 알려드림 🙏", "나중에 여기 가려고 저장 필수"

[자막 규칙]
- subtitle: 8~15자, 이모지 1~2개, 구어체, 임팩트, 완결성
- subtitle_style: "hook"|"detail"|"hero"|"cta"
- subtitle_position: "center"|"lower"|"upper"  
- narration: 친근한 구어체 남성 1~2문장, 글자 수 ≤ duration×7
- effect: 컷분석의 best_effect 우선 적용
- duration: 컷분석 suggested_duration 우선, 나레이션 길이 반영 (min:2, max:6)
- idx: 0~${S.files.length - 1}

[SNS 태그]
- naver_clip_tags: 300자 이내 #태그, 지역+음식+감성
- youtube_shorts_tags: 100자 이내 #태그
- instagram_caption: 반말 감성 2줄 소개 + 이모지 + 해시태그 12개
- tiktok_tags: 핵심 5개 #태그

JSON만 반환:
{"title":"제목","hashtags":"#태그들","naver_clip_tags":"...","youtube_shorts_tags":"...","instagram_caption":"...","tiktok_tags":"...","scenes":[{"idx":0,"duration":3,"subtitle":"🔥 이거 실화임?","subtitle_style":"hook","subtitle_position":"center","narration":"진짜 이 가격에 이게 나온다고?","effect":"zoom-out"}]}`;

  const makeReq = async url => {
    const data = await apiPost(url, { contents: [{ parts: [...imgParts, { text: prompt }] }], generationConfig: { temperature: 0.92, responseMimeType: 'application/json' } });
    const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const obj  = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (!Array.isArray(obj.scenes) || !obj.scenes.length) throw new Error('스크립트 오류');
    return obj;
  };
  try { return await makeReq(GEMINI_PRO); }
  catch (e) { console.warn('[Script] Pro → Flash 폴백:', e.message); return makeReq(GEMINI_FLASH); }
}

function toB64(file) {
  return new Promise((ok, fail) => { const r = new FileReader(); r.onload = e => ok(e.target.result.split(',')[1]); r.onerror = fail; r.readAsDataURL(file); });
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
   ════════════════════════════════════════════════════════════ */
async function generateAllTTS(scenes) {
  const buffers = []; let hasErr = false;
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (!sc.narration || !useTTSApi) { buffers.push(null); continue; }
    try { buffers.push(await fetchGeminiTTS(sc.narration)); }
    catch (err) { console.warn(`TTS 씬${i + 1} 실패:`, err.message); hasErr = true; useTTSApi = false; buffers.push(null); }
  }
  if (hasErr || !useTTSApi) { updateAudioStatus('web-speech'); toast('AI 음성: 웹 음성으로 재생됩니다', 'inf'); }
  else { updateAudioStatus('google-tts'); toast('AI 남성 보이스 생성 완료 ✓', 'ok'); }
  return buffers;
}

// Charon → Fenrir → Orus 순으로 남성 보이스 시도
async function fetchGeminiTTS(text) {
  const maleVoices = ['Charon', 'Fenrir', 'Orus'];
  for (const voiceName of maleVoices) {
    try {
      const res = await fetch(GEMINI_TTS, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: '낮고 굵은 남성 목소리로 천천히 자신감 있게 읽어주세요. 성조는 최대한 낮게 유지하세요.' }] },
          contents: [{ parts: [{ text }] }],
          generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `TTS ${res.status}`);
      const part = data?.candidates?.[0]?.content?.parts?.[0];
      if (!part?.inlineData?.data) throw new Error('empty');
      return await decodePCMAudio(part.inlineData.data, part.inlineData.mimeType);
    } catch (e) {
      console.warn(`[TTS] ${voiceName} 실패:`, e.message);
      if (voiceName === 'Orus') throw e;
    }
  }
}

function decodePCMAudio(b64, mimeType) {
  const binary = atob(b64), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (mimeType?.includes('pcm')) {
    const sr = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || '24000');
    const n  = bytes.length / 2, buf = audioCtx.createBuffer(1, n, sr);
    const ch = buf.getChannelData(0), dv = new DataView(bytes.buffer);
    for (let i = 0; i < n; i++) ch[i] = dv.getInt16(i * 2, true) / 32768;
    return Promise.resolve(buf);
  }
  return audioCtx.decodeAudioData(bytes.buffer.slice());
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
  } else if (!S.muted) {
    playWebSpeech(S.script?.scenes?.[si]);
  }
}
// Web Speech 폴백 — pitch 최저, 남성 보이스 우선
function playWebSpeech(sc) {
  if (!sc?.narration) return;
  const u = new SpeechSynthesisUtterance(sc.narration);
  u.lang = 'ko-KR'; u.pitch = 0.1; u.rate = 0.88; u.volume = 1;
  const v = speechSynthesis.getVoices();
  // Heami = 여성, 피함
  const male = v.find(x => x.lang.startsWith('ko') && !/heami|female|여성/i.test(x.name))
            || v.find(x => x.lang.startsWith('ko'))
            || null;
  if (male) u.voice = male;
  speechSynthesis.speak(u);
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
      const img = await new Promise((ok, fail) => { const i = new Image(); i.src = m.url; i.onload = () => ok(i); i.onerror = fail; });
      S.loaded.push({ type: 'image', src: img });
    } else {
      const vid = Object.assign(document.createElement('video'), { src: m.url, muted: true, loop: true, playsInline: true });
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      await new Promise(r => { vid.onloadeddata = r; vid.onerror = r; setTimeout(r, 5000); });
      vid.play().catch(() => {}); // canvas drawImage는 playing 상태 필요 (모바일)
      S.loaded.push({ type: 'video', src: vid });
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
    D.vProg.style.width = ((done + el) / total * 100) + '%';
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
function renderFrame(si, prog) {
  const sc = S.script.scenes[si], media = getMedia(sc);
  ctx.clearRect(0, 0, CW, CH);
  drawMedia(media, sc.effect, prog);
  drawVignetteGrad();
  drawSubtitle(sc, S.subAnimProg);
  if (si === 0) drawTopBadge();
}
function drawTransition(fi, t) {
  const e = ease(t);
  ctx.save(); renderFrame(fi, 1);
  ctx.globalAlpha = e; renderFrame(fi + 1, 0);
  ctx.restore();
}
// 특정 시간 t(초)에 해당하는 프레임 렌더링 (export용, 실시간 불필요)
function renderFrameAtTime(t) {
  let elapsed = 0;
  const sc = S.script.scenes;
  for (let i = 0; i < sc.length; i++) {
    const dur = sc[i].duration;
    if (t < elapsed + dur || i === sc.length - 1) {
      const prog       = Math.max(0, Math.min((t - elapsed) / dur, 1));
      const subAnimProg = Math.min(prog * 2.8, 1);
      const media      = getMedia(sc[i]);
      ctx.clearRect(0, 0, CW, CH);
      drawMedia(media, sc[i].effect, prog);
      drawVignetteGrad();
      drawSubtitle(sc[i], subAnimProg);
      if (i === 0) drawTopBadge();
      return;
    }
    elapsed += dur;
  }
}
function getMedia(sc) { return S.loaded.length ? S.loaded[(sc.idx ?? 0) % S.loaded.length] : null; }

/* ── Ken Burns (6종) ─────────────────────────────────────── */
function drawMedia(media, effect, prog) {
  if (!media) { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, CW, CH); return; }
  // 모바일에서 video가 일시정지 상태면 재생
  if (media.type === 'video' && media.src.paused) {
    media.src.play().catch(() => {});
  }
  const e = ease(prog); let sc = 1, ox = 0, oy = 0;
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
  ctx.translate(CW / 2 + ox, CH / 2 + oy); ctx.scale(sc, sc);
  ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

/* ── 비네트 ──────────────────────────────────────────────── */
function drawVignetteGrad() {
  const top = ctx.createLinearGradient(0, 0, 0, CH * 0.30);
  top.addColorStop(0, 'rgba(0,0,0,0.62)'); top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, CW, CH * 0.30);
  const bot = ctx.createLinearGradient(0, CH * 0.36, 0, CH);
  bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(0.5, 'rgba(0,0,0,0.72)'); bot.addColorStop(1, 'rgba(0,0,0,0.94)');
  ctx.fillStyle = bot; ctx.fillRect(0, CH * 0.36, CW, CH * 0.64);
}

/* ════════════════════════════════════════════════════════════
   SUBTITLE SYSTEM — 4 Instagram Reels 스타일 + 애니메이션
   animProg: 0=시작, 1=완전 표시
   ════════════════════════════════════════════════════════════ */
function drawSubtitle(sc, animProg) {
  if (!sc.subtitle) return;
  ctx.save();
  switch (sc.subtitle_style || 'detail') {
    case 'hook':   drawSubHook  (sc.subtitle, sc.subtitle_position || 'center', animProg); break;
    case 'hero':   drawSubHero  (sc.subtitle, animProg); break;
    case 'cta':    drawSubCTA   (sc.subtitle, animProg); break;
    default:       drawSubDetail(sc.subtitle, sc.subtitle_position || 'lower', animProg);
  }
  ctx.restore();
}

/* ① Hook — 대형 그라디언트 텍스트 + scale-pop */
function drawSubHook(text, pos, ap) {
  const eased  = ease(Math.min(ap * 3.5, 1));
  const scale  = 0.65 + eased * 0.35;   // 0.65 → 1.0
  const alpha  = Math.min(ap * 4, 1);
  const y      = pos === 'upper' ? CH * 0.22 : (pos === 'center' ? CH * 0.50 : CH * 0.72);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 82px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.translate(CW / 2, y); ctx.scale(scale, scale);
  // 섀도우
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 28;
  ctx.fillStyle = '#ffffff'; ctx.fillText(text, 0, 4); ctx.shadowBlur = 0;
  // 그라디언트
  const grd = ctx.createLinearGradient(-260, 0, 260, 0);
  grd.addColorStop(0, '#ff6b9d'); grd.addColorStop(0.45, '#ffffff'); grd.addColorStop(1, '#c77dff');
  ctx.fillStyle = grd; ctx.fillText(text, 0, 0);
  ctx.restore();
}

/* ② Detail — 반투명 박스 + 좌측 액센트 바 + slide-up */
function drawSubDetail(text, pos, ap) {
  const eased  = ease(Math.min(ap * 2.8, 1));
  const slideY = (1 - eased) * 38;
  const alpha  = Math.min(ap * 3.5, 1);
  const baseY  = pos === 'upper' ? CH * 0.18 : (pos === 'center' ? CH * 0.50 : CH - 218);
  const y      = baseY + slideY;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 60px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width, padX = 44, boxH = 86;
  const boxW = Math.min(tw + padX * 2, CW - 48), boxX = CW / 2 - boxW / 2, boxY = y - boxH / 2;
  // 배경
  ctx.fillStyle = 'rgba(6,6,14,0.78)'; roundRect(ctx, boxX, boxY, boxW, boxH, 18); ctx.fill();
  // 액센트 바
  const bg = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
  bg.addColorStop(0, '#ff6b9d'); bg.addColorStop(1, '#c77dff');
  ctx.fillStyle = bg; roundRect(ctx, boxX, boxY + 10, 5, boxH - 20, 3); ctx.fill();
  // 텍스트
  ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8;
  ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ③ Hero — 대형 + 그라디언트 언더라인 + slide-up */
function drawSubHero(text, ap) {
  const eased  = ease(Math.min(ap * 2.8, 1));
  const slideY = (1 - eased) * 28;
  const alpha  = Math.min(ap * 3.5, 1);
  const y      = CH - 196 + slideY;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 70px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff'; ctx.fillText(text, CW / 2, y); ctx.shadowBlur = 0;
  const tw = ctx.measureText(text).width;
  const ug = ctx.createLinearGradient(CW / 2 - tw / 2, 0, CW / 2 + tw / 2, 0);
  ug.addColorStop(0, '#ff6b9d'); ug.addColorStop(1, '#c77dff');
  ctx.fillStyle = ug; ctx.fillRect(CW / 2 - tw / 2, y + 44, tw * eased, 5);
  ctx.restore();
}

/* ④ CTA — 미니멀 + bounce */
function drawSubCTA(text, ap) {
  const eased  = ease(Math.min(ap * 2.5, 1));
  const bounce = ap < 0.5 ? Math.sin(ap * Math.PI * 2) * 10 : 0;
  const slideY = (1 - eased) * 32;
  const alpha  = Math.min(ap * 4, 1);
  const y      = CH - 120 - bounce + slideY;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 56px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(0,0,0,0.88)'; ctx.shadowBlur = 20;
  ctx.fillStyle = 'rgba(255,255,255,0.97)'; ctx.fillText(text, CW / 2, y);
  ctx.restore();
}

/* ── MOOVLOG 배지 ────────────────────────────────────────── */
function drawTopBadge() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.50)'; roundRect(ctx, 20, 42, 225, 54, 27); ctx.fill();
  ctx.fillStyle = '#ff6b9d'; ctx.shadowColor = '#ff6b9d'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(50, 69, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.font = 'bold 27px "Inter", sans-serif';
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('MOOVLOG', 66, 69);
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
    d.innerHTML = `<div class="scard-num">SCENE ${i + 1} · ${s.duration}s · #${(s.idx ?? 0) + 1} · ${s.subtitle_style || 'detail'}</div><div class="scard-sub">${esc(s.subtitle)}</div><div class="scard-nar">${esc(s.narration)}</div>`;
    D.sceneList.appendChild(d);
  });
}
function highlightScene(i) {
  document.querySelectorAll('.scard').forEach(c => c.classList.remove('active'));
  const c = g(`sc${i}`); if (c) { c.classList.add('active'); c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

/* ════════════════════════════════════════════════════════════
   EXPORT — WebCodecs 비실시간 저장 (녹화 없음)
   Chrome 94+ : VideoEncoder + AudioEncoder + webm-muxer
   폴백         : MediaRecorder (구형 브라우저)
   ════════════════════════════════════════════════════════════ */
async function doExport() {
  if (!S.script || !S.loaded.length) { toast('먼저 영상을 생성해주세요', 'err'); return; }
  pausePlay();
  if (!audioCtx) ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
  const hasWebCodecs = typeof VideoEncoder !== 'undefined'
    && typeof AudioEncoder !== 'undefined'
    && typeof window.WebmMuxer !== 'undefined';

  // iOS Safari: canvas.captureStream() 미지원, WebCodecs 미지원
  if (isIOS && !hasWebCodecs) {
    toast('iOS Safari에서는 Chrome 앱을 이용해 저장해주세요', 'err');
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
  }
}

/* ── WebCodecs 경로 ──────────────────────────────────────── */
async function doExportWebCodecs() {
  const FPS      = 30;
  const totalDur = S.script.scenes.reduce((a, s) => a + s.duration, 0);
  const nFrames  = Math.ceil(totalDur * FPS);
  const hasAudio = S.audioBuffers.some(b => b !== null);

  // 1. 오디오 사전 렌더링
  let pcm = null;
  if (hasAudio) {
    D.dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 음성 처리 중... 3%';
    try { pcm = await prerenderAudio(totalDur); }
    catch (e) { console.warn('[Export] 오디오 렌더 실패:', e.message); }
  }

  // 2. Muxer 초기화
  const { Muxer, ArrayBufferTarget } = window.WebmMuxer;
  const muxTarget = new ArrayBufferTarget();
  const muxer     = new Muxer({
    target:   muxTarget,
    video:    { codec: 'V_VP9', width: CW, height: CH, frameRate: FPS },
    ...(pcm ? { audio: { codec: 'A_OPUS', numberOfChannels: 1, sampleRate: 48000 } } : {}),
    firstTimestampBehavior: 'offset',
  });

  // 3. VideoEncoder
  const videoEnc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error:  err => { throw err; },
  });
  videoEnc.configure({ codec: 'vp09.00.10.08', width: CW, height: CH, bitrate: 8_000_000, framerate: FPS });

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
    audioEnc.configure({ codec: 'opus', sampleRate: 48000, numberOfChannels: 1, bitrate: 128_000 });
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

  downloadBlob(new Blob([buffer], { type: 'video/webm' }), `moovlog_${sanitizeName()}.webm`);
  D.dlBtn.disabled  = false;
  D.dlBtn.innerHTML = '<i class="fas fa-download"></i> 다시 저장하기';
  toast(pcm ? '✓ AI 음성 포함 영상 저장 완료!' : '✓ 영상 저장 완료!', 'ok');
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
  const mime     = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const hasAudio = S.audioBuffers.some(b => b !== null);
  const cs       = D.canvas.captureStream(30);
  const stream   = hasAudio
    ? new MediaStream([...cs.getVideoTracks(), ...audioMixDest.stream.getAudioTracks()])
    : cs;

  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks   = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    if (D.recStatus) D.recStatus.hidden = true;
    const blob = new Blob(chunks, { type: mime });
    if (blob.size < 1000) { toast('영상 데이터 없음. 다시 시도해주세요', 'err'); return; }
    downloadBlob(blob, `moovlog_${sanitizeName()}.webm`);
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

/* ── helpers ─────────────────────────────────────────────── */
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 8000);
}
function sanitizeName() { return (D.restName?.value || 'video').replace(/\s+/g, '_') + '_' + Date.now(); }

/* ── UI 유틸 ─────────────────────────────────────────────── */
function goBack()   { pausePlay(); D.resultWrap.hidden = true; D.makeBtn.disabled = false; }
function showLoad() { D.loadWrap.hidden = false; }
function hideLoad() { D.loadWrap.hidden = true; }
function setStep(n, title, sub) {
  D.loadTitle.textContent = title || ''; D.loadSub.textContent = sub || '';
  [D.ls1, D.ls2, D.ls3].forEach((el, i) => { el.classList.toggle('active', i === n - 1); if (i < n - 1) el.classList.add('done'); });
}
function doneStep(n) { const el = [D.ls1, D.ls2, D.ls3][n - 1]; if (el) { el.classList.remove('active'); el.classList.add('done'); } }
function updateAudioStatus(mode) {
  if (!D.audioStatus) return;
  D.audioStatus.innerHTML = mode === 'google-tts'
    ? '<i class="fas fa-microphone-alt"></i> AI 남성 보이스 포함 (Gemini TTS)'
    : '<i class="fas fa-microphone"></i> 웹 음성 합성 (폴백)';
  D.audioStatus.style.color = mode === 'google-tts' ? '#4ade80' : '#888';
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
