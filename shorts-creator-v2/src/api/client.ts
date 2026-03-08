/* ============================================================
   api/client.ts — 공통 HTTP 클라이언트
   fetchWithTimeout + 오류 파싱 (throw Error, not event)
   ============================================================ */

/** AbortController 타임아웃 래퍼. 응답 이벤트 객체 대신 Error를 throw. */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 7000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    // AbortError, NetworkError 모두 명확한 메시지로 변환
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`요청 시간 초과 (${timeoutMs / 1000}초): ${url}`);
    }
    throw new Error(err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timer);
  }
}

/** Gemini API base URL */
export function geminiApiUrl(model: string, key: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
}
