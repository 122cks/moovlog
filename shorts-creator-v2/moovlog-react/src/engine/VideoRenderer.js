// src/engine/VideoRenderer.js
// FFmpeg WASM 기반 영상 렌더러 — 시네마틱 LUT · Ken Burns · 전환 효과 · 자막 포함
// ⚠️ SharedArrayBuffer가 필요합니다. COOP/COEP 헤더가 설정된 환경에서만 동작합니다.

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useVideoStore } from '../store/videoStore.js';

const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
// 자막용 폰트 (NotoSans KR Bold .ttf — CDN에서 최초 1회 다운로드)
const FONT_CDN_URL = 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2';
// woff2는 ffmpeg drawtext 미지원 → TTF 대안 CDN
const FONT_TTF_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansCJKkr-Bold.otf';

let ffmpegInstance = null;
let isLoading = false;

async function getFFmpeg(onLog) {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (isLoading) {
    while (isLoading) await new Promise(r => setTimeout(r, 200));
    return ffmpegInstance;
  }
  isLoading = true;
  const ff = new FFmpeg();
  if (onLog) ff.on('log', ({ message }) => onLog(message));
  await ff.load({
    coreURL: await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL: await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  ffmpegInstance = ff;
  isLoading = false;
  return ff;
}

// ─── 테마별 색감 보정 LUT 필터 ───────────────────────────
function getColorLUT(theme) {
  const LUTs = {
    cafe:    'curves=preset=vintage,eq=saturation=1.2:brightness=0.03:contrast=1.08,unsharp=3:3:0.8:3:3:0.0',
    grill:   'eq=contrast=1.1:saturation=1.5:brightness=0.02,unsharp=5:5:1.5:5:5:0.0',
    hansik:  'eq=saturation=1.15:contrast=1.08,unsharp=3:3:0.8:3:3:0.0',
    premium: 'eq=contrast=1.05:saturation=1.3:brightness=0.04,curves=preset=lighter,unsharp=5:5:1.0:5:5:0.0',
    pub:     'eq=saturation=1.4:contrast=1.15:brightness=-0.02,unsharp=3:3:0.9:3:3:0.0',
    seafood: 'eq=saturation=1.3:hue=3:brightness=0.03,unsharp=3:3:1.0:3:3:0.0',
    chinese: 'eq=saturation=1.5:contrast=1.2:brightness=-0.03,unsharp=3:3:0.8:3:3:0.0',
  };
  return LUTs[theme] || LUTs.hansik;
}
export { getColorLUT };

// ─── 비디오용 마스터 필터 (색감 + Flash 전환) ────────────
function getVideoFilter(scene, theme, dur, isLastScene, sceneIndex = 0) {
  const f = [];

  // 기본 해상도 / 크롭
  f.push('scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1');
  // ★ Freeze Frame
  f.push('tpad=stop_mode=clone:stop_duration=5');
  
  // 색감 LUT
  f.push(getColorLUT(theme));
  // ★ 업스케일러: 선명도 강화 + 노이즈 감소
  f.push('unsharp=5:5:1.0:5:5:0.0,hqdn3d=1.5:1.5:4.5:4.5');
  // 필름 그레인 텍스처 (uniform noise — 디지털 날것 느낌 제거)
  f.push('noise=alls=8:allf=u');
  
  // 첫 씬 제외: 짧은 컷 화이트 플래시 / 긴 컷 블랙 페이드인
  if (sceneIndex > 0) {
    if (dur < 1.0) {
      f.push('fade=t=in:st=0:d=0.15:color=white');
    } else {
      f.push('fade=t=in:st=0:d=0.2:color=black');
    }
  }

  // 마지막 씩에만 블랙 아웃 (눈 피로 방지)
  if (isLastScene && dur >= 0.6) {
    f.push(`fade=t=out:st=${(dur - 0.5).toFixed(3)}:d=0.5:color=black`);
  } else if (isLastScene) {
    f.push(`fade=t=out:st=0:d=${dur.toFixed(3)}:color=black`);
  }
  return f.join(',');
}

// ─── 이미지용 마스터 필터 (Ken Burns + 색감 + Flash 전환) ─
function getImageFilter(scene, theme, dur, fps, focusCoords, isLastScene, sceneIndex = 0) {
  const f = [];
  const frames = Math.ceil(dur * fps);
  const cx = (focusCoords?.x ?? 0.5).toFixed(4);
  const cy = (focusCoords?.y ?? 0.45).toFixed(4);

  // Ken Burns: 1440x2560으로 업스케일 후 zoompan으로 720x1280 출력
  f.push('scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560');
  
  if (scene.type === 'hook') {
    // 훅 씬: 초반 임팩트 줌 — 최대 1.1배로 제한하여 음식 전체 샷 유지
    f.push(`zoompan=z='if(lte(on,10),1.1,min(zoom+0.0005,1.1))':d=${frames}:x='iw*${cx}-ow/zoom/2':y='ih*${cy}-oh/zoom/2':s=720x1280:fps=${fps}`);
  } else {
    // 일반 씬: 아주 미세하게 움직여 정지 화면 느낌 방지, 전체 샷 보존
    f.push(`zoompan=z='min(zoom+0.0002,1.1)':d=${frames}:x='iw*${cx}-ow/zoom/2':y='ih*${cy}-oh/zoom/2':s=720x1280:fps=${fps}`);
  }
  
  // 색감 LUT
  f.push(getColorLUT(theme));
  // 선명도 향상
  f.push('unsharp=3:3:1.0:3:3:0.0');
  // 필름 그레인 텍스처 (uniform noise)
  f.push('noise=alls=8:allf=u');
  f.push('setsar=1');

  // 첫 씬 제외: 짧은 컷 화이트 플래시 / 긴 컷 블랙 페이드인
  if (sceneIndex > 0) {
    if (dur < 1.0) {
      f.push('fade=t=in:st=0:d=0.15:color=white');
    } else {
      f.push('fade=t=in:st=0:d=0.2:color=black');
    }
  }

  // 마지막 씬에만 블랙 페이드아웃
  if (isLastScene && dur >= 0.6) {
    f.push(`fade=t=out:st=${(dur - 0.5).toFixed(3)}:d=0.5:color=black`);
  } else if (isLastScene) {
    f.push(`fade=t=out:st=0:d=${dur.toFixed(3)}:color=black`);
  }
  return f.join(',');
}

// ─── 자막 오버레이 필터 (fontPath 있을 때만) ─────────────
function getSubtitleFilter(scene, fontPath, isLastScene) {
  if (!fontPath || !scene.caption1) return null;
  const platform = useVideoStore.getState().targetPlatform || 'reels';
  
  // 특수문자 이스케이프 (ffmpeg drawtext)
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
  const fp = fontPath.replace(/\\/g, '/');
  
  // 9번: 플랫폼 버튼 높이에 따른 Y좌표 절대 방어 (틱톡은 더 높게)
  const bottomMargin = platform === 'tiktok' ? 580 : platform === 'shorts' ? 400 : 500;
  const safeY = 1280 - bottomMargin; 

  const filters = [];
  filters.push(`drawbox=y=${safeY - 40}:color=black@0.65:width=iw:height=200:t=fill`); // 다이내믹 섀도우 반영
  filters.push(`drawtext=fontfile='${fp}':text='${esc(scene.caption1.replace(/\*\*/g, ''))}':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=${safeY}`);

  // 12번: 마지막 씬(구독 유도)일 경우 커다란 CTA 이모지 팝업 애니메이션 
  if (isLastScene) {
    filters.push(`drawtext=fontfile='${fp}':text='💖':fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t,0.5,5)'`);
  }
  return filters.join(',');
}

/**
 * FFmpeg WASM으로 씬 배열을 720×1280 MP4로 합성
 * v2.19: 테마 LUT · Ken Burns · White Flash 전환 · 블랙 페이드아웃 · 자막 · 진행률
 *
 * @param {Array}    scenes      - script.scenes 배열 (focus_coords 포함)
 * @param {Array}    files       - videoStore.files [{file, url, type}]
 * @param {Object}   script      - 전체 스크립트 ({theme, vibe_color, ...})
 * @param {Function} onProgress  - (msg: string, pct: number) => void
 * @returns {Blob} 최종 video/mp4 Blob
 */
/**
 * aesthetic_score 기준 베스트 프레임을 Canvas로 추출하여 Blob 반환
 * FFmpeg 없이 프론트엔드 Canvas API만 사용 (빠름 + 디바이스 지원)
 */
export async function extractThumbnail(scenes, files, script, onProgress) {
  onProgress?.('썸네일 프레임 선정 중...');

  // aesthetic_score 가장 높은 씬 찾기
  let bestIdx = 0, bestScore = -1;
  (scenes || []).forEach((sc, i) => {
    const score = sc.aesthetic_score ?? sc.foodie_score ?? 0;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });

  const scene    = scenes[bestIdx];
  const fileIdx  = scene?.media_idx ?? bestIdx;
  const fileItem = files?.[fileIdx] ?? files?.[0];
  if (!fileItem) throw new Error('썸네일용 파일 없음');

  const canvas  = document.createElement('canvas');
  canvas.width  = 720;
  canvas.height = 1280;
  const ctx     = canvas.getContext('2d');

  if (fileItem.type === 'image') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = fileItem.url; });
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const sw = img.width * scale, sh = img.height * scale;
    ctx.drawImage(img, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
  } else {
    // 비디오: best_start_pct 시점으로 Seek
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = fileItem.url;
    video.muted = true;
    await new Promise(res => { video.onloadedmetadata = res; video.load(); });
    const seekTo = (scene?.best_start_pct ?? 0.25) * video.duration;
    video.currentTime = Math.max(0, Math.min(seekTo, video.duration - 0.1));
    await new Promise(res => { video.onseeked = res; });
    const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    const sw = video.videoWidth * scale, sh = video.videoHeight * scale;
    ctx.drawImage(video, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
  }

  // 자막 레이어 (미리보기용)
  if (scene?.caption1) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, canvas.height - 340, canvas.width, 180);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scene.caption1.substring(0, 14), canvas.width / 2, canvas.height - 278);
    if (scene?.caption2) {
      ctx.fillStyle = script?.vibe_color || '#FFEA00';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(scene.caption2.substring(0, 10), canvas.width / 2, canvas.height - 208);
    }
  }

  onProgress?.(`씬 ${bestIdx + 1}번 썸네일 완료 (aesthetic ${bestScore})`);
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('Blob 변환 실패')), 'image/jpeg', 0.92)
  );
}

export async function renderVideoWithFFmpeg(scenes, files, script, onProgress) {
  const report = (msg, pct) => {
    console.log('[FFmpeg]', msg);
    onProgress?.(msg, typeof pct === 'number' ? pct : undefined);
  };
  const theme = script?.theme || 'hansik';
  const FPS   = 25;

  report('FFmpeg 엔진 로딩 중... (최초 1회, 약 20~40초 소요)', 0);
  const ff = await getFFmpeg((logMsg) => {
    if (logMsg.includes('frame=') || logMsg.includes('time=')) report(logMsg);
  });

  // ── 자막 폰트 로딩 시도 ────────────────────────────────
  let fontPath = null;
  try {
    report('자막 폰트 로딩 중...', 2);
    const fontData = await fetchFile(FONT_TTF_URL);
    await ff.writeFile('subtitle_font.otf', fontData);
    fontPath = 'subtitle_font.otf';
    report('자막 폰트 로드 완료 ✓', 4);
  } catch (e) {
    console.warn('[FFmpeg] 폰트 로딩 실패 — 자막 없이 진행:', e.message);
  }

  const partFiles = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene      = scenes[i];
    const fileItem   = files[scene.media_idx ?? i] ?? files[i];
    if (!fileItem) continue;

    const pct = Math.round(5 + (i / scenes.length) * 80);
    report(`씬 ${i + 1}/${scenes.length} 인코딩 중...`, pct);

    const isVideo    = fileItem.type === 'video';
    const ext        = isVideo ? 'mp4' : 'jpg';
    const inputName  = `in_${i}.${ext}`;
    const outputName = `part_${i}.mp4`;
    // 블록 분리형 짧은 컷(0.5초 등)는 AI 설계 duration 보존
    const dur        = (scene.blockIdx !== undefined)
      ? Math.max(0.4, scene.duration || 0.5)
      : Math.max(2.0, scene.duration || 3.0);
    const isLast     = (i === scenes.length - 1);

    // 파일 가상 FS 기록
    const fileData = fileItem.file
      ? await fetchFile(fileItem.file)
      : await fetchFile(fileItem.url);
    await ff.writeFile(inputName, fileData);

    // 필터 체인 구성 (씬 인덱스 i 전달 → 트랜지션 효과)
    const focusCoords = scene.focus_coords || null;
    let vf = isVideo
      ? getVideoFilter(scene, theme, dur, isLast, i)
      : getImageFilter(scene, theme, dur, FPS, focusCoords, isLast, i);

    // 자막 오버레이 (폰트 로드 성공 시)
    const subtitleF = getSubtitleFilter(scene, fontPath, isLast);
    if (subtitleF) vf = vf + ',' + subtitleF;

    const inputLoopArgs = isVideo ? [] : ['-loop', '1'];
    const ssArgs = (isVideo && scene.best_start_pct > 0)
      ? ['-ss', (scene.best_start_pct * Math.max(dur * 2, 5)).toFixed(2)]
      : [];
    try {
      await ff.exec([
        ...inputLoopArgs,
        ...ssArgs,
        '-i', inputName,
        '-t', String(dur),
        '-vf', vf,
        '-r', String(FPS),
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26',
        '-pix_fmt', 'yuv420p', '-an',
        outputName,
      ]);
      partFiles.push(outputName);
    } catch (sceneErr) {
      console.warn(`[FFmpeg] 씬 ${i + 1} 인코딩 실패 — 건너뜁니다:`, sceneErr.message);
    }
    await ff.deleteFile(inputName).catch(() => {});
  }

  if (!partFiles.length) throw new Error('렌더링할 씬이 없습니다');

  // ── 씬 이어붙이기 ─────────────────────────────────────
  report('씬 합치는 중...', 88);
  const concatContent = partFiles.map(f => `file '${f}'`).join('\n');
  await ff.writeFile('concat.txt', new TextEncoder().encode(concatContent));

  await ff.exec([
    '-f', 'concat', '-safe', '0',
    '-i', 'concat.txt',
    '-c', 'copy',
    'output.mp4',
  ]);

  report('최종 파일 읽는 중...', 96);
  const data = await ff.readFile('output.mp4');
  report('✅ 렌더링 완료!', 100);

  // 임시 파일 정리
  for (const f of partFiles) ff.deleteFile(f).catch(() => {});
  ff.deleteFile('concat.txt').catch(() => {});
  ff.deleteFile('output.mp4').catch(() => {});
  if (fontPath) ff.deleteFile(fontPath).catch(() => {});

  return new Blob([data.buffer], { type: 'video/mp4' });
}

/**
 * 시네마틱 마감 주의 함수 — WebCodecs 원본에 LUT 입혀 최고화
 */
export async function renderCinematicFinish(blob, theme, onProgress) {
  const ff = await getFFmpeg();
  onProgress?.('시네마틱 마감 처리 중...', 10);
  await ff.writeFile('raw_input.mp4', await fetchFile(blob));
  const lut = getColorLUT(theme || 'hansik');
  await ff.exec([
    '-i', 'raw_input.mp4',
    '-vf', `${lut},unsharp=3:3:1.0:3:3:0.0`,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22',
    '-c:a', 'copy',
    'cinematic_out.mp4',
  ]);
  onProgress?.('완료!', 100);
  const data = await ff.readFile('cinematic_out.mp4');
  ff.deleteFile('raw_input.mp4').catch(() => {});
  ff.deleteFile('cinematic_out.mp4').catch(() => {});
  return new Blob([data.buffer], { type: 'video/mp4' });
}


