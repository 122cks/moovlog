// src/engine/gemini.js
// Gemini API ??visionAnalysis, generateScript (湲곗〈 script.js?먯꽌 ?댁떇)

import { useVideoStore, TEMPLATE_HINTS, HOOK_HINTS, VIRAL_TRENDS } from '../store/videoStore.js';
import { getPersonaPrompt } from './PersonaManager.js';

// API ??愿由???鍮뚮뱶 ??VITE_GEMINI_KEY ?섍꼍蹂??二쇱엯 (GitHub GEMINI_KEY2 ?쒗겕由?
// ?섎뱶肄붾뵫 湲덉?: ?ㅺ? 怨듦컻 ??μ냼???몄텧?섎㈃ Google??利됱떆 李⑤떒(403)
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
    if (e.name === 'AbortError') throw new Error(`?ㅽ듃?뚰겕 ??꾩븘??(${Math.round(timeout / 1000)}s 珥덇낵)`);
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

// ??? 紐⑤뜽 紐⑸줉 (2026-03 v1beta ?뺤씤???좏슚 紐⑤뜽留? ????????
// 2.0 ?쒕━利?gemini-2.0-flash, gemini-2.0-flash-lite)??Legacy 泥섎━ ???쒓굅
export const TEXT_MODELS = [
  'gemini-2.5-flash',  // 1?쒖쐞: ?띾룄쨌鍮꾩슜 洹좏삎
  'gemini-2.5-pro',    // 2?쒖쐞: 怨좏뭹吏??대갚
];

// ??? ?쒖감 ?대갚 (湲곕낯) ?????????????????????????????????????
export async function geminiWithFallback(body, timeoutMs = 60000) {
  let lastErr;
  for (const model of TEXT_MODELS) {
    try {
      return await apiPost(getApiUrl(model), body, timeoutMs);
    } catch (e) {
      lastErr = e;
      console.warn(`[Gemini] ${model} ?ㅽ뙣 ???ㅼ쓬 紐⑤뜽:`, e.message);
    }
  }
  throw lastErr || new Error('紐⑤뱺 Gemini 紐⑤뜽 ?ㅽ뙣');
}

// ??? 蹂묐젹 寃쎌웳 (媛??鍮좊Ⅸ 紐⑤뜽 ?묐떟 梨꾪깮) ???????????????
// Promise.any: ?섎굹?쇰룄 ?깃났?섎㈃ 利됱떆 諛섑솚, 紐⑤몢 ?ㅽ뙣?섎㈃ AggregateError
export async function geminiRace(body, models = TEXT_MODELS, timeoutMs = 28000) {
  if (!models.length) throw new Error('紐⑤뜽 紐⑸줉 ?놁쓬');
  const attempts = models.map(model =>
    apiPost(getApiUrl(model), body, timeoutMs)
      .then(r => ({ model, data: r }))
      .catch(e => {
        console.warn(`[Gemini 蹂묐젹] ${model} ?ㅽ뙣:`, e.message);
        throw e;
      })
  );
  const result = await Promise.any(attempts);
  console.log(`[Gemini ?? 梨꾪깮 紐⑤뜽: ${result.model}`);
  return result.data;
}

// ??? ?뚯씪 ??Base64 蹂??(PC ?꾩슜 ?ㅻ쭏???뺤텞: ?붿쭏 蹂댁〈 + ?띾룄 ?≪긽) ????
const MAX_IMG_SIZE = 1280; // Gemini Vision? ?대? 由ъ궗?댁쫰 ??1280px ?댁긽? payload ??퉬
export function toB64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`'${file.name}' ?뚯씪???쎌쓣 ???놁뒿?덈떎.`));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('?대?吏 ?뚯떛 ?ㅽ뙣'));
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

// ??? 鍮꾨뵒?????꾨젅??異붿텧 ????????????????????????????????
// count 湲곕낯媛?2: 4?꾨젅?꾩? payload ??퉬, 2?꾨젅?꾩쑝濡쒕룄 遺꾩꽍 異⑸텇
export function extractVideoFramesB64(file, count = 2) {
  return new Promise(resolve => {
    // ?꾩껜 ?⑥닔 理쒕? ?湲??쒓컙 ??onloadedmetadata 誘몃컻???ы븿 紐⑤뱺 hang 諛⑹?
    const globalTimer = setTimeout(() => { resolve([]); }, 15000);

    const vid = Object.assign(document.createElement('video'), {
      muted: true, playsInline: true, preload: 'metadata',
    });
    const url = URL.createObjectURL(file);

    const cleanup = (canvas) => {
      clearTimeout(globalTimer);
      URL.revokeObjectURL(url);
      vid.pause();
      vid.src = '';
      vid.load();
      vid.remove();
      if (canvas) { canvas.width = 0; canvas.height = 0; }
    };
    const done = (frames, canvas) => { cleanup(canvas); resolve(frames); };

    vid.onerror = () => { done([], null); };

    // onloadedmetadata ?먯껜 ??꾩븘??(8珥? ???쇰? ?щ㎎?먯꽌 硫뷀??곗씠???대깽?멸? 諛쒗솕 ????
    const metaTimer = setTimeout(() => { vid.onloadedmetadata = null; done([], null); }, 8000);

    vid.onloadedmetadata = () => {
      clearTimeout(metaTimer);
      const dur = isFinite(vid.duration) ? vid.duration : 0;
      if (!dur) { done([], null); return; }
      const offscreen = document.createElement('canvas');
      offscreen.width = 640; offscreen.height = 360;
      const octx = offscreen.getContext('2d');
      const frames = [];
      const times = Array.from({ length: count }, (_, i) => dur * (i + 0.5) / count);
      const captureAt = idx => {
        if (idx >= times.length) { done(frames, offscreen); return; }
        // onseeked 誘몃컻????? 5珥????대떦 ?꾨젅???ㅽ궢
        const seekTimer = setTimeout(() => { vid.onseeked = null; captureAt(idx + 1); }, 5000);
        vid.currentTime = times[idx];
        vid.onseeked = () => {
          clearTimeout(seekTimer);
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

// ??? Gemini ?묐떟 ?덉쟾 ?뚯떛 (Safety ?꾪꽣 李⑤떒 泥댄겕) ??????????
export function safeExtractText(data) {
  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  if (finishReason === 'SAFETY') {
    throw new Error('肄섑뀗痢??덉쟾???뺤콉???섑빐 ?앹꽦??李⑤떒?섏뿀?듬땲?? 吏덉쓽瑜??섏젙??二쇱꽭??');
  }
  if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
    console.warn(`[Gemini] finishReason: ${finishReason}`);
  }
  return candidate?.content?.parts?.[0]?.text || '';
}

// ??? STEP 1: Vision Analysis (2-pass) ????????????????????
export async function visionAnalysis(restaurantName, researchData = '', restaurantType = 'auto') {
  const { files } = useVideoStore.getState();

  // ?? 誘몃뵒????base64 parts 鍮뚮뱶 ?ы띁 (?뚯씪蹂?洹몃９ 諛섑솚, idx ?ㅽ봽??吏?? ??
  const buildBatchPartsGrouped = async (fileSlice, baseIdx) =>
    Promise.all(fileSlice.map(async (m, li) => {
      const i = baseIdx + li;
      const label = { text: `\n--- [?먮낯 誘몃뵒??踰덊샇 media_idx: ${i}] ---` };
      if (m.type === 'image') {
        try { const b64 = await toB64(m.file); return [label, { inline_data: { mime_type: m.file.type || 'image/jpeg', data: b64 } }]; }
        catch (_) { return [label]; }
      } else {
        try { const frames = await extractVideoFramesB64(m.file, 2); return [label, ...frames.map(fr => ({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } }))]; }
        catch (_) { return [label]; }
      }
    }));

  // ?? 10+10+10 諛곗튂 遺꾪븷 (理쒕? 30媛? ??
  const VISION_BATCH = 10;
  const totalMedia = Math.min(files.length, 30);
  const slice0 = files.slice(0, Math.min(VISION_BATCH, totalMedia));
  const slice1 = files.slice(VISION_BATCH, Math.min(VISION_BATCH * 2, totalMedia));
  const slice2 = files.slice(VISION_BATCH * 2, totalMedia);

  if (!slice0.length) {
    return { keywords: [restaurantName, '留쏆쭛'], mood: '媛먯꽦?곸씤', per_image: [], recommended_order: [] };
  }

  // 諛곗튂 parts 蹂묐젹 鍮뚮뱶 (?뚯씪蹂?洹몃９ ?좎?)
  const [filePartsGroup0, filePartsGroup1, filePartsGroup2] = await Promise.all([
    buildBatchPartsGrouped(slice0, 0),
    slice1.length ? buildBatchPartsGrouped(slice1, VISION_BATCH) : Promise.resolve([]),
    slice2.length ? buildBatchPartsGrouped(slice2, VISION_BATCH * 2) : Promise.resolve([]),
  ]);
  // 1李??⑥뒪??flat parts / 2李??⑥뒪???뚯씪蹂?洹몃９ ?꾩껜 李몄“
  const parts0 = filePartsGroup0.flat();
  const parts1 = filePartsGroup1.flat();
  const parts2 = filePartsGroup2.flat();
  const allFilePartsGroups = [...filePartsGroup0, ...filePartsGroup1, ...filePartsGroup2];

  // ?? 1踰덉㎏ ?⑥뒪: 湲곕낯 鍮꾩＜??遺꾩꽍 ??
  const typeHint = restaurantType && restaurantType !== 'auto'
    ? `\n[?낆껜 ?좏삎: ${restaurantType}] ?????좏삎???뱀꽦??留욊쾶 ?쒓렇?덉쿂 而룹쓣 ?곗꽑 遺꾨쪟?섏꽭??`
    : '';
  const prompt1 = `?뱀떊? 2026???몄뒪?洹몃옩 Reels 쨌 ?좏뒠釉?Shorts ?뚭퀬由ъ쬁 ?꾨Ц 鍮꾩＜???붾젆?곗엯?덈떎.
?뚯떇?? "${restaurantName}" / 誘몃뵒??${totalMedia}媛?{typeHint}${researchData ? `\n\n[?뵇 ?앸떦 ?ъ쟾 ?명뀛由ъ쟾?????꾨옒 ?뺣낫瑜?李멸퀬?섏뿬, ?쒓렇?덉쿂 硫붾돱쨌USP? 媛???곌????ъ쭊???믪? emotional_score쨌foodie_score瑜?遺?ы븯?몄슂]\n${researchData.slice(0, 500)}` : ''}

媛??대?吏:
- type: "hook"|"hero"|"detail"|"ambiance"|"process"|"wide"
- best_effect: "zoom-in"|"zoom-out"|"pan-left"|"pan-right"|"zoom-in-slow"|"float-up"
- emotional_score: 1~10
- suggested_duration: 0.5~5珥?
- focus: ?앸떦 ?명뀛由ъ쟾???곗씠?곗? ?議고빐 ?뚯떇쨌?뚮즺紐낆쓣 ?뺥솗???앸퀎 ??1臾몄옣 ?ㅻ챸 (援ъ뼱泥? ?뚮즺쨌嫄닿컯二쇱뒪쨌?뚮즺?샕룸Ъ? ?덈? ?뚯뒪쨌?쒕젅?깆씠???쒗쁽 湲덉?. ?? "?쒖옉 ???쒓났?섎뒗 嫄닿컯二쇱뒪?덉슂.", "?먰댋??梨꾨걡 ?ㅽ뀒?댄겕媛 泥좏뙋 ?꾩뿉 ?щ씪媛 ?덉뼱??")
- focus_coords: {"x":0.5,"y":0.5}
- viral_potential: "high"|"medium"|"low"
- is_exterior: 媛寃??멸?쨌媛꾪뙋쨌嫄대Ъ ?낃뎄쨌?곹샇紐낆씠 蹂댁씠硫?true, ?뚯떇쨌?ㅻ궡쨌湲고?硫?false
- aesthetic_score: 0~100 (援щ룄쨌諛앷린쨌?됯컧 醫낇빀 ?먯닔. 80 ?댁긽?대㈃ type??"hook"?쇰줈 ?곗꽑 遺꾨쪟)
- foodie_score: 0~10 (?뚯떇???ㅺ린쨌吏덇컧쨌?됯컧 ?좊챸?? ?앹슃 ?먭레 媛뺣룄. ?뚯떇 ?꾨땶 ?ъ? null)
- best_start_pct: 0.0~1.0 (?곸긽 ?뚯뒪??寃쎌슦 媛???몄긽?곸씤 ?섏씠?쇱씠??援ш컙 ?쒖옉 吏??鍮꾩쑉. ?대?吏??0)
- tracking_coords: {"start":{"x":0.5,"y":0.5},"end":{"x":0.5,"y":0.5}} (?쇱궗泥??대룞 寃쎈줈 異붿젙. ?뺤쟻 而룹? start쨌end ?숈씪)
- ocr_data: {"menu_items":[],"prices":[]} (硫붾돱?먃룰?寃⑺몴쨌?곸닔利앹뿉???몄떇???띿뒪?? ?놁쑝硫?null)

?꾩껜:
- keywords: ?몃젋??寃?됱뼱 ?ы븿 (ex: "以꾩꽌??吏?, "?몄깮 留쏆쭛", "留쏆쭛?ъ뼱")
- mood, menu, visual_hook
- recommended_order: foodie_score횞0.7 + aesthetic_score횞0.3 媛以묒튂濡??대┝李⑥닚 ?뺣젹 (?앹슃 ?먭레 理쒖슦??
- recommended_template: pov|reveal|viral_fast|aesthetic|mukbang|foreshadow 以??좏깮
- recommended_hook: viral_2026|pov|shock|question|challenge 以??좏깮

JSON留?諛섑솚:
{"keywords":[],"mood":"","menu":[],"visual_hook":"","recommended_order":[],"recommended_template":"reveal","recommended_hook":"viral_2026","per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":0.8,"focus":"?ㅻ챸","focus_coords":{"x":0.5,"y":0.45},"viral_potential":"high","is_exterior":false,"aesthetic_score":85,"foodie_score":8,"best_start_pct":0.2,"tracking_coords":{"start":{"x":0.5,"y":0.5},"end":{"x":0.5,"y":0.5}},"ocr_data":null}]}`;

  // 諛곗튂蹂?1李??⑥뒪 蹂묐젹 ?몄텧 (?대?吏 ?ы븿 ??90珥???꾩븘??
  const callPass1 = async (batchParts) => {
    const data = await geminiWithFallback({
      contents: [{ parts: [...batchParts, { text: prompt1 }] }],
      generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
    }, 90000);
    const raw = safeExtractText(data);
    const _s = raw.indexOf('{'), _e = raw.lastIndexOf('}');
    return JSON.parse(_s >= 0 && _e > _s ? raw.slice(_s, _e + 1) : raw.replace(/```json|```/g, '').trim());
  };

  const [pass1Result0, pass1Result1, pass1Result2] = await Promise.all([
    callPass1(parts0).catch(() => ({ keywords: [restaurantName], mood: 'unknown', per_image: [], recommended_order: [] })),
    parts1.length ? callPass1(parts1).catch(() => ({ per_image: [], recommended_order: [] })) : Promise.resolve(null),
    parts2.length ? callPass1(parts2).catch(() => ({ per_image: [], recommended_order: [] })) : Promise.resolve(null),
  ]);

  // 諛곗튂 寃곌낵 蹂묓빀 ??媛?諛곗튂 per_image idx??VISION_BATCH ?ㅽ봽???곸슜
  const mergeBatch = (base, extra, offset) => {
    if (!extra) return base;
    return {
      ...base,
      per_image: [
        ...(base.per_image || []),
        ...(extra.per_image || []).map(p => ({ ...p, idx: p.idx + offset })),
      ],
      recommended_order: [
        ...(base.recommended_order || []),
        ...(extra.recommended_order || []).map(i => i + offset),
      ],
    };
  };
  const firstResult = mergeBatch(
    mergeBatch(pass1Result0, pass1Result1, VISION_BATCH),
    pass1Result2,
    VISION_BATCH * 2
  );

  // ?? 2踰덉㎏ ?⑥뒪: narration_hint ?앹꽦 (議대뙎留먃룹젙蹂댁쟾?? ??
  const topIdxs = (firstResult.recommended_order || []).slice(0, Math.min(5, allFilePartsGroups.length));
  const topParts = topIdxs.length
    ? topIdxs.flatMap(idx => allFilePartsGroups[idx] || [])
    : allFilePartsGroups.slice(0, 5).flat();

  const focusSummary = (firstResult.per_image || [])
    .map(p => `?대?吏${p.idx}: ${p.focus || ''}`)
    .join('\n');

  const prompt2 = `?뱀떊? ?대갚?섍퀬 ?몃젴??2030 留쏆쭛 ?щ━?먯씠?곗엯?덈떎. 怨쇳븯吏 ?딄쾶, 吏꾩쭨 留쏆옒?뚯쿂???꾩떎?곸씤 援ъ뼱泥대줈 媛??대?吏???댁슱由щ뒗 ?섎젅?댁뀡 ?뚰듃瑜??묒꽦?섏꽭??
?뚯떇?? "${restaurantName}"${researchData ? `\n\n[?앸떦 硫붾돱 ?뺣낫 ?ㅼ떆 李멸퀬 ???대?吏 ???뚯떇쨌?뚮즺紐낆쓣 ?뺥솗??諛섏쁺?섏꽭?? ?뚮즺쨌嫄닿컯二쇱뒪???뚯뒪???섏? 留덉꽭??]\n${researchData.slice(0, 800)}` : ''}
?꾨옒 ?대?吏?ㅼ쓽 1李?遺꾩꽍 寃곌낵瑜?李멸퀬?섏뿬, 媛??대?吏??????섎젅?댁뀡 ?뚰듃瑜??앹꽦?섏꽭??

[1李?遺꾩꽍 ?붿빟]
${focusSummary || '遺꾩꽍 ?놁쓬'}

[narration_hint 洹쒖튃]
??"~?? ?대? ?ъ슜 (?? 蹂댁씠?쒕굹??/ ?щ씪媛 ?덉뼱??/ ?ш텋吏?泥좏뙋 ?꾩삁??
??"~?낅땲?? "~?⑸땲?? 媛숈? ?깅뵳??留먰닾 ?덈? 湲덉?
???붾㈃???ㅼ젣 蹂댁씠??寃껋쓣 ?ㅺ컧?쇰줈 援ъ껜?곸쑝濡??ㅻ챸 (吏덇컧쨌?됯컧쨌?⑤룄媛먃룻뼢쨌?뚮━ ??
??1臾몄옣, 15???댁쇅
?????덈? 湲덉? ?쒗쁽: "誘몄낀?댁슂", "?諛뺤씠?먯슂", "?ㅽ솕?덉슂", "湲곗젅?댁뿉??, "??誘몄낀?댁슂", "?뺣쭚 留쏆엳?댁슂", "吏꾩쭨 留쏆엳?댁슂", "?덈Т 留쏆엳?댁슂", "?섏긽?댁뿉??, "理쒓퀬?덉슂", "?덉쟾?쒖삁??, "?뚮쫫?댁뿉??, "?좎꽭怨꾩삁??
?????몃뱾媛?媛먰깂??湲덉?: "?~!", "?諛?!", "??", "?대㉧!", "?몄긽??"
?????щ컮瑜??덉떆: "?먰댘?섍쾶 ?곗뼱??梨꾨걹???ш텋吏?泥좏뙋 ?꾩뿉???듭뼱媛怨??덉뼱??", "?ы겕媛 ?우옄留덉옄 寃곕?濡?李?뼱吏??吏덇컧??蹂댁씠?쒕굹??", "湲곕텇 醫뗭? ??텋?μ씠 ?щ씪?ㅻ뒗 ?λ㈃?댁뿉??"

JSON留?諛섑솚 ??per_image 諛곗뿴 媛???ぉ??narration_hint ?꾨뱶留??ы븿:
{"per_image":[{"idx":0,"narration_hint":"?먰댘?섍쾶 ?곗뼱???쒖슦 梨꾨걹???ш텋吏?泥좏뙋 ?꾩뿉???듭뼱媛怨??덉뒿?덈떎."}]}`;

  let secondResult = { per_image: [] };
  try {
    const data2 = await geminiWithFallback({
      contents: [{ parts: [...topParts, { text: prompt2 }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
    }, 90000);
    const raw2 = safeExtractText(data2);
    const _s2 = raw2.indexOf('{'), _e2 = raw2.lastIndexOf('}');
    secondResult = JSON.parse(_s2 >= 0 && _e2 > _s2 ? raw2.slice(_s2, _e2 + 1) : raw2.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.warn('[visionAnalysis 2-pass] 2踰덉㎏ ?⑥뒪 ?ㅽ뙣:', e.message);
  }

  // ?? 寃곌낵 蹂묓빀: narration_hint 二쇱엯 ??
  const hintMap = {};
  for (const h of (secondResult.per_image || [])) hintMap[h.idx] = h.narration_hint;
  const mergedPerImage = (firstResult.per_image || []).map(p => ({
    ...p,
    narration_hint: hintMap[p.idx] || p.focus || '',
  }));

  return { ...firstResult, per_image: mergedPerImage };
}

// ??? STEP 1.5: ?앸떦 ?ㅼ떆媛?寃??議곗궗 (Google Search Grounding) ?????????????
export async function researchRestaurant(restaurantName) {
  const prompt = `援ш? 寃?됱쓣 ?듯빐 '?앸떦紐? ${restaurantName}'??理쒖떊 釉붾줈洹맞룹씤?ㅽ?洹몃옩 由щ럭瑜?議곗궗?섍퀬, ?꾨옒 ??ぉ??350???대궡濡??붿빟?섏꽭??

[?꾩닔 議곗궗 ??ぉ]
1. ?쒓렇?덉쿂 硫붾돱 & 留쏆쓽 ?뱀쭠 (?? ?≪쬂 媛?앺븳 ?섏젣踰꾧굅, 30???꾪넻 媛꾩옣寃뚯옣)
2. ???앸떦留뚯쓽 USP ??寃쎌웳 ?앸떦怨?李⑤퀎?붾맂 ?듭떖 ?ъ씤??(?? ?ъ옣??吏곸젒 ?섑솗 ?щ즺, ?뱀젣 ?뚯뒪 鍮꾨쾿)
3. 理쒓렐 3媛쒖썡 由щ럭 ?멸린 ?ㅼ썙??TOP 3 (?? "?⑥씠??2?쒓컙", "怨좉린?먭퍡 ?ㅽ솕", "酉?誘몄낀?댁슂")
4. ?ㅼ젣 諛⑸Ц??轅??
   - ?⑥씠???? ?됯퇏 ?⑥씠???쒓컙, 踰덊샇?쑣룹삁??媛???щ?, ?⑥씠???⑥텞踰?(?ㅽ뵂 吏곹썑 諛⑸Ц ??
   - 二쇱감 ?뺣낫: ?꾩슜 二쇱감???щ?, ?멸렐 怨듭쁺二쇱감?? 諛쒕젢 ?쒕퉬???щ?
   - ?덉젅 二쇱쓽 硫붾돱: 議곌린 ?덉젅?섎뒗 硫붾돱紐낃낵 異붿쿇 諛⑸Ц ?쒓컙?
5. 遺꾩쐞湲?諛?諛⑸Ц ?곹솴 (?곗씠?? 媛議??섎뱾?? 吏곸옣???먯떖 ??
6. 媛寃⑸? ?뺣낫

?녿뒗 ?뺣낫???앸왂?섍퀬, ?뺤씤???ъ떎留?媛꾧껐?섍쾶 ?붿빟?섏꽭??`;

  const searchModels = ['gemini-2.5-flash', 'gemini-2.5-pro'];
  for (const model of searchModels) {
    try {
      const data = await apiPost(getApiUrl(model), {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.5 },
      }, 25000);
      const text = safeExtractText(data)?.trim();
      if (text && text.length > 20) {
        console.log(`[researchRestaurant ?? ${model} 寃???깃났`);
        return text;
      }
    } catch (e) {
      console.warn(`[researchRestaurant] ${model} ?ㅽ뙣:`, e.message);
    }
  }
  return ''; // 議곗궗 ?ㅽ뙣 ??鍮?臾몄옄????generateScript媛 gracefully skip
}
// ??? 釉붾줈洹??ъ뒪???앹꽦 (10+10 諛곗튂 遺꾩꽍 ???듯빀 ?묒꽦) ?????????????????????
export async function generateBlogPost({ name, location, keywords, extra, imageFiles }) {
  const allFiles = (imageFiles || []).slice(0, 20);

  // ?? ?뚯씪 ??base64 parts 洹몃９ 鍮뚮뱶 ?ы띁 ??
  const buildBatchParts = async (fileSlice, baseIdx) =>
    Promise.all(fileSlice.map(async (f, li) => {
      const label = { text: `\n--- [?뚯씪 ${baseIdx + li + 1}: ${f.type.startsWith('video/') ? '?곸긽' : '?ъ쭊'}] ---` };
      if (f.type.startsWith('image/')) {
        try { return [label, { inline_data: { mime_type: f.type, data: await toB64(f) } }]; }
        catch (_) { return [label]; }
      } else {
        try {
          const frames = await extractVideoFramesB64(f, 2);
          return [label, ...frames.map(fr => ({ inline_data: { mime_type: fr.mimeType, data: fr.base64 } }))];
        } catch (_) { return [label]; }
      }
    }));

  const BATCH = 10;
  const slice0 = allFiles.slice(0, BATCH);
  const slice1 = allFiles.slice(BATCH);

  // ?? Step 1: 諛곗튂蹂??뚯씪 遺꾩꽍 (蹂묐젹) ??
  const [partGroups0, partGroups1] = await Promise.all([
    buildBatchParts(slice0, 0),
    slice1.length ? buildBatchParts(slice1, BATCH) : Promise.resolve([]),
  ]);
  const parts0 = partGroups0.flat();
  const parts1 = partGroups1.flat();

  const analysisPrompt = `?뚯떇??"${name}" 愿???대?吏/?곸긽?낅땲?? 媛??뚯씪???댁슜???뚯븙?섏꽭??
JSON 諛곗뿴留?諛섑솚: [{"file":1,"desc":"?붾㈃??蹂댁씠??寃?1~2臾몄옣","type":"food|interior|exterior|menu|process","placement":"?꾩엯|?뚯떇?뚭컻|?뚯떇?뷀뀒??遺꾩쐞湲?留덈Т由?}]`;

  const runAnalysis = async (parts) => {
    if (!parts.length) return [];
    try {
      const data = await geminiWithFallback({
        contents: [{ parts: [...parts, { text: analysisPrompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }, 90000);
      const raw = safeExtractText(data);
      const s = raw.indexOf('['), e = raw.lastIndexOf(']');
      return JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : '[]');
    } catch { return []; }
  };

  const [analysis0, analysis1] = await Promise.all([
    runAnalysis(parts0),
    slice1.length ? runAnalysis(parts1) : Promise.resolve([]),
  ]);
  const combined = [...analysis0, ...analysis1];

  // ?? Step 2: ?듯빀 遺꾩꽍 ??釉붾줈洹??묒꽦 ??
  const mediaContext = allFiles.map((f, i) => {
    const a = combined.find(c => c.file === i + 1);
    const tag = f.type.startsWith('video/') ? `[?곸긽 ${i + 1}]` : `[?ъ쭊 ${i + 1}]`;
    return `${tag} ${a?.desc || ''} ??異붿쿇 ?꾩튂: ${a?.placement || '?먯쑀 ?쎌엯'}`;
  }).join('\n');

  const prompt = `?뱀떊? ?쒓뎅?먯꽌 媛???멸린 ?덈뒗 留쏆쭛 釉붾줈嫄?"臾대툕癒쇳듃(moovlog)"?낅땲??
?ㅼ쓬 ?뺣낫? ?대?吏 遺꾩꽍 寃곌낵瑜?諛뷀깢?쇰줈 ?ㅼ씠踰?釉붾줈洹??ъ뒪?낆쓣 ?묒꽦?댁＜?몄슂.

?뚯떇?? ${name}
?꾩튂: ${location || '(?대?吏?먯꽌 ?뚯븙)'}
泥⑤? ?뚯씪: 珥?${allFiles.length}媛?
${keywords ? `蹂몃Ц???먯뿰?ㅻ읇寃??뱀뿬?????ㅼ썙?? ${keywords}` : ''}
${extra ? `異붽? 吏?쒖궗?? ${extra}` : ''}

[?뚯씪蹂?遺꾩꽍 寃곌낵 ?????댁슜 湲곕컲?쇰줈 蹂몃Ц ?묒꽦]
${mediaContext || '?놁쓬'}

[臾대툕癒쇳듃 釉붾줈洹??ㅽ?????2026 ?ㅼ씠踰??곸쐞 ?몄텧 理쒖쟻??
???꾩엯: 諛⑸Ц ?숆린쨌?ㅻ젅??湲곕?媛?(移쒓렐??援ъ뼱泥? ?대え吏 ?쒖슜)
???멸?쨌?낃뎄 ?뚭컻
?????硫붾돱 ?뚭컻쨌硫붾돱?먃룰?寃??뺣낫
???뚯떇 ?뷀뀒??臾섏궗 (援ъ껜??留쎛룹떇媛먃룸퉬二쇱뼹)
??遺꾩쐞湲걔룹꽌鍮꾩뒪쨌?⑥씠???멸툒
???щ갑臾??섏궗 + 寃곕줎 + ?꾩튂쨌?곸뾽?쒓컙 ?뺣낫

[以묒슂 洹쒖튃]
- ?뚯씪 遺꾩꽍??"異붿쿇 ?꾩튂"???곕씪 [?ъ쭊 N] ?먮뒗 [?곸긽 N] 留덉빱瑜?蹂몃Ц??諛곗튂 (珥?${allFiles.length}媛쒓퉴吏 ?ъ슜)
- ?ㅼ썙?쒕뒗 ??臾몄옣???먯뿰?ㅻ읇寃?(愿묎퀬???섏뿴 湲덉?)
- ?⑤씫 援щ텇? 鍮덉쨪, 援ъ뼱泥? ?대え吏 ?곷떦??
- ?ㅼ씠踰??곸쐞 ?몄텧???꾪빐 泥?臾몃떒???듭떖 ?ㅼ썙???ы븿

JSON留?諛섑솚:
{
  "title": "釉붾줈洹??쒕ぉ (?대┃瑜??믪? 媛먯꽦 ?쒕ぉ)",
  "body": "釉붾줈洹?蹂몃Ц ?꾩껜 (?⑤씫留덈떎 鍮덉쨪, [?ъ쭊/?곸긽 N] 留덉빱 ?ы븿)",
  "naver_clip_tags": "#?쒓렇??(300???대궡, 吏???뚯떇 ?꾩＜)",
  "youtube_shorts_tags": "#?쒓렇??(100???대궡)",
  "instagram_caption": "?뚭컻 2~3以?\n\\n#?댁떆?쒓렇??(10媛?",
  "tiktok_tags": "#?쒓렇1 #?쒓렇2 #?쒓렇3 #?쒓렇4 #?쒓렇5"
}`;

  // ?묒꽦 ?몄텧: 1李?諛곗튂 ?대?吏 理쒕? 4媛쒕쭔 ?ы븿 (payload 理쒖쟻??
  const topParts = partGroups0.slice(0, 4).flat();
  const body = {
    contents: [{ parts: [...topParts, { text: prompt }] }],
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
    console.warn('[Blog] Pro ??Flash ?대갚:', e.message);
    const data = await apiPost(getApiUrl('gemini-2.5-flash'), body);
    return parseJson(safeExtractText(data));
  }
}
