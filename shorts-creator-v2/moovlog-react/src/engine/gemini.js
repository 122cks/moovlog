// src/engine/gemini.js
// Gemini API — visionAnalysis, generateScript (기존 script.js에서 이식)

import { useVideoStore, TEMPLATE_HINTS, HOOK_HINTS, VIRAL_TRENDS } from '../store/videoStore.js';

// 고정 API 키 (미리터닝 없이도 동작 보장)
const BUILT_IN_KEY = 'AIzaSyDzYoTeyFdOO8LuSeVYD-iF5_27Cxok_nc';
let geminiKey = BUILT_IN_KEY;

export function setGeminiKey(key) { geminiKey = key || BUILT_IN_KEY; }
export function getGeminiKey() { return geminiKey; }
export function hasGeminiKey() { return !!geminiKey; }

export function getApiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
}

async function fetchWithTimeout(url, options, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function apiPost(url, body) {
  const r = await fetchWithTimeout(
    url,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    30000
  );
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `${r.status}`);
  }
  return r.json();
}

// 텍스트/비전 전용 모델 폴백 체인 (오디오 지원 모델 제외)
const TEXT_MODELS = [
  'gemini-2.5-pro-preview-05-06',   // 2.5 Pro 최신 Preview (2026-Q1)
  'gemini-2.5-flash-preview-05-20', // 2.5 Flash 최신 Preview
  'gemini-2.5-pro',                 // 2.5 Pro stable
  'gemini-2.5-flash',               // 2.5 Flash stable
  'gemini-2.0-flash',               // 2.0 Flash (안정)
  'gemini-2.0-flash-lite',          // 2.0 Flash Lite (빠름)
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

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
    });
    const url = URL.createObjectURL(file);
    vid.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
    vid.onloadedmetadata = () => {
      const dur = isFinite(vid.duration) ? vid.duration : 0;
      if (!dur) { URL.revokeObjectURL(url); resolve([]); return; }
      const offscreen = document.createElement('canvas');
      offscreen.width = 640; offscreen.height = 360;
      const octx = offscreen.getContext('2d');
      const frames = []; let done = 0;
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

// ─── STEP 1: Vision Analysis ──────────────────────────────
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

  const prompt = `당신은 2026년 인스타그램 Reels · 유튜브 Shorts 알고리즘 전문 비주얼 디렉터입니다.
음식점: "${restaurantName}" / 미디어 ${parts.length}개

[핵심 분석 규칙] 2026 릴스/쉽츠 알고리즘
• 첫 0.5초에 시청자를 멈춰라 → hook 이미지 최우선
• 시각적 충격도(emotional_score 9~10) 컷을 첫 씨이 배치
• 음식 클로즈업, 디테일 샷이 코멘트/공유 환율 3배

각 이미지:
- type: "hook"|"추마"|"detail"|"ambiance"|"process"|"wide"
- best_effect: "zoom-in"|"zoom-out"|"pan-left"|"pan-right"|"zoom-in-slow"|"float-up"
- emotional_score: 1~10
- suggested_duration: 0.5~5초
- focus: 핵심 포인트 1문장
- focus_coords: {"x":0.5,"y":0.5}
- viral_potential: "high"|"medium"|"low"

전체:
- keywords: 트렌딩 검색어 포함 (ex: "줄서는 집", "인생 맛집", "핸릹투어")
- mood, menu, visual_hook
- recommended_order: 시청자 유지률 최고 순서
- recommended_template: pov|reveal|viral_fast|aesthetic|mukbang|foreshadow 중 선택
- recommended_hook: viral_2026|pov|shock|question|challenge 중 선택

JSON만 반환:
{"keywords":[],"mood":"","menu":[],"visual_hook":"","recommended_order":[],"recommended_template":"reveal","recommended_hook":"viral_2026","per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":0.8,"focus":"설명","focus_coords":{"x":0.5,"y":0.45},"viral_potential":"high"}]}`;

  const data = await geminiWithFallback({
    contents: [{ parts: [...parts, { text: prompt }] }],
    generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
  });
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
  catch { return { keywords: [restaurantName], mood: '활기찬', per_image: [], recommended_order: [] }; }
}

// ─── STEP 2: Script Generation ────────────────────────────
export async function generateScript(restaurantName, analysis) {
  const { files, selectedTemplate, selectedHook } = useVideoStore.getState();
  const pi    = analysis.per_image || [];
  const order = analysis.recommended_order?.length ? analysis.recommended_order : files.map((_, i) => i);
  const imgSummary = pi.map(p =>
    `이미지${p.idx}(${p.type}/감성${p.emotional_score}점): 효과=${p.best_effect}, ${p.suggested_duration}s, "${p.focus}"`
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

  const prompt = `당신은 팔로워 50만+ 한국 맛집 인스타그램·유튜브 Shorts 전문 감독 "무브먼트(MOOVLOG)"입니다.
2026 최신 릴스/쇼츠 트렌드: 스토리 아크(기승전결), 감정 몰입, 느린 여운, 자막 임팩트.
${trendInstruction}
[음식점 정보]
이름: ${restaurantName} / 분위기: ${analysis.mood || '감성적인'}
메뉴: ${(analysis.menu || []).join(', ') || restaurantName}
비주얼 훅: ${analysis.visual_hook || ''}

[선택된 전략]
템플릿: ${TEMPLATE_HINTS[selectedTemplate] || TEMPLATE_HINTS.story}
훅: ${HOOK_HINTS[selectedHook] || HOOK_HINTS.question}

[비주얼 컷 분석]
${imgSummary || '분석 없음'}
권장 컷 순서: [${order.join(',')}]

[★ 총 ${totalTarget}초, ${files.length}씬 구성 — 완성형 스토리 아크]
씬1 발견/훅(2.5~3.5s): 충격적 첫 비주얼 + 궁금증 폭발 자막
씬2 설정/기대(3~4s): 이 곳이 특별한 이유, 분위기·비하인드
씬3 클라이맥스 전(3~4s): 대표 메뉴 등장, 텍스처·디테일 극대화
씬4 감정 피크(3~4.5s): 맛 반응, 경험 최고조 → 가장 인상적인 컷
씬N CTA(2.5~3.5s): 감성 마무리 + "꼭 가봐", 위치 힌트

[나레이션 스타일 — 2026 인플루언서 말투]
• 반말, 1~2문장, 각 씬 duration × 5글자 이하 (여유있게 읽히도록)
• 감정 흐름: 설렘→기대→충격→감동→여운
• 이모지 금지, 구어체 자연스럽게 (ex: "이거 실화야", "미쳤다 진짜", "꼭 와봐")

[자막 규칙 — 임팩트 극대화]
caption1: narration 첫 임팩트 구절 4~10자 (반말, 구어체)
caption2: narration 후반 감정 핵심 4~10자 (없으면 빈 문자열)
subtitle_style: hook(강렬한 첫 씬) | hero(음식 클라이맥스) | cta(마지막 행동유도) | bold_drop(TikTok 스타일) | minimal(여운/감성) | elegant(에세이 스타일)

[★ SNS 태그 규칙 — 반드시 준수]
naver_clip_tags : #협찬 으로 시작, 이어서 지역·음식·분위기 태그 공백 나열, 총 300자 이내
youtube_shorts_tags : 핵심 태그 5~8개 100자 이내
instagram_caption : 감성 소개 2~3줄\\n\\n#태그1 #태그2 #태그3 #태그4 #태그5 (5개 딱 맞기)
tiktok_tags : #태그 딱 5개만 공백 구분

JSON만 반환:
{"title":"제목","hashtags":"#태그","naver_clip_tags":"#협찬 #서울맛집 #한식 #점심","youtube_shorts_tags":"#맛집투어 #한식 #shorts","instagram_caption":"소개문\\n\\n#태그1 #태그2 #태그3 #태그4 #태그5","tiktok_tags":"#한식 #맛집 #vlog #food #korea","scenes":[
  {"idx":0,"duration":3.0,"caption1":"이거 실화임?","caption2":"이 가격에..","subtitle_style":"hook","subtitle_position":"center","narration":"이거 실화야. 이 가격에 이게 나온다고.","effect":"zoom-out"}
]}`;

  const makeReq = async url => {
    const data = await apiPost(url, {
      contents: [{ parts: [...imgParts, { text: prompt }] }],
      generationConfig: { temperature: 0.92, responseMimeType: 'application/json' },
    });
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const obj = JSON.parse(raw.replace(/```json|```/g, '').trim());
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

  try {
    const data = await apiPost(getApiUrl('gemini-2.5-pro'), body);
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.warn('[Blog] Pro → Flash 폴백:', e.message);
    const data = await apiPost(getApiUrl('gemini-2.5-flash'), body);
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  }
}
