// src/engine/gemini.js
// Gemini API — visionAnalysis, generateScript (기존 script.js에서 이식)

import { useVideoStore, TEMPLATE_HINTS, HOOK_HINTS, VIRAL_TRENDS } from '../store/videoStore.js';

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

async function fetchWithTimeout(url, options, timeout = 30000) {
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

export async function apiPost(url, body, timeoutMs = 30000) {
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

// ─── 파일 → Base64 변환 ───────────────────────────────────
export function toB64(file) {
  return new Promise((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(r.result.split(',')[1]);
    r.onerror = fail;
    r.readAsDataURL(file);
  });
}

// ─── 비디오 → 프레임 추출 ────────────────────────────────
export function extractVideoFramesB64(file, count = 4) {
  return new Promise(resolve => {
    const vid = Object.assign(document.createElement('video'), {
      muted: true, playsInline: true, preload: 'metadata',
      crossOrigin: 'anonymous',   // CORS Tainted Canvas 방지
    });
    const url = URL.createObjectURL(file);
    vid.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
    vid.onloadedmetadata = () => {
      const dur = isFinite(vid.duration) ? vid.duration : 0;
      if (!dur) { URL.revokeObjectURL(url); resolve([]); return; }
      const offscreen = document.createElement('canvas');
      offscreen.width = 640; offscreen.height = 360;
      const octx = offscreen.getContext('2d');
      const frames = [];
      const times = Array.from({ length: count }, (_, i) => dur * (i + 0.5) / count);
      const captureAt = idx => {
        if (idx >= times.length) { URL.revokeObjectURL(url); resolve(frames); return; }
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
export async function visionAnalysis(restaurantName) {
  const { files } = useVideoStore.getState();
  const parts = [];

  for (let i = 0; i < Math.min(files.length, 8); i++) {
    const m = files[i];
    if (m.type === 'image') {
      const b64 = await toB64(m.file);
      parts.push({ inline_data: { mime_type: m.file.type || 'image/jpeg', data: b64 } });
    } else {
      try {
        const frames = await extractVideoFramesB64(m.file, 2);
        for (const fr of frames) parts.push({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } });
      } catch (_) {}
    }
  }

  if (!parts.length) {
    return { keywords: [restaurantName, '맛집'], mood: '감성적인', per_image: [], recommended_order: [] };
  }

  // ── 1번째 패스: 기본 비주얼 분석 ──
  const prompt1 = `당신은 2026년 인스타그램 Reels · 유튜브 Shorts 알고리즘 전문 비주얼 디렉터입니다.
음식점: "${restaurantName}" / 미디어 ${parts.length}개

각 이미지:
- type: "hook"|"hero"|"detail"|"ambiance"|"process"|"wide"
- best_effect: "zoom-in"|"zoom-out"|"pan-left"|"pan-right"|"zoom-in-slow"|"float-up"
- emotional_score: 1~10
- suggested_duration: 0.5~5초
- focus: 화면에 보이는 것 핵심 포인트 1문장 (존댓말, 예: "두툼한 한우 채끝이 철판 위에 올려져 있습니다.")
- focus_coords: {"x":0.5,"y":0.5}
- viral_potential: "high"|"medium"|"low"

전체:
- keywords: 트렌딩 검색어 포함 (ex: "줄서는 집", "인생 맛집", "맛집투어")
- mood, menu, visual_hook
- recommended_order: emotional_score 내림차순으로 시청자 유지율 최고 순서
- recommended_template: pov|reveal|viral_fast|aesthetic|mukbang|foreshadow 중 선택
- recommended_hook: viral_2026|pov|shock|question|challenge 중 선택

JSON만 반환:
{"keywords":[],"mood":"","menu":[],"visual_hook":"","recommended_order":[],"recommended_template":"reveal","recommended_hook":"viral_2026","per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":0.8,"focus":"설명","focus_coords":{"x":0.5,"y":0.45},"viral_potential":"high"}]}`;

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

// ─── STEP 2: Script Generation ────────────────────────────
export async function generateScript(restaurantName, analysis) {
  const { files, selectedTemplate, selectedHook } = useVideoStore.getState();
  const pi    = analysis.per_image || [];
  const order = analysis.recommended_order?.length ? analysis.recommended_order : files.map((_, i) => i);
  const imgSummary = pi.map(p =>
    `이미지${p.idx}(${p.type}/감성${p.emotional_score}점): 효과=${p.best_effect}, ${p.suggested_duration}s, focus="${p.focus}", narration_hint="${p.narration_hint || p.focus || ''}"`
  ).join('\n');

  const isTrend = VIRAL_TRENDS[selectedTemplate];
  const totalTarget = isTrend
    ? isTrend.durations.reduce((a, v) => a + v, 0)
    : Math.min(Math.max(files.length * 4 + 8, 30), 55);

  const imgParts = [];
  for (let i = 0; i < Math.min(files.length, 8); i++) {
    const m = files[i];
    if (m.type === 'image') {
      const b64 = await toB64(m.file);
      imgParts.push({ inline_data: { mime_type: m.file.type || 'image/jpeg', data: b64 } });
    } else {
      try {
        const frames = await extractVideoFramesB64(m.file, 2);
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
${trendInstruction}
[음식점 정보]
이름: ${restaurantName} / 분위기: ${analysis.mood || '감성적인'}
메뉴: ${(analysis.menu || []).join(', ') || restaurantName}
비주얼 훅: ${analysis.visual_hook || ''}

[선택된 전략]
템플릿: ${TEMPLATE_HINTS[selectedTemplate] || TEMPLATE_HINTS.story}
훅: ${HOOK_HINTS[selectedHook] || HOOK_HINTS.question}

[비주얼 컷 분석 — narration_hint를 나레이션 작성 기반으로 활용]
${imgSummary || '분석 없음'}
권장 컷 순서: [${order.join(',')}]

[★ 총 ${totalTarget}초, ${files.length}씬 구성]
씬1 발견/훅(2.5~3.5s): 강렬한 첫 비주얼 + 궁금증 유발 자막
씬2 설정/기대(3~4s): 이 곳이 특별한 이유, 분위기·비하인드
씬3 클라이맥스 전(3~4s): 대표 메뉴 등장, 텍스처·디테일
씬4 감정 피크(3~4.5s): 맛·경험 최고조 → 가장 인상적인 컷
씬N CTA(2.5~3.5s): 정보 마무리 + 위치 힌트

[나레이션 스타일 — 친근한 요체 (릴스/쇼츠 스타일)]
• 반드시 "~요" 어미로 끝낼 것 (맛있어요 / 좋아요 / 대박이에요 / 강추해요 / 진짜예요)
• 절대 금지: "~입니다" "~합니다" "~드립니다" 같은 딱딱한 아나운서 말투
• 1~2문장, 각 씬 duration × 4.5글자 이하
• 호들갑스럽고 자연스러운 리액션 대환영! (예: '와, 비주얼 미쳤어요!', '이건 무조건 드셔야 해요!', '한 입에 기절할 뻔했어요.')
• 화면에 실제 보이는 것을 구체적으로 설명 (narration_hint 참고)
• 예: "두툼하게 썰어낸 한우 채끝, 진짜 맛있어요!"
• 예: "화르르 타오르는 불향이 살아있어요. 겉은 바삭하고 속은 촉촉해요."
• 예: "여기 분위기 진짜 좋아요! 데이트하기 딱이에요."
• 예: "꼭 한 번 가보세요! 저장해두면 나중에 고마워요."

[자막 규칙 — 임팩트 극대화]
caption1: 해당 컷 핵심 내용 4~10자 (존댓말 가능, 명사형 허용)
caption2: narration 후반 감정·정보 핵심 4~10자 (없으면 빈 문자열)
subtitle_style: hook(강렬한 첫 씬) | hero(음식 클라이맥스) | cta(마지막 행동유도) | bold_drop(TikTok 스타일) | minimal(여운/감성) | elegant(에세이 스타일)

[★ SNS 태그 규칙 — 반드시 준수]
naver_clip_tags : #협찬 으로 시작, 이어서 지역·음식·분위기 태그 공백 나열, 총 300자 이내
youtube_shorts_tags : 핵심 태그 5~8개 100자 이내
instagram_caption : 감성 소개 2~3줄\\n\\n#태그1 #태그2 #태그3 #태그4 #태그5 (5개 딱 맞기)
tiktok_tags : #태그 딱 5개만 공백 구분

[컷 매칭 규칙 — ★매우 중요★]
• 각 씨(scene)에는 반드시 "media_idx" 필드를 추가하여, 이 나레이션과 자막이 원본 미디어 중 몷 번째(idx) 이미지를 보고 쓴 것인지 정확한 번호를 명시하세요.
• 반드시 권장 컷 순서 [${order.join(',')}] 의 흐름을 따라 장면을 전개하세요.

JSON만 반환:
{"title":"제목","hashtags":"#태그","naver_clip_tags":"#협찬 #서울맛집","youtube_shorts_tags":"#맛집 #shorts","instagram_caption":"소개문\\n\\n#태그","tiktok_tags":"#맛집","scenes":[
  {"idx":0,"media_idx":2,"duration":3.0,"caption1":"한우 쇠끝","caption2":"불향 살아있어요","subtitle_style":"hook","subtitle_position":"center","narration":"두툴하게 썬어낸 한우 쇠끝, 불향이 살아있어요!","effect":"zoom-out"}
]}`;

  const makeReq = async url => {
    const data = await apiPost(url, {
      contents: [{ parts: [...imgParts, { text: prompt }] }],
      generationConfig: { temperature: 0.92, responseMimeType: 'application/json' },
    });
    const raw = safeExtractText(data);
    const _s = raw.indexOf('{'), _e = raw.lastIndexOf('}');
    const obj = JSON.parse(_s >= 0 && _e > _s ? raw.slice(_s, _e + 1) : raw.replace(/```json|```/g, '').trim());
    if (!Array.isArray(obj.scenes) || !obj.scenes.length) throw new Error('스크립트 오류');
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
        const frames = await extractVideoFramesB64(f, 2);
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
