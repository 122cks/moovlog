'use strict';
/* ============================================================
   무브먼트 Shorts Creator v3 — script.js
   ◾ Gemini Vision 이미지 분석 → 무브먼트 스타일 스크립트 생성
   ◾ Google Cloud TTS → 한국어 남성 AI 음성 (영상에 합성)
   ◾ AudioContext MediaStream → 음성 포함 WebM 영상 저장
   ◾ Canvas 자막 애니메이션 (글자별 등장 + 글로우 효과)
   ============================================================ */

const GEMINI_KEY = 'AIzaSyA-QrlNLTWEB-6fL0KE4OvodqXTalnvMHs';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
const TTS_URL    = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GEMINI_KEY}`;

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

/* ── 메인 파이프라인 ─────────────────────────────────────── */
async function startMake() {
  if (!S.files.length) { toast('이미지 또는 영상을 올려주세요', 'err'); return; }
  const name = D.restName.value.trim();
  if (!name) { toast('음식점 이름을 입력해주세요', 'err'); D.restName.focus(); return; }
  D.makeBtn.disabled = true;
  showLoad();
  ensureAudio();
  try {
    setStep(1, '이미지 분석 중...', 'Gemini AI가 음식 사진을 인식합니다');
    const script = await analyzeWithGemini(name);
    S.script = script; doneStep(1);

    setStep(2, 'AI 목소리 생성 중...', `${script.scenes.length}개 씬 나레이션 합성 중`);
    S.audioBuffers = await generateAllTTS(script.scenes); doneStep(2);

    setStep(3, '영상 프레임 준비 중...', '미디어를 로드하고 있습니다');
    await preload(); buildSceneCards(); await sleep(400); doneStep(3);

    hideLoad();
    D.resultWrap.hidden = false;
    setupPlayer();
    setTimeout(startPlay, 300);
  } catch (err) {
    hideLoad(); D.makeBtn.disabled = false;
    console.error(err); toast('오류: ' + (err.message || '알 수 없는 오류'), 'err');
  }
}

/* ── Gemini Vision (무브먼트 스타일) ─────────────────────── */
async function analyzeWithGemini(restaurantName) {
  const images = S.files.filter(f => f.type === 'image').slice(0, 4);
  const imgParts = [];
  for (const img of images) {
    const b64 = await fileToBase64(img.file);
    imgParts.push({ inline_data: { mime_type: img.file.type || 'image/jpeg', data: b64 } });
  }
  const sceneCount = Math.max(S.files.length, 4);
  const prompt = `당신은 한국 SNS 맛집 블로거 "무브먼트(moovlog)"의 전문 영상 PD입니다.
무브먼트는 인천·서울·부천 일대 맛집을 소개하는 유튜브 쇼츠·릴스·틱톡을 운영합니다.

[채널 스타일]
- 오프닝: 강력한 훅 ("이거 진짜?", "여기 알아?", "지금 안 오면 후회함") 짧고 임팩트
- 묘사: 구체적 식욕 자극 표현 ("육즙 폭발", "바삭", "진한 국물", "줄서는 곳")
- 나레이션 톤: 친구에게 말하듯 편안하고 활기찬 남성
- 엔딩: 좋아요·구독 유도 + 위치 언급

[지시사항]
음식점: "${restaurantName}"
이미지를 분석해서 실제 메뉴·분위기를 파악하세요.
총 씬 수: ${sceneCount}개
- idx: 0~${S.files.length-1} 중 파일 인덱스
- 자막: 10자 이내, 임팩트 있게
- 나레이션: 한국어 1~2문장, 무브먼트 스타일
- effect: zoom-in|zoom-out|pan-left|pan-right
- duration: 3~6 정수

해시태그: #맛집 #${restaurantName.replace(/\s/g,'')} #무브먼트 + 관련 태그 5개

첫 씬: 필히 강한 훅. 마지막 씬: CTA(좋아요·팔로우 유도).

JSON만 반환:
{"title":"제목","hashtags":"해시태그들","scenes":[{"idx":0,"duration":4,"subtitle":"자막","narration":"나레이션","effect":"zoom-in"}]}`;

  const parts = [...imgParts, { text: prompt }];
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.9, responseMimeType: 'application/json' } }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Gemini ${res.status}`); }
  const data  = await res.json();
  const raw   = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const obj   = JSON.parse(raw.replace(/```json|```/g, '').trim());
  if (!Array.isArray(obj.scenes) || !obj.scenes.length) throw new Error('스크립트 데이터 오류');
  return obj;
}
function fileToBase64(file) {
  return new Promise((ok, fail) => { const r = new FileReader(); r.onload = e => ok(e.target.result.split(',')[1]); r.onerror = fail; r.readAsDataURL(file); });
}

/* ── Google Cloud TTS (한국어 남성 Wavenet-C) ────────────── */
async function generateAllTTS(scenes) {
  const buffers = [];
  let hasErr = false;
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (!sc.narration || !useTTSApi) { buffers.push(null); continue; }
    try {
      buffers.push(await fetchGoogleTTS(sc.narration));
    } catch (err) {
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
async function fetchGoogleTTS(text) {
  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'ko-KR', ssmlGender: 'MALE', name: 'ko-KR-Wavenet-C' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.05, pitch: -2.5, volumeGainDb: 1.0 },
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.audioContent) throw new Error(data.error?.message || `TTS ${res.status}`);
  const binary = atob(data.audioContent);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return audioCtx.decodeAudioData(buf.buffer.slice());
}

function playSceneAudio(si, capture = false) {
  stopAudio();
  const buf = S.audioBuffers?.[si];
  if (buf && audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    if (capture) src.connect(audioMixDest);
    src.start(); S.currentAudio = src;
  } else if (!S.muted) {
    const sc = S.script?.scenes?.[si];
    if (sc?.narration) {
      const u = new SpeechSynthesisUtterance(sc.narration);
      u.lang = 'ko-KR'; u.pitch = 0.8; u.rate = 1.0;
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

/* ── 플레이어 ────────────────────────────────────────────── */
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

/* ── Canvas 렌더링 ───────────────────────────────────────── */
function renderFrame(si, prog) {
  const sc = S.script.scenes[si], media = getMedia(sc);
  ctx.clearRect(0, 0, CW, CH);
  drawMedia(media, sc.effect, prog);
  drawVignetteGrad();
  drawSubtitle(sc.subtitle, S.subCharIdx);
  drawHashtags();
  if (si === 0) drawTopBadge();
}
function drawTransition(fi, t) {
  const e = ease(t); ctx.save(); renderFrame(fi, 1); ctx.globalAlpha = e; renderFrame(fi+1, 0); ctx.restore();
}
function getMedia(sc) { return S.loaded.length ? S.loaded[(sc.idx??0) % S.loaded.length] : null; }
function drawMedia(media, effect, prog) {
  if (!media) { ctx.fillStyle='#111'; ctx.fillRect(0,0,CW,CH); return; }
  const e = ease(prog); let sc=1, ox=0, oy=0;
  if      (effect==='zoom-in')   sc = 1.0 + e*0.08;
  else if (effect==='zoom-out')  sc = 1.08 - e*0.08;
  else if (effect==='pan-left')  { sc=1.06; ox=-e*CW*0.04; }
  else if (effect==='pan-right') { sc=1.06; ox= e*CW*0.04; }
  else sc = 1.03 + e*0.03;
  const el=media.src;
  const sw=media.type==='video'?(el.videoWidth||CW):el.naturalWidth;
  const sh=media.type==='video'?(el.videoHeight||CH):el.naturalHeight;
  const r=Math.max(CW/sw,CH/sh), dw=sw*r, dh=sh*r;
  ctx.save(); ctx.translate(CW/2+ox, CH/2+oy); ctx.scale(sc,sc); ctx.drawImage(el,-dw/2,-dh/2,dw,dh); ctx.restore();
}
function drawVignetteGrad() {
  const top=ctx.createLinearGradient(0,0,0,CH*0.28);
  top.addColorStop(0,'rgba(0,0,0,0.52)'); top.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=top; ctx.fillRect(0,0,CW,CH*0.28);
  const bot=ctx.createLinearGradient(0,CH*0.42,0,CH);
  bot.addColorStop(0,'rgba(0,0,0,0)'); bot.addColorStop(1,'rgba(0,0,0,0.88)');
  ctx.fillStyle=bot; ctx.fillRect(0,CH*0.42,CW,CH*0.58);
}

function drawSubtitle(text, charLimit) {
  if (!text) return;
  const visible = text.slice(0, charLimit===undefined?text.length:charLimit);
  if (!visible) return;
  const x=CW/2, y=CH-220;
  ctx.save();
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='bold 72px "Noto Sans KR", sans-serif';
  // 글로우
  ctx.shadowColor='rgba(255,77,109,0.7)'; ctx.shadowBlur=30;
  ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=9; ctx.lineJoin='round';
  ctx.strokeText(visible,x,y);
  ctx.shadowBlur=0; ctx.fillStyle='#ffffff'; ctx.fillText(visible,x,y);
  // 하이라이트 바
  const tw=ctx.measureText(visible).width;
  const bar=ctx.createLinearGradient(x-tw/2,0,x+tw/2,0);
  bar.addColorStop(0,'rgba(255,77,109,0)'); bar.addColorStop(0.5,'rgba(255,77,109,0.95)'); bar.addColorStop(1,'rgba(199,125,255,0)');
  ctx.fillStyle=bar; ctx.shadowBlur=8; ctx.shadowColor='rgba(255,77,109,0.8)';
  ctx.fillRect(x-tw/2, y+50, tw, 2.5);
  ctx.restore();
}

function drawHashtags() {
  if (!S.script?.hashtags) return;
  ctx.save(); ctx.font='26px "Noto Sans KR", sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.textAlign='center'; ctx.textBaseline='bottom';
  ctx.fillText(S.script.hashtags, CW/2, CH-64);
  ctx.restore();
}
function drawTopBadge() {
  ctx.save(); ctx.font='bold 28px "Inter", sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.textAlign='left';
  ctx.fillText('MOOVLOG', 36, 72); ctx.restore();
}

function startSubAnim(si) {
  clearSubAnim();
  const sc=S.script.scenes[si], len=(sc.subtitle||'').length;
  const step=Math.max(55,(sc.duration*1000)/(len+3));
  S.subCharIdx=0;
  S.subTimer=setInterval(()=>{ if(S.subCharIdx<len) S.subCharIdx++; else clearSubAnim(); }, step);
}
function clearSubAnim() { if(S.subTimer){clearInterval(S.subTimer);S.subTimer=null;} S.subCharIdx=9999; }

/* ── 씬 카드 ─────────────────────────────────────────────── */
function buildSceneCards() {
  D.sceneList.innerHTML='';
  S.script.scenes.forEach((s,i) => {
    const d=document.createElement('div'); d.className='scard'; d.id=`sc${i}`;
    d.innerHTML=`<div class="scard-num">SCENE ${i+1} · ${s.duration}s · #${(s.idx??0)+1}</div><div class="scard-sub">${esc(s.subtitle)}</div><div class="scard-nar">${esc(s.narration)}</div>`;
    D.sceneList.appendChild(d);
  });
}
function highlightScene(i) {
  document.querySelectorAll('.scard').forEach(c=>c.classList.remove('active'));
  const c=g(`sc${i}`); if(c){c.classList.add('active'); c.scrollIntoView({behavior:'smooth',block:'nearest'});}
}

/* ── 영상 내보내기 (AI 음성 포함) ────────────────────────── */
async function doExport() {
  if (!S.script || !S.loaded.length) { toast('먼저 영상을 생성해주세요','err'); return; }
  if (!audioCtx) ensureAudio();
  if (audioCtx.state==='suspended') await audioCtx.resume();
  D.dlBtn.disabled=true; D.recStatus.hidden=false;
  let sec=0;
  const ticker=setInterval(()=>{ sec++; const m=Math.floor(sec/60),s=String(sec%60).padStart(2,'0'); D.recTimer.textContent=`${m}:${s}`; },1000);
  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'video/webm';
  const canvasStream=D.canvas.captureStream(30);
  const hasAudio=S.audioBuffers.some(b=>b!==null);
  const recStream=hasAudio ? new MediaStream([...canvasStream.getVideoTracks(),...audioMixDest.stream.getAudioTracks()]) : canvasStream;
  const recorder=new MediaRecorder(recStream,{mimeType:mime,videoBitsPerSecond:8_000_000});
  const chunks=[];
  recorder.ondataavailable=e=>{ if(e.data.size>0) chunks.push(e.data); };
  recorder.onstop=()=>{
    clearInterval(ticker); D.recStatus.hidden=true; D.dlBtn.disabled=false;
    const blob=new Blob(chunks,{type:mime});
    const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`moovlog_${D.restName.value.replace(/\s/g,'_')||Date.now()}.webm`});
    a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),8000);
    toast(hasAudio?'✓ AI 음성 포함 영상 저장 완료!':'✓ 영상 저장 완료!','ok');
  };
  recorder.start(100);
  await exportRender();
  await sleep(300);
  recorder.stop();
}
async function exportRender() {
  const scenes=S.script.scenes; let si=0, ts=null;
  playSceneAudio(0, true); clearSubAnim(); S.subCharIdx=9999;
  return new Promise(resolve=>{
    const frame=now=>{
      if(!ts) ts=now;
      const sc=scenes[si], dur=sc.duration, el=(now-ts)/1000, prog=Math.min(el/dur,1);
      const TD=0.35;
      if(el>=dur-TD && si<scenes.length-1) drawTransition(si,(el-(dur-TD))/TD);
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

/* ── 뒤로가기 ────────────────────────────────────────────── */
function goBack() { pausePlay(); clearSubAnim(); D.resultWrap.hidden=true; D.makeBtn.disabled=false; }

/* ── 로딩 UI ─────────────────────────────────────────────── */
function showLoad() { D.loadWrap.hidden=false; }
function hideLoad() { D.loadWrap.hidden=true; }
function setStep(n,title,sub) {
  D.loadTitle.textContent=title||''; D.loadSub.textContent=sub||'';
  [D.ls1,D.ls2,D.ls3].forEach((el,i)=>{ el.classList.toggle('active',i===n-1); if(i<n-1) el.classList.add('done'); });
}
function doneStep(n) { const el=[D.ls1,D.ls2,D.ls3][n-1]; if(el){el.classList.remove('active');el.classList.add('done');} }
function updateAudioStatus(mode) {
  if(!D.audioStatus) return;
  D.audioStatus.innerHTML = mode==='google-tts' ? '<i class="fas fa-microphone-alt"></i> AI 음성 포함' : '<i class="fas fa-microphone"></i> 웹 음성 합성';
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
