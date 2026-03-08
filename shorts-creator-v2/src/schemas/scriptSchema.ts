/* ============================================================
   schemas/scriptSchema.ts
   Gemini generateScript() 응답 검증.
   씬 배열의 각 필드를 엄격히 검증하여 런타임 NaN/undefined 차단.
   ============================================================ */
import { z } from 'zod';

const SceneSchema = z.object({
  media_idx:         z.number().int().min(0),
  narration:         z.string().min(1),
  caption1:          z.string().min(1),
  caption2:          z.string().optional(),
  effect:            z.enum(['zoom-in','zoom-out','pan-left','pan-right','zoom-in-slow','float-up','drift'])
                      .default('zoom-in'),
  transition:        z.enum(['fade','wipe','zoom','none']).default('fade'),
  subtitle_position: z.number().min(0).max(1).default(0.82),
  duration:          z.number().min(1.0).max(10.0).default(3.0),
});

export const GeneratedScriptSchema = z.object({
  hook:               z.string().min(1),
  summary:            z.string().min(1),
  scenes:             z.array(SceneSchema).min(1).max(20),
  tags:               z.array(z.string()).default([]),
  youtube_title:      z.string().default(''),
  youtube_desc:       z.string().default(''),
  instagram_caption:  z.string().default(''),
});

export type GeneratedScript = z.infer<typeof GeneratedScriptSchema>;
export type SceneData       = z.infer<typeof SceneSchema>;

/**
 * Gemini 스크립트 응답 raw JSON → 파싱 & 검증.
 * `safeParse`를 사용하여 오류 메시지를 한국어로 포맷.
 */
export function parseGeneratedScript(raw: string): GeneratedScript {
  let json: unknown;
  try {
    const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    json = JSON.parse(clean);
  } catch {
    throw new Error(`스크립트 응답이 JSON이 아닙니다: ${raw.slice(0, 200)}`);
  }

  const result = GeneratedScriptSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  • ${i.path.join('.')} — ${i.message}`)
      .join('\n');
    throw new Error(`스크립트 스키마 검증 실패:\n${issues}`);
  }
  return result.data;
}
