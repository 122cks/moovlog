/* ============================================================
   export/webcodecs.ts — WebCodecs + webm-muxer 영상 내보내기
   VideoEncoder/AudioEncoder 오류를 Error 객체로 래핑하여
   "[object DOMException]" 표출 방지.
   ============================================================ */
import { Muxer, ArrayBufferTarget } from 'webm-muxer';
import type { LoadedMedia, VideoScript } from '@/types/state';
import type { TemplateKey } from '@/types/state';
import { getTemplate } from '@/config/templates';
import {
  drawMedia, drawVignette, drawColorGrade, drawSubtitle, drawLetterbox,
  CW, CH,
} from '@/render/canvas';

export const FPS       = 30;
export const BITRATE_V = 4_000_000;  // 4Mbps
export const BITRATE_A = 128_000;    // 128kbps

export interface ExportOptions {
  script:       VideoScript;
  loaded:       LoadedMedia[];
  audioBuffers: AudioBuffer[];
  template:     TemplateKey;
  onProgress:   (pct: number) => void;
}

export async function exportWebCodecs(opts: ExportOptions): Promise<Blob> {
  const { script, loaded, audioBuffers, template, onProgress } = opts;
  const tplConfig = getTemplate(template);

  const totalDuration = script.scenes.reduce((s, sc) => s + sc.duration, 0);
  const totalFrames   = Math.ceil(totalDuration * FPS);

  const canvas  = new OffscreenCanvas(CW, CH);
  const ctx     = canvas.getContext('2d')!;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video:  { codec: 'V_VP9', width: CW, height: CH, frameRate: FPS },
    audio:  { codec: 'A_OPUS', numberOfChannels: 2, sampleRate: 48_000 },
  });

  /* ── VideoEncoder ── */
  let videoEncErr: Error | null = null;
  const videoEnc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error:  (err) => { videoEncErr = new Error(err?.message ?? String(err) ?? 'VideoEncoder 오류'); },
  });
  videoEnc.configure({
    codec:      'vp09.00.10.08',
    width:      CW,
    height:     CH,
    bitrate:    BITRATE_V,
    framerate:  FPS,
    latencyMode:'quality',
  });

  /* ── AudioEncoder ── */
  let audioEncErr: Error | null = null;
  const audioEnc = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error:  (err) => { audioEncErr = new Error(err?.message ?? String(err) ?? 'AudioEncoder 오류'); },
  });
  audioEnc.configure({
    codec:           'opus',
    numberOfChannels: 2,
    sampleRate:      48_000,
    bitrate:         BITRATE_A,
  });

  /* ── 씬별 프레임 인코딩 ── */
  let globalFrame = 0;
  let sceneStart  = 0;

  for (const sc of script.scenes) {
    const scFrames = Math.ceil(sc.duration * FPS);
    const media    = loaded[sc.media_idx];

    for (let f = 0; f < scFrames; f++) {
      if (videoEncErr) throw videoEncErr;
      if (audioEncErr) throw audioEncErr;

      const prog     = Math.min(f / scFrames, 1);
      const timestampUs = Math.round((globalFrame / FPS) * 1_000_000);

      ctx.clearRect(0, 0, CW, CH);
      if (media) drawMedia(ctx as unknown as CanvasRenderingContext2D, media, sc.effect, prog);
      drawColorGrade(ctx as unknown as CanvasRenderingContext2D, tplConfig.style.colorGrade.r, tplConfig.style.colorGrade.g, tplConfig.style.colorGrade.b);
      drawVignette(ctx as unknown as CanvasRenderingContext2D, tplConfig.style);
      if (tplConfig.style.letterbox) drawLetterbox(ctx as unknown as CanvasRenderingContext2D);
      drawSubtitle(ctx as unknown as CanvasRenderingContext2D, sc, tplConfig.caption, Math.min(prog * 3, 1));

      const frame = new VideoFrame(canvas, {
        timestamp: timestampUs,
        duration:  Math.round(1_000_000 / FPS),
      });
      videoEnc.encode(frame, { keyFrame: globalFrame % (FPS * 2) === 0 });
      frame.close();

      globalFrame++;
      onProgress(globalFrame / totalFrames * 0.8); // 80%까지 인코딩
    }

    // 씬 오디오 인코딩
    const audioBuf = audioBuffers[script.scenes.indexOf(sc)];
    if (audioBuf) {
      encodeAudioBuffer(audioEnc, audioBuf, sceneStart);
    }
    sceneStart += sc.duration;
  }

  await videoEnc.flush();
  await audioEnc.flush();
  if (videoEncErr) throw videoEncErr;
  if (audioEncErr) throw audioEncErr;

  muxer.finalize();
  onProgress(1.0);

  const { buffer } = muxer.target as ArrayBufferTarget;
  return new Blob([buffer], { type: 'video/webm' });
}

function encodeAudioBuffer(enc: AudioEncoder, buf: AudioBuffer, offsetSec: number): void {
  const sampleRate  = buf.sampleRate;
  const numChannels = Math.min(buf.numberOfChannels, 2);
  const chunkFrames = 1024;
  const totalFrames = buf.length;

  for (let start = 0; start < totalFrames; start += chunkFrames) {
    const len   = Math.min(chunkFrames, totalFrames - start);
    const data  = new Float32Array(len * numChannels);

    for (let ch = 0; ch < numChannels; ch++) {
      const chanData = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i * numChannels + ch] = chanData[start + i];
      }
    }

    const audioData = new AudioData({
      format:          'f32-planar',
      sampleRate,
      numberOfFrames:  len,
      numberOfChannels: numChannels,
      timestamp:       Math.round((offsetSec + start / sampleRate) * 1_000_000),
      data,
    });
    enc.encode(audioData);
    audioData.close();
  }
}
