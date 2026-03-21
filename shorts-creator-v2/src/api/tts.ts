/* ============================================================
   api/tts.ts — 모든 씬 TTS 일괄 처리 + AudioBuffer 디코딩
   ============================================================ */
import { fetchTypeCastTTS, rotateTypeCastKey, getKeyPoolSize } from './typecast';
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

    // 등록된 키 전체를 순환하며 시도 (최대 8회)
    const maxAttempts = Math.max(getKeyPoolSize(), 1);
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        arrayBuf = await fetchTypeCastTTS(text);
        // 성공 시 다음 씬을 위해 키 로테이션 (부하 분산)
        rotateTypeCastKey();
        break;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        const isRateLimit = (err as Error & { isRateLimit?: boolean }).isRateLimit === true;
        console.warn(
          `[TTS] 씬${i} 시도${attempt + 1}/${maxAttempts} 실패${isRateLimit ? ' (429 Rate Limit)' : ''} — 키 로테이션:`,
          lastErr.message,
        );
        rotateTypeCastKey();
        // 429 Rate Limit 이면 잠깐 대기 후 다음 키로 재시도
        if (isRateLimit && attempt < maxAttempts - 1) {
          await sleep(600);
        }
      }
    }

    if (!arrayBuf) {
      console.error(`[TTS] 씬${i} 최종 실패 (${maxAttempts}회 시도):`, lastErr?.message);
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
