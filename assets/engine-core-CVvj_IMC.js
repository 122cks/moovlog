const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/engine-gemini-BCTerkaI.js","assets/vendor-DKjQ1qLu.js","assets/vendor-react-CvBl8VdO.js"])))=>i.map(i=>d[i]);
import { g as getApiUrl, u as useVideoStore, _ as __vitePreload, r as researchRestaurant, d as detectRestaurantType, v as visionAnalysis, V as VIRAL_TRENDS, a as geminiQualityCheck } from './engine-gemini-BCTerkaI.js';
import { g as generateScript } from './engine-script-Hqvxxul9.js';
import './vendor-firebase-CmLdJ1V2.js';
import { i as initializeApp, g as getStorage, a as getFirestore, b as ref, u as uploadBytes, c as getDownloadURL, d as addDoc, e as collection, f as serverTimestamp, h as updateDoc, j as doc, q as query, o as orderBy, l as limit, k as getDocs, w as where, m as deleteDoc, F as FFmpeg, t as toBlobURL, n as fetchFile } from './vendor-DKjQ1qLu.js';

const firebaseConfig = {
  apiKey: "",
  authDomain: "moovlog-be7a6.firebaseapp.com",
  projectId: "moovlog-be7a6",
  storageBucket: undefined                                             || "moovlog-be7a6.firebasestorage.app",
  messagingSenderId: "173534090692",
  appId: ""
};
let storage = null, db = null, sessionDocId = null;
function initFirebase() {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
    console.log("[Firebase] API 키 없음 — 로컬 모드");
    return false;
  }
  try {
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    db = getFirestore(app);
    console.log("[Firebase] 초기화 완료 — moovlog-be7a6");
    return true;
  } catch (e) {
    console.warn("[Firebase] 초기화 실패:", e.message);
    return false;
  }
}
async function fbUpload(blob, storagePath) {
  if (!storage) return null;
  try {
    const storRef = ref(storage, storagePath);
    const snap = await uploadBytes(storRef, blob);
    const url = await getDownloadURL(snap.ref);
    console.log("[Firebase ✓]", storagePath);
    return url;
  } catch (e) {
    console.warn("[Firebase] 업로드 실패:", e.message);
    return null;
  }
}
async function firebaseUploadOriginals(files, restaurantName, pipelineSessionId) {
  if (!storage) return;
  const session = pipelineSessionId || `${Date.now()}_${(restaurantName || "noname").replace(/\s+/g, "_")}`;
  await Promise.all(
    files.map(
      (m, i) => fbUpload(m.file, `originals/${session}/${i}_${m.file.name}`).catch((e) => console.warn(`[Firebase] 파일 ${i} 업로드 실패:`, e.message))
    )
  );
}
async function firebaseSaveSession(script, restaurantName) {
  if (!db) return;
  sessionDocId = null;
  try {
    const docRef = await addDoc(collection(db, "sessions"), {
      restaurant: restaurantName || "",
      template: "auto",
      sceneCount: script.scenes.length,
      title: script.title || "",
      version: "v2.6-react",
      videoUrl: null,
      ext: null,
      createdAt: serverTimestamp()
    });
    sessionDocId = docRef.id;
    console.log("[Firebase] 세션 저장:", sessionDocId);
  } catch (e) {
    console.warn("[Firebase] 세션 저장 실패:", e.message);
  }
}
async function firebaseUploadVideo(blob, ext, restaurantName, pipelineSessionId) {
  if (!storage || !db) return;
  const session = pipelineSessionId || `${Date.now()}_${(restaurantName || "noname").replace(/\s+/g, "_")}`;
  const url = await fbUpload(blob, `generated/${session}/video.${ext}`);
  if (!url) return;
  try {
    await addDoc(collection(db, "generations"), {
      restaurant: restaurantName || "",
      videoUrl: url,
      ext,
      version: "v2.6-react",
      createdAt: serverTimestamp()
    });
    if (sessionDocId) {
      await updateDoc(doc(db, "sessions", sessionDocId), { videoUrl: url, ext });
    }
  } catch (e) {
    console.warn("[Firebase] Firestore 기록 실패:", e.message);
  }
}
async function firebaseLoadRecentSession() {
  if (!db) return null;
  try {
    const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"), limit(5));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    let latest = null;
    snap.forEach((d) => {
      if (!latest && d.data().videoUrl) latest = { id: d.id, ...d.data() };
    });
    return latest;
  } catch (e) {
    console.warn("[Firebase] 최근 세션 로드 실패:", e.message);
    return null;
  }
}
async function saveBlogPost(blogData) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, "blog_posts"), {
      restaurant: blogData.restaurant || "",
      location: blogData.location || "",
      title: blogData.title || "",
      body: blogData.body || "",
      naverClipTags: blogData.naver_clip_tags || "",
      youtubeTags: blogData.youtube_shorts_tags || "",
      instagramCaption: blogData.instagram_caption || "",
      tiktokTags: blogData.tiktok_tags || "",
      keywords: blogData.keywords || [],
      createdAt: serverTimestamp()
    });
    console.log("[Firebase] 블로그 저장:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn("[Firebase] 블로그 저장 실패:", e.message);
    return null;
  }
}
async function getRecentBlogPosts(limitN = 20) {
  if (!db) return [];
  try {
    const q = query(collection(db, "blog_posts"), orderBy("createdAt", "desc"), limit(limitN));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((d) => results.push({ id: d.id, ...d.data() }));
    return results;
  } catch (e) {
    console.warn("[Firebase] 블로그 목록 로드 실패:", e.message);
    return [];
  }
}
async function searchBlogPosts(keyword) {
  if (!db || !keyword?.trim()) return [];
  const kw = keyword.trim();
  try {
    const q = query(
      collection(db, "blog_posts"),
      orderBy("restaurant"),
      where("restaurant", ">=", kw),
      where("restaurant", "<=", kw + ""),
      limit(30)
    );
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((d) => results.push({ id: d.id, ...d.data() }));
    return results;
  } catch (e) {
    console.warn("[Firebase] 블로그 검색 실패:", e.message);
    return [];
  }
}
async function saveSNSTags(tagsData) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, "sns_tags"), {
      restaurant: tagsData.restaurant || "",
      naverClipTags: tagsData.naver_clip_tags || "",
      youtubeTags: tagsData.youtube_shorts_tags || "",
      instagramCaption: tagsData.instagram_caption || "",
      tiktokTags: tagsData.tiktok_tags || "",
      hashtags: tagsData.hashtags || "",
      createdAt: serverTimestamp()
    });
    console.log("[Firebase] SNS 태그 저장:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn("[Firebase] SNS 태그 저장 실패:", e.message);
    return null;
  }
}
async function saveMarketingKit(data) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, "marketing_kits"), {
      restaurant: data.restaurant || "",
      hookTitle: data.hook_title || "",
      caption: data.caption || "",
      hashtags30: data.hashtags_30 || "",
      receiptReview: data.receipt_review || "",
      hookVariations: data.hook_variations || [],
      naverClipTags: data.naver_clip_tags || "",
      youtubeShortsTags: data.youtube_shorts_tags || "",
      instagramCaption: data.instagram_caption || "",
      tiktokTags: data.tiktok_tags || "",
      hashtags: data.hashtags || "",
      theme: data.theme || "",
      vibeColor: data.vibe_color || "",
      createdAt: serverTimestamp()
    });
    console.log("[Firebase] 마케팅 키트 저장:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn("[Firebase] 마케팅 키트 저장 실패:", e.message);
    return null;
  }
}
async function getMarketingKits(limitN = 20) {
  if (!db) return [];
  try {
    const q = query(collection(db, "marketing_kits"), orderBy("createdAt", "desc"), limit(limitN));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((d) => results.push({ id: d.id, ...d.data() }));
    return results;
  } catch (e) {
    console.warn("[Firebase] 마케팅 키트 목록 실패:", e.message);
    return [];
  }
}
async function searchMarketingKits(keyword) {
  if (!db || !keyword?.trim()) return [];
  const kw = keyword.trim();
  try {
    const q = query(
      collection(db, "marketing_kits"),
      orderBy("restaurant"),
      where("restaurant", ">=", kw),
      where("restaurant", "<=", kw + ""),
      limit(30)
    );
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((d) => results.push({ id: d.id, ...d.data() }));
    return results;
  } catch (e) {
    console.warn("[Firebase] 마케팅 키트 검색 실패:", e.message);
    return [];
  }
}
async function deleteMarketingKit(id) {
  if (!db || !id) return;
  try {
    await deleteDoc(doc(db, "marketing_kits", id));
    console.log("[Firebase] 마케팅 키트 삭제:", id);
  } catch (e) {
    console.warn("[Firebase] 마케팅 키트 삭제 실패:", e.message);
    throw e;
  }
}

// src/engine/PersonaManager.js
// 식당 테마에 따른 나레이션 페르소나 제어 — 톤, 단어 선택, 이모지 빈도를 자동화

const PERSONA_MAP = {
  cafe: {
    name: '감성 크리에이터',
    tone: '따뜻하고 감성적인 친구 같은 톤. 여유롭고 정감 있게.',
    emoji_frequency: 'medium', // 씬당 1~2개
    highlight_keywords: ['채광 맛집', '비주얼 맛집', '인생샷 각도', '감성 가득', '시간이 멈추는 곳'],
    narration_style: '부드러운 구어체, 여운 있는 마무리. 카페 분위기·음료 비주얼·감성 공간에 집중. ~해요 어미 선호.',
    caption_examples: ['뷰 실화 ✨', '감성 충전 ☕', '여기서 하루종일 있고 싶어요'],
    vibe_words: ['따뜻한', '감성적인', '여유로운', '예쁜'],
  },
  grill: {
    name: '육즙 탐험가 PD',
    tone: '에너지 넘치는 직접적인 맛집 PD 톤. 임팩트 있고 빠르게.',
    emoji_frequency: 'high', // 씬당 2~3개
    highlight_keywords: ['육즙 실화', '두께 보여요', '숯불향', '입에서 녹아요', '고기 마니아 필수'],
    narration_style: '빠르고 임팩트 있는 문장. 식욕 자극 오감 묘사 필수. 고기의 두께·육향·식감에 집중. ~요 어미.',
    caption_examples: ['육즙 폭발 🔥', '오픈런 각 🥩', '두께 보고 기절함'],
    vibe_words: ['강렬한', '두툼한', '짙은', '폭발하는'],
  },
  hansik: {
    name: '진정성 맛집 리뷰어',
    tone: '담백하고 진정성 있는 현실 리뷰어 톤. 속이 편한 정직함.',
    emoji_frequency: 'low', // 씬당 0~1개
    highlight_keywords: ['손맛', '정성 가득', '든든한 한 끼', '정통 레시피', '된장·간장 절임'],
    narration_style: '진솔하고 따뜻한 구어체. 음식의 깊은 맛·정성·든든함을 강조. 할머니의 손맛 느낌. ~요 어미.',
    caption_examples: ['손맛 느껴져요 🍚', '정성 한 그릇', '든든한 집밥 느낌'],
    vibe_words: ['진정성', '정직한', '깊은', '든든한'],
  },
  premium: {
    name: '파인다이닝 에디터',
    tone: '세련되고 절제된 전문 리뷰 톤. 고급스럽고 분위기 있게.',
    emoji_frequency: 'low',
    highlight_keywords: ['플레이팅 완벽', '분위기 최상급', '기념일 강추', '셰프의 시그니처', '섬세한 맛'],
    narration_style: '고급스럽고 절제된 문체. 과장 표현 자제. 공간·플레이팅·서비스를 균형 있게 묘사. ~요 어미.',
    caption_examples: ['플레이팅 예술 🍽️', '오늘의 메인', '기념일 강추 맛집'],
    vibe_words: ['우아한', '섬세한', '완성된', '고급스러운'],
  },
  pub: {
    name: '술집 불청객',
    tone: '신나고 텐션 높은 친구 같은 톤. 유쾌하고 자유롭게.',
    emoji_frequency: 'high',
    highlight_keywords: ['안주 미쳤어요', '한 잔 하고 싶어지는', '인생 안주', '분위기 넘쳐요'],
    narration_style: '활기차고 유쾌한 구어체. 안주와 분위기·사람들의 열기에 집중. ~요 어미.',
    caption_examples: ['안주 비주얼 🍻', '자리 잡자 🥂', '오늘 여기 가즈아'],
    vibe_words: ['활기찬', '텐션 터지는', '신나는', '유쾌한'],
  },
  seafood: {
    name: '해산물 전문 PD',
    tone: '깔끔하고 명쾌한 신선도 강조 톤. 청량하고 시원하게.',
    emoji_frequency: 'medium',
    highlight_keywords: ['신선도 최고', '바다 향', '입안이 바다', '활어 느낌', '싱싱함'],
    narration_style: '깔끔하고 간결한 문장. 신선도·바다 느낌·풍미를 강조. 시원시원한 톤. ~요 어미.',
    caption_examples: ['신선도 실화 🌊', '바다 한 상 🦞', '입안이 바다예요'],
    vibe_words: ['청량한', '신선한', '시원한', '싱싱한'],
  },
  chinese: {
    name: '가성비 탐험가',
    tone: '빠르고 활기차며 가성비를 강조하는 톤. 든든하고 시원하게.',
    emoji_frequency: 'medium',
    highlight_keywords: ['가성비 실화', '양 실화', '중독적인 맛', '기름지고 풍성한', '다시 오고 싶어요'],
    narration_style: '빠르고 경쾌한 구어체. 양·가성비·중독성 있는 맛을 명확히 전달. ~요 어미.',
    caption_examples: ['양 실화 🥡', '가성비 찐', '중독 주의 😋'],
    vibe_words: ['풍성한', '든든한', '중독적인', '가성비'],
  },
};

const DEFAULT_PERSONA = PERSONA_MAP.hansik;

/**
 * 테마 ID로 페르소나 객체 반환
 * @param {string|undefined} theme
 * @returns {Object}
 */
function getPersona(theme) {
  return PERSONA_MAP[theme] || DEFAULT_PERSONA;
}

/**
 * 페르소나를 Gemini 프롬프트용 텍스트 블록으로 변환
 * @param {string|undefined} theme  - 이미 감지한 테마 (없으면 '자동 감지' 모드)
 * @param {string|undefined} mood   - visionAnalysis mood
 * @returns {string}
 */
function getPersonaPrompt(theme, mood) {
  if (theme && PERSONA_MAP[theme]) {
    const p = PERSONA_MAP[theme];
    return `[🎭 페르소나 자동 적용 — 테마: ${theme}]
• 나레이터 역할: ${p.name}
• 톤&매너: ${p.tone}
• 이모지 빈도: ${p.emoji_frequency} (low=0~1개/씬, medium=1~2개/씬, high=2~3개/씬)
• 테마별 추천 키워드 (자연스럽게 녹여 쓸 것): ${p.highlight_keywords.join(', ')}
• 나레이션 스타일: ${p.narration_style}
• 자막 예시 (이 감성으로): ${p.caption_examples.join(' / ')}
• 핵심 무드 단어: ${p.vibe_words.join(', ')}`;
  }

  // 테마 미확정 시 — 비주얼에서 자동 판단 지시
  return `[🎭 페르소나 자동 감지]
• 이미지·메뉴 분석으로 식당 카테고리를 감지해 아래 페르소나 중 하나를 선택하세요:
  - cafe(카페/디저트): 감성 크리에이터 — 따뜻하고 여유로운 톤
  - grill(고깃집/BBQ): 육즙 탐험가 PD — 에너지 넘치고 임팩트 강한 톤
  - hansik(한식/밥집): 진정성 리뷰어 — 담백하고 정직한 톤
  - premium(고급/양식): 파인다이닝 에디터 — 세련되고 절제된 톤
  - pub(술집/포차): 술집 불청객 — 텐션 높고 유쾌한 톤
  - seafood(해산물/일식): 해산물 전문 PD — 청량하고 신선함 강조
  - chinese(중식/가성비): 가성비 탐험가 — 빠르고 든든함 강조
• 감지한 페르소나를 나레이션·자막 전체에 일관되게 적용하세요.
• 현재 분위기 힌트: ${mood || '분석 중'}`;
}

// src/engine/tts.js
// TTS 시스템 — Typecast 우선 + Gemini 폴백 (기존 script.js에서 이식)


// ─── AudioContext (싱글턴) ────────────────────────────────
let audioCtx = null;
let audioMixDest = null;

function ensureAudio() {
  if (audioCtx) return { audioCtx, audioMixDest };
  audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
  audioMixDest = audioCtx.createMediaStreamDestination();
  return { audioCtx, audioMixDest };
}
function getAudioCtx() { return audioCtx; }
function getAudioMixDest() { return audioMixDest; }

// ─── Typecast 키 관리 ─────────────────────────────────────
let _typeCastKeys = [];
let _tcKeyIdx = 0;

function setTypeCastKeys(keys) {
  _typeCastKeys = keys.filter(Boolean);
  _tcKeyIdx = 0;
}
function getTypeCastKey() {
  if (!_typeCastKeys.length) return '';
  return _typeCastKeys[_tcKeyIdx % _typeCastKeys.length];
}
function rotateTypeCastKey() {
  _tcKeyIdx = (_tcKeyIdx + 1) % Math.max(_typeCastKeys.length, 1);
  console.log(`[Typecast] 키 로테이션 → #${_tcKeyIdx + 1} (${_typeCastKeys.length}개 중)`);
}
function hasTypeCastKeys() { return _typeCastKeys.length > 0; }

// ─── Typecast 보이스 ID ───────────────────────────────────
let TYPECAST_VOICE_ID =
  localStorage.getItem('moovlog_typecast_voice') || 'tc_5d654ea6b5ce05000143e79b';

// ─── 유틸 ────────────────────────────────────────────────
const sleep$1 = ms => new Promise(r => setTimeout(r, ms));

async function fetchWithTimeout(url, options, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`네트워크 타임아웃 (${Math.round(timeout / 1000)}s 초과)`);
    throw e;
  } finally {
    clearTimeout(id);
  }
}

// ─── 나레이션 전처리 ─────────────────────────────────────
function preprocessNarration(text) {
  if (!text?.trim()) return '';
  return text
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[⭐🔥✨🍜📹📖📊🎬🤖💾🙏]/g, '')
    .replace(/\.{2,}/g, ',')
    .replace(/,\s*/g, ', ')
    .replace(/\.\s+([가-힣])/g, '. $1')
    .replace(/!+/g, '!')
    .replace(/진짜(?![,.])/g, '진짜, ')
    .replace(/(?<![가-힣])와(?=[^가-힣a-zA-Z]|$)/g, '와, ')
    .replace(/\.\s*/g, '.\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── Typecast TTS ─────────────────────────────────────────
async function fetchTypeCastTTS(text) {
  if (!text?.trim()) throw new Error('빈 텍스트');
  const { audioCtx: ac } = ensureAudio();
  const apiKey = getTypeCastKey();
  if (!apiKey) throw new Error('TYPECAST_401: 사용 가능한 API 키 없음');

  console.log(`[Typecast 시도] 키 #${_tcKeyIdx + 1}/${_typeCastKeys.length}`);

  const tcBody = JSON.stringify({
    actor_id: TYPECAST_VOICE_ID,
    text: text.trim(),
    lang: 'auto',
    xapi_hd: true,
    model_version: 'latest',
    xapi_audio_format: 'mp3',
    tempo: PROSODY_TEMPO[theme] ?? 1.45,
    volume: 100,
    pitch: PROSODY_PITCH[theme] ?? 0,
  });
  const tcHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };

  // 엔드포인트: 실제 typecast.ai API 도메인 우선 최신 RFC7231 시도
  let res;
  try {
    res = await fetchWithTimeout('https://typecast.ai/api/speak',
      { method: 'POST', headers: tcHeaders, body: tcBody }, 14000);
  } catch (_firstErr) {
    // 폴백: 이전 엔드포인트
    console.warn('[Typecast] 신규 엔드포인트 실패 → 구 엔드포인트 시도');
    res = await fetchWithTimeout('https://api.typecast.ai/v1/text-to-speech',
      { method: 'POST', headers: tcHeaders, body: tcBody }, 14000);
  }

  if (!res.ok) {
    const _errData = await res.json().catch(() => ({}));
    const _errMsg  = _errData?.result?.message || _errData?.error?.message || `HTTP ${res.status}`;
    // 401(인증 오류)은 즉시 키 로테이션, 429(할당량 초과)는 명시적 표기
    if (res.status === 401) throw new Error(`TYPECAST_401: ${_errMsg}`);
    if (res.status === 429) throw new Error(`TYPECAST_429: ${_errMsg}`);
    throw new Error(`TYPECAST_FAIL_${res.status}: ${_errMsg}`);
  }

  const data = await res.json();
  // speak_v2_url (polling) 또는 바로 오디오 URL
  const directUrl = data?.result?.speak_url || data?.result?.audio_download_url;
  if (directUrl && !data?.result?.speak_v2_url) {
    const audioRes = await fetchWithTimeout(directUrl, {}, 15000);
    if (!audioRes.ok) throw new Error('Typecast 직접 다운로드 실패');
    const ab = await audioRes.arrayBuffer();
    const buf = await ac.decodeAudioData(ab.slice(0));
    if (!buf || buf.duration < 0.05) throw new Error('Typecast 빈 오디오');
    console.log(`[Typecast ✓] ${buf.duration.toFixed(2)}s`);
    return buf;
  }

  const speakUrl = data?.result?.speak_v2_url || data?.result?.speak_url;
  if (!speakUrl) throw new Error(`Typecast URL 누락`);

  // Polling (0.8초 간격, 최대 30초)
  let audioUrl = null;
  for (let i = 0; i < 38; i++) {
    await sleep$1(800);
    try {
      const pollRes = await fetchWithTimeout(
        speakUrl,
        { headers: { 'Authorization': `Bearer ${apiKey}` } },
        4000
      );
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      const status   = pollData?.result?.status;
      if (status === 'DONE') { audioUrl = pollData?.result?.audio_download_url; break; }
      if (status === 'FAILED') throw new Error('Typecast 오디오 합성 실패');
    } catch (e) {
      if (e.name === 'AbortError') continue;
      throw e;
    }
  }
  if (!audioUrl) throw new Error('Typecast 전체 응답 타임아웃 (30초 초과)');

  const audioRes = await fetchWithTimeout(audioUrl, {}, 15000);
  if (!audioRes.ok) throw new Error('Typecast 오디오 다운로드 실패');
  const ab = await audioRes.arrayBuffer();
  if (ab.byteLength < 100) throw new Error('Typecast 오디오 데이터 너무 작음');
  const buf = await ac.decodeAudioData(ab.slice(0));
  if (!buf || buf.duration < 0.05) throw new Error('Typecast 빈 오디오');
  console.log(`[Typecast ✓] ${buf.duration.toFixed(2)}s — ${text.substring(0, 15)}...`);
  return buf;
}

// ─── Gemini TTS 재시도 래퍼 ──────────────────────────────
// AUDIO 모달리티를 지원하는 실제 TTS 전용 모델만 사용
// gemini-2.0-flash-exp / gemini-2.5-flash-exp / gemini-2.0-flash 는 audio 미지원 (404/400)
const TTS_CONFIG = {
  // 429(쿼타 초과) 시 다음 모델로 즉시 전환, 동일 모델 2회 재시도 포함
  models: [
    'gemini-2.5-flash-preview-tts',   // 1순위: TTS 전용 100/day 무료
    'gemini-2.5-pro-preview-tts',     // 2순위: Pro TTS (다른 쿼타)
    'gemini-2.5-flash-preview-tts',   // 3순위: flash 재시도
    'gemini-2.5-pro-preview-tts',     // 4순위: pro 재시도
  ],
  maxRetry:   4,
  retryDelay: 2000,   // 429 이외 오류 대기 (ms)
  sceneDelay: 2500,
};

// 세션 내 단일 부이스 고정 — 모든 씨 동일 남성 목소리
const _GEMINI_MALE_VOICES = ['Fenrir', 'Orus', 'Charon', 'Puck'];
const _sessionGeminiVoice = (() => {
  const stored = localStorage.getItem('moovlog_gemini_voice');
  if (stored && _GEMINI_MALE_VOICES.includes(stored)) return stored;
  const v = _GEMINI_MALE_VOICES[Math.floor(Math.random() * _GEMINI_MALE_VOICES.length)];
  localStorage.setItem('moovlog_gemini_voice', v);
  return v;
})();

async function fetchTTSWithRetry(text, sceneIdx, energyLevel = 3) {
  const { audioCtx: ac } = ensureAudio();
  let lastErr = null;
  // energy_level 1~5 → pitch semitone 조정 (-4 ~ +4)
  const energyPitch = ((energyLevel ?? 3) - 3) * 2;

  for (let attempt = 0; attempt < TTS_CONFIG.maxRetry; attempt++) {
    const model     = TTS_CONFIG.models[attempt % TTS_CONFIG.models.length];
    const voiceName = _sessionGeminiVoice;
    try {
      // 오디오 전용 모델에 직접 요청 (geminiWithFallback은 텍스트 모델만 순환)
      const r = await fetchWithTimeout(
        getApiUrl(model),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
          }),
        },
        42000   // TTS 응답은 최대 42초 대기
      );
      if (!r.ok) {
        const errJson = await r.json().catch(() => ({}));
        const errMsg  = errJson?.error?.message || `HTTP ${r.status}`;
        // 429(쿼타 초과)는 즉시 다음 모델로 전환 (retryDelay 없이)
        if (r.status === 429) {
          console.warn(`[TTS] ${model} 쿼타 초과(429) → 다음 모델로 즉시 전환`);
          lastErr = new Error(errMsg);
          continue;  // 대기 없이 다음 attempt
        }
        throw new Error(errMsg);
      }
      const data = await r.json();
      const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) throw new Error('빈 base64');

      let bytes;
      try {
        const raw = atob(b64);
        bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      } catch { throw new Error('base64 디코딩 실패'); }

      if (bytes.length < 4) throw new Error('오디오 데이터 너무 짧음');

      // WAV 헤더 없으면 RAW PCM으로 처리
      const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
      if (isWav) {
        const buf = await ac.decodeAudioData(bytes.buffer.slice(0));
        if (!buf || buf.duration < 0.05) throw new Error('빈 WAV');
        console.log(`[Gemini TTS ✓] ${model}/${voiceName} — ${buf.duration.toFixed(2)}s`);
        return buf;
      } else {
        const SR = 24000;
        const view = new DataView(bytes.buffer);
        const samples = [];
        for (let i = 0; i < bytes.length - 1; i += 2) samples.push(view.getInt16(i, true) / 32768);
        if (samples.length < 10) throw new Error('PCM 샘플 부족');
        const buf = ac.createBuffer(1, samples.length, SR);
        buf.copyToChannel(new Float32Array(samples), 0);
        console.log(`[Gemini TTS PCM ✓] ${model}/${voiceName} — ${buf.duration.toFixed(2)}s`);
        return buf;
      }
    } catch (e) {
      lastErr = e;
      if (e.message?.startsWith('TTS_403')) throw e;  // 인증 오류는 즉시 중단
      console.warn(`[TTS] 시도 ${attempt + 1}/${TTS_CONFIG.maxRetry} 실패:`, e.message);
      // abort/timeout 은 대기 후 재시도, 429는 위에서 continue로 처리됨
      if (attempt < TTS_CONFIG.maxRetry - 1) await sleep$1(TTS_CONFIG.retryDelay);
    }
  }
  throw lastErr || new Error('TTS 최종 실패');
}

// ─── Typecast 단일 씬 TTS (HTTP 코드 기반 로테이션) ─────
// 429 소진 키 임시 마킹 (60초 TTL)
const _tcExhaustedAt = new Map();
const TC_EXHAUST_TTL = 60_000;
function _isKeyExhausted(key) {
  const ts = _tcExhaustedAt.get(key);
  if (!ts) return false;
  if (Date.now() - ts > TC_EXHAUST_TTL) { _tcExhaustedAt.delete(key); return false; }
  return true;
}
function _markKeyExhausted(key) { _tcExhaustedAt.set(key, Date.now()); }
function _allKeysExhausted() {
  return _typeCastKeys.length > 0 && _typeCastKeys.every(k => _isKeyExhausted(k));
}

async function fetchTypeCastTTSWithRotation(text, theme = 'hansik', energyLevel = 3) {
  if (_allKeysExhausted()) return null; // 모든 키 429 소진 → 즉시 Gemini
  let tcBuf = null;
  const maxAttempts = _typeCastKeys.length * 2;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (_allKeysExhausted()) break;
    // 소진된 키 건너뜀
    let skip = 0;
    while (_isKeyExhausted(getTypeCastKey()) && skip < _typeCastKeys.length) {
      rotateTypeCastKey(); skip++;
    }
    if (_isKeyExhausted(getTypeCastKey())) break;
    try {
      tcBuf = await fetchTypeCastTTS(text, theme);
      break;
    } catch (e2) {
      const m2 = e2.message || '';
      if (m2.startsWith('TYPECAST_429')) {
        _markKeyExhausted(getTypeCastKey());
        rotateTypeCastKey();
        continue;
      }
      if (m2.startsWith('TYPECAST_401')) { rotateTypeCastKey(); continue; }
      // 타임아웃 → 한 번 더 같은 키로 시도
      if (m2.includes('타임아웃') || m2.includes('30초') || e2.name === 'AbortError') {
        if (attempt % 2 === 1) rotateTypeCastKey();
        continue;
      }
      // 기타 오류 → 키 로테이션 후 재시도
      rotateTypeCastKey();
    }
  }
  return tcBuf; // null이면 Gemini 폴백
}

// ─── 전체 씬 TTS 생성 (병렬 처리 + concurrency 제어) ───
async function generateAllTTS(scenes, onToast, theme = 'hansik') {
  const buffers = new Array(scenes.length).fill(null);
  let successCount = 0, failCount = 0, fatalStop = false, processedCount = 0;
  const useTypecast = hasTypeCastKeys();

  // Typecast는 API rate limit 특성상 최대 3개 동시, Gemini는 2개
  const CONCURRENCY = useTypecast ? 3 : 2;

  // 처리할 씬 인덱스만 추출
  const tasks = scenes
    .map((sc, i) => ({ sc, i }))
    .filter(({ sc }) => sc.narration?.trim());

  if (tasks.length > 0) {
    onToast?.(`🎙️ AI 보이스 생성 시작 (${tasks.length}개 씬, ${CONCURRENCY}개 병렬)`, 'inf');
  }

  // 병렬 처리 (concurrency 슬롯 제어)
  let taskIdx = 0;
  let forcedToGemini = false; // Typecast 실패 시 이후 씬 전체 Gemini → 목소리 일관성
  const worker = async () => {
    while (taskIdx < tasks.length) {
      if (fatalStop) break;
      const { sc, i } = tasks[taskIdx++];
      const text = preprocessNarration(sc.narration);
      if (!text) continue;

      try {
        let buf = null;
        if (useTypecast && !forcedToGemini) {
          buf = await fetchTypeCastTTSWithRotation(text, theme, sc.energy_level ?? 3);
          if (!buf) {
            console.warn(`[Typecast] 씬${i+1} 모든 키 소진 — 이후 씬 전체 Gemini로 전환`);
            onToast?.('Typecast 키 소진 — 이후 씬 Gemini로 생성합니다', 'inf');
            forcedToGemini = true;
            buf = await fetchTTSWithRetry(text, i, sc.energy_level ?? 3);
          }
        } else {
          buf = await fetchTTSWithRetry(text, i, sc.energy_level ?? 3);
        }
        buffers[i] = buf;
        successCount++;
      } catch (e) {
        const msg = e.message || '';
        if (msg.includes('TTS_403')) {
          fatalStop = true;
          onToast?.('AI 보이스: API 키에 TTS 권한 없음 — 무음으로 진행합니다', 'inf');
        } else {
          failCount++;
          console.warn(`[TTS] 씬${i + 1} 최종 실패:`, msg);
        }
      }
      processedCount++;
      if (!fatalStop && processedCount < tasks.length) {
        onToast?.(`🎙️ AI 보이스 ${processedCount}/${tasks.length} 완료...`, 'inf');
      }
    }
  };

  // CONCURRENCY 수만큼 worker 병렬 실행
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (!fatalStop) {
    const total = tasks.length;
    if (successCount === 0) onToast?.('AI 보이스 생성 실패 — 무음 영상으로 진행합니다', 'inf');
    else if (failCount > 0) onToast?.(`AI 보이스 ${successCount}/${total}씬 완료 (${failCount}씬 무음)`, 'inf');
    else onToast?.(`${useTypecast ? 'Typecast' : 'Gemini'} AI 보이스 ${successCount}씬 생성 완료 ✓`, 'ok');
  }

  return buffers;
}

const tts = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  TYPECAST_VOICE_ID,
  ensureAudio,
  fetchTTSWithRetry,
  fetchTypeCastTTS,
  generateAllTTS,
  getAudioCtx,
  getAudioMixDest,
  getTypeCastKey,
  hasTypeCastKeys,
  preprocessNarration,
  rotateTypeCastKey,
  setTypeCastKeys,
  sleep: sleep$1
}, Symbol.toStringTag, { value: 'Module' }));

// src/engine/utils.js

const sleep = ms => new Promise(r => setTimeout(r, ms));

function splitCaptions(text) {
  if (!text) return ['', ''];
  const clean = text.trim();
  if (clean.includes('\n')) {
    const parts = clean.split('\n').map(s => s.trim()).filter(Boolean);
    return [parts[0] || '', parts.slice(1).join(' ') || ''];
  }
  const sm = clean.match(/^(.{3,14}[.!?…]+)\s*(.{2,})$/);
  if (sm) return [sm[1], sm[2]];
  const cp = clean.split(/[,，]/);
  if (cp.length >= 2 && cp[0].trim().length >= 3)
    return [cp[0].trim(), cp.slice(1).join(',').trim()];
  const stripped = clean.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim();
  if (stripped.length <= 10) return [clean, ''];
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  const mid = Math.ceil(clean.length / 2);
  return [clean.slice(0, mid), clean.slice(mid)];
}

function formatDuration(sec) {
  const s  = Math.max(0, Math.floor(Number(sec) || 0));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p  = n => String(n).padStart(2, '0');
  return hh > 0 ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
}

function sanitizeName(name) {
  return (name || 'video').replace(/\s+/g, '_') + '_' + Date.now();
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 8000);
}

// firebaseUploadVideo는 VideoPlayer에서 직접 사용 — pipeline에서 pipelineSessionId 노출

// ─── 자막 분할 ────────────────────────────────────────────
// (utils.js에서 임포트, 기존 splitCaptions() 동일)

// ─── 파이프라인 메인 ──────────────────────────────────────
async function startMake() {
  const store = useVideoStore.getState();
  const {
    files, restaurantName, selectedTemplate,
    restaurantType, setDetectedRestaurantType,
    setPipeline, donePipelineStep, setScript,
    setAudioBuffers, setLoaded, setShowResult,
    addToast, setAutoStyleName, setTemplate, setHook,
    hidePipeline, reset, setPipelineSessionId, setAnalysis,
  } = store;

  if (!files.length) { addToast('이미지 또는 영상을 올려주세요', 'err'); return; }
  if (!restaurantName.trim()) { addToast('음식점 이름을 입력해주세요', 'err'); return; }

  const { hasGeminiKey } = await __vitePreload(async () => { const { hasGeminiKey } = await import('./engine-gemini-BCTerkaI.js').then(n => n.j);return { hasGeminiKey }},true?__vite__mapDeps([0,1,2]):void 0);
  if (!hasGeminiKey()) { addToast('Gemini API 키가 필요합니다', 'err'); return; }

  // AudioContext 초기화 (iOS 보안 정책 대응)
  const { audioCtx } = ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
  try {
    const _osc = audioCtx.createOscillator(), _gain = audioCtx.createGain();
    _gain.gain.value = 0;
    _osc.connect(_gain); _gain.connect(audioCtx.destination);
    _osc.start(0); _osc.stop(audioCtx.currentTime + 0.05);
  } catch (_) {}
  if (window.speechSynthesis) {
    const _u = new SpeechSynthesisUtterance(''); _u.volume = 0; speechSynthesis.speak(_u);
  }

  // 파이프라인 공유 sessionId — originals·video 모두 같은 폴더
  const pipelineSessionId = `${Date.now()}_${restaurantName.trim().replace(/\s+/g, '_')}`;
  setPipelineSessionId(pipelineSessionId);

  // Firebase Storage 업로드 — CORS 설정(gsutil cors set) 전까지 비활성화
  // firebaseUploadOriginals(files, restaurantName, pipelineSessionId).catch(() => {});

  // 화면 꺼짐 방지 (Wake Lock API) — 생성 중 휴대폰 꺼져도 계속 진행
  let _wakeLock = null;
  try {
    if (navigator.wakeLock) {
      _wakeLock = await navigator.wakeLock.request('screen');
      console.log('[WakeLock] 화면 잠금 방지 활성화');
    }
  } catch (_wlErr) { /* 지원 안 해도 계속 진행 */ }

  try {
    // ── STEP 1: 식당 인텔리전스 — 데이터 선행형 파이프라인 ─────────────────────
    // 💡 데이터 먼저! 식당 정보 → AI가 "어떤 사진이 핵심인지" 알고 이미지 분석에 들어갑니다
    setPipeline(1, `"${restaurantName}" 식당 인텔리전스 수집 중...`, `데이터 선행형 — Gemini가 시그니처 메뉴·USP·방문 팁을 먼저 확보합니다`);
    const researchData = await researchRestaurant(restaurantName.trim()).catch(() => '');
    if (researchData) addToast('식당 인텔리전스 확보 ✅ — 데이터 기반 시각 분석 시작', 'ok');
    donePipelineStep(1);

    // ── STEP 2: 업체 유형 분류 ────────────────────────────────────────────────
    setPipeline(2, '업체 유형 분류 중...', '음식점 유형에 맞는 파이프라인 전략을 선택합니다');
    let effectiveType = restaurantType && restaurantType !== 'auto' ? restaurantType : '';
    if (!effectiveType) {
      // 사용자가 'auto' 선택 → AI가 자동 분류
      const tempAnalysis = { keywords: [], mood: '', menu: [] };
      const detected = await detectRestaurantType(restaurantName.trim(), tempAnalysis, researchData).catch(() => 'auto');
      effectiveType = detected !== 'auto' ? detected : '';
      if (effectiveType) {
        setDetectedRestaurantType(effectiveType);
        addToast(`업체 유형 감지: ${effectiveType}`, 'inf');
      }
    } else {
      setDetectedRestaurantType(effectiveType);
    }
    donePipelineStep(2);

    // ── STEP 3: 컨텍스트 기반 Vision Analysis ─────────────────────────────────
    // 💡 식당 정보를 먼저 숙지한 AI가 "어떤 사진이 시그니처 메뉴인지" 판단하며 분석합니다
    setPipeline(3, 'AI 컨텍스트 기반 이미지 분석 중...', '식당 데이터 참고 → 시그니처 메뉴 컷 우선 선별');
    const analysis = await visionAnalysis(restaurantName.trim(), researchData, effectiveType);

    // AI 자동 스타일 선택
    const curState = useVideoStore.getState();
    const userChoseManually = curState.selectedTemplate !== 'auto';
    if (!userChoseManually && analysis.recommended_template) {
      setTemplate(analysis.recommended_template);
    }
    if (analysis.recommended_hook) setHook(analysis.recommended_hook);

    const curTemplate = useVideoStore.getState().selectedTemplate;
    const { TEMPLATE_NAMES } = await __vitePreload(async () => { const { TEMPLATE_NAMES } = await import('./engine-gemini-BCTerkaI.js').then(n => n.i);return { TEMPLATE_NAMES }},true?__vite__mapDeps([0,1,2]):void 0);
    setAutoStyleName(TEMPLATE_NAMES[curTemplate] || curTemplate);
    addToast(
      userChoseManually
        ? `수동 선택: ${TEMPLATE_NAMES[curTemplate] || curTemplate}`
        : `AI 추천: ${TEMPLATE_NAMES[curTemplate] || curTemplate}`,
      'inf'
    );
    donePipelineStep(3);
    // analysis 저장 (VideoRenderer의 focus_coords · aesthetic_score 활용)
    setAnalysis(analysis);

    // ── STEP 4: Script Generation ─────────────────────────────
    setPipeline(4, 'Instagram Reels 스토리보드 생성 중...', '훅→감성→클로즈업→CTA 내러티브 설계');
    const script = await generateScript(restaurantName.trim(), analysis, useVideoStore.getState().userPrompt, researchData, effectiveType);

    // 🚀 [1 Audio : N Video] blocks → scenes 평탄화 로직
    // AI가 blocks 형식으로 주면 시각 컷을 베고, 오디오는 첫 컷에만 연결
    if (Array.isArray(script.blocks) && script.blocks.length && !script.scenes?.length) {
      let flatScenes = [];
      let globalMediaIdx = 0;
      script.blocks.forEach((block, bIdx) => {
        const cuts = (block.video_cuts && block.video_cuts.length > 0)
          ? block.video_cuts
          : [{ duration: block.total_duration || 3.0, media_idx: block.media_idx }];
        cuts.forEach((cut, cIdx) => {
          // ⚡ [인간화 TTS 튜닝] 단일 마침표·쉼표만 제거, 느낌표·물음표·말줄임표는 보존 (억양 유지)
          let humanNarration = '';
          if (cIdx === 0 && block.narration) {
            humanNarration = block.narration
              .replace(/\.(?!\.)/g, ' ')  // 단일 마침표만 제거 (말줄임표 ... 보존)
              .replace(/,/g, ' ')          // 쉼표 제거 (숨 안 쉬고 랩하게)
              .replace(/\s{2,}/g, ' ')
              .trim();
          }
          flatScenes.push({
            ...cut,
            blockIdx:       bIdx,
            isFirstInBlock: cIdx === 0,
            media_idx:      cut.media_idx !== undefined ? cut.media_idx
                            : (block.media_idx !== undefined ? block.media_idx : globalMediaIdx++),
            caption1:          cIdx === 0 ? (block.caption || block.caption1 || '') : '',
            caption2:          cIdx === 0 ? (block.caption2 || '') : '',
            narration:         humanNarration,
            effect:            cut.effect || block.effect || 'zoom-in',
            subtitle_style:    block.subtitle_style || 'hero',
            energy_level:      block.energy_level || 3,
            retention_strategy: block.retention_strategy || 'build',
          });
        });
      });
      script.scenes = flatScenes;
      console.log(`[Pipeline] blocks 평탄화: ${script.blocks.length}블록 → ${flatScenes.length}씬`);
    }

    setScript(script);
    donePipelineStep(4);

    // ── STEP 5: TTS ─────────────────────────────────────────────────
    setPipeline(5, 'AI 남성 보이스 합성 중...', `Gemini TTS Fenrir — ${script.scenes.length}컷`);
    let audioBuffers;
    try {
      audioBuffers = await generateAllTTS(script.scenes, (msg, type) => addToast(msg, type), script.theme);
    } catch (ttsErr) {
      console.warn('[TTS] 전체 실패, 무음 진행:', ttsErr.message);
      audioBuffers = script.scenes.map(() => null);
      addToast('AI 보이스 실패: 무음 영상으로 진행합니다', 'inf');
    }

    // 오디오 길이로 씬 duration 동기화 (while 루프 — 블록 오디오 잘림 방지)
    const isTrend = VIRAL_TRENDS[useVideoStore.getState().selectedTemplate];
    // analysis.per_image 인덱스 맵 (focus_coords, aesthetic_score 씬에 주입)
    const analysisMap = {};
    for (const p of (analysis.per_image || [])) analysisMap[p.idx] = p;

    const BPM_BEAT   = 0.46875;  // 128 BPM 한 비트
    const finalScenes = [];
    let sceneIdx = 0;
    while (sceneIdx < script.scenes.length) {
      let sc      = script.scenes[sceneIdx];
      const buf   = audioBuffers[sceneIdx];
      const isBlockCut = sc.blockIdx !== undefined;

      if (isBlockCut) {
        // ── 블록 그룹: 같은 blockIdx 컷 전체를 한 번에 처리 ──
        const blockStart = sceneIdx;
        const blockIdx   = sc.blockIdx;
        while (sceneIdx < script.scenes.length && script.scenes[sceneIdx].blockIdx === blockIdx) sceneIdx++;
        const blockScenes = script.scenes.slice(blockStart, sceneIdx);
        const audioDur    = (buf && buf.duration > 0) ? buf.duration : 0;

        // 각 컷 AI 설계 duration 합산
        const rawTotal = blockScenes.reduce((sum, s) => sum + Math.max(BPM_BEAT, s.duration || BPM_BEAT), 0);
        // 필요 최소 총 길이 = audioDur + 0.1s 여백 (타이트 컷오프 방지)
        const minTotal = audioDur > 0 ? audioDur + 0.1 : rawTotal;
        const deficit  = Math.max(0, minTotal - rawTotal);

        // 각 컷 BPM 스냅
        let durations = blockScenes.map(s =>
          Math.max(BPM_BEAT, Math.round(Math.max(BPM_BEAT, s.duration || BPM_BEAT) / BPM_BEAT) * BPM_BEAT)
        );
        // deficit → 마지막 컷에 보정
        if (deficit > 0) durations[durations.length - 1] += Math.ceil(deficit / BPM_BEAT) * BPM_BEAT;

        // BPM 스냅 후에도 부족하면 재보정
        const snappedTotal = durations.reduce((s, d) => s + d, 0);
        if (audioDur > 0 && snappedTotal < audioDur + 0.1) {
          durations[durations.length - 1] += Math.ceil((audioDur + 0.1 - snappedTotal) / BPM_BEAT) * BPM_BEAT;
        }

        blockScenes.forEach((s, j) => {
          let caption1 = s.caption1, caption2 = s.caption2;
          if (!caption1?.trim()) {
            const [c1, c2] = splitCaptions(s.narration || s.subtitle || '');
            caption1 = c1; caption2 = c2;
          }
          const imgMeta = analysisMap[s.media_idx ?? (blockStart + j)] || {};
          finalScenes.push({ ...s, duration: durations[j], caption1, caption2, subtitle: caption1 || s.subtitle || '',
            focus_coords:    imgMeta.focus_coords    || null,
            aesthetic_score: imgMeta.aesthetic_score || null,
            foodie_score:    imgMeta.foodie_score    || null,
            best_start_pct:  imgMeta.best_start_pct  || 0,
          });
        });
      } else {
        // ── 일반 씬 ──
        let duration;
        if (isTrend && isTrend.durations[sceneIdx] !== undefined) {
          const trendDur = isTrend.durations[sceneIdx];
          duration = (buf && buf.duration > 0)
            ? Math.max(trendDur, Math.round((buf.duration + 0.1) * 10) / 10)
            : trendDur;
          if (!sc.effect && isTrend.effect) sc = { ...sc, effect: isTrend.effect[sceneIdx % isTrend.effect.length] };
        } else if (buf && buf.duration > 0) {
          duration = Math.max(2.0, Math.round((buf.duration + 0.1) * 10) / 10);
        } else {
          duration = Math.max(2.0, sc.duration || 3.0);
        }
        duration = Math.max(2.0, Math.round(duration / BPM_BEAT) * BPM_BEAT);

        let caption1 = sc.caption1, caption2 = sc.caption2;
        if (!caption1?.trim()) {
          const [c1, c2] = splitCaptions(sc.narration || sc.subtitle || '');
          caption1 = c1; caption2 = c2;
        }
        const imgMeta = analysisMap[sc.media_idx ?? sceneIdx] || {};
        finalScenes.push({ ...sc, duration, caption1, caption2, subtitle: caption1 || sc.subtitle || '',
          focus_coords:    imgMeta.focus_coords    || null,
          aesthetic_score: imgMeta.aesthetic_score || null,
          foodie_score:    imgMeta.foodie_score    || null,
          best_start_pct:  imgMeta.best_start_pct  || 0,
        });
        sceneIdx++;
      }
    }

    // ── 영상 우선 배치: 사용 없는 영상을 이미지 새으로 교체 (이미지 최대 35%) ──────
    {
      const videoIdxs = files.map((f, i) => f.type === 'video' ? i : -1).filter(i => i >= 0);
      if (videoIdxs.length > 0) {
        const usedVideos = new Set(finalScenes.filter(s => files[s.media_idx]?.type === 'video').map(s => s.media_idx));
        const unusedVideos = videoIdxs.filter(i => !usedVideos.has(i));
        if (unusedVideos.length > 0) {
          const maxImages = Math.ceil(finalScenes.length * 0.35);
          const imageScenes = finalScenes.reduce((acc, s, i) => { if (files[s.media_idx]?.type === 'image') acc.push(i); return acc; }, []);
          const excess = imageScenes.length - maxImages;
          if (excess > 0) {
            let pool = [...unusedVideos], swapped = 0;
            for (let i = 0; i < finalScenes.length && swapped < excess && pool.length; i++) {
              if (files[finalScenes[i].media_idx]?.type === 'image') {
                const vidIdx = pool.shift();
                const meta = analysisMap[vidIdx] || {};
                finalScenes[i] = { ...finalScenes[i], media_idx: vidIdx, best_start_pct: meta.best_start_pct || 0 };
                swapped++;
              }
            }
            if (swapped > 0) console.log(`[Pipeline] 영상 우선: ${swapped}개 이미지 사이년 → 영상으로 교체`);
          }
        }
      }
    }

    // script 업데이트
    setScript({ ...script, scenes: finalScenes });
    setAudioBuffers(audioBuffers);
    donePipelineStep(5);

    // ── STEP 6: 미디어 프리로드 ────────────────────────────────────
    setPipeline(6, '렌더링 준비 중...', '컷 배치 · 애니메이션 · 효과 적용');
    const loaded = await preloadMedia(files);
    setLoaded(loaded);
    await sleep$1(200);
    donePipelineStep(6);

    // ── STEP 7: AI 품질 검수 ──────────────────────────────────────
    setPipeline(7, 'AI 품질 검수 중...', '스크립트 흐름·금지어·CTA 점검 후 기준 미달 시 재생성');
    const latestScript = useVideoStore.getState().script;
    let qcResult = await geminiQualityCheck(latestScript, restaurantName.trim(), effectiveType).catch(() => ({ pass: true }));
    if (!qcResult.pass) {
      addToast(`품질 검수 미달 (${qcResult.total_score}/50) — 스크립트 재생성 중...`, 'inf');
      let retryCount = 0;
      while (!qcResult.pass && retryCount < 2) {
        retryCount++;
        try {
          const retryScript = await generateScript(restaurantName.trim(), analysis, useVideoStore.getState().userPrompt, researchData, effectiveType);
          // blocks→scenes 평탄화 (기존 로직 재실행)
          if (Array.isArray(retryScript.blocks) && retryScript.blocks.length && !retryScript.scenes?.length) {
            let flatScenes = [];
            let gIdx = 0;
            retryScript.blocks.forEach((block, bIdx) => {
              const cuts = (block.video_cuts?.length > 0) ? block.video_cuts : [{ duration: block.total_duration || 3.0, media_idx: block.media_idx }];
              cuts.forEach((cut, cIdx) => {
                const humanNarration = cIdx === 0 && block.narration
                  ? block.narration.replace(/\.(?!\.)/g, ' ').replace(/,/g, ' ').replace(/\s{2,}/g, ' ').trim()
                  : '';
                flatScenes.push({
                  ...cut,
                  blockIdx: bIdx, isFirstInBlock: cIdx === 0,
                  media_idx: cut.media_idx !== undefined ? cut.media_idx : (block.media_idx !== undefined ? block.media_idx : gIdx++),
                  caption1: cIdx === 0 ? (block.caption || block.caption1 || '') : '',
                  caption2: cIdx === 0 ? (block.caption2 || '') : '',
                  narration: humanNarration,
                  effect: cut.effect || block.effect || 'zoom-in',
                  subtitle_style: block.subtitle_style || 'hero',
                  energy_level: block.energy_level || 3,
                  retention_strategy: block.retention_strategy || 'build',
                });
              });
            });
            retryScript.scenes = flatScenes;
          }
          // TTS 재생성
          const retryAudioBuffers = await generateAllTTS(retryScript.scenes, () => {}, retryScript.theme).catch(() => retryScript.scenes.map(() => null));
          setScript({ ...retryScript, scenes: retryScript.scenes });
          setAudioBuffers(retryAudioBuffers);
          qcResult = await geminiQualityCheck(retryScript, restaurantName.trim(), effectiveType).catch(() => ({ pass: true }));
          if (qcResult.pass) {
            addToast(`재생성 성공 (${retryCount}차) — 품질 통과 ✅`, 'ok');
          } else {
            addToast(`재생성 ${retryCount}차 미달 (${qcResult.total_score}/50)`, 'inf');
          }
        } catch (retryErr) {
          console.warn(`[QC retry ${retryCount}] 재생성 실패:`, retryErr.message);
          break;
        }
      }
      if (!qcResult.pass) addToast('최대 재생성 횟수 초과 — 현재 스크립트로 진행합니다', 'inf');
    } else {
      addToast(`품질 검수 통과 (${qcResult.total_score}/50) ✅`, 'ok');
    }
    donePipelineStep(7);

    // Firebase 세션 저장
    firebaseSaveSession({ ...script, scenes: finalScenes }, restaurantName).catch(() => {});

    // 마케팅 키트 자동 저장 (Firebase)
    saveMarketingKit({
      restaurant:        restaurantName,
      hook_title:        script.marketing?.hook_title || '',
      caption:           script.marketing?.caption || '',
      hashtags_30:       script.marketing?.hashtags_30 || '',
      receipt_review:    script.marketing?.receipt_review || '',
      hook_variations:   script.hook_variations || [],
      naver_clip_tags:   script.naver_clip_tags || '',
      youtube_shorts_tags: script.youtube_shorts_tags || '',
      instagram_caption: script.instagram_caption || '',
      tiktok_tags:       script.tiktok_tags || '',
      hashtags:          script.hashtags || '',
      theme:             script.theme || '',
      vibe_color:        script.vibe_color || '',
    }).catch(() => {});

    await sleep$1(300);
    hidePipeline();
    setShowResult(true);

  } catch (err) {
    hidePipeline();
    console.error('[startMake]', err);
    addToast('오류: ' + (err?.message || String(err) || '알 수 없는 오류'), 'err');
  } finally {
    // Wake Lock 해제
    if (_wakeLock) { _wakeLock.release().catch(() => {}); _wakeLock = null; }
  }
}

// ─── 미디어 프리로드 (병렬) ───────────────────────────────
async function preloadMedia(files) {
  console.log(`[Preload] ${files.length}개 미디어 병렬 로드 시작`);
  const loadPromises = files.map(async (m, index) => {
    if (m.type === 'image') {
      return new Promise((resolve) => {
        const img = Object.assign(new Image(), { src: m.url });
        img.onload  = () => resolve({ type: 'image', src: img, idx: index });
        img.onerror = () => resolve({ type: 'image', src: img, idx: index, error: true });
      });
    } else {
      return new Promise((resolve) => {
        const vid = Object.assign(document.createElement('video'), {
          src: m.url, muted: true, loop: false, playsInline: true, preload: 'auto',
        });
        const timeout = setTimeout(
          () => resolve({ type: 'video', src: vid, offset: 0, idx: index }),
          5000,
        );
        vid.oncanplay = () => { clearTimeout(timeout); resolve({ type: 'video', src: vid, offset: 0, idx: index }); };
        vid.onerror   = () => { clearTimeout(timeout); vid._loadFailed = true; resolve({ type: 'video', src: vid, offset: 0, idx: index }); };
        vid.load();
      });
    }
  });
  const loaded = await Promise.all(loadPromises);
  return loaded.sort((a, b) => a.idx - b.idx);
}

// src/engine/AuthService.js
// 구글 드라이브 인증 서비스 — 자동 갱신 · 재시도 · 세션 복구 지원
// DrivePicker.jsx에서 import해서 사용. 직접 인증 로직은 여기에 집중.

const TOKEN_KEY   = 'moovlog_gdrive_token';
const EXPIRY_KEY  = 'moovlog_gdrive_expiry';
const TTL_MS      = 55 * 60 * 1000;  // 55분 (구글 Access Token 만료 60분 - 5분 여유)
const MAX_RETRY   = 3;
const RETRY_DELAY = 1200;

// ─── 토큰 저장 ─────────────────────────────────────────────
function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY,  token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + TTL_MS));
  } catch (_) { /* 시크릿 모드 등 localStorage 불가 시 무시 */ }
}

// ─── 유효 토큰 반환 (없거나 만료 시 null) ──────────────────
function loadToken() {
  try {
    const token  = localStorage.getItem(TOKEN_KEY);
    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
    if (token && Date.now() < expiry) return token;
  } catch (_) {}
  return null;
}

// ─── 토큰 삭제 ─────────────────────────────────────────────
function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch (_) {}
}

// ─── 토큰 유효 여부 확인 ───────────────────────────────────
function isTokenValid() {
  return !!loadToken();
}

// ─── 남은 유효 시간 (초 단위, 만료 시 0) ───────────────────
function getTokenTtlSec() {
  try {
    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
    return Math.max(0, Math.round((expiry - Date.now()) / 1000));
  } catch (_) { return 0; }
}

/**
 * 인증 오류 자동 재시도 래퍼
 * @param {Function} fn       - async (token: string) => result
 * @param {Function} getToken - async () => string  (새 토큰 발급 콜백)
 * @returns {Promise<any>}
 */
async function withAuthRetry(fn, getToken) {
  let token = loadToken();
  let lastErr;

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    try {
      if (!token) {
        token = await getToken();
        if (!token) throw new Error('토큰 발급 실패');
        saveToken(token);
      }
      return await fn(token);
    } catch (err) {
      lastErr = err;
      const msg = (err?.message || String(err)).toLowerCase();
      const isAuthErr = msg.includes('401') || msg.includes('403')
        || msg.includes('auth') || msg.includes('token') || msg.includes('expired');

      if (isAuthErr) {
        clearToken();
        token = null;
        console.warn(`[AuthService] 인증 오류 (시도 ${attempt + 1}/${MAX_RETRY}) → 토큰 재발급:`, err.message);
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      } else {
        throw err; // 인증 외 오류는 즉시 전파
      }
    }
  }
  throw lastErr || new Error(`[AuthService] 재시도 ${MAX_RETRY}회 한도 초과`);
}

// src/engine/VideoRenderer.js
// FFmpeg WASM 기반 영상 렌더러 — 시네마틱 LUT · Ken Burns · 전환 효과 · 자막 포함
// ⚠️ SharedArrayBuffer가 필요합니다. COOP/COEP 헤더가 설정된 환경에서만 동작합니다.


const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
// 자막용 폰트 (NotoSans KR Bold .ttf — CDN에서 최초 1회 다운로드)
const FONT_CDN_URL = 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2';
// woff2는 ffmpeg drawtext 미지원 → TTF 대안 CDN
const FONT_TTF_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansCJKkr-Bold.otf';

let ffmpegInstance = null;
let isLoading = false;

async function getFFmpeg(onLog) {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (isLoading) {
    while (isLoading) await new Promise(r => setTimeout(r, 200));
    return ffmpegInstance;
  }
  isLoading = true;
  const ff = new FFmpeg();
  if (onLog) ff.on('log', ({ message }) => onLog(message));
  await ff.load({
    coreURL: await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL: await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  ffmpegInstance = ff;
  isLoading = false;
  return ff;
}

// ─── 테마별 색감 보정 LUT 필터 ───────────────────────────
function getColorLUT(theme) {
  const LUTs = {
    cafe:    'curves=preset=vintage,eq=saturation=1.2:brightness=0.03:contrast=1.08,unsharp=3:3:0.8:3:3:0.0',
    grill:   'eq=contrast=1.1:saturation=1.5:brightness=0.02,unsharp=5:5:1.5:5:5:0.0',
    hansik:  'eq=saturation=1.15:contrast=1.08,unsharp=3:3:0.8:3:3:0.0',
    premium: 'eq=contrast=1.05:saturation=1.3:brightness=0.04,curves=preset=lighter,unsharp=5:5:1.0:5:5:0.0',
    pub:     'eq=saturation=1.4:contrast=1.15:brightness=-0.02,unsharp=3:3:0.9:3:3:0.0',
    seafood: 'eq=saturation=1.3:hue=3:brightness=0.03,unsharp=3:3:1.0:3:3:0.0',
    chinese: 'eq=saturation=1.5:contrast=1.2:brightness=-0.03,unsharp=3:3:0.8:3:3:0.0',
  };
  return LUTs[theme] || LUTs.hansik;
}

// ─── 비디오용 마스터 필터 (색감 + Flash 전환) ────────────
function getVideoFilter(scene, theme, dur, isLastScene, sceneIndex = 0) {
  const f = [];

  // 기본 해상도 / 크롭
  f.push('scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1');
  // ★ Freeze Frame
  f.push('tpad=stop_mode=clone:stop_duration=5');
  
  // 색감 LUT
  f.push(getColorLUT(theme));
  // ★ 업스케일러: 선명도 강화 + 노이즈 감소
  f.push('unsharp=5:5:1.0:5:5:0.0,hqdn3d=1.5:1.5:4.5:4.5');
  // 필름 그레인 텍스처 (uniform noise — 디지털 날것 느낌 제거)
  f.push('noise=alls=8:allf=u');
  
  // 첫 씬 제외: 짧은 컷 화이트 플래시 / 긴 컷 블랙 페이드인
  if (sceneIndex > 0) {
    if (dur < 1.0) {
      f.push('fade=t=in:st=0:d=0.15:color=white');
    } else {
      f.push('fade=t=in:st=0:d=0.2:color=black');
    }
  }

  // 마지막 씩에만 블랙 아웃 (눈 피로 방지)
  if (isLastScene && dur >= 0.6) {
    f.push(`fade=t=out:st=${(dur - 0.5).toFixed(3)}:d=0.5:color=black`);
  } else if (isLastScene) {
    f.push(`fade=t=out:st=0:d=${dur.toFixed(3)}:color=black`);
  }
  return f.join(',');
}

// ─── 이미지용 마스터 필터 (Ken Burns + 색감 + Flash 전환) ─
function getImageFilter(scene, theme, dur, fps, focusCoords, isLastScene, sceneIndex = 0) {
  const f = [];
  const frames = Math.ceil(dur * fps);
  const cx = (focusCoords?.x ?? 0.5).toFixed(4);
  const cy = (focusCoords?.y ?? 0.45).toFixed(4);

  // Ken Burns: 1440x2560으로 업스케일 후 zoompan으로 720x1280 출력
  f.push('scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560');
  
  if (scene.type === 'hook') {
    // 훅 씬: 초반 임팩트 줌 — 최대 1.1배로 제한하여 음식 전체 샷 유지
    f.push(`zoompan=z='if(lte(on,10),1.1,min(zoom+0.0005,1.1))':d=${frames}:x='iw*${cx}-ow/zoom/2':y='ih*${cy}-oh/zoom/2':s=720x1280:fps=${fps}`);
  } else {
    // 일반 씬: 아주 미세하게 움직여 정지 화면 느낌 방지, 전체 샷 보존
    f.push(`zoompan=z='min(zoom+0.0002,1.1)':d=${frames}:x='iw*${cx}-ow/zoom/2':y='ih*${cy}-oh/zoom/2':s=720x1280:fps=${fps}`);
  }
  
  // 색감 LUT
  f.push(getColorLUT(theme));
  // 선명도 향상
  f.push('unsharp=3:3:1.0:3:3:0.0');
  // 필름 그레인 텍스처 (uniform noise)
  f.push('noise=alls=8:allf=u');
  f.push('setsar=1');

  // 첫 씬 제외: 짧은 컷 화이트 플래시 / 긴 컷 블랙 페이드인
  if (sceneIndex > 0) {
    if (dur < 1.0) {
      f.push('fade=t=in:st=0:d=0.15:color=white');
    } else {
      f.push('fade=t=in:st=0:d=0.2:color=black');
    }
  }

  // 마지막 씬에만 블랙 페이드아웃
  if (isLastScene && dur >= 0.6) {
    f.push(`fade=t=out:st=${(dur - 0.5).toFixed(3)}:d=0.5:color=black`);
  } else if (isLastScene) {
    f.push(`fade=t=out:st=0:d=${dur.toFixed(3)}:color=black`);
  }
  return f.join(',');
}

// ─── 자막 오버레이 필터 (fontPath 있을 때만) ─────────────
function getSubtitleFilter(scene, fontPath, isLastScene) {
  if (!fontPath || !scene.caption1) return null;
  const platform = useVideoStore.getState().targetPlatform || 'reels';
  
  // 특수문자 이스케이프 (ffmpeg drawtext)
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
  const fp = fontPath.replace(/\\/g, '/');
  
  // 9번: 플랫폼 버튼 높이에 따른 Y좌표 절대 방어 (틱톡은 더 높게)
  const bottomMargin = platform === 'tiktok' ? 580 : platform === 'shorts' ? 400 : 500;
  const safeY = 1280 - bottomMargin; 

  const filters = [];
  filters.push(`drawbox=y=${safeY - 40}:color=black@0.65:width=iw:height=200:t=fill`); // 다이내믹 섀도우 반영
  filters.push(`drawtext=fontfile='${fp}':text='${esc(scene.caption1.replace(/\*\*/g, ''))}':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=${safeY}`);

  // 12번: 마지막 씬(구독 유도)일 경우 커다란 CTA 이모지 팝업 애니메이션 
  if (isLastScene) {
    filters.push(`drawtext=fontfile='${fp}':text='💖':fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t,0.5,5)'`);
  }
  return filters.join(',');
}

/**
 * FFmpeg WASM으로 씬 배열을 720×1280 MP4로 합성
 * v2.19: 테마 LUT · Ken Burns · White Flash 전환 · 블랙 페이드아웃 · 자막 · 진행률
 *
 * @param {Array}    scenes      - script.scenes 배열 (focus_coords 포함)
 * @param {Array}    files       - videoStore.files [{file, url, type}]
 * @param {Object}   script      - 전체 스크립트 ({theme, vibe_color, ...})
 * @param {Function} onProgress  - (msg: string, pct: number) => void
 * @returns {Blob} 최종 video/mp4 Blob
 */
/**
 * aesthetic_score 기준 베스트 프레임을 Canvas로 추출하여 Blob 반환
 * FFmpeg 없이 프론트엔드 Canvas API만 사용 (빠름 + 디바이스 지원)
 */
async function extractThumbnail(scenes, files, script, onProgress) {
  onProgress?.('썸네일 프레임 선정 중...');

  // aesthetic_score 가장 높은 씬 찾기
  let bestIdx = 0, bestScore = -1;
  (scenes || []).forEach((sc, i) => {
    const score = sc.aesthetic_score ?? sc.foodie_score ?? 0;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });

  const scene    = scenes[bestIdx];
  const fileIdx  = scene?.media_idx ?? bestIdx;
  const fileItem = files?.[fileIdx] ?? files?.[0];
  if (!fileItem) throw new Error('썸네일용 파일 없음');

  const canvas  = document.createElement('canvas');
  canvas.width  = 720;
  canvas.height = 1280;
  const ctx     = canvas.getContext('2d');

  if (fileItem.type === 'image') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = fileItem.url; });
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const sw = img.width * scale, sh = img.height * scale;
    ctx.drawImage(img, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
  } else {
    // 비디오: best_start_pct 시점으로 Seek
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = fileItem.url;
    video.muted = true;
    await new Promise(res => { video.onloadedmetadata = res; video.load(); });
    const seekTo = (scene?.best_start_pct ?? 0.25) * video.duration;
    video.currentTime = Math.max(0, Math.min(seekTo, video.duration - 0.1));
    await new Promise(res => { video.onseeked = res; });
    const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    const sw = video.videoWidth * scale, sh = video.videoHeight * scale;
    ctx.drawImage(video, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
  }

  // 자막 레이어 (미리보기용)
  if (scene?.caption1) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, canvas.height - 340, canvas.width, 180);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scene.caption1.substring(0, 14), canvas.width / 2, canvas.height - 278);
    if (scene?.caption2) {
      ctx.fillStyle = script?.vibe_color || '#FFEA00';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(scene.caption2.substring(0, 10), canvas.width / 2, canvas.height - 208);
    }
  }

  onProgress?.(`씬 ${bestIdx + 1}번 썸네일 완료 (aesthetic ${bestScore})`);
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('Blob 변환 실패')), 'image/jpeg', 0.92)
  );
}

async function renderVideoWithFFmpeg(scenes, files, script, onProgress) {
  const report = (msg, pct) => {
    console.log('[FFmpeg]', msg);
    onProgress?.(msg, typeof pct === 'number' ? pct : undefined);
  };
  const theme = script?.theme || 'hansik';
  const FPS   = 25;

  report('FFmpeg 엔진 로딩 중... (최초 1회, 약 20~40초 소요)', 0);
  const ff = await getFFmpeg((logMsg) => {
    if (logMsg.includes('frame=') || logMsg.includes('time=')) report(logMsg);
  });

  // ── 자막 폰트 로딩 시도 ────────────────────────────────
  let fontPath = null;
  try {
    report('자막 폰트 로딩 중...', 2);
    const fontData = await fetchFile(FONT_TTF_URL);
    await ff.writeFile('subtitle_font.otf', fontData);
    fontPath = 'subtitle_font.otf';
    report('자막 폰트 로드 완료 ✓', 4);
  } catch (e) {
    console.warn('[FFmpeg] 폰트 로딩 실패 — 자막 없이 진행:', e.message);
  }

  const partFiles = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene      = scenes[i];
    const fileItem   = files[scene.media_idx ?? i] ?? files[i];
    if (!fileItem) continue;

    const pct = Math.round(5 + (i / scenes.length) * 80);
    report(`씬 ${i + 1}/${scenes.length} 인코딩 중...`, pct);

    const isVideo    = fileItem.type === 'video';
    const ext        = isVideo ? 'mp4' : 'jpg';
    const inputName  = `in_${i}.${ext}`;
    const outputName = `part_${i}.mp4`;
    // 블록 분리형 짧은 컷(0.5초 등)는 AI 설계 duration 보존
    const dur        = (scene.blockIdx !== undefined)
      ? Math.max(0.4, scene.duration || 0.5)
      : Math.max(2.0, scene.duration || 3.0);
    const isLast     = (i === scenes.length - 1);

    // 파일 가상 FS 기록
    const fileData = fileItem.file
      ? await fetchFile(fileItem.file)
      : await fetchFile(fileItem.url);
    await ff.writeFile(inputName, fileData);

    // 필터 체인 구성 (씬 인덱스 i 전달 → 트랜지션 효과)
    const focusCoords = scene.focus_coords || null;
    let vf = isVideo
      ? getVideoFilter(scene, theme, dur, isLast, i)
      : getImageFilter(scene, theme, dur, FPS, focusCoords, isLast, i);

    // 자막 오버레이 (폰트 로드 성공 시)
    const subtitleF = getSubtitleFilter(scene, fontPath, isLast);
    if (subtitleF) vf = vf + ',' + subtitleF;

    const inputLoopArgs = isVideo ? [] : ['-loop', '1'];
    const ssArgs = (isVideo && scene.best_start_pct > 0)
      ? ['-ss', (scene.best_start_pct * Math.max(dur * 2, 5)).toFixed(2)]
      : [];
    try {
      await ff.exec([
        ...inputLoopArgs,
        ...ssArgs,
        '-i', inputName,
        '-t', String(dur),
        '-vf', vf,
        '-r', String(FPS),
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26',
        '-pix_fmt', 'yuv420p', '-an',
        outputName,
      ]);
      partFiles.push(outputName);
    } catch (sceneErr) {
      console.warn(`[FFmpeg] 씬 ${i + 1} 인코딩 실패 — 건너뜁니다:`, sceneErr.message);
    }
    await ff.deleteFile(inputName).catch(() => {});
  }

  if (!partFiles.length) throw new Error('렌더링할 씬이 없습니다');

  // ── 씬 이어붙이기 ─────────────────────────────────────
  report('씬 합치는 중...', 88);
  const concatContent = partFiles.map(f => `file '${f}'`).join('\n');
  await ff.writeFile('concat.txt', new TextEncoder().encode(concatContent));

  await ff.exec([
    '-f', 'concat', '-safe', '0',
    '-i', 'concat.txt',
    '-c', 'copy',
    'output.mp4',
  ]);

  report('최종 파일 읽는 중...', 96);
  const data = await ff.readFile('output.mp4');
  report('✅ 렌더링 완료!', 100);

  // 임시 파일 정리
  for (const f of partFiles) ff.deleteFile(f).catch(() => {});
  ff.deleteFile('concat.txt').catch(() => {});
  ff.deleteFile('output.mp4').catch(() => {});
  if (fontPath) ff.deleteFile(fontPath).catch(() => {});

  return new Blob([data.buffer], { type: 'video/mp4' });
}

/**
 * 시네마틱 마감 주의 함수 — WebCodecs 원본에 LUT 입혀 최고화
 */
async function renderCinematicFinish(blob, theme, onProgress) {
  const ff = await getFFmpeg();
  onProgress?.('시네마틱 마감 처리 중...', 10);
  await ff.writeFile('raw_input.mp4', await fetchFile(blob));
  const lut = getColorLUT(theme || 'hansik');
  await ff.exec([
    '-i', 'raw_input.mp4',
    '-vf', `${lut},unsharp=3:3:1.0:3:3:0.0`,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22',
    '-c:a', 'copy',
    'cinematic_out.mp4',
  ]);
  onProgress?.('완료!', 100);
  const data = await ff.readFile('cinematic_out.mp4');
  ff.deleteFile('raw_input.mp4').catch(() => {});
  ff.deleteFile('cinematic_out.mp4').catch(() => {});
  return new Blob([data.buffer], { type: 'video/mp4' });
}

// src/engine/mediaPreprocess.js
// 미디어 파일 전처리 — MIME 타입 검출 + 동영상 720p 다운스케일
// 용량이 큰 영상(>50MB 또는 해상도 1280p 초과)을 WebM VP9로 변환하여 FFmpeg RAM 부족 방지

const V_EXT = new Set(['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', 'hevc']);
const I_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif', 'avif']);

const DOWNSCALE_THRESH_BYTES = 50 * 1024 * 1024; // 50MB 이상만 변환 시도
const DOWNSCALE_MAX_SIDE     = 1280; // portrait 720p 기준

/** MIME 타입 + 확장자 기반 미디어 타입 검출 ('video'|'image'|null) */
function detectMediaType(file) {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  const ext = (file.name || '').split('.').pop().toLowerCase();
  if (V_EXT.has(ext)) return 'video';
  if (I_EXT.has(ext)) return 'image';
  return null;
}

/** 동영상 해상도 반환 (실패 시 null) */
function getVideoDimensions(file) {
  return new Promise(resolve => {
    const vid = document.createElement('video');
    const url = URL.createObjectURL(file);
    const timer = setTimeout(() => { URL.revokeObjectURL(url); resolve(null); }, 6000);
    vid.onloadedmetadata = () => {
      clearTimeout(timer);
      const r = { w: vid.videoWidth, h: vid.videoHeight };
      URL.revokeObjectURL(url);
      resolve(r.w && r.h ? r : null);
    };
    vid.onerror = () => { clearTimeout(timer); URL.revokeObjectURL(url); resolve(null); };
    vid.muted = true; vid.playsInline = true; vid.preload = 'metadata';
    vid.src = url;
  });
}

/** 동영상을 canvas + MediaRecorder로 720p WebM으로 다운스케일 */
function downscaleVideo(file, { w, h }) {
  return new Promise(resolve => {
    const scale = DOWNSCALE_MAX_SIDE / Math.max(w, h);
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);

    // 지원 mimeType 탐색
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find(m => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } });
    if (!mimeType) { resolve(file); return; } // 브라우저 미지원 → 원본

    const canvas = document.createElement('canvas');
    canvas.width = tw; canvas.height = th;
    const ctx = canvas.getContext('2d');

    const vid = document.createElement('video');
    const srcUrl = URL.createObjectURL(file);
    const chunks = [];

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });

    recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      try { stream.getTracks().forEach(t => t.stop()); } catch {}
      URL.revokeObjectURL(srcUrl);
      const blob = new Blob(chunks, { type: 'video/webm' });
      // 결과가 오히려 더 크면 원본 반환
      const out = blob.size < file.size * 0.95
        ? new File([blob], file.name.replace(/\.[^.]+$/, '.webm'), { type: 'video/webm' })
        : file;
      resolve(out);
    };
    recorder.onerror = () => { URL.revokeObjectURL(srcUrl); resolve(file); };

    // 3분 safety timeout
    const safety = setTimeout(() => { try { recorder.stop(); } catch {} }, 180_000);

    vid.muted = true; vid.playsInline = true;
    vid.ontimeupdate = () => { ctx.drawImage(vid, 0, 0, tw, th); };
    vid.onended = () => {
      clearTimeout(safety);
      ctx.drawImage(vid, 0, 0, tw, th);
      try { recorder.stop(); } catch {}
    };
    vid.onerror = () => { clearTimeout(safety); URL.revokeObjectURL(srcUrl); resolve(file); };
    vid.onloadedmetadata = () => {
      recorder.start(500);
      vid.play().catch(() => { try { recorder.stop(); } catch {} resolve(file); });
    };
    vid.src = srcUrl;
  });
}

/**
 * 필요 시 동영상을 720p로 다운스케일 반환
 * - 50MB 미만이거나 이미 1280px 이하이면 원본 그대로 반환
 */
async function downscaleVideoIfNeeded(file) {
  if (file.size < DOWNSCALE_THRESH_BYTES) return file;
  if (!window.MediaRecorder) return file;
  const dims = await getVideoDimensions(file);
  if (!dims || Math.max(dims.w, dims.h) <= DOWNSCALE_MAX_SIDE) return file;
  return downscaleVideo(file, dims);
}

/**
 * 파일 배열 전처리 — MIME 검출 + 비디오 다운스케일
 * @param {File[]} fileList
 * @param {(msg:string)=>void} [onProgress]
 * @returns {Promise<{file: File, mediaType: 'video'|'image'}[]>}
 */
async function preprocessMediaFiles(fileList, onProgress) {
  const results = [];
  const arr = [...fileList];
  for (let i = 0; i < arr.length; i++) {
    const f = arr[i];
    const mediaType = detectMediaType(f);
    if (!mediaType) continue;

    let processed = f;
    if (mediaType === 'video' && f.size >= DOWNSCALE_THRESH_BYTES) {
      onProgress?.(`영상 최적화 중 (${i + 1}/${arr.length})...`);
      processed = await downscaleVideoIfNeeded(f);
    }
    results.push({ file: processed, mediaType });
  }
  return results;
}

const mediaPreprocess = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  detectMediaType,
  downscaleVideoIfNeeded,
  preprocessMediaFiles
}, Symbol.toStringTag, { value: 'Module' }));

export { initFirebase as A, tts as B, mediaPreprocess as C, searchMarketingKits as a, getMarketingKits as b, clearToken as c, setTypeCastKeys as d, startMake as e, getAudioCtx as f, getPersonaPrompt as g, hasTypeCastKeys as h, fetchTypeCastTTS as i, fetchTTSWithRetry as j, formatDuration as k, loadToken as l, downloadBlob as m, sanitizeName as n, extractThumbnail as o, preprocessNarration as p, renderCinematicFinish as q, rotateTypeCastKey as r, saveToken as s, renderVideoWithFFmpeg as t, firebaseUploadVideo as u, deleteMarketingKit as v, saveBlogPost as w, saveSNSTags as x, searchBlogPosts as y, getRecentBlogPosts as z };
