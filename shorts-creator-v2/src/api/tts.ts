/* ============================================================
   api/tts.ts — 모든 씬 TTS 일괄 처리 + AudioBuffer 디코딩
   ============================================================ */
import { fetchTypeCastTTS, rotateTypeCastKey } from './typecast';
import type { SceneData } from '@/schemas/scriptSchema';

export async function generateAllTTS(
  scenes: SceneData[],
  audioCtx: AudioContext,
  onProgress: (args: { sceneIdx: number; total: number }) => void,
): Promise<(AudioBuffer | null)[]> {
  const results: (AudioBuffer | null)[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const text = scenes[i].narration.trim();
    if (!text) {
      results.push(null);
      onProgress({ sceneIdx: i, total: scenes.length });
      continue;
    }

    let arrayBuf: ArrayBuffer | null = null;
    let lastErr: Error | null = null;

    // 최대 2회 시도 (키 로테이션)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        arrayBuf = await fetchTypeCastTTS(text);
        break;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        console.warn(`[TTS] 씬${i} 시도${attempt + 1} 실패 — 키 로테이션:`, lastErr.message);
        rotateTypeCastKey();
      }
    }

    if (!arrayBuf) {
      console.error(`[TTS] 씬${i} 최종 실패:`, lastErr?.message);
      results.push(null);
    } else {
      try {
        const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
        results.push(audioBuf);
      } catch (err) {
        console.error(`[TTS] 씬${i} 디코딩 실패:`, err);
        results.push(null);
      }
    }

    onProgress({ sceneIdx: i, total: scenes.length });
  }

  return results;
}
