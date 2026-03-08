// src/engine/tts.js
// TTS 시스템 — Typecast 우선 + Gemini 폴백 (기존 script.js에서 이식)

import { getApiUrl, getGeminiKey } from './gemini.js';

// ─── AudioContext (싱글턴) ────────────────────────────────
let audioCtx = null;
let audioMixDest = null;

export function ensureAudio() {
  if (audioCtx) return { audioCtx, audioMixDest };
  audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
  audioMixDest = audioCtx.createMediaStreamDestination();
  return { audioCtx, audioMixDest };
}
export function getAudioCtx() { return audioCtx; }
export function getAudioMixDest() { return audioMixDest; }

// ─── Typecast 키 관리 ─────────────────────────────────────
let _typeCastKeys = [];
let _tcKeyIdx = 0;

export function setTypeCastKeys(keys) {
  _typeCastKeys = keys.filter(Boolean);
  _tcKeyIdx = 0;
}
export function getTypeCastKey() {
  if (!_typeCastKeys.length) return '';
  return _typeCastKeys[_tcKeyIdx % _typeCastKeys.length];
}
export function rotateTypeCastKey() {
  _tcKeyIdx = (_tcKeyIdx + 1) % Math.max(_typeCastKeys.length, 1);
  console.log(`[Typecast] 키 로테이션 → #${_tcKeyIdx + 1} (${_typeCastKeys.length}개 중)`);
}
export function hasTypeCastKeys() { return _typeCastKeys.length > 0; }

// ─── Typecast 보이스 ID ───────────────────────────────────
export let TYPECAST_VOICE_ID =
  localStorage.getItem('moovlog_typecast_voice') || 'tc_5d654ea6b5ce05000143e79b';

// ─── 유틸 ────────────────────────────────────────────────
export const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchWithTimeout(url, options, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ─── 나레이션 전처리 ─────────────────────────────────────
export function preprocessNarration(text) {
  if (!text?.trim()) return '';
  return text
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[⭐🔥✨🍜📹📖📊🎬🤖💾🙏]/g, '')
    .replace(/\.{2,}/g, ',')
    .replace(/,\s*/g, ', ')
    .replace(/\.\s+([가-힣])/g, '. $1')
    .replace(/!+/g, '!')
    .replace(/진짜(?![,.])/g, '진짜, ')
    .replace(/(?<![가-힣])와(?=[^가-힣a-zA-Z]|$)/g, '와, ')
    .replace(/\.\s*/g, '.\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── Typecast TTS ─────────────────────────────────────────
export async function fetchTypeCastTTS(text) {
  if (!text?.trim()) throw new Error('빈 텍스트');
  const { audioCtx: ac } = ensureAudio();
  const apiKey = getTypeCastKey();
  if (!apiKey) throw new Error('TYPECAST_401: 사용 가능한 API 키 없음');

  console.log(`[Typecast 시도] 키 #${_tcKeyIdx + 1}/${_typeCastKeys.length}`);

  const tcBody = JSON.stringify({
    actor_id: TYPECAST_VOICE_ID,
    text: text.trim(),
    lang: 'auto',
    xapi_hd: true,
    model_version: 'latest',
    xapi_audio_format: 'mp3',
    tempo: 1.25,
    volume: 100,
    pitch: 0,
  });
  const tcHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };

  // 엔드포인트: 실제 typecast.ai API 도메인 우선 최신 RFC7231 시도
  let res;
  try {
    res = await fetchWithTimeout('https://typecast.ai/api/speak',
      { method: 'POST', headers: tcHeaders, body: tcBody }, 14000);
  } catch (_firstErr) {
    // 폴백: 이전 엔드포인트
    console.warn('[Typecast] 신규 엔드포인트 실패 → 구 엔드포인트 시도');
    res = await fetchWithTimeout('https://api.typecast.ai/v1/text-to-speech',
      { method: 'POST', headers: tcHeaders, body: tcBody }, 14000);
  }

  if (!res.ok) {
    const _errData = await res.json().catch(() => ({}));
    const _errMsg  = _errData?.result?.message || _errData?.error?.message || `HTTP ${res.status}`;
    throw new Error(`TYPECAST_FAIL_${res.status}: ${_errMsg}`);
  }

  const data = await res.json();
  // speak_v2_url (polling) 또는 바로 오디오 URL
  const directUrl = data?.result?.speak_url || data?.result?.audio_download_url;
  if (directUrl && !data?.result?.speak_v2_url) {
    const audioRes = await fetchWithTimeout(directUrl, {}, 15000);
    if (!audioRes.ok) throw new Error('Typecast 직접 다운로드 실패');
    const ab = await audioRes.arrayBuffer();
    const buf = await ac.decodeAudioData(ab.slice(0));
    if (!buf || buf.duration < 0.05) throw new Error('Typecast 빈 오디오');
    console.log(`[Typecast ✓] ${buf.duration.toFixed(2)}s`);
    return buf;
  }

  const speakUrl = data?.result?.speak_v2_url || data?.result?.speak_url;
  if (!speakUrl) throw new Error(`Typecast URL 누락`);

  // Polling (0.8초 간격, 최대 30초)
  let audioUrl = null;
  for (let i = 0; i < 38; i++) {
    await sleep(800);
    try {
      const pollRes = await fetchWithTimeout(
        speakUrl,
        { headers: { 'Authorization': `Bearer ${apiKey}` } },
        4000
      );
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      const status   = pollData?.result?.status;
      if (status === 'DONE') { audioUrl = pollData?.result?.audio_download_url; break; }
      if (status === 'FAILED') throw new Error('Typecast 오디오 합성 실패');
    } catch (e) {
      if (e.name === 'AbortError') continue;
      throw e;
    }
  }
  if (!audioUrl) throw new Error('Typecast 전체 응답 타임아웃 (30초 초과)');

  const audioRes = await fetchWithTimeout(audioUrl, {}, 15000);
  if (!audioRes.ok) throw new Error('Typecast 오디오 다운로드 실패');
  const ab = await audioRes.arrayBuffer();
  if (ab.byteLength < 100) throw new Error('Typecast 오디오 데이터 너무 작음');
  const buf = await ac.decodeAudioData(ab.slice(0));
  if (!buf || buf.duration < 0.05) throw new Error('Typecast 빈 오디오');
  console.log(`[Typecast ✓] ${buf.duration.toFixed(2)}s — ${text.substring(0, 15)}...`);
  return buf;
}

// ─── Gemini TTS 재시도 래퍼 ──────────────────────────────
// AUDIO 모달리티를 지원하는 실제 TTS 전용 모델만 사용
// gemini-2.0-flash-exp / gemini-2.5-flash-exp / gemini-2.0-flash 는 audio 미지원 (404/400)
const TTS_CONFIG = {
  // 429(쿼타 초과) 시 다음 모델로 즉시 전환, 동일 모델 2회 재시도 포함
  models: [
    'gemini-2.5-flash-preview-tts',   // 1순위: TTS 전용 100/day 무료
    'gemini-2.5-pro-preview-tts',     // 2순위: Pro TTS (다른 쿼타)
    'gemini-2.5-flash-preview-tts',   // 3순위: flash 재시도
    'gemini-2.5-pro-preview-tts',     // 4순위: pro 재시도
  ],
  voices:     ['Fenrir', 'Orus', 'Charon', 'Kore', 'Aoede', 'Puck'],
  maxRetry:   4,
  retryDelay: 2000,   // 429 이외 오류 대기 (ms)
  sceneDelay: 2500,
};

export async function fetchTTSWithRetry(text, sceneIdx) {
  const { audioCtx: ac } = ensureAudio();
  let lastErr = null;

  for (let attempt = 0; attempt < TTS_CONFIG.maxRetry; attempt++) {
    const model     = TTS_CONFIG.models[attempt % TTS_CONFIG.models.length];
    const voiceName = TTS_CONFIG.voices[sceneIdx % TTS_CONFIG.voices.length];
    try {
      // 오디오 전용 모델에 직접 요청 (geminiWithFallback은 텍스트 모델만 순환)
      const r = await fetchWithTimeout(
        getApiUrl(model),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
          }),
        },
        42000   // TTS 응답은 최대 42초 대기
      );
      if (!r.ok) {
        const errJson = await r.json().catch(() => ({}));
        const errMsg  = errJson?.error?.message || `HTTP ${r.status}`;
        // 429(쿼타 초과)는 즉시 다음 모델로 전환 (retryDelay 없이)
        if (r.status === 429) {
          console.warn(`[TTS] ${model} 쿼타 초과(429) → 다음 모델로 즉시 전환`);
          lastErr = new Error(errMsg);
          continue;  // 대기 없이 다음 attempt
        }
        throw new Error(errMsg);
      }
      const data = await r.json();
      const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) throw new Error('빈 base64');

      let bytes;
      try {
        const raw = atob(b64);
        bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      } catch { throw new Error('base64 디코딩 실패'); }

      if (bytes.length < 4) throw new Error('오디오 데이터 너무 짧음');

      // WAV 헤더 없으면 RAW PCM으로 처리
      const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
      if (isWav) {
        const buf = await ac.decodeAudioData(bytes.buffer.slice(0));
        if (!buf || buf.duration < 0.05) throw new Error('빈 WAV');
        console.log(`[Gemini TTS ✓] ${model}/${voiceName} — ${buf.duration.toFixed(2)}s`);
        return buf;
      } else {
        const SR = 24000;
        const view = new DataView(bytes.buffer);
        const samples = [];
        for (let i = 0; i < bytes.length - 1; i += 2) samples.push(view.getInt16(i, true) / 32768);
        if (samples.length < 10) throw new Error('PCM 샘플 부족');
        const buf = ac.createBuffer(1, samples.length, SR);
        buf.copyToChannel(new Float32Array(samples), 0);
        console.log(`[Gemini TTS PCM ✓] ${model}/${voiceName} — ${buf.duration.toFixed(2)}s`);
        return buf;
      }
    } catch (e) {
      lastErr = e;
      if (e.message?.startsWith('TTS_403')) throw e;  // 인증 오류는 즉시 중단
      console.warn(`[TTS] 시도 ${attempt + 1}/${TTS_CONFIG.maxRetry} 실패:`, e.message);
      // abort/timeout 은 대기 후 재시도, 429는 위에서 continue로 처리됨
      if (attempt < TTS_CONFIG.maxRetry - 1) await sleep(TTS_CONFIG.retryDelay);
    }
  }
  throw lastErr || new Error('TTS 최종 실패');
}

// ─── 전체 씬 TTS 생성 ────────────────────────────────────
export async function generateAllTTS(scenes, onToast) {
  const buffers = new Array(scenes.length).fill(null);
  let successCount = 0, failCount = 0, fatalStop = false;
  const useTypecast = hasTypeCastKeys();

  for (let i = 0; i < scenes.length; i++) {
    if (fatalStop) break;
    const sc = scenes[i];
    if (!sc.narration) { if (i < scenes.length - 1) await sleep(TTS_CONFIG.sceneDelay); continue; }

    const text = preprocessNarration(sc.narration);
    if (!text) { if (i < scenes.length - 1) await sleep(TTS_CONFIG.sceneDelay); continue; }

    try {
      if (useTypecast) {
        let tcBuf = null, tcErr = null;
        const maxAttempts = _typeCastKeys.length * 2;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try { tcBuf = await fetchTypeCastTTS(text); break; }
          catch (e2) {
            tcErr = e2;
            const m2 = e2.message || '';
            const isTimeout = m2.includes('타임아웃') || m2.includes('30초') || e2.name === 'AbortError';
            if (!isTimeout || attempt % 2 === 1) rotateTypeCastKey();
          }
        }
        if (tcBuf) {
          buffers[i] = tcBuf; successCount++;
        } else {
          console.warn(`[Typecast] 모든 키 소진 — Gemini로 전환`);
          onToast?.(`Typecast 키 소진 — Gemini로 전환합니다`, 'inf');
          buffers[i] = await fetchTTSWithRetry(text, i);
          successCount++;
        }
      } else {
        buffers[i] = await fetchTTSWithRetry(text, i);
        successCount++;
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('TTS_403')) {
        fatalStop = true;
        onToast?.('AI 보이스: API 키에 TTS 권한 없음 — 무음으로 진행합니다', 'inf');
      } else {
        failCount++;
        console.warn(`[TTS] 씬${i + 1} 최종 실패:`, msg);
      }
    }

    if (i < scenes.length - 1) await sleep(TTS_CONFIG.sceneDelay);
  }

  if (!fatalStop) {
    if (successCount === 0) onToast?.('AI 보이스 생성 실패 — 무음 영상으로 진행합니다', 'inf');
    else if (failCount > 0) onToast?.(`AI 보이스 ${successCount}/${scenes.length}씬 완료 (${failCount}씬 무음)`, 'inf');
    else onToast?.(`${useTypecast ? 'Typecast' : 'Gemini'} AI 보이스 ${successCount}씬 생성 완료 ✓`, 'ok');
  }

  return buffers;
}
