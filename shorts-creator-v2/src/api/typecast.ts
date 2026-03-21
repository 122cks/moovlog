/* ============================================================
   api/typecast.ts — Typecast v1 API (8-key 풀 + 로테이션)
   Authorization: Bearer 헤더 사용 (X-API-KEY 아님)
   ============================================================ */
import { fetchWithTimeout } from './client';

/* ── API 키 풀 (환경변수 주입) ── */
function buildKeyPool(): string[] {
  const keys = [
    import.meta.env.VITE_TYPECAST_API_KEY,
    import.meta.env.VITE_TYPECAST_API_KEY_2,
    import.meta.env.VITE_TYPECAST_API_KEY_3,
    import.meta.env.VITE_TYPECAST_API_KEY_4,
    import.meta.env.VITE_TYPECAST_API_KEY_5,
    import.meta.env.VITE_TYPECAST_API_KEY_6,
    import.meta.env.VITE_TYPECAST_API_KEY_7,
    import.meta.env.VITE_TYPECAST_API_KEY_8,  // 8번째 키
  ] as (string | undefined)[];
  return keys.filter((k): k is string => typeof k === 'string' && k.length > 0);
}

let _keys: string[] = buildKeyPool();
let _keyIdx = 0;

export function getTypeCastKey(): string {
  return _keys[_keyIdx] ?? '';
}

export function rotateTypeCastKey(): void {
  if (_keys.length === 0) return;
  _keyIdx = (_keyIdx + 1) % _keys.length;
  console.debug(`[Typecast] 키 로테이션 → #${_keyIdx + 1} / ${_keys.length}개`);
}

/** 로컬 스토리지에서 수동 등록한 키 로드 (개발 환경) */
export function loadKeysFromLocalStorage(): void {
  const fromStorage: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const key = localStorage.getItem(i === 1 ? 'moovlog_typecast_key' : `moovlog_typecast_key${i}`);
    if (key) fromStorage.push(key);
  }
  if (fromStorage.length) {
    _keys = fromStorage;
    _keyIdx = 0;
    console.debug(`[Typecast] 로컬스토리지 키 ${fromStorage.length}개 로드`);
  }
}

/** 현재 등록된 키 개수 반환 */
export function getKeyPoolSize(): number {
  return _keys.length;
}

/* ── Typecast 음성 합성 ── */
const TYPECAST_SPEAK_URL  = 'https://typecast.ai/api/speak';
const TYPECAST_ACTOR_ID   = 'gM00000057';  // Fenrir 남성 성우
const AUDIO_TEMPO         = 1.25;
const POLLING_INTERVAL_MS = 1500;
const POLLING_MAX_TRIES   = 30;
const REQUEST_TIMEOUT_MS  = 8_000;

export async function fetchTypeCastTTS(text: string): Promise<ArrayBuffer> {
  const apiKey = getTypeCastKey();
  if (!apiKey) throw new Error('Typecast API 키가 설정되지 않았습니다.');

  const authHeader = { Authorization: `Bearer ${apiKey}` };

  // 1) speak 요청
  const speakRes = await fetchWithTimeout(
    TYPECAST_SPEAK_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        text,
        actor_id: TYPECAST_ACTOR_ID,
        audio_tempo: AUDIO_TEMPO,
        emotion_tone_preset: 'neutral-1',
        last_pitch: 0,
        speed_x: 1.0,
      }),
    },
    REQUEST_TIMEOUT_MS,
  );

  if (!speakRes.ok) {
    const errBody = await speakRes.json().catch(() => ({})) as { message?: string };
    const errMsg  = `Typecast speak 오류 (${speakRes.status}): ${errBody?.message ?? speakRes.statusText}`;
    // 429 Rate Limit — 상위 재시도 로직에서 키 로테이션 처리
    if (speakRes.status === 429) {
      const rateLimitErr = new Error(errMsg);
      (rateLimitErr as Error & { isRateLimit: boolean }).isRateLimit = true;
      throw rateLimitErr;
    }
    throw new Error(errMsg);
  }

  const speakData = await speakRes.json() as { result?: { speak_v2_url?: string; speak_url?: string } };
  const audioUrl  = speakData?.result?.speak_v2_url || speakData?.result?.speak_url;
  if (!audioUrl) {
    throw new Error(`Typecast URL 누락 (응답: ${JSON.stringify(speakData?.result ?? {})})`);
  }

  // 2) 오디오 파일 폴링
  for (let i = 0; i < POLLING_MAX_TRIES; i++) {
    await sleep(POLLING_INTERVAL_MS);

    const pollRes = await fetchWithTimeout(
      audioUrl,
      { headers: authHeader },
      REQUEST_TIMEOUT_MS,
    );

    if (pollRes.status === 200) return pollRes.arrayBuffer();
    if (pollRes.status === 202) continue; // 아직 처리 중
    // 4xx/5xx → 즉시 실패
    throw new Error(`Typecast 폴링 오류 (${pollRes.status}): ${audioUrl}`);
  }

  throw new Error(`Typecast TTS 타임아웃 — ${POLLING_MAX_TRIES * POLLING_INTERVAL_MS / 1000}초 초과`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
