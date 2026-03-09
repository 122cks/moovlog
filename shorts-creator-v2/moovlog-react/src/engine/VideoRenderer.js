// src/engine/VideoRenderer.js
// FFmpeg WASM 기반 영상 렌더러 — 시네마틱 LUT · Ken Burns · 전환 효과 · 자막 포함
// ⚠️ SharedArrayBuffer가 필요합니다. COOP/COEP 헤더가 설정된 환경에서만 동작합니다.

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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
    cafe:    'curves=preset=vintage,eq=saturation=1.15:brightness=0.03:contrast=1.05',
    grill:   'eq=contrast=1.2:saturation=1.5:brightness=-0.05,unsharp=3:3:1.0:3:3:0.0',
    hansik:  'eq=saturation=1.1:contrast=1.05,unsharp=2:2:0.5:2:2:0.0',
    premium: 'eq=contrast=1.1:saturation=0.92:brightness=0.04,curves=r=\'0/0 0.5/0.46 1/0.9\'',
    pub:     'eq=saturation=1.3:contrast=1.1:brightness=-0.02,unsharp=2:2:0.6:2:2:0.0',
    seafood: 'eq=saturation=1.2:hue=3:brightness=0.02,unsharp=2:2:0.8:2:2:0.0',
    chinese: 'eq=saturation=1.4:contrast=1.15:brightness=-0.03,unsharp=2:2:0.5:2:2:0.0',
  };
  return LUTs[theme] || LUTs.hansik;
}

// ─── 비디오용 마스터 필터 (색감 + Flash 전환) ────────────
function getVideoFilter(scene, theme, dur, isLastScene) {
  const f = [];
  const flashDur = Math.min(0.12, dur * 0.05).toFixed(3);

  // 기본 해상도 / 크롭
  f.push('scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1');
  // ★ Freeze Frame: 영상 소스가 scene.duration보다 짧을 때 마지막 프레임 정지 ("틱틱" 반복 방지)
  // tpad가 최대 30초 분량의 동결 프레임을 추가하고, -t ${dur} 아웃풋 옵션이 정확히 잘라냄
  f.push('tpad=stop_mode=clone:stop_duration=30');
  // 색감 LUT
  f.push(getColorLUT(theme));
  // Flash 전환 — 씬 시작 화이트 플래시 인
  f.push(`fade=t=in:st=0:d=${flashDur}:color=white`);
  // Flash 전환 — 씬 끝 화이트 플래시 아웃 (마지막 씬은 블랙 페이드아웃)
  if (isLastScene) {
    f.push(`fade=t=out:st=${(dur - 0.5).toFixed(3)}:d=0.5:color=black`);
  } else {
    f.push(`fade=t=out:st=${(dur - flashDur).toFixed(3)}:d=${flashDur}:color=white`);
  }
  return f.join(',');
}

// ─── 이미지용 마스터 필터 (Ken Burns + 색감 + Flash 전환) ─
function getImageFilter(scene, theme, dur, fps, focusCoords, isLastScene) {
  const f = [];
  const frames = Math.ceil(dur * fps);
  const flashDur = Math.min(0.12, dur * 0.05).toFixed(3);
  // 중심점 (focus_coords || 화면 중앙 약간 위)
  const cx = (focusCoords?.x ?? 0.5).toFixed(4);
  const cy = (focusCoords?.y ?? 0.45).toFixed(4);

  // Ken Burns: 1440x2560으로 업스케일 후 zoompan으로 720x1280 출력
  f.push('scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560');
  f.push(
    `zoompan=z='min(zoom+0.0008,1.3)':` +
    `d=${frames}:` +
    `x='iw*${cx}-ow/zoom/2':` +
    `y='ih*${cy}-oh/zoom/2':` +
    `s=720x1280:fps=${fps}`
  );
  // 색감 LUT
  f.push(getColorLUT(theme));
  // 선명도 향상
  f.push('unsharp=3:3:1.0:3:3:0.0');
  f.push('setsar=1');
  // Flash 전환
  f.push(`fade=t=in:st=0:d=${flashDur}:color=white`);
  if (isLastScene) {
    f.push(`fade=t=out:st=${(dur - 0.5).toFixed(3)}:d=0.5:color=black`);
  } else {
    f.push(`fade=t=out:st=${(dur - flashDur).toFixed(3)}:d=${flashDur}:color=white`);
  }
  return f.join(',');
}

// ─── 자막 오버레이 필터 (fontPath 있을 때만) ─────────────
function getSubtitleFilter(scene, fontPath) {
  if (!fontPath || !scene.caption1) return null;
  // 특수문자 이스케이프 (ffmpeg drawtext)
  const esc = (s) => String(s || '')
    .replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    .replace(/:/g, '\\:').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
    .substring(0, 25);

  const fp = fontPath.replace(/\\/g, '/');
  const filters = [];
  // 자막 배경 그라데이션 박스 (세이프 존)
  filters.push(`drawbox=y=ih-440:color=black@0.55:width=iw:height=290:t=fill`);
  // caption1 (메인)
  filters.push(
    `drawtext=fontfile='${fp}':text='${esc(scene.caption1)}':` +
    `fontsize=54:fontcolor=white:x=(w-text_w)/2:y=h-415:` +
    `borderw=2:bordercolor=black@0.8`
  );
  // caption2 (서브)
  if (scene.caption2) {
    filters.push(
      `drawtext=fontfile='${fp}':text='${esc(scene.caption2)}':` +
      `fontsize=36:fontcolor=yellow:x=(w-text_w)/2:y=h-330:` +
      `borderw=1:bordercolor=black@0.8`
    );
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
    const dur        = Math.max(2.0, scene.duration || 3.0);
    const isLast     = (i === scenes.length - 1);

    // 파일 가상 FS 기록
    const fileData = fileItem.file
      ? await fetchFile(fileItem.file)
      : await fetchFile(fileItem.url);
    await ff.writeFile(inputName, fileData);

    // 필터 체인 구성
    const focusCoords = scene.focus_coords || null;
    let vf = isVideo
      ? getVideoFilter(scene, theme, dur, isLast)
      : getImageFilter(scene, theme, dur, FPS, focusCoords, isLast);

    // 자막 오버레이 (폰트 로드 성공 시)
    const subtitleF = getSubtitleFilter(scene, fontPath);
    if (subtitleF) vf = vf + ',' + subtitleF;

    const inputLoopArgs = isVideo ? [] : ['-loop', '1'];
    await ff.exec([
      ...inputLoopArgs,
      '-i', inputName,
      '-t', String(dur),
      '-vf', vf,
      '-r', String(FPS),
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26',
      '-pix_fmt', 'yuv420p', '-an',
      outputName,
    ]);

    partFiles.push(outputName);
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

