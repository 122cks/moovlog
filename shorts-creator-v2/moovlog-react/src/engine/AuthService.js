// src/engine/AuthService.js
// 구글 드라이브 인증 서비스 — 자동 갱신 · 재시도 · 세션 복구 지원
// DrivePicker.jsx에서 import해서 사용. 직접 인증 로직은 여기에 집중.

const TOKEN_KEY   = 'moovlog_gdrive_token';
const EXPIRY_KEY  = 'moovlog_gdrive_expiry';
const TTL_MS      = 55 * 60 * 1000;  // 55분 (구글 Access Token 만료 60분 - 5분 여유)
const MAX_RETRY   = 3;
const RETRY_DELAY = 1200;

// ─── 토큰 저장 ─────────────────────────────────────────────
export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY,  token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + TTL_MS));
  } catch (_) { /* 시크릿 모드 등 localStorage 불가 시 무시 */ }
}

// ─── 유효 토큰 반환 (없거나 만료 시 null) ──────────────────
export function loadToken() {
  try {
    const token  = localStorage.getItem(TOKEN_KEY);
    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
    if (token && Date.now() < expiry) return token;
  } catch (_) {}
  return null;
}

// ─── 토큰 삭제 ─────────────────────────────────────────────
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch (_) {}
}

// ─── 토큰 유효 여부 확인 ───────────────────────────────────
export function isTokenValid() {
  return !!loadToken();
}

// ─── 남은 유효 시간 (초 단위, 만료 시 0) ───────────────────
export function getTokenTtlSec() {
  try {
    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
    return Math.max(0, Math.round((expiry - Date.now()) / 1000));
  } catch (_) { return 0; }
}

/**
 * 인증 오류 자동 재시도 래퍼
 * @param {Function} fn       - async (token: string) => result
 * @param {Function} getToken - async () => string  (새 토큰 발급 콜백)
 * @returns {Promise<any>}
 */
export async function withAuthRetry(fn, getToken) {
  let token = loadToken();
  let lastErr;

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    try {
      if (!token) {
        token = await getToken();
        if (!token) throw new Error('토큰 발급 실패');
        saveToken(token);
      }
      return await fn(token);
    } catch (err) {
      lastErr = err;
      const msg = (err?.message || String(err)).toLowerCase();
      const isAuthErr = msg.includes('401') || msg.includes('403')
        || msg.includes('auth') || msg.includes('token') || msg.includes('expired');

      if (isAuthErr) {
        clearToken();
        token = null;
        console.warn(`[AuthService] 인증 오류 (시도 ${attempt + 1}/${MAX_RETRY}) → 토큰 재발급:`, err.message);
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      } else {
        throw err; // 인증 외 오류는 즉시 전파
      }
    }
  }
  throw lastErr || new Error(`[AuthService] 재시도 ${MAX_RETRY}회 한도 초과`);
}
