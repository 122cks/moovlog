/* ============================================================
   schemas/visionSchema.ts
   Gemini visionAnalysis() 응답을 런타임에서 검증하는 Zod 스키마.
   여기서 parse가 실패하면 "[object ProgressEvent]" 같은 모호한
   에러 대신 Zod가 정확한 필드명과 기대값을 알려준다.
   ============================================================ */
import { z } from 'zod';

const FocusCoordsSchema = z.object({
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
});

export const PerImageSchema = z.object({
  idx:                z.number().int().min(0),
  type:               z.enum(['hook', 'hero', 'detail', 'ambiance', 'process', 'wide']),
  best_effect:        z.enum(['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'zoom-in-slow', 'float-up', 'drift']),
  emotional_score:    z.number().min(1).max(10),
  suggested_duration: z.number().min(1).max(8),
  focus:              z.string().min(1),
  focus_coords:       FocusCoordsSchema.default({ x: 0.5, y: 0.5 }),
});

export const VisionAnalysisSchema = z.object({
  keywords:             z.array(z.string()).min(1).max(10),
  mood:                 z.string().min(1),
  menu:                 z.array(z.string()).default([]),
  visual_hook:          z.string().min(1),
  recommended_order:    z.array(z.number().int().min(0)).default([]),
  recommended_template: z.enum(['cinematic','viral','aesthetic','mukbang','vlog','review','story','info'])
                         .default('aesthetic'),
  recommended_hook:     z.enum(['question','shock','challenge','secret','ranking','pov'])
                         .default('question'),
  per_image:            z.array(PerImageSchema).min(1),
});

export type VisionAnalysis = z.infer<typeof VisionAnalysisSchema>;

/**
 * Gemini 응답 텍스트(raw JSON string)를 파싱 & 검증.
 * 검증 실패 시 ZodError를 throw — 호출자에서 명확한 오류 메시지로 toast.
 */
export function parseVisionAnalysis(raw: string): VisionAnalysis {
  let json: unknown;
  try {
    // Gemini가 가끔 ```json ... ``` 마크다운 래핑으로 응답하는 경우 처리
    const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    json = JSON.parse(clean);
  } catch {
    throw new Error(`Gemini 비전 분석 응답이 유효한 JSON이 아닙니다: ${raw.slice(0, 200)}`);
  }
  return VisionAnalysisSchema.parse(json);
}
