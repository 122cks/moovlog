// src/engine/gemini.js
// Gemini API — visionAnalysis, generateScript (기존 script.js에서 이식)

import { useVideoStore, TEMPLATE_HINTS, HOOK_HINTS, VIRAL_TRENDS } from '../store/videoStore.js';

let geminiKey = '';

export function setGeminiKey(key) { geminiKey = key; }
export function getGeminiKey() { return geminiKey; }
export function hasGeminiKey() { return !!geminiKey; }

function getApiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
}

async function fetchWithTimeout(url, options, timeout = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function apiPost(url, body) {
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

export async function geminiWithFallback(body) {
  try { return await apiPost(getApiUrl('gemini-2.5-pro'), body); }
  catch (e) {
    console.warn('[Gemini] Pro → Flash 폴백:', e.message);
    return apiPost(getApiUrl('gemini-2.5-flash'), body);
  }
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
    : Math.min(Math.max(files.length * 3 + 6, 22), 42);

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
duration 1초 미만 씬 → narration 비우거나 단어 1개만.
` : '';

  const prompt = `당신은 팔로워 50만+ 한국 맛집 인스타그램·유튜브 Shorts 전문 감독 "무브먼트(MOOVLOG)"입니다.
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

[★ 총 ${totalTarget}초, ${files.length}씬 구성]
씬1 Hook(2~2.5s) → 씬2 Context(2~3s) → 씬3 Hero(3~4s) → 씬N CTA(2~2.5s)

[자막 규칙]
caption1: narration 첫 임팩트 구절 4~8자, 반말 구어체
caption2: narration 후반 핵심 4~8자 (없으면 빈 문자열)
narration: 반말, 1~2문장, 해당 씬 duration × 7글자 이하, 이모지 금지

JSON만 반환:
{"title":"제목","hashtags":"#태그","naver_clip_tags":"...","youtube_shorts_tags":"...","instagram_caption":"...","tiktok_tags":"...","scenes":[
  {"idx":0,"duration":2.5,"caption1":"이거 실화임?","caption2":"이 가격에..","subtitle_style":"hook","subtitle_position":"center","narration":"이거 실화야. 이 가격에 이게 나온다고.","effect":"zoom-out"}
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
