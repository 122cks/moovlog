/* ============================================================
   api/gemini.ts — Gemini 2.5 Pro/Flash API 래퍼
   visionAnalysis, generateScript, geminiTTS 포함
   ============================================================ */
import { fetchWithTimeout, geminiApiUrl } from './client';
import type { GeminiRequest, GeminiResponse } from '@/types/api';
import { parseVisionAnalysis, type VisionAnalysis } from '@/schemas/visionSchema';
import { parseGeneratedScript, type GeneratedScript } from '@/schemas/scriptSchema';
import type { MediaItem } from '@/types/state';
import type { TemplateKey, HookKey } from '@/types/state';
import { TEMPLATE_HINTS, HOOK_HINTS } from '@/config/templates';

/** 환경변수 주입 — Vite: import.meta.env.VITE_GEMINI_KEY */
export function getGeminiKey(): string {
  return import.meta.env.VITE_GEMINI_KEY ?? '';
}

/** Pro → Flash 자동 폴백 */
async function geminiPost(body: GeminiRequest): Promise<GeminiResponse> {
  const key = getGeminiKey();
  if (!key) throw new Error('Gemini API 키가 설정되지 않았습니다.');

  const tryModel = async (model: string): Promise<GeminiResponse> => {
    const res = await fetchWithTimeout(
      geminiApiUrl(model, key),
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      30_000,
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(err?.error?.message ?? `Gemini ${model} HTTP ${res.status}`);
    }
    return res.json() as Promise<GeminiResponse>;
  };

  try {
    return await tryModel('gemini-2.5-pro');
  } catch (e) {
    console.warn('[Gemini] Pro → Flash 폴백:', (e as Error).message);
    return tryModel('gemini-2.5-flash');
  }
}

/** 응답 텍스트 추출 */
function extractText(data: GeminiResponse): string {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/* ── STEP 1: Vision Analysis ── */
export async function visionAnalysis(
  restaurantName: string,
  files: MediaItem[],
): Promise<VisionAnalysis> {
  // 이미지를 base64 인라인 데이터로 변환 (최대 8개)
  const parts: GeminiRequest['contents'][0]['parts'] = [];
  for (const item of files.slice(0, 8)) {
    if (item.type === 'image') {
      const b64 = await fileToBase64(item.file);
      parts.push({ inlineData: { mimeType: item.file.type, data: b64 } });
    } else {
      // 영상: 첫 프레임을 캔버스로 추출
      const frame = await extractVideoFrame(item.url);
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: frame } });
    }
  }
  if (!parts.length) throw new Error('분석할 미디어가 없습니다.');

  const prompt = buildVisionPrompt(restaurantName, parts.length);
  const data = await geminiPost({
    contents: [{ parts: [...parts, { text: prompt }] }],
    generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
  });
  return parseVisionAnalysis(extractText(data));
}

/* ── STEP 2: Script Generation ── */
export async function generateScript(
  restaurantName: string,
  analysis: VisionAnalysis,
  template: TemplateKey,
  hook: HookKey,
): Promise<GeneratedScript> {
  const tplHint  = template !== 'auto' ? TEMPLATE_HINTS[template] : TEMPLATE_HINTS.aesthetic;
  const hookHint = HOOK_HINTS[hook] ?? HOOK_HINTS.question;
  const order    = analysis.recommended_order.length
    ? analysis.recommended_order
    : analysis.per_image.map((_: unknown, i: number) => i);

  const imgSummary = analysis.per_image
    .map((p: VisionAnalysis['per_image'][number]) => `이미지${p.idx}(${p.type}/감성${p.emotional_score}점): 효과=${p.best_effect}, ${p.suggested_duration}s, "${p.focus}"`)
    .join('\n');

  const prompt = `당신은 인스타그램 Reels 전문 편집 감독입니다.
음식점: "${restaurantName}"
스타일: ${tplHint}
훅 스타일: ${hookHint}
분위기: ${analysis.mood}
메뉴: ${analysis.menu.join(', ')}
이미지 분석:\n${imgSummary}
추천 순서: [${order.join(', ')}]

위 정보로 쇼츠 스크립트를 작성하세요. 각 씬은 추천 순서대로. 
narration은 2~10초 분량(자연스러운 1인칭 나레이션). caption1·caption2는 틱톡 자막(6~14자).
effect/transition은 분위기에 맞게. subtitle_position: 0.75~0.88(하단).

JSON만 반환 (마크다운 금지):
{
  "hook": "첫 씬 훅 문구",
  "summary": "전체 요약 1줄",
  "scenes": [
    {
      "media_idx": 0,
      "narration": "나레이션 텍스트",
      "caption1": "메인 자막",
      "caption2": "서브 자막(선택)",
      "effect": "zoom-in",
      "transition": "fade",
      "subtitle_position": 0.82,
      "duration": 3.0
    }
  ],
  "tags": ["#맛집", "#숏츠"],
  "youtube_title": "유튜브 타이틀",
  "youtube_desc": "유튜브 설명",
  "instagram_caption": "인스타 캡션"
}`;

  const data = await geminiPost({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.75, responseMimeType: 'application/json' },
  });
  return parseGeneratedScript(extractText(data));
}

/* ── Gemini TTS (Fenrir voice) ── */
export async function fetchGeminiTTS(text: string): Promise<ArrayBuffer> {
  const key = getGeminiKey();
  if (!key) throw new Error('Gemini API 키가 없습니다.');

  const res = await fetchWithTimeout(
    geminiApiUrl('gemini-2.5-flash-preview-tts', key),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
        },
      }),
    },
    20_000,
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e?.error?.message ?? `Gemini TTS HTTP ${res.status}`);
  }
  const json = await res.json() as GeminiResponse;
  const audioB64 = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!audioB64) throw new Error('Gemini TTS 응답에 오디오 데이터가 없습니다.');
  return base64ToArrayBuffer(audioB64);
}

/* ── 유틸 ── */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error(`'${file.name}' 파일을 읽는 중 오류가 발생했습니다.`));
    reader.readAsDataURL(file);
  });
}

async function extractVideoFrame(url: string): Promise<string> {
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.currentTime = 0.5;
  await new Promise<void>((res) => { video.onseeked = () => res(); video.load(); });
  const canvas = document.createElement('canvas');
  canvas.width  = 640;
  canvas.height = 360;
  canvas.getContext('2d')!.drawImage(video, 0, 0, 640, 360);
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1] ?? '';
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function buildVisionPrompt(restaurantName: string, mediaCount: number): string {
  return `당신은 인스타그램 Reels 전문 비주얼 디렉터입니다.
음식점: "${restaurantName}" / 미디어 ${mediaCount}개

각 이미지를 순서대로 정밀 분석하세요.
JSON만 반환:
{"keywords":["k1"],"mood":"감성","menu":["메뉴"],"visual_hook":"훅","recommended_order":[0],"recommended_template":"aesthetic","recommended_hook":"question","per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":8,"suggested_duration":3,"focus":"설명","focus_coords":{"x":0.5,"y":0.45}}]}`;
}
