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
const CW = 720, CH = 1280;
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
  sceneList: g('sceneList'), dlBtn: g('dlBtn'),
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
  D.reBtn.addEventListener('click',     goBack);
  if (D.reBtnBottom) D.reBtnBottom.addEventListener('click', goBack);
  updateStepUI(1);
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
    S.audioBuffers = await generateAllTTS(script.scenes);
    // 어 duration을 TTS 오디오 실제 길이에 맞춤 (자막·내레이션 싱크 보정)
    for (let i = 0; i < script.scenes.length; i++) {
      const buf = S.audioBuffers[i];
      if (buf && buf.duration > script.scenes[i].duration) {
        script.scenes[i].duration = Math.ceil(buf.duration * 10) / 10 + 0.3;
      }
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
    setupPlayer();
    if (AUTO_EXPORT_ON_CREATE) {
      toast('영상 생성 완료: 자동 저장을 시작합니다', 'inf');
      setTimeout(() => { doExport(); }, 350);
    } else {
      setTimeout(startPlay, 300);
    }
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

  const prompt = `당신은 팔로워 10만+ 인스타그램 Reels 전문 PD "무브먼트(MOOVLOG)"입니다.
인천·서울·부천 맛집 채널 / 감성적이고 트렌디한 영상 스타일.

[음식점]
이름: ${restaurantName}
분위기: ${analysis.mood || '감성적인'}
메뉴: ${(analysis.menu || []).join(', ') || restaurantName}
비주얼 훅: ${analysis.visual_hook || ''}
키워드: ${(analysis.keywords || []).join(', ')}

[선택된 스타일]
콘텐츠 템플릿: ${TEMPLATE_HINTS[selectedTemplate] || TEMPLATE_HINTS.story}
오프닝 훅: ${HOOK_HINTS[selectedHook] || HOOK_HINTS.question}

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
  try { return await makeReq(getApiUrl('gemini-2.5-pro')); }
  catch (e) { console.warn('[Script] Pro → Flash 폴백:', e.message); return makeReq(getApiUrl('gemini-2.5-flash')); }
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
      console.warn(`[TTS] 씬${i + 1} 실패:`, err.message);
      failCount++;
      buffers.push(null);
    }
  }
  if (successCount === 0) {
    throw new Error(`남성 AI 보이스 생성 실패: 모든 씬 실패 — API 키를 확인하세요`);
  }
  if (failCount > 0) {
    toast(`AI 남성 보이스 ${successCount}/${scenes.length}씬 성공 (${failCount}씬은 무음 처리)`, 'warn');
  } else {
    toast(`AI 남성 보이스 ${successCount}씬 생성 완료 ✓`, 'ok');
  }
  updateAudioStatus('google-tts');
  return buffers;
}

// Charon → Fenrir → Orus 순으로 남성 보이스 시도
async function fetchGeminiTTS(text) {
  const maleVoices = ['Charon', 'Fenrir', 'Orus'];
  for (const voiceName of maleVoices) {
    try {
      const res = await fetch(getApiUrl('gemini-2.5-flash-preview-tts'), {
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
  if (!audioCtx) ensureAudio();
  const binary = atob(b64), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (mimeType?.includes('pcm')) {
    const sr = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || '24000');
    const n  = bytes.length / 2;
    if (n < 1) throw new Error('PCM 데이터 없음');
    const buf = audioCtx.createBuffer(1, n, sr);
    const ch  = buf.getChannelData(0);
    const dv  = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i < n; i++) ch[i] = dv.getInt16(i * 2, true) / 32768;
    return Promise.resolve(buf);
  }
  // WAV or other: decodeAudioData requires a copy of the buffer
  return audioCtx.decodeAudioData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
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
    console.error(`씬 ${si + 1}의 남성 나레이션 오디오가 없습니다.`);
    toast('남성 나레이션 오디오가 누락되어 재생을 중단했습니다', 'err');
    S.playing = false;
    setPlayIcon(false);
  }
}
// Web Speech 폴백 — 목소리에서 pitch=0 + 명시적 남성 탐색
function playWebSpeech(sc) {
  if (!sc?.narration) return;
  const u = new SpeechSynthesisUtterance(sc.narration);
  u.lang = 'ko-KR'; u.pitch = 0; u.rate = 0.85; u.volume = 1;
  const v = speechSynthesis.getVoices();
  // 남성 보이스만 허용. 없으면 여성 보이스로 폴백하지 않음.
  const pick = v.find(x => /male|남성/i.test(x.name) && x.lang.startsWith('ko'))
             || null;
  if (!pick) {
    toast('이 기기 브라우저에는 남성 웹 음성이 없어 무음 처리됩니다', 'inf');
    return;
  }
  u.voice = pick;
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
  // [강화1] 씬 분위기 색상 오버레이
  drawMoodOverlay(sc.subtitle_style, Math.min(prog * 3, 1));
  // [강화2] Hero 씬: 시네마틱 레터박스 + 스파클
  if (sc.subtitle_style === 'hero') {
    drawLetterbox(Math.min(prog * 4, 1));
    drawSparkles(prog);
  }
  drawSubtitle(sc, S.subAnimProg);
  if (si === 0) drawTopBadge();
}
function drawTransition(fi, t) {
  const e = ease(t);
  // [강화3] 씬 스타일별 전환 효과 4종
  const nextStyle = S.script.scenes[fi + 1]?.subtitle_style || 'detail';
  if (nextStyle === 'hero') {
    // Zoom-in 전환: hero 씬 등장 임팩트
    renderFrame(fi, 1);
    ctx.save();
    ctx.globalAlpha = e;
    ctx.translate(CW / 2, CH / 2);
    ctx.scale(0.88 + e * 0.12, 0.88 + e * 0.12);
    ctx.translate(-CW / 2, -CH / 2);
    renderFrame(fi + 1, 0);
    ctx.restore();
  } else if (nextStyle === 'hook') {
    // Slide-up 전환: 시선 강탈 훅 등장
    renderFrame(fi, 1);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, CH * (1 - e), CW, CH * e); ctx.clip();
    renderFrame(fi + 1, 0);
    ctx.restore();
  } else if (nextStyle === 'cta') {
    // Fade + scale-down: CTA 여운
    ctx.save(); renderFrame(fi, 1);
    const outScale = 1 - e * 0.05;
    ctx.save(); ctx.translate(CW/2, CH/2); ctx.scale(outScale, outScale); ctx.translate(-CW/2, -CH/2);
    ctx.globalAlpha = 1 - e; renderFrame(fi, 1); ctx.restore();
    ctx.globalAlpha = e; renderFrame(fi + 1, 0);
    ctx.restore();
  } else {
    // 기본 crossfade
    renderFrame(fi, 1);
    ctx.save(); ctx.globalAlpha = e; renderFrame(fi + 1, 0); ctx.restore();
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
      drawSubtitle(sc[i], subAnimProg);
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
  // 모바일에서 video가 일시정지 상태면 재생
  if (media.type === 'video' && media.src.paused) {
    media.src.play().catch(() => {});
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

/* ── [강화1] 씬 무드 컬러 오버레이 ──────────────────────── */
function drawMoodOverlay(style, alpha) {
  if (!alpha) return;
  const colors = {
    hook:   `rgba(255, 30, 80, ${0.07 * alpha})`,
    hero:   `rgba(255, 120, 0, ${0.06 * alpha})`,
    detail: `rgba(60, 160, 255, ${0.045 * alpha})`,
    cta:    `rgba(160, 50, 255, ${0.07 * alpha})`,
  };
  ctx.fillStyle = colors[style] || 'transparent';
  ctx.fillRect(0, 0, CW, CH);
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
    const r     = (1.5 + seed1 * 2.5) * twink;
    const a     = twink * 0.65;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 230, 120, ${a})`; ctx.fill();
    // 십자 반짝임
    ctx.strokeStyle = `rgba(255, 255, 200, ${a * 0.6})`;
    ctx.lineWidth = 0.8;
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

/* ── CapCut 스타일 공통 렌더러 ────────────────────────────────
   hlIdx: 강조할 단어 인덱스 (null = 없음)
   단어별 순차 팝인 + 오버슛 바운스 + 두꺼운 검은 스트로크
   ──────────────────────────────────────────────────────────── */
function capWords(text, cx, cy, maxSz, color, hlIdx, ap) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return;
  ctx.save();
  let sz = maxSz;
  ctx.font = `900 ${sz}px "Noto Sans KR", Impact, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let wM = words.map(w => ctx.measureText(w).width);
  const sp = () => sz * 0.28;
  const tot = () => wM.reduce((a, b) => a + b, 0) + sp() * (words.length - 1);
  // 캔버스 폭 초과 시 자동 축소
  if (tot() > CW - 56) {
    sz = Math.max(34, Math.floor(sz * (CW - 56) / tot()));
    ctx.font = `900 ${sz}px "Noto Sans KR", Impact, sans-serif`;
    wM = words.map(w => ctx.measureText(w).width);
  }
  const N  = words.length;
  const step = 0.55 / N;           // 전체 애니메이션의 55%에 모든 단어 등장
  const sw   = Math.max(sz * 0.13, 7); // 스트로크 두께
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
      // 노란 하이라이트 박스 + 검정 텍스트
      const pad = 9;
      ctx.fillStyle = '#FFE033';
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

/* ① Hook — CapCut 최대 임팩트: 첫 단어 노란 강조 */
function drawSubHook(text, pos, ap) {
  const y = pos === 'upper' ? CH * 0.22 : pos === 'center' ? CH * 0.50 : CH * 0.72;
  capWords(text, CW / 2, y, 96, '#FFFFFF', 0, ap);
}

/* ② Detail — CapCut 기본: 슬라이드업 + 흰 텍스트 */
function drawSubDetail(text, pos, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const baseY = pos === 'upper' ? CH * 0.18 : pos === 'center' ? CH * 0.50 : CH - 200;
  const y     = baseY + (1 - eased) * 30;
  capWords(text, CW / 2, y, 74, '#FFFFFF', null, ap);
}

/* ③ Hero — CapCut 대형: 마지막 단어 클라이맥스 강조 */
function drawSubHero(text, ap) {
  const eased = ease(Math.min(ap * 2.5, 1));
  const y     = CH - 188 + (1 - eased) * 24;
  const words = text.split(/\s+/).filter(Boolean);
  capWords(text, CW / 2, y, 88, '#FFFFFF', words.length - 1, ap);
}

/* ④ CTA — CapCut 노란 콜투액션 + 파워풀 바운스 */
function drawSubCTA(text, ap) {
  const eased  = ease(Math.min(ap * 2.5, 1));
  const bounce = ap < 0.4 ? Math.sin(ap * Math.PI * 2.5) * 14 : 0;
  const y      = CH - 128 + (1 - eased) * 28 - bounce;
  capWords(text, CW / 2, y, 80, '#FFE033', 0, ap);
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

  // 0. 코덱 자동 감지: MP4(H264) 우선 → WebM(VP9/VP8) 폴백
  D.dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 코덱 확인 중...';
  let fmt = null;
  // MP4 (H.264) — 모든 기기·SNS 호환
  if (typeof window.Mp4Muxer !== 'undefined') {
    for (const vc of [{ enc: 'avc1.42001f', mux: 'avc' }, { enc: 'avc1.4d001f', mux: 'avc' }]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: 8_000_000, framerate: FPS });
        if (s.supported) { fmt = { vc, MuxLib: window.Mp4Muxer, ext: 'mp4', mime: 'video/mp4', ac: { enc: 'mp4a.40.2', mux: 'aac' } }; break; }
      } catch {}
    }
    if (fmt) {
      try { const as = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 1, bitrate: 128000 }); if (!as.supported) fmt.ac = { enc: 'opus', mux: 'opus' }; } catch { fmt.ac = { enc: 'opus', mux: 'opus' }; }
    }
  }
  // WebM (VP9/VP8) 폴백
  if (!fmt && typeof window.WebmMuxer !== 'undefined') {
    for (const vc of [{ enc: 'vp09.00.41.08', mux: 'V_VP9' }, { enc: 'vp09.00.31.08', mux: 'V_VP9' }, { enc: 'vp08.00.41.08', mux: 'V_VP8' }]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: 8_000_000, framerate: FPS });
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
  });

  // 3. VideoEncoder
  const videoEnc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error:  err => { throw err; },
  });
  videoEnc.configure({ codec: fmt.vc.enc, width: CW, height: CH, bitrate: 8_000_000, framerate: FPS });

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
    audioEnc.configure({ codec: fmt.ac.enc, sampleRate: 48000, numberOfChannels: 1, bitrate: 128_000 });
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

  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
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
  if (D.sceneDots) D.sceneDots.innerHTML = '';
  if (D.snsWrap) D.snsWrap.hidden = true;
  const styleBadge = document.getElementById('autoStyleBadge');
  if (styleBadge) styleBadge.hidden = true;
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
