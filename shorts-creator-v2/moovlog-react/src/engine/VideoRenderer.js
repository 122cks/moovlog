// src/engine/VideoRenderer.js
// FFmpeg WASM 기반 영상 렌더러 — 기존 WebCodecs 렌더러의 보조 옵션
// ⚠️ SharedArrayBuffer가 필요합니다. COOP/COEP 헤더가 설정된 환경에서만 동작합니다.

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

let ffmpegInstance = null;
let isLoading = false;

async function getFFmpeg(onLog) {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (isLoading) {
    // 이미 로딩 중이면 완료될 때까지 대기
    while (isLoading) await new Promise(r => setTimeout(r, 200));
    return ffmpegInstance;
  }
  isLoading = true;
  const ff = new FFmpeg();
  if (onLog) ff.on('log', ({ message }) => onLog(message));
  await ff.load({
    coreURL:   await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL:   await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  ffmpegInstance = ff;
  isLoading = false;
  return ff;
}

/**
 * FFmpeg WASM으로 씬 배열을 720×1280 MP4로 합성
 * @param {Array}    scenes       - script.scenes 배열
 * @param {Array}    files        - videoStore.files [{file, url, type}]
 * @param {Function} onProgress  - (msg: string) => void  진행 콜백
 * @returns {Blob} 최종 video/mp4 Blob
 */
export async function renderVideoWithFFmpeg(scenes, files, onProgress) {
  const report = (msg) => { console.log('[FFmpeg]', msg); onProgress?.(msg); };

  report('FFmpeg 엔진 로딩 중... (최초 1회, 약 20~40초 소요)');
  const ff = await getFFmpeg((logMsg) => {
    if (logMsg.includes('frame=') || logMsg.includes('time=')) report(logMsg);
  });

  const partFiles = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const fileItem = files[scene.media_idx ?? i] ?? files[i];
    if (!fileItem) continue;

    report(`씬 ${i + 1}/${scenes.length} 인코딩 중...`);

    const isVideo = fileItem.type === 'video';
    const ext = isVideo ? 'mp4' : 'jpg';
    const inputName  = `in_${i}.${ext}`;
    const outputName = `part_${i}.mp4`;

    // 파일/blob URL을 FFmpeg 가상 파일시스템에 기록
    const fileData = fileItem.file
      ? await fetchFile(fileItem.file)
      : await fetchFile(fileItem.url);
    await ff.writeFile(inputName, fileData);

    const dur = String(Math.max(2.0, scene.duration || 3.0));
    const scale = 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1';

    if (isVideo) {
      await ff.exec([
        '-i', inputName,
        '-t', dur,
        '-vf', scale,
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
        '-pix_fmt', 'yuv420p', '-an',
        outputName,
      ]);
    } else {
      // 정지 이미지 → duration 길이의 영상으로 변환
      await ff.exec([
        '-loop', '1', '-i', inputName,
        '-t', dur,
        '-vf', scale,
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
        '-pix_fmt', 'yuv420p',
        outputName,
      ]);
    }

    partFiles.push(outputName);

    // 임시 입력 파일 삭제 (메모리 절약)
    await ff.deleteFile(inputName).catch(() => {});
  }

  if (!partFiles.length) throw new Error('렌더링할 씬이 없습니다');

  // Concat list 작성
  report('씬 합치는 중...');
  const concatContent = partFiles.map(f => `file '${f}'`).join('\n');
  await ff.writeFile('concat.txt', new TextEncoder().encode(concatContent));

  await ff.exec([
    '-f', 'concat', '-safe', '0',
    '-i', 'concat.txt',
    '-c', 'copy',
    'output.mp4',
  ]);

  const data = await ff.readFile('output.mp4');
  report('완료!');

  // 임시 파일 정리
  for (const f of partFiles) ff.deleteFile(f).catch(() => {});
  ff.deleteFile('concat.txt').catch(() => {});
  ff.deleteFile('output.mp4').catch(() => {});

  return new Blob([data.buffer], { type: 'video/mp4' });
}
