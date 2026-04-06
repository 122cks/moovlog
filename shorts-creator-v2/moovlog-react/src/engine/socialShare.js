// src/engine/socialShare.js  v2.73
// 소셜 공유 & 마케팅 — Web Share API / 클립보드 (#81-95)
// · Web Share API (Instagram/TikTok 딥링크)
// · 해시태그 클립보드 복사
// · YouTube 썸네일 추출
// · Naver 블로그 연동 스텁

// ═══════════════════════════════════════════════════════════════════════════
// #81  Web Share API — 완성 영상 공유
// ═══════════════════════════════════════════════════════════════════════════
/**
 * 생성된 영상 Blob을 플랫폼 공유 시트로 보냄
 * @param {Blob}   blob       - 공유할 영상 파일
 * @param {string} text       - 공유 텍스트 (캡션 / 해시태그)
 * @param {string} [filename] - 파일명 (기본: moovlog.mp4)
 * @returns {Promise<'shared'|'copied'|'unsupported'>}
 */
export async function shareVideo(blob, text, filename = 'moovlog.mp4') {
  const file = new File([blob], filename, { type: 'video/mp4' });

  // Web Share API Level 2 (파일 공유 지원 여부 확인)
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title: 'MOOVLOG' });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'shared'; // 사용자가 직접 닫음
      console.warn('[socialShare] Web Share 실패:', e.message);
    }
  }

  // Web Share API Level 1 (URL만)
  if (navigator.share) {
    try {
      await navigator.share({ text, title: 'MOOVLOG' });
      return 'shared';
    } catch { /* ignore */ }
  }

  // 폴백: 텍스트 클립보드 복사
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch { /* ignore */ }

  return 'unsupported';
}

// ═══════════════════════════════════════════════════════════════════════════
// #82  해시태그 / 캡션 클립보드 복사
// ═══════════════════════════════════════════════════════════════════════════
/**
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // legacy fallback
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// #83  YouTube 썸네일 자동 추출
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Canvas를 이용해 비디오의 특정 타임스탬프에서 썸네일 이미지 추출
 * @param {HTMLVideoElement} videoEl
 * @param {number} timeSeconds - 추출할 타임스탬프(초)
 * @param {{ width?:number, height?:number }} [opts]
 * @returns {Promise<Blob>} PNG Blob
 */
export async function extractVideoThumbnail(videoEl, timeSeconds = 1, opts = {}) {
  const { width = 1280, height = 720 } = opts;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const onSeeked = () => {
      try {
        ctx.drawImage(videoEl, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob 실패'));
        }, 'image/png');
      } catch (e) {
        reject(e);
      }
    };

    videoEl.addEventListener('seeked', onSeeked, { once: true });
    videoEl.currentTime = timeSeconds;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// #84  썸네일 다운로드
// ═══════════════════════════════════════════════════════════════════════════
export function downloadThumbnail(blob, restaurantName = 'moovlog') {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = `${restaurantName}_thumbnail.png`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
// #85  Instagram 딥링크 (모바일에서 앱 직접 열기)
// ═══════════════════════════════════════════════════════════════════════════
export function openInstagramShare(caption) {
  // Instagram은 파일 직접 공유 API 미지원 → 캡션 복사 후 앱 열기
  copyToClipboard(caption);
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = 'instagram://camera';
  } else {
    window.open('https://www.instagram.com/', '_blank', 'noopener');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// #86  TikTok 딥링크
// ═══════════════════════════════════════════════════════════════════════════
export function openTikTokShare(caption) {
  copyToClipboard(caption);
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = 'snssdk1128://';  // TikTok URI scheme
  } else {
    window.open('https://www.tiktok.com/upload', '_blank', 'noopener');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// #87  Naver 블로그 포스팅 도우미 (API 직접 호출 불가 → 글쓰기 창 열기)
// ═══════════════════════════════════════════════════════════════════════════
export function openNaverBlog() {
  window.open('https://blog.naver.com/PostWriteForm.naver', '_blank', 'noopener');
}

// ═══════════════════════════════════════════════════════════════════════════
// #88  브랜딩 워터마크 텍스트 생성
// ═══════════════════════════════════════════════════════════════════════════
/**
 * @param {string} restaurantName
 * @param {string} [handle] - SNS 핸들 (예: @moovlog)
 * @returns {{ text: string, position: string, style: object }}
 */
export function getBrandingWatermark(restaurantName, handle = '@moovlog') {
  return {
    text:     `${restaurantName} · ${handle}`,
    position: 'bottomRight',
    style: {
      fontFamily: 'Pretendard, sans-serif',
      fontSize:   24,
      color:      '#ffffff',
      opacity:    0.7,
      shadow:     '2px 2px 4px rgba(0,0,0,0.8)',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// #89  완성 영상 URL 생성 (Firebase Storage 업로드 후)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Blob → Firebase Storage에 업로드하고 공유 가능한 URL 반환
 * (firebase.js의 fbUpload를 직접 쓸 수 없으므로, 외부에서 URL 받아 사용)
 * @param {string} videoUrl - Firebase Storage URL
 * @param {string} restaurantName
 * @returns {string} 공유용 URL (현재는 Firebase URL 그대로)
 */
export function buildShareUrl(videoUrl, restaurantName) {
  if (!videoUrl) return '';
  return videoUrl;
}
