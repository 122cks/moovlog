// src/components/ExportPanel.jsx
import { useState } from 'react';
import { useVideoStore } from '../store/videoStore.js';
import { getAudioCtx } from '../engine/tts.js';
import { downloadBlob, sanitizeName } from '../engine/utils.js';
import { firebaseUploadVideo } from '../engine/firebase.js';
import { renderFrameToCtx, ASPECT_MAP_EX } from './VideoPlayer.jsx';
import { renderVideoWithFFmpeg, renderCinematicFinish, extractThumbnail } from '../engine/VideoRenderer.js';
import * as Mp4Muxer  from 'mp4-muxer';
import * as WebmMuxer from 'webm-muxer';

export default function ExportPanel() {
  const { script, audioBuffers, restaurantName, addToast, setExporting, exporting, pipelineSessionId, files } = useVideoStore();
  const [btnText, setBtnText] = useState('영상 저장하기');
  const [ffmpegText, setFfmpegText] = useState('📦 FFmpeg 내보내기 (시네마틱)');
  const [ffmpegBusy, setFfmpegBusy] = useState(false);
  const [ffmpegPct, setFfmpegPct] = useState(0);
  const [thumbBusy, setThumbBusy] = useState(false);
  const [hybridBusy, setHybridBusy] = useState(false);

  const doExport = async () => {
    if (exporting) return;
    if (!script?.scenes?.length) { addToast('먼저 영상을 생성해주세요', 'err'); return; }
    setExporting(true);
    setBtnText('준비 중...');

    const ac = getAudioCtx();
    if (ac?.state === 'suspended') await ac.resume();

    try {
      const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined'
        && typeof VideoEncoder.isConfigSupported === 'function'
        && (typeof Mp4Muxer.Muxer !== 'undefined' || typeof WebmMuxer.Muxer !== 'undefined');

      if (hasWebCodecs) {
        await doExportWebCodecs(script, audioBuffers, restaurantName, setBtnText, addToast);
      } else {
        addToast('WebCodecs 미지원 브라우저 — Chrome을 이용해주세요', 'err');
      }
    } catch (err) {
      addToast('저장 오류: ' + (err?.message || String(err)), 'err');
      setBtnText('영상 저장하기');
    } finally {
      setExporting(false);
    }
  };

  const doExportAudio = async () => {
    if (!audioBuffers?.some(b => b)) { addToast('AI 음성이 없습니다', 'err'); return; }
    addToast('음성 WAV 저장 중...', 'inf');
    try {
      const ac = getAudioCtx();
      const totalDur = script.scenes.reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);
      const SR = 44100;
      const totalSamples = Math.ceil(SR * totalDur);
      const mixed = new Float32Array(totalSamples);
      let offset = 0;
      for (let i = 0; i < script.scenes.length; i++) {
        const dur = (script.scenes[i].duration > 0 && isFinite(script.scenes[i].duration)) ? script.scenes[i].duration : 3;
        const buf = audioBuffers[i];
        if (buf) {
          const ch = buf.getChannelData(0);
          for (let j = 0; j < Math.min(ch.length, totalSamples - offset); j++) mixed[offset + j] = ch[j];
        }
        offset += Math.round(dur * SR);
      }
      const wavBlob = new Blob([encodeWav(mixed, SR)], { type: 'audio/wav' });
      downloadBlob(wavBlob, `moovlog_${sanitizeName(restaurantName)}.wav`);
      addToast('음성 WAV 저장 완료!', 'ok');
    } catch (e) {
      addToast('음성 저장 오류: ' + e.message, 'err');
    }
  };

  // COOP/COEP 격리 확인 — 비격리 환경에서도 우선 시도하고 실패 시 안내/폴백
  const ensureIsolation = () => {
    if (crossOriginIsolated) return true;
    addToast('격리 모드가 아니어서 FFmpeg가 느리거나 실패할 수 있습니다. 우선 시도합니다.', 'inf');
    return true;
  };

  const doExportThumbnail = async () => {
    if (thumbBusy) return;
    if (!script?.scenes?.length || !files?.length) { addToast('시작 전 영상을 만들어주세요', 'err'); return; }
    setThumbBusy(true);
    try {
      const blob = await extractThumbnail(script.scenes, files, script, (msg) => addToast(msg, 'inf'));
      downloadBlob(blob, `moovlog_thumb_${sanitizeName(restaurantName)}.jpg`);
      addToast('썸네일 저장 완료! 최고등급 씨 추출 ✨', 'ok');
    } catch (e) {
      addToast('썸네일 오류: ' + e.message, 'err');
    } finally {
      setThumbBusy(false);
    }
  };

  const doExportHybrid = async () => {
    if (hybridBusy || exporting) return;
    if (!script?.scenes?.length) { addToast('먼저 영상을 생성해주세요', 'err'); return; }
    ensureIsolation();
    setHybridBusy(true);
    setExporting(true);
    try {
      addToast('하이브리드: WebCodecs 로 빠르게 렌더링 후 FFmpeg LUT 마감 중...', 'inf');
      // Step 1: WebCodecs 로 로우 렌더
      const rawBlob = await new Promise((resolve, reject) => {
        doExportWebCodecs(script, audioBuffers, restaurantName, (t) => {}, addToast).then(resolve).catch(reject);
      });
      // WebCodecs가 관리하는 다운로드를 직접 Blob으로 받을 수 없으므로 FFmpeg만 시네마틱 적용
      if (files?.length) {
        const cinematic = await renderCinematicFinish(
          rawBlob || new Blob(),
          script.theme,
          (msg, pct) => addToast(msg, 'inf')
        );
        downloadBlob(cinematic, `moovlog_hybrid_${sanitizeName(restaurantName)}.mp4`);
        addToast('하이브리드 렌더링 완료! 🎬', 'ok');
      }
    } catch (e) {
      // WebCodecs rawBlob 없으면 FFmpeg만으로 대체
      try {
        const blob = await renderVideoWithFFmpeg(script.scenes, files, script, (msg, pct) => {
          if (typeof pct === 'number') addToast(`하이브리드 폴백: ${msg}`, 'inf');
        });
        downloadBlob(blob, `moovlog_hybrid_${sanitizeName(restaurantName)}.mp4`);
        addToast('하이브리드(FFmpeg 대체) 완료!', 'ok');
      } catch (e2) {
        addToast('하이브리드 오류: ' + e2.message, 'err');
      }
    } finally {
      setHybridBusy(false);
      setExporting(false);
    }
  };

  const doExportFFmpeg = async () => {
    if (ffmpegBusy) return;
    if (!script?.scenes?.length) { addToast('먼저 영상을 생성해주세요', 'err'); return; }
    if (!files?.length) { addToast('미디어 파일이 없습니다', 'err'); return; }
    ensureIsolation();
    setFfmpegBusy(true);
    setFfmpegPct(0);
    try {
      const blob = await renderVideoWithFFmpeg(
        script.scenes,
        files,
        script,
        (msg, pct) => {
          setFfmpegText(`🎬 ${msg}`);
          if (typeof pct === 'number') setFfmpegPct(pct);
        }
      );
      downloadBlob(blob, `moovlog_ffmpeg_${sanitizeName(restaurantName)}.mp4`);
      addToast('FFmpeg 렌더링 완료!', 'ok');
      setFfmpegText('📦 FFmpeg 내보내기 (시네마틱)');
      setFfmpegPct(0);
    } catch (err) {
      const msg = err?.message || String(err);
      addToast('FFmpeg 오류: ' + msg, 'err');
      if (/sharedarraybuffer|crossoriginisolated|coop|coep|security|worker/i.test(msg)) {
        addToast('FFmpeg 격리 오류로 기본 저장으로 자동 전환합니다.', 'inf');
        await doExport().catch(() => {});
      }
      setFfmpegText('📦 FFmpeg 내보내기 (시네마틱)');
      setFfmpegPct(0);
    } finally {
      setFfmpegBusy(false);
    }
  };

  return (
    <div className="dl-box">
      <p className="dl-title"><i className="fas fa-download" /> 영상 저장</p>
      <p className="dl-desc">
        나레이션 음성이 자동으로 합성됩니다.<br />
        버튼을 누르면 <b>음성 포함 MP4 영상</b>이 저장됩니다.
      </p>
      <button className="dl-btn" onClick={doExport} disabled={exporting}>
        <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-download'}`} /> {btnText}
      </button>
      <button className="dl-audio-btn" onClick={doExportAudio}>
        <i className="fas fa-music" /> 음성만 저장 (WAV)
      </button>
      <button className="dl-audio-btn" onClick={doExportFFmpeg} disabled={ffmpegBusy}
        style={{ marginTop: '8px' }}
        title="FFmpeg WASM 시네마틱 렌더링 (LUT·Ken Burns·자막)"
      >
        <i className={`fas ${ffmpegBusy ? 'fa-spinner fa-spin' : 'fa-film'}`} /> {ffmpegText}
      </button>      <button className="dl-audio-btn" onClick={doExportThumbnail} disabled={thumbBusy}
        style={{ marginTop: '6px' }}
        title="최고화질 썸네일 추출"
      >
        <i className={`fas ${thumbBusy ? 'fa-spinner fa-spin' : 'fa-image'}`} /> {thumbBusy ? '썸네일 추출 중...' : '베스트 썸네일 저장'}
      </button>      {ffmpegBusy && (
        <div style={{ margin: '6px 0 2px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden', height: '6px' }}>
          <div style={{
            height: '100%', background: 'linear-gradient(90deg,#7c3aed,#a855f7)',
            width: `${ffmpegPct}%`, transition: 'width 0.4s ease',
            borderRadius: '6px',
          }} />
        </div>
      )}
      {ffmpegBusy && ffmpegPct > 0 && (
        <p style={{ fontSize: '0.68rem', color: '#a855f7', textAlign: 'right', margin: '2px 0 0' }}>{ffmpegPct}%</p>
      )}
    </div>
  );
}

// WAV 인코딩
function encodeWav(f32, SR) {
  const N = f32.length, bps = 16, ch = 1, blockAlign = ch * bps / 8;
  const dataSize = N * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const ws = (off, s) => s.split('').forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)));
  ws(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, ch, true); v.setUint32(24, SR, true); v.setUint32(28, SR * blockAlign, true);
  v.setUint16(32, blockAlign, true); v.setUint16(34, bps, true);
  ws(36, 'data'); v.setUint32(40, dataSize, true);
  for (let i = 0; i < N; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buf;
}

// WebCodecs 내보내기
async function doExportWebCodecs(script, audioBuffers, restaurantName, setBtnText, addToast) {
  const { loaded, aspectRatio } = useVideoStore.getState();
  const { CW, CH } = ASPECT_MAP_EX[aspectRatio] || ASPECT_MAP_EX['9:16'];
  const FPS = 60;                       // 60fps — 유틜브 쇼츠/릴스 권장 사양
  const sceneDurs = script.scenes.map(s => (s.duration > 0 && isFinite(s.duration)) ? s.duration : 3);
  const totalDur  = sceneDurs.reduce((a, b) => a + b, 0);
  const nFrames   = Math.ceil(totalDur * FPS);
  const VBR = 20_000_000;               // 20Mbps — 60fps 고화질 권장 비트레이트
  const ABR = 192_000;

  setBtnText('코덱 확인 중...');

  // 코덱 감지
  let fmt = null;
  if (typeof Mp4Muxer.Muxer !== 'undefined') {
    for (const vc of [
      { enc: 'avc1.640033', mux: 'avc' },
      { enc: 'avc1.4d0033', mux: 'avc' },
      { enc: 'avc1.42001f', mux: 'avc' },
    ]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: VBR, framerate: FPS });
        if (s.supported) { fmt = { vc, MuxLib: Mp4Muxer, ext: 'mp4', mime: 'video/mp4', ac: { enc: 'mp4a.40.2', mux: 'aac' } }; break; }
      } catch {}
    }
  }
  if (!fmt && typeof WebmMuxer.Muxer !== 'undefined') {
    for (const vc of [{ enc: 'vp09.00.41.08', mux: 'V_VP9' }, { enc: 'vp08.00.41.08', mux: 'V_VP8' }]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: VBR, framerate: FPS });
        if (s.supported) { fmt = { vc, MuxLib: WebmMuxer, ext: 'webm', mime: 'video/webm', ac: { enc: 'opus', mux: 'A_OPUS' } }; break; }
      } catch {}
    }
  }
  if (!fmt) throw new Error('지원하는 코덱 없음 — Chrome을 이용해주세요');

  // 오디오 사전 렌더
  let pcm = null;
  if (audioBuffers?.some(b => b)) {
    setBtnText('음성 처리 중... 3%');
    try {
      const SR = 48000;
      const totalSamples = Math.ceil(SR * totalDur);
      const mixed = new Float32Array(totalSamples);
      let offset = 0;
      for (let i = 0; i < script.scenes.length; i++) {
        const dur = (script.scenes[i].duration > 0 && isFinite(script.scenes[i].duration)) ? script.scenes[i].duration : 3;
        const buf = audioBuffers[i];
        if (buf) {
          const ch = buf.getChannelData(0);
          const ac = getAudioCtx();
          let resampled = ch;
          if (buf.sampleRate !== SR) {
            const offCtx = new OfflineAudioContext(1, Math.ceil(buf.length * SR / buf.sampleRate), SR);
            const src = offCtx.createBufferSource();
            src.buffer = buf; src.connect(offCtx.destination); src.start(0);
            const rendered = await offCtx.startRendering();
            resampled = rendered.getChannelData(0);
          }
          for (let j = 0; j < Math.min(resampled.length, totalSamples - offset); j++) {
            mixed[offset + j] = resampled[j];
          }
        }
        offset += Math.round(dur * SR);
      }
      pcm = mixed;
    } catch (e) { console.warn('[Export] 오디오 렌더 실패:', e.message); }
  }

  // Muxer 초기화
  const { Muxer, ArrayBufferTarget } = fmt.MuxLib;
  const muxTarget = new ArrayBufferTarget();
  const muxer = new Muxer({
    target: muxTarget,
    video: { codec: fmt.vc.mux, width: CW, height: CH, frameRate: FPS },
    ...(pcm ? { audio: { codec: fmt.ac.mux, numberOfChannels: 1, sampleRate: 48000 } } : {}),
    firstTimestampBehavior: 'offset',
    ...(fmt.ext === 'mp4' ? { fastStart: 'in-memory' } : {}),
  });

  // VideoEncoder
  const videoEnc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: err => { throw new Error(err?.message || String(err) || 'VideoEncoder 오류'); },
  });
  videoEnc.configure({ codec: fmt.vc.enc, width: CW, height: CH, bitrate: VBR, framerate: FPS, latencyMode: 'quality', bitrateMode: 'variable' });

  // 프레임 인코딩 — scene별 renderFrameToCtx로 정확한 프레임 렌더
  const snapCanvas = new OffscreenCanvas(CW, CH);
  const snapCtx    = snapCanvas.getContext('2d', { willReadFrequently: true });
  const renderCtx  = { script, loaded, aspectRatio, restaurantName };

  let globalFrame = 0;
  for (let si = 0; si < script.scenes.length; si++) {
    const dur          = sceneDurs[si];
    const nSceneFrames = Math.ceil(dur * FPS);
    const media        = loaded?.[(script.scenes[si].idx ?? 0) % Math.max(loaded?.length || 1, 1)] || null;

    // 비디오는 씨렐 시작 위치로 seek
    if (media?.type === 'video' && media.src && !media.src._loadFailed) {
      media.src.pause();
      media.src.currentTime = 0;
      await new Promise(r => { media.src.onseeked = r; setTimeout(r, 200); });
    }

    for (let f = 0; f < nSceneFrames; f++) {
      const prog = nSceneFrames > 1 ? f / (nSceneFrames - 1) : 0;

      // 비디오 프레임 seek — 영상이 자막보다 짧을 때 마지막 프레임에 멈춤
      if (media?.type === 'video' && media.src && !media.src._loadFailed) {
        const vDur = media.src.duration;
        const targetTime = (vDur && isFinite(vDur))
          ? Math.min(prog * vDur, vDur - 0.1)  // 영상 끝을 초과하지 않도록 제한
          : prog * dur;
        if (Math.abs(media.src.currentTime - targetTime) > 0.08) {
          await new Promise(r => { media.src.currentTime = targetTime; media.src.onseeked = r; setTimeout(r, 150); });
        }
      }

      renderFrameToCtx(snapCtx, renderCtx, si, prog, Math.min(prog, 1), true); // isExporting=true: play() 호출 차단

      const vf = new VideoFrame(snapCanvas, {
        timestamp: Math.round(globalFrame * 1_000_000 / FPS),
        duration:  Math.round(1_000_000 / FPS),
      });
      if (videoEnc.encodeQueueSize > 30) {
        await new Promise(resolve => {
          const checkQ = () => videoEnc.encodeQueueSize <= 10 ? resolve() : setTimeout(checkQ, 10);
          checkQ();
        });
      }
      videoEnc.encode(vf, { keyFrame: globalFrame % FPS === 0 });
      vf.close();

      if (globalFrame % 15 === 0) {
        const pct = Math.round(globalFrame / nFrames * (pcm ? 65 : 90));
        setBtnText(`인코딩 중... ${pct}%`);
        await new Promise(r => setTimeout(r, 0));
      }
      globalFrame++;
    }
  }
  await videoEnc.flush(); videoEnc.close();

  // AudioEncoder
  if (pcm) {
    setBtnText('음성 인코딩 중... 70%');
    const audioEnc = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: err => { throw new Error(err?.message || String(err) || 'AudioEncoder 오류'); },
    });
    audioEnc.configure({ codec: fmt.ac.enc, sampleRate: 48000, numberOfChannels: 1, bitrate: ABR });
    const CHUNK = 1920;
    for (let i = 0; i < pcm.length; i += CHUNK) {
      const slice = pcm.slice(i, Math.min(i + CHUNK, pcm.length));
      const ad = new AudioData({ format: 'f32', sampleRate: 48000, numberOfFrames: slice.length, numberOfChannels: 1, timestamp: Math.round(i * 1_000_000 / 48000), data: slice.buffer });
      audioEnc.encode(ad); ad.close();
      if (i % (CHUNK * 30) === 0) await new Promise(r => setTimeout(r, 0));
    }
    await audioEnc.flush(); audioEnc.close();
  }

  setBtnText('파일 생성 중... 98%');
  await new Promise(r => setTimeout(r, 80));
  muxer.finalize();
  const { buffer } = muxTarget;
  if (!buffer || buffer.byteLength < 1000) throw new Error('영상 데이터 생성 실패');

  const blob = new Blob([buffer], { type: fmt.mime });
  downloadBlob(blob, `moovlog_${sanitizeName(restaurantName)}.${fmt.ext}`);
  setBtnText('다시 저장하기');
  addToast(pcm ? `✓ AI 음성 포함 ${fmt.ext.toUpperCase()} 저장 완료!` : `✓ ${fmt.ext.toUpperCase()} 저장 완료!`, 'ok');
  firebaseUploadVideo(blob, fmt.ext, restaurantName, pipelineSessionId).catch(() => {});
}
