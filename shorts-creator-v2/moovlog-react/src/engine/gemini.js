// src/engine/gemini.js
// Gemini API — visionAnalysis, generateScript (기존 script.js에서 이식)

import { useVideoStore, TEMPLATE_HINTS, HOOK_HINTS, VIRAL_TRENDS } from '../store/videoStore.js';
import { getPersonaPrompt } from './PersonaManager.js';

// API 키 관리 — 빌드 시 VITE_GEMINI_KEY 환경변수 주입 (GitHub GEMINI_KEY2 시크릿)
// 하드코딩 금지: 키가 공개 저장소에 노출되면 Google이 즉시 차단(403)
let geminiKey = import.meta.env.VITE_GEMINI_KEY || localStorage.getItem('moovlog_gemini_key') || '';

export function setGeminiKey(key) {
  if (key) geminiKey = key;
}
export function getGeminiKey() { return geminiKey; }
export function hasGeminiKey() { return !!geminiKey; }

export function getApiUrl(model, key) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key || geminiKey}`;
}

async function fetchWithTimeout(url, options, timeout = 60000) {
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

export async function apiPost(url, body, timeoutMs = 60000) {
  const r = await fetchWithTimeout(
    url,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    timeoutMs
  );
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `${r.status}`);
  }
  return r.json();
}

// ─── 모델 목록 (2026-03 v1beta 확인된 유효 모델만) ────────
// 404: preview-05-06, preview-05-20, 1.5-pro, 1.5-flash (모두 deprecated/미지원)
// 403: 누출 키 문제 (새 키 사용 시 정상 동작)
// ⚡ 병렬 그룹: 같은 그룹은 동시 요청 → 가장 빠른 응답 사용
export const TEXT_MODELS = [
  'gemini-2.5-flash',     // 최신 2.5 Flash (안정, 무료 티어)
  'gemini-2.5-pro',       // 최신 2.5 Pro (고품질)
  'gemini-2.0-flash',     // 2.0 Flash (안정, 빠름)
  'gemini-2.0-flash-lite', // 2.0 Flash Lite (초고속 폴백)
];

// ─── 순차 폴백 (기본) ─────────────────────────────────────
export async function geminiWithFallback(body) {
  let lastErr;
  for (const model of TEXT_MODELS) {
    try {
      return await apiPost(getApiUrl(model), body);
    } catch (e) {
      lastErr = e;
      console.warn(`[Gemini] ${model} 실패 → 다음 모델:`, e.message);
    }
  }
  throw lastErr || new Error('모든 Gemini 모델 실패');
}

// ─── 병렬 경쟁 (가장 빠른 모델 응답 채택) ───────────────
// Promise.any: 하나라도 성공하면 즉시 반환, 모두 실패하면 AggregateError
export async function geminiRace(body, models = TEXT_MODELS, timeoutMs = 28000) {
  if (!models.length) throw new Error('모델 목록 없음');
  const attempts = models.map(model =>
    apiPost(getApiUrl(model), body, timeoutMs)
      .then(r => ({ model, data: r }))
      .catch(e => {
        console.warn(`[Gemini 병렬] ${model} 실패:`, e.message);
        throw e;
      })
  );
  const result = await Promise.any(attempts);
  console.log(`[Gemini ✓] 채택 모델: ${result.model}`);
  return result.data;
}

// ─── 파일 → Base64 변환 (PC 전용 스마트 압축: 화질 보존 + 속도 떡상) ────
const MAX_IMG_SIZE = 1920; // Gemini Vision은 FHD급으로 내부 리사이즈 → 4K 원본 전송은 데이터 낭비
export function toB64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`'${file.name}' 파일을 읽을 수 없습니다.`));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 파싱 실패'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width: w, height: h } = img;

        if (w > MAX_IMG_SIZE || h > MAX_IMG_SIZE) {
          const ratio = Math.min(MAX_IMG_SIZE / w, MAX_IMG_SIZE / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── 비디오 → 프레임 추출 ────────────────────────────────
export function extractVideoFramesB64(file, count = 4) {
  return new Promise(resolve => {
    const vid = Object.assign(document.createElement('video'), {
      muted: true, playsInline: true, preload: 'metadata',
    });
    const url = URL.createObjectURL(file);

    const cleanup = (canvas) => {
      URL.revokeObjectURL(url);
      vid.pause();
      vid.src = '';
      vid.load();
      vid.remove();
      if (canvas) { canvas.width = 0; canvas.height = 0; }
    };

    vid.onerror = () => { cleanup(null); resolve([]); };
    vid.onloadedmetadata = () => {
      const dur = isFinite(vid.duration) ? vid.duration : 0;
      if (!dur) { cleanup(null); resolve([]); return; }
      const offscreen = document.createElement('canvas');
      offscreen.width = 640; offscreen.height = 360;
      const octx = offscreen.getContext('2d');
      const frames = [];
      const times = Array.from({ length: count }, (_, i) => dur * (i + 0.5) / count);
      const captureAt = idx => {
        if (idx >= times.length) {
          cleanup(offscreen);
          resolve(frames);
          return;
        }
        vid.currentTime = times[idx];
        vid.onseeked = () => {
          try {
            octx.drawImage(vid, 0, 0, 640, 360);
            const b64 = offscreen.toDataURL('image/jpeg', 0.82).split(',')[1];
            frames.push({ base64: b64, mimeType: 'image/jpeg' });
          } catch (_) {}
          captureAt(idx + 1);
        };
      };
      captureAt(0);
    };
    vid.src = url;
  });
}

// ─── Gemini 응답 안전 파싱 (Safety 필터 차단 체크) ──────────
function safeExtractText(data) {
  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  if (finishReason === 'SAFETY') {
    throw new Error('콘텐츠 안전성 정책에 의해 생성이 차단되었습니다. 질의를 수정해 주세요.');
  }
  if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
    console.warn(`[Gemini] finishReason: ${finishReason}`);
  }
  return candidate?.content?.parts?.[0]?.text || '';
}

// ─── STEP 1: Vision Analysis (2-pass) ────────────────────
export async function visionAnalysis(restaurantName, researchData = '') {
  const { files } = useVideoStore.getState();
  const parts = [];

  for (let i = 0; i < Math.min(files.length, 8); i++) {
    const m = files[i];
    parts.push({ text: `\n--- [원본 미디어 번호 media_idx: ${i}] ---` });
    if (m.type === 'image') {
      const b64 = await toB64(m.file);
      parts.push({ inline_data: { mime_type: m.file.type || 'image/jpeg', data: b64 } });
    } else {
      try {
        const frames = await extractVideoFramesB64(m.file, 4);
        for (const fr of frames) parts.push({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } });
      } catch (_) {}
    }
  }

  if (!parts.length) {
    return { keywords: [restaurantName, '맛집'], mood: '감성적인', per_image: [], recommended_order: [] };
  }

  // ── 1번째 패스: 기본 비주얼 분석 ──
  const prompt1 = `당신은 2026년 인스타그램 Reels · 유튜브 Shorts 알고리즘 전문 비주얼 디렉터입니다.
음식점: "${restaurantName}" / 미디어 ${parts.length}개${researchData ? `\n\n[🔍 식당 사전 인텔리전스 — 아래 정보를 참고하여, 시그니처 메뉴·USP와 가장 연관된 사진에 높은 emotional_score·foodie_score를 부여하세요]\n${researchData.slice(0, 500)}` : ''}

각 이미지:
- type: "hook"|"hero"|"detail"|"ambiance"|"process"|"wide"
- best_effect: "zoom-in"|"zoom-out"|"pan-left"|"pan-right"|"zoom-in-slow"|"float-up"
- emotional_score: 1~10
- suggested_duration: 0.5~5초
- focus: 화면에 보이는 것 핵심 포인트 1문장 (존댓말, 예: "두툼한 한우 채끝이 철판 위에 올려져 있습니다.")
- focus_coords: {"x":0.5,"y":0.5}
- viral_potential: "high"|"medium"|"low"
- is_exterior: 가게 외관·간판·건물 입구·상호명이 보이면 true, 음식·실내·기타면 false
- aesthetic_score: 0~100 (구도·밝기·색감 종합 점수. 80 이상이면 type을 "hook"으로 우선 분류)
- foodie_score: 0~10 (음식의 윤기·질감·색감 선명도. 식욕 자극 강도. 음식 아닌 씬은 null)

전체:
- keywords: 트렌딩 검색어 포함 (ex: "줄서는 집", "인생 맛집", "맛집투어")
- mood, menu, visual_hook
- recommended_order: foodie_score×0.6 + emotional_score×0.4 가중치로 내림차순 정렬 (식욕 자극 최우선)
- recommended_template: pov|reveal|viral_fast|aesthetic|mukbang|foreshadow 중 선택
- recommended_hook: viral_2026|pov|shock|question|challenge 중 선택

JSON만 반환:
{"keywords":[],"mood":"","menu":[],"visual_hook":"","recommended_order":[],"recommended_template":"reveal","recommended_hook":"viral_2026","per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":0.8,"focus":"설명","focus_coords":{"x":0.5,"y":0.45},"viral_potential":"high","is_exterior":false}]}`;

  const data1 = await geminiWithFallback({
    contents: [{ parts: [...parts, { text: prompt1 }] }],
    generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
  });
  let firstResult;
  try {
    const raw1 = safeExtractText(data1);
    const _s1 = raw1.indexOf('{'), _e1 = raw1.lastIndexOf('}');
    firstResult = JSON.parse(_s1 >= 0 && _e1 > _s1 ? raw1.slice(_s1, _e1 + 1) : raw1.replace(/```json|```/g, '').trim());
  } catch {
    firstResult = { keywords: [restaurantName], mood: '활기찬', per_image: [], recommended_order: [] };
  }

  // ── 2번째 패스: narration_hint 생성 (존댓말·정보전달) ──
  const topIdxs = (firstResult.recommended_order || []).slice(0, Math.min(5, parts.length));
  const topParts = topIdxs.length
    ? topIdxs.flatMap(idx => (parts[idx] ? [parts[idx]] : []))
    : parts.slice(0, 5);

  const focusSummary = (firstResult.per_image || [])
    .map(p => `이미지${p.idx}: ${p.focus || ''}`)
    .join('\n');

  const prompt2 = `당신은 텐션 넘치고 친근한 2030 맛집 크리에이터입니다. 친한 친구에게 찐맛집을 흥분해서 소개하듯, 자연스럽고 생동감 넘치는 구어체를 사용하세요.
음식점: "${restaurantName}"
아래 이미지들의 1차 분석 결과를 참고하여, 각 이미지에 대한 나레이션 힌트를 생성하세요.

[1차 분석 요약]
${focusSummary || '분석 없음'}

[narration_hint 규칙]
• "~요" 어미 필수 (맛있어요 / 좋아요 / 진짜예요 / 대박이에요)
• "~입니다" "~합니다" 같은 딱딱한 말투 절대 금지
• 화면에 실제 보이는 것을 구체적으로 설명 (맛·식감·비주얼·조리 장면 등)
• 자연스러운 리액션 환영 (예: '비주얼 미쳤어요!', '한 입에 반했어요', '이거 진짜 맛있어요!')
• 1문장, 15자 내외

JSON만 반환 — per_image 배열 각 항목에 narration_hint 필드만 포함:
{"per_image":[{"idx":0,"narration_hint":"두툼하게 썰어낸 한우 채끝이 달궈진 철판 위에서 익어가고 있습니다."}]}`;

  let secondResult = { per_image: [] };
  try {
    const data2 = await geminiWithFallback({
      contents: [{ parts: [...topParts, { text: prompt2 }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
    });
    const raw2 = safeExtractText(data2);
    const _s2 = raw2.indexOf('{'), _e2 = raw2.lastIndexOf('}');
    secondResult = JSON.parse(_s2 >= 0 && _e2 > _s2 ? raw2.slice(_s2, _e2 + 1) : raw2.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.warn('[visionAnalysis 2-pass] 2번째 패스 실패:', e.message);
  }

  // ── 결과 병합: narration_hint 주입 ──
  const hintMap = {};
  for (const h of (secondResult.per_image || [])) hintMap[h.idx] = h.narration_hint;
  const mergedPerImage = (firstResult.per_image || []).map(p => ({
    ...p,
    narration_hint: hintMap[p.idx] || p.focus || '',
  }));

  return { ...firstResult, per_image: mergedPerImage };
}

// ─── STEP 1.5: 식당 실시간 검색 조사 (Google Search Grounding) ─────────────
export async function researchRestaurant(restaurantName) {
  const prompt = `구글 검색을 통해 '식당명: ${restaurantName}'의 최신 블로그·인스타그램 리뷰를 조사하고, 아래 항목을 350자 이내로 요약하세요.

[필수 조사 항목]
1. 시그니처 메뉴 & 맛의 특징 (예: 육즙 가득한 수제버거, 30년 전통 간장게장)
2. 이 식당만의 USP — 경쟁 식당과 차별화된 핵심 포인트 (예: 사장님 직접 수확 재료, 특제 소스 비법)
3. 최근 3개월 리뷰 인기 키워드 TOP 3 (예: "웨이팅 2시간", "고기두께 실화", "뷰 미쳤어요")
4. 실제 방문자 꿀팁:
   - 웨이팅 팁: 평균 웨이팅 시간, 번호표·예약 가능 여부, 웨이팅 단축법 (오픈 직후 방문 등)
   - 주차 정보: 전용 주차장 여부, 인근 공영주차장, 발렛 서비스 여부
   - 품절 주의 메뉴: 조기 품절되는 메뉴명과 추천 방문 시간대
5. 분위기 및 방문 상황 (데이트, 가족 나들이, 직장인 점심 등)
6. 가격대 정보

없는 정보는 생략하고, 확인된 사실만 간결하게 요약하세요.`;

  const searchModels = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
  for (const model of searchModels) {
    try {
      const data = await apiPost(getApiUrl(model), {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.5 },
      }, 25000);
      const text = safeExtractText(data)?.trim();
      if (text && text.length > 20) {
        console.log(`[researchRestaurant ✓] ${model} 검색 성공`);
        return text;
      }
    } catch (e) {
      console.warn(`[researchRestaurant] ${model} 실패:`, e.message);
    }
  }
  return ''; // 조사 실패 시 빈 문자열 → generateScript가 gracefully skip
}

// ─── STEP 2: Script Generation ────────────────────────────
export async function generateScript(restaurantName, analysis, userPrompt = '', researchData = '') {
  const { files, selectedTemplate, selectedHook } = useVideoStore.getState();
  const pi    = analysis.per_image || [];
  const order = analysis.recommended_order?.length ? analysis.recommended_order : files.map((_, i) => i);
  const exteriorIdx = analysis.per_image?.find(p => p.is_exterior === true)?.idx;
  const exteriorInfo = exteriorIdx !== undefined
    ? `\n• [★ 외관 강제 배치] ${exteriorIdx}번 미디어가 가게 외관으로 분석되었습니다. 마지막 씬의 media_idx는 반드시 ${exteriorIdx}로 설정하세요.`
    : '';
  const imgSummary = pi.map(p =>
    `이미지${p.idx}(${p.type}/감성${p.emotional_score}점${p.is_exterior ? '/🏪외관' : ''}): 효과=${p.best_effect}, ${p.suggested_duration}s, focus="${p.focus}", narration_hint="${p.narration_hint || p.focus || ''}"`
  ).join('\n');

  const isTrend = VIRAL_TRENDS[selectedTemplate];
  const totalTarget = isTrend
    ? isTrend.durations.reduce((a, v) => a + v, 0)
    : Math.min(Math.max(files.length * 4 + 8, 30), 55);

  const imgParts = [];
  for (let i = 0; i < Math.min(files.length, 8); i++) {
    const m = files[i];
    imgParts.push({ text: `\n--- [원본 미디어 번호 media_idx: ${i}] ---` });
    if (m.type === 'image') {
      const b64 = await toB64(m.file);
      imgParts.push({ inline_data: { mime_type: m.file.type || 'image/jpeg', data: b64 } });
    } else {
      try {
        const frames = await extractVideoFramesB64(m.file, 4);
        for (const fr of frames) imgParts.push({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } });
      } catch (_) {}
    }
  }

  const trendInstruction = isTrend ? `
[🚨 바이럴 트렌드 템플릿 강제 규칙 🚨]
"${isTrend.name}" 포맷 — 정확히 ${isTrend.durations.length}개 씬, duration 배열: [${isTrend.durations.join(', ')}]
duration 1.5초 미만 씬 → narration 비우거나 단어 1~2개만.
` : '';

  const prompt = `당신은 텐션 넘치는 친근한 2030 맛집 크리에이터 "무브먼트(MOOVLOG)"입니다. 친한 친구에게 찐맛집을 신나게 소개하듯 생동감 넘치는 구어체로 나레이션을 작성하세요.
2026 릴스/쇼츠: 첫 컷 임팩트, 정보 밀도, 존댓말 나레이션, 자막 임팩트.
${trendInstruction}${getPersonaPrompt(analysis.detected_theme, analysis.mood)}

[사용자 특별 요청 사항 (★이 지시사항을 최우선으로 반영할 것★)]
${userPrompt ? userPrompt : '특별한 요청 없음. 평소체림 최고의 감성으로 작성하세요.'}
[음식점 정보]
이름: ${restaurantName} / 분위기: ${analysis.mood || '감성적인'}
메뉴: ${(analysis.menu || []).join(', ') || restaurantName}
비주얼 훅: ${analysis.visual_hook || ''}${researchData ? `\n\n[🔍 실시간 Gemini 검색 조사 — 이 식당의 실제 정보]\n${researchData}\n★ 위 조사 내용에서 이 집만의 시그니처 메뉴·맛의 비결·특별한 배경을 나레이션에 자연스럽게 녹여내세요. (단, 확인된 정보만 사용하고 없는 정보는 생략)` : ''}

[선택된 전략]
템플릿: ${TEMPLATE_HINTS[selectedTemplate] || TEMPLATE_HINTS.story}
훅: ${HOOK_HINTS[selectedHook] || HOOK_HINTS.question}

[테마 자동 인식 — researchData와 비주얼을 보고 아래 테마 중 하나를 반드시 선택, JSON에 theme/vibe_color 포함]
☕ 카페/디저트 → theme:"cafe"        vibe_color:"#F5C6D0"  (감성·부드러운 톤. 키워드: 채광, 비주얼, 인생샷)
🥩 고깃집/BBQ  → theme:"grill"       vibe_color:"#FF6B35"  (에너지·타격감 있는 톤. 키워드: 육즙, 숯불향)
🥘 한식/밥집   → theme:"hansik"      vibe_color:"#C8E6C9"  (진정성·담백한 톤. 키워드: 손맛, 든든함)
🍷 고급/양식   → theme:"premium"     vibe_color:"#E8D5B7"  (우아·전문적인 톤. 키워드: 분위기, 기념일)
🍺 술집/포차   → theme:"pub"         vibe_color:"#CE93D8"  (신나·텐션 높은 톤. 키워드: 안주, 분위기)
🦞 해산물/일식 → theme:"seafood"     vibe_color:"#80DEEA"  (깔끔·명쾌한 톤. 키워드: 신선도, 입안이 바다)
🥡 중식/가성비 → theme:"chinese"     vibe_color:"#FFF176"  (빠르고 활기찬 톤. 키워드: 양 실화, 가성비)
테마 키워드를 caption1·caption2·naration에 자연스럽게 섞어주세요.
테마별 권장 effect: cafe=zoom-out, grill=zoom-in, pub=pan-right, chinese=tilt-down 

[비주얼 컷 분석 — narration_hint를 나레이션 작성 기반으로 활용]
${imgSummary || '분석 없음'}
권장 컷 순서: [${order.join(',')}]

[★ 총 ${totalTarget}초, ${files.length}씬 구성]
씬1 발견/훅(2.5~3.5s): 강렬한 첫 비주얼 + 궁금증 유발 자막
씬2 설정/기대(3~4s): 이 곳이 특별한 이유, 분위기·비하인드
씬3 클라이맥스 전(3~4s): 대표 메뉴 등장, 텍스처·디테일
씬4 감정 피크(3~4.5s): 맛·경험 최고조 → 가장 인상적인 컷
마지막 씬 CTA(3~4s): 식당(${restaurantName})에 대한 임팩트 있는 한 줄 요약 + 시청자에게 "구독, 좋아요, 댓글"을 자연스럽게 유도하는 아웃트로 나레이션 필수 포함. caption1에 식당 이름 또는 핵심 카피, caption2에 "구독 & 좋아요 꾹!" 또는 "무브먼트 구독하기" 형태의 CTA 문구를 반드시 넣을 것. subtitle_style은 반드시 "cta"로 지정.${exteriorInfo}

[⏱ Duration 규칙 — 반드시 준수]
• 모든 씬의 duration은 2.0초 이상 4.5초 이하로 설정하세요.
• 0.5초, 1초처럼 2초 미만의 짧은 duration은 영상 로딩 전 화면이 넘어가 깜박임의 원인이 됩니다. 절대 사용 금지.
• trendInstruction의 duration 배열이 제시되더라도 2.0초 미만 값은 2.0초로 올려서 사용하세요.
• 자막 글자 수 기반 duration 가이드 (자막 다이어트 후 캡션 총 글자 수 기준):
  - 총 10자 미만 → 2.0~2.2초 (임팩트 컷, 눈에 쏙 들어오는 짧은 자막)
  - 총 10~18자 → 2.3~3.0초 (정보 전달, 시청자가 편하게 읽을 시간 확보)
  - 총 18자 이상 → 3.0~4.0초 (상세 묘사, 나레이션 호흡 맞추기)
• 비디오 소스(영상 파일)가 씬 duration보다 짧으면 자동 슬로우모션이 적용됩니다. 비디오 씬의 duration은 소스 길이의 2배를 넘지 마세요 (예: 2초 클립 → duration 최대 4초).
• 이미지 소스는 Ken Burns 효과 적용 — duration 제한 없음 (3~4.5초 권고).

[나레이션 스타일 — 담백하고 진정성 있는 현실 톤]
• '실화', '미쳤다', '대박', '기절', '폼 미쳤다' 같은 억지스러운 숏폼 과장어 절대 금지
• 호들갑 떨지 말고, 차분하지만 몰입감 있는 "진짜 맛잘알"의 현실적인 구어체를 사용하세요
• "~요" 어미로 끝내되, 과하게 친한 척하지 말고 세련된 리뷰어의 톤앤매너를 유지하세요
• 1~2문장, 각 씬 duration × 4.5글자 이하
• 단순 상황 설명("~하고 있습니다") 절대 금지. 오감(시각, 청각, 미각, 촉각)을 자극하는 디테일한 표현을 1개 이상 섞어주세요.
  (예: "혀끝에 닿자마자 녹아내리는 육향", "은은하게 배어있는 숯불향", "아삭하게 씹히는 단면")
• 화면에 실제 보이는 것을 구체적으로 설명 (narration_hint 참고)

[자막 다이어트 규칙 — ★절대 준수★]
• 메인 자막(caption1): 공백 포함 12자 이내. (예: "여긴 진짜 나만 알래", "육즙 파티🤤", "웨이팅 가치 있는 이유")
• 서브 자막(caption2): 키워드 위주 8자 이내. (예: "당장 저장각", "무조건 오픈런", "숯불향 실화")
• 마침표(.) 생략, 임팩트 이모지(🔥 ✨ 🤤 💖) 적극 활용
• 설명조 긴 문장 절대 금지 — 친구 카톡처럼 짧고 강렬하게 끊기
• 할 말이 많으면 장면을 쪼개서 자막을 나눠 배치
• subtitle_style: hook(첫 씬) | hero(클라이맥스) | cta(마지막) | minimal(여운/감성) | elegant(에세이)

[★ SNS 태그 규칙 — 반드시 준수]
naver_clip_tags : #협찬 으로 시작, 이어서 지역·음식·분위기 태그 공백 나열, 총 300자 이내
youtube_shorts_tags : 핵심 태그 5~8개 100자 이내
instagram_caption : 감성 소개 2~3줄\\n\\n#태그1 #태그2 #태그3 #태그4 #태그5 (5개 딱 맞기)
tiktok_tags : #태그 딱 5개만 공백 구분

[컷 매칭 규칙 — ★매우 중요★]
• 각 이미지를 제공할 때 앞에 "--- [원본 미디어 번호 media_idx: N] ---" 이라고 라벨을 뺙여두었습니다.
• 스크립트 씨(scene)을 구성할 때, 화면에 나가는 컷이 어떤 원본 파일인지 파악하여 라벨에 적힌 정확한 N값을 "media_idx" 필드에 적어주세요.
• 반드시 권장 컷 순서 [${order.join(',')}] 의 흐름을 따라 장면을 전개하세요.
${exteriorIdx !== undefined ? `• 가게 외관 사진(${exteriorIdx}번)은 마지막 씨에만 배치하고, 중간 씨에서는 사용하지 마세요.` : ''}

[카메라 워크 지시사항]
각 씨의 'effect' 필드에는 아래 6가지 중 미디어의 특성에 맞는 것을 하나 반드시 선택하세요:
1. zoom-in: 음식 디테일 강조 시
2. zoom-out: 전체 분위기 공개 시
3. pan-right/pan-left: 넓은 공간이나 정갈하게 놓인 음식을 훑을 때
4. tilt-up/tilt-down: 층이 쉬인 디저트나 건물 외관을 보여줄 때
★ 정적인 컷은 절대 금지! 모든 씨에 역동적인 움직임을 부여하세요. ★

[모범 나레이션 예시 (이 현실적인 톤과 길이를 똑같이 따라하세요)]
- 씬1: "요즘 이 동네에서 가장 예약하기 힘들다는 곳, 드디어 다녀왔습니다."
- 씬2: "두툼한 고기 두께 보이시나요? 숯불향이 은은하게 코를 스치는데, 굽기 전부터 기대가 되더라고요."
- 씬3: "씹을 것도 없이 부드럽게 넘어가요. 고기 본연의 진한 육향이 입안에 오래 남습니다."
- 씬4: "정갈한 밑반찬 하나하나에 정성이 듬뿍 담겨 있어서, 부모님 모시고 오기에도 참 좋은 곳이에요."
- 마지막 씬(CTA): "웨이팅이 아깝지 않은 찐맛집이었습니다! 무브먼트 구독하고 숨은 맛집 정보 계속 받아가세요. 좋아요와 댓글도 큰 힘이 됩니다!"

[릴스 최적화 자가 검증 — 최종 JSON 출력 전 스스로 채점 후 audit_report에 담기]
• Hook(후킹): 첫 씬 caption1이 2초 안에 시청자를 멈추게 하는가? (0~100점)
• Readability(가독성): 모든 caption1이 12자 이내, caption2가 8자 이내인가? (0~100점)
• Pacing(박자): 모든 duration이 2.0~4.5초 이며 글자 수 기준 가이드에 맞게 배분했는가? (0~100점)
3항목 평균 점수를 "score" 필드에, 릴스에서 터지는 이유 한 줄을 "reason" 필드에 담아서 JSON에 포함하세요.
기준 미달 항목은 즉시 수정 후 출력하세요.

[📣 마케팅 에셋 생성 — JSON에 marketing 필드 반드시 포함]
• hook_title: 클릭을 유도하는 릴스 제목. "무브먼트픽 🔥 여기 안 가면 진짜 손해", "내돈내산 솔직 후기 — 이 집 혼자 알고 싶었어" 처럼 무브먼트 퍼스널 브랜딩 + 강렬한 훅 문구를 결합할 것.
• caption: 인스타그램 본문 캡션. "저 진짜 이 집만큼은 혼자 알고 싶었는데 😅" 처럼 무브먼트 1인칭 페르소나(내돈내산 찐 추천)를 첫 문장에 넣고, 감성 2~3문장 + 방문자 액션 유도 (저장, 좋아요, 댓글). 줄바꿈은 \\n 사용.
• hashtags_30: 지역 태그 5개 + 음식 카테고리 태그 10개 + 분위기/감성 태그 5개 + 2026 트렌딩 태그 10개. 공백으로 구분, 정확히 30개.

JSON만 반환:
{"audit_report":{"score":93,"reason":"첫 컷 육즙 훅 강력, 자막 평균 9자 최적, 리드미컬한 2~3초 컷"},"title":"제목","theme":"grill","vibe_color":"#FF6B35","hashtags":"#태그","naver_clip_tags":"#협찬 #서울맛집","youtube_shorts_tags":"#맛집 #shorts","instagram_caption":"소개문\\n\\n#태그","tiktok_tags":"#맛집","marketing":{"hook_title":"이 집 안 가면 진짜 손해 🔥","caption":"인천에서 이 집 모르면 간첩이라는 말이 있어요.\\n웨이팅이 있어도 기다릴 가치 충분합니다.\\n오늘 저녁 여기 어떠세요? 💬","hashtags_30":"#인천맛집 #인천고깃집 #인천데이트 #검단맛집 #인천오픈런 #고깃집 #한우 #채끝살 #육즙맛집 #숯불구이 #소고기맛집 #구이맛집 #스테이크 #고기집 #고기맛집 #감성맛집 #분위기맛집 #데이트맛집 #오픈런 #웨이팅맛집 #2026맛집 #릴스맛집 #숏폼맛집 #떡상각 #바이럴맛집 #먹방 #맛스타그램 #오늘뭐먹지 #저장각 #맛집투어"},"scenes":[
  {"idx":0,"media_idx":2,"duration":2.2,"caption1":"육즙 폭발 🔥","caption2":"숯불향 실화","subtitle_style":"hook","subtitle_position":"center","narration":"두툼하게 썰어낸 채끝, 숯불 위에서 은은하게 피어오르는 향이 기대감을 높여요.","effect":"zoom-out"}
]}`;

  const makeReq = async url => {
    const body = {
      system_instruction: {
        parts: [{ text: "당신은 감각적이고 진정성 있는 로컬 맛집 리뷰어 '무브먼트(moovlog)'입니다. '대박', '실화', '미쳤다', '기절' 같은 작위적이고 뻔한 유튜브식 과장어를 절대 사용하지 마세요. 대신 시청자가 텍스트만 읽어도 침이 고이도록, 음식의 디테일과 식당의 분위기를 담백하고 현실감 있는 일상어로 세련되게 묘사해야 합니다." }],
      },
      contents: [{ parts: [...imgParts, { text: prompt }] }],
      generationConfig: { temperature: 0.92, responseMimeType: 'application/json' },
    };
    const data = await apiPost(url, body);
    const raw = safeExtractText(data);
    const _s = raw.indexOf('{'), _e = raw.lastIndexOf('}');
    const obj = JSON.parse(_s >= 0 && _e > _s ? raw.slice(_s, _e + 1) : raw.replace(/```json|```/g, '').trim());
    if (!Array.isArray(obj.scenes) || !obj.scenes.length) throw new Error('스크립트 오류');
    // duration 클램핑: Gemini가 짧게 주더라도 최소 2.0초 / 최대 4.5초 보장
    obj.scenes = obj.scenes.map(sc => ({
      ...sc,
      duration: Math.max(2.0, Math.min(4.5, Number(sc.duration) || 3.0)),
    }));
    return obj;
  };
  try { return await makeReq(getApiUrl('gemini-2.5-pro')); }
  catch (e) {
    console.warn('[Script] Pro → Flash 폴백:', e.message);
    return makeReq(getApiUrl('gemini-2.5-flash'));
  }
}

// ─── 블로그 포스팅 생성 ───────────────────────────────────
export async function generateBlogPost({ name, location, keywords, extra, imageFiles }) {
  const imgParts = [];
  for (const f of (imageFiles || []).slice(0, 8)) {
    if (f.type.startsWith('image/')) {
      const b64 = await toB64(f);
      imgParts.push({ inline_data: { mime_type: f.type || 'image/jpeg', data: b64 } });
    } else if (f.type.startsWith('video/')) {
      try {
        const frames = await extractVideoFramesB64(f, 4);
        for (const fr of frames) imgParts.push({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } });
      } catch (_) {}
    }
  }

  const mediaList = (imageFiles || []).map((m, i) =>
    m.type.startsWith('video/') ? `[영상 ${i + 1}]` : `[사진 ${i + 1}]`
  ).join(', ');

  const prompt = `당신은 한국에서 가장 인기 있는 맛집 블로거 "무브먼트(moovlog)"입니다.
다음 정보와 이미지를 바탕으로 네이버 블로그 포스팅을 작성해주세요.

음식점: ${name}
위치: ${location || '(이미지에서 파악)'}
첨부 파일: ${mediaList || '없음'} (총 ${(imageFiles || []).length}개)
${keywords ? `본문에 자연스럽게 녹여야 할 키워드: ${keywords}` : ''}
${extra ? `추가 지시사항: ${extra}` : ''}

[무브먼트 블로그 스타일 — 2026 네이버 상위 노출 최적화]
① 도입: 방문 동기·설레는 기대감 (친근한 구어체, 이모지 활용) → [사진 1]
② 외관·입구 소개 → [사진/영상 2]
③ 대표 메뉴 소개·메뉴판, 가격 정보 → [사진/영상 3]
④ 음식 디테일 묘사 (구체적 맛·식감·비주얼) → 추가 사진 삽입
⑤ 분위기·서비스·웨이팅 언급
⑥ 재방문 의사 + 결론 + 위치·영업시간 정보
⑦ 해시태그 (지역명 키워드 2~3개 포함, 최대 30개)

[중요 규칙]
- 첨부 파일이 있으면 본문의 적절한 위치에 [사진 N] 또는 [영상 N] 마커 반드시 삽입
- 키워드는 한 문장에 자연스럽게 (광고성 나열 금지)
- 단락 구분은 빈줄로, 구어체 사용, 이모지 적당히
- 네이버 상위 노출을 위해 첫 문단에 핵심 키워드 포함

JSON만 반환:
{
  "title": "블로그 제목 (클릭률 높은 감성 제목)",
  "body": "블로그 본문 전체 (단락마다 빈줄, [사진/영상 N] 마커 포함)",
  "naver_clip_tags": "#태그들 (300자 이내, 지역+음식 위주)",
  "youtube_shorts_tags": "#태그들 (100자 이내)",
  "instagram_caption": "소개 2~3줄\\n\\n#해시태그들 (10개)",
  "tiktok_tags": "#태그1 #태그2 #태그3 #태그4 #태그5"
}`;

  const body = {
    contents: [{ parts: [...imgParts, { text: prompt }] }],
    generationConfig: { temperature: 0.85, responseMimeType: 'application/json' },
  };

  const parseJson = raw => {
    const _s = raw.indexOf('{'), _e = raw.lastIndexOf('}');
    return JSON.parse(_s >= 0 && _e > _s ? raw.slice(_s, _e + 1) : raw.replace(/```json|```/g, '').trim());
  };
  try {
    const data = await apiPost(getApiUrl('gemini-2.5-pro'), body);
    return parseJson(safeExtractText(data));
  } catch (e) {
    console.warn('[Blog] Pro → Flash 폴백:', e.message);
    const data = await apiPost(getApiUrl('gemini-2.5-flash'), body);
    return parseJson(safeExtractText(data));
  }
}
