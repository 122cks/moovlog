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
  mediaCount: number,
): Promise<GeneratedScript> {
  const tplHint  = template !== 'auto' ? TEMPLATE_HINTS[template] : TEMPLATE_HINTS.aesthetic;
  const hookHint = HOOK_HINTS[hook] ?? HOOK_HINTS.question;
  const maxIdx   = Math.max(0, mediaCount - 1);

  const prompt = `당신은 인스타그램 Reels 전문 편집 감독입니다.
음식점: "${restaurantName}"
스타일: ${tplHint}
훅 스타일: ${hookHint}

=== 업체 비주얼 분석 결과 ===
분위기: ${analysis.mood}
키워드: ${analysis.keywords.join(', ')}
메뉴: ${analysis.menu.join(', ')}
비주얼 핵심: ${analysis.visual_hook}
사용 가능한 미디어: ${mediaCount}개 (인덱스 0 ~ ${maxIdx})

=== 작성 지침 ===
1. 이 음식점의 브랜드 스토리를 자연스럽게 전달하는 쇼츠를 기획하세요.
2. 씬 구성: 훅(시선 포착) → 특징 소개 → 감성/분위기 → 여운/CTA
3. narration: TTS로 읽힐 자연스러운 1인칭 나레이션, 한 문장 (2~8초 분량)
4. caption1: 틱톡 스타일 핵심 자막 6~14자, caption2: 보조 자막 선택
5. media_idx: 0~${maxIdx} 사이에서 씬의 분위기와 위치에 맞게 자유 선택
   - 첫 씬: 가장 임팩트 있는 미디어
   - 중반 씬: 메뉴/분위기가 잘 보이는 미디어 다양하게
   - 마지막 씬: 여운이 남는 감성적 미디어
   - 미디어는 다시 써도 되고, 굳이 순서대로 쓸 필요 없음
6. effect/transition은 스타일에 맞게, subtitle_position 0.75~0.88, duration 2.0~6.0

JSON만 반환 (마크다운 없이):
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
    generationConfig: { temperature: 0.80, responseMimeType: 'application/json' },
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
음식점: "${restaurantName}" / 미디어 ${mediaCount}개 (인덱스 0~${mediaCount - 1})

각 이미지/영상을 순서대로 정밀 분석하여 아래 JSON을 반환하세요.

분석 기준:
- type: "hook"(강렬한 첫인상) / "hero"(대표 메뉴·공간) / "detail"(디테일 클로즈업) / "ambiance"(분위기·인테리어) / "process"(조리·서빙 과정) / "wide"(전경·외관)
- best_effect: 해당 미디어에 가장 어울리는 Ken Burns 효과
- emotional_score: 1~10 (시청자 감정 반응 예상치)
- suggested_duration: 씬 권장 재생 시간(초)
- focus: 이 미디어의 핵심 피사체 설명
- recommended_order: 영상에서 미디어를 쓸 최적 순서 (같은 idx 반복 가능)

전체 분석:
- keywords: 이 음식점을 대표하는 감성 키워드 3~6개
- mood: 전반적인 분위기 한 문장
- menu: 보이는 메뉴 목록
- visual_hook: 이 음식점의 가장 강렬한 비주얼 포인트 한 문장
- recommended_template: cinematic/viral/aesthetic/mukbang/vlog/review/story/info 중 최적
- recommended_hook: question/shock/challenge/secret/ranking/pov 중 최적

JSON만 반환 (마크다운 없이):
{"keywords":["k1","k2"],"mood":"분위기","menu":["메뉴1"],"visual_hook":"핵심 훅","recommended_order":[0,1,2],"recommended_template":"aesthetic","recommended_hook":"question","per_image":[{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":8,"suggested_duration":3,"focus":"설명","focus_coords":{"x":0.5,"y":0.45}}]}`;
}
