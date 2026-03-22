// src/engine/mediaPreprocess.js
// 미디어 파일 전처리 — MIME 타입 검출 + 동영상 720p 다운스케일
// 용량이 큰 영상(>50MB 또는 해상도 1280p 초과)을 WebM VP9로 변환하여 FFmpeg RAM 부족 방지

const V_EXT = new Set(['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', 'hevc']);
const I_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif', 'avif']);

const DOWNSCALE_THRESH_BYTES = 50 * 1024 * 1024; // 50MB 이상만 변환 시도
const DOWNSCALE_MAX_SIDE     = 1280; // portrait 720p 기준

/** MIME 타입 + 확장자 기반 미디어 타입 검출 ('video'|'image'|null) */
export function detectMediaType(file) {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  const ext = (file.name || '').split('.').pop().toLowerCase();
  if (V_EXT.has(ext)) return 'video';
  if (I_EXT.has(ext)) return 'image';
  return null;
}

/** 동영상 해상도 반환 (실패 시 null) */
function getVideoDimensions(file) {
  return new Promise(resolve => {
    const vid = document.createElement('video');
    const url = URL.createObjectURL(file);
    const timer = setTimeout(() => { URL.revokeObjectURL(url); resolve(null); }, 6000);
    vid.onloadedmetadata = () => {
      clearTimeout(timer);
      const r = { w: vid.videoWidth, h: vid.videoHeight };
      URL.revokeObjectURL(url);
      resolve(r.w && r.h ? r : null);
    };
    vid.onerror = () => { clearTimeout(timer); URL.revokeObjectURL(url); resolve(null); };
    vid.muted = true; vid.playsInline = true; vid.preload = 'metadata';
    vid.src = url;
  });
}

/** 동영상을 canvas + MediaRecorder로 720p WebM으로 다운스케일 */
function downscaleVideo(file, { w, h }) {
  return new Promise(resolve => {
    const scale = DOWNSCALE_MAX_SIDE / Math.max(w, h);
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);

    // 지원 mimeType 탐색
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find(m => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } });
    if (!mimeType) { resolve(file); return; } // 브라우저 미지원 → 원본

    const canvas = document.createElement('canvas');
    canvas.width = tw; canvas.height = th;
    const ctx = canvas.getContext('2d');

    const vid = document.createElement('video');
    const srcUrl = URL.createObjectURL(file);
    const chunks = [];

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });

    recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      try { stream.getTracks().forEach(t => t.stop()); } catch {}
      URL.revokeObjectURL(srcUrl);
      const blob = new Blob(chunks, { type: 'video/webm' });
      // 결과가 오히려 더 크면 원본 반환
      const out = blob.size < file.size * 0.95
        ? new File([blob], file.name.replace(/\.[^.]+$/, '.webm'), { type: 'video/webm' })
        : file;
      resolve(out);
    };
    recorder.onerror = () => { URL.revokeObjectURL(srcUrl); resolve(file); };

    // 3분 safety timeout
    const safety = setTimeout(() => { try { recorder.stop(); } catch {} }, 180_000);

    vid.muted = true; vid.playsInline = true;
    vid.ontimeupdate = () => { ctx.drawImage(vid, 0, 0, tw, th); };
    vid.onended = () => {
      clearTimeout(safety);
      ctx.drawImage(vid, 0, 0, tw, th);
      try { recorder.stop(); } catch {}
    };
    vid.onerror = () => { clearTimeout(safety); URL.revokeObjectURL(srcUrl); resolve(file); };
    vid.onloadedmetadata = () => {
      recorder.start(500);
      vid.play().catch(() => { try { recorder.stop(); } catch {} resolve(file); });
    };
    vid.src = srcUrl;
  });
}

/**
 * 필요 시 동영상을 720p로 다운스케일 반환
 * - 50MB 미만이거나 이미 1280px 이하이면 원본 그대로 반환
 */
export async function downscaleVideoIfNeeded(file) {
  if (file.size < DOWNSCALE_THRESH_BYTES) return file;
  if (!window.MediaRecorder) return file;
  const dims = await getVideoDimensions(file);
  if (!dims || Math.max(dims.w, dims.h) <= DOWNSCALE_MAX_SIDE) return file;
  return downscaleVideo(file, dims);
}

/**
 * 파일 배열 전처리 — MIME 검출 + 비디오 다운스케일
 * @param {File[]} fileList
 * @param {(msg:string)=>void} [onProgress]
 * @returns {Promise<{file: File, mediaType: 'video'|'image'}[]>}
 */
export async function preprocessMediaFiles(fileList, onProgress) {
  const results = [];
  const arr = [...fileList];
  for (let i = 0; i < arr.length; i++) {
    const f = arr[i];
    const mediaType = detectMediaType(f);
    if (!mediaType) continue;

    let processed = f;
    if (mediaType === 'video' && f.size >= DOWNSCALE_THRESH_BYTES) {
      onProgress?.(`영상 최적화 중 (${i + 1}/${arr.length})...`);
      processed = await downscaleVideoIfNeeded(f);
    }
    results.push({ file: processed, mediaType });
  }
  return results;
}
