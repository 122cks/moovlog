/* ============================================================
   types/api.ts — Gemini / Typecast API 요청·응답 타입
   실제 런타임 검증은 src/schemas/ 의 Zod 스키마로 수행
   ============================================================ */

/** Gemini Content 블록 */
export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface GeminiContent {
  role?: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    responseMimeType?: string;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> };
    finishReason?: string;
  }>;
  error?: { message: string; code: number };
}

/* ── Typecast v1 API ── */

export interface TypecastSpeakRequest {
  /** 음성 합성할 텍스트 */
  text: string;
  /** 모델 actor ID */
  actor_id: string;
  /** 재생 속도 (1.0 = 기본) */
  audio_tempo: number;
  /** 감정 강도 0..100 */
  emotion_tone_preset?: string;
  last_pitch?: number;
  speed_x?: number;
}

export interface TypecastSpeakResponse {
  result?: {
    speak_v2_url?: string;
    speak_url?: string;
    status?: 'done' | 'in_progress' | 'error';
  };
  success?: boolean;
}

/* ── Gemini TTS (Live API) ── */
export interface GeminiTTSRequest {
  contents: GeminiContent[];
  generationConfig: {
    responseModalities: string[];
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: string };
      };
    };
  };
}

/* ── Vision Analysis Result (Zod 검증 후 확정 타입) ── */
/** Zod ParsedType — src/schemas/visionSchema.ts 에서 infer */
export type VisionPerImage = {
  idx: number;
  type: 'hook' | 'hero' | 'detail' | 'ambiance' | 'process' | 'wide';
  best_effect: string;
  emotional_score: number;
  suggested_duration: number;
  focus: string;
  focus_coords: { x: number; y: number };
};

export type VisionAnalysisResult = {
  keywords: string[];
  mood: string;
  menu: string[];
  visual_hook: string;
  recommended_order: number[];
  recommended_template: string;
  recommended_hook: string;
  per_image: VisionPerImage[];
};

/* ── Script Generation Result (Gemini → JSON) ── */
export type GeneratedScriptResult = {
  hook: string;
  summary: string;
  scenes: Array<{
    media_idx: number;
    narration: string;
    caption1: string;
    caption2?: string;
    effect: string;
    transition: string;
    subtitle_position: number;
    duration: number;
  }>;
  tags: string[];
  youtube_title: string;
  youtube_desc: string;
  instagram_caption: string;
};
