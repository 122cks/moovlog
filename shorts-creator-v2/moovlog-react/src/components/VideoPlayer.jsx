// src/components/VideoPlayer.jsx
// Canvas + 재생 루프 — React ref로 엔진 격리, 상태는 Zustand

import { useEffect, useRef, useCallback } from 'react';
import { useVideoStore } from '../store/videoStore.js';
import { getAudioCtx, getAudioMixDest } from '../engine/tts.js';

// ── 캔버스 크기 매핑 ─────────────────────────────────────
const ASPECT_MAP = {
  '9:16':  { CW: 1080, CH: 1920 },
  '1:1':   { CW: 1080, CH: 1080 },
  '16:9':  { CW: 1920, CH: 1080 },
};

export default function VideoPlayer() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);   // { raf, currentAudio, audioStartTs, startTs }

  const {
    script, loaded, audioBuffers, playing, muted, scene,
    aspectRatio, subAnimProg, restaurantName,
    setPlaying, setScene, setSubAnimProg, addToast,
  } = useVideoStore();

  // ── 캔버스 크기 동적 설정 ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { CW, CH } = ASPECT_MAP[aspectRatio] || ASPECT_MAP['9:16'];
    canvas.width  = CW;
    canvas.height = CH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }, [aspectRatio]);

  // ── 씬 오디오 재생 ────────────────────────────────────────
  const playSceneAudio = useCallback((si, forExport = false) => {
    const ac   = getAudioCtx();
    const dest = getAudioMixDest();
    if (!ac || !audioBuffers?.[si]) return;

    const buf = audioBuffers[si];
    const eng = engineRef.current;

    // 기존 오디오 정지
    if (eng?.currentAudio) {
      try { eng.currentAudio.stop(); } catch (_) {}
    }

    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    if (dest && !muted) src.connect(dest);
    src.start(0);
    if (eng) {
      eng.currentAudio  = src;
      eng.audioStartTs  = ac.currentTime;
    }
  }, [audioBuffers, muted]);

  const stopAudio = useCallback(() => {
    const eng = engineRef.current;
    if (eng?.currentAudio) {
      try { eng.currentAudio.stop(); } catch (_) {}
      eng.currentAudio = null;
    }
  }, []);

  // ── 렌더 프레임 ───────────────────────────────────────────
  const renderFrame = useCallback((si, prog, subAnim) => {
    const canvas = canvasRef.current;
    if (!canvas || !script?.scenes?.[si]) return;
    const { CW, CH } = ASPECT_MAP[aspectRatio] || ASPECT_MAP['9:16'];
    const ctx  = canvas.getContext('2d');
    const SCALE = Math.min(CW, CH) / 720;
    const sc   = script.scenes[si];
    const media = loaded?.[(sc.idx ?? 0) % (loaded?.length || 1)] || null;

    ctx.clearRect(0, 0, CW, CH);
    drawMedia(ctx, media, sc.effect, prog, CW, CH, SCALE);
    drawVignetteGrad(ctx, CW, CH);
    drawChannelTop(ctx, restaurantName, CW, CH, SCALE);
    drawSubtitle(ctx, sc, subAnim ?? subAnimProg, CW, CH, SCALE);

    // 씬 진입 flash burst
    if (prog < 0.10) {
      const flashT = 1 - prog / 0.10;
      ctx.fillStyle = `rgba(255,255,255,${flashT * 0.45})`;
      ctx.fillRect(0, 0, CW, CH);
    }
  }, [script, loaded, aspectRatio, subAnimProg, restaurantName]);

  // ── tick 루프 ─────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !script) return;
    const eng = engineRef.current || {};
    engineRef.current = eng;
    eng.startTs = null;

    const { CW, CH } = ASPECT_MAP[aspectRatio] || ASPECT_MAP['9:16'];

    const run = now => {
      const store = useVideoStore.getState();
      if (!store.playing) return;

      if (eng.startTs === null) eng.startTs = now;

      const si  = store.scene;
      const sc  = store.script?.scenes?.[si];
      if (!sc) { setPlaying(false); return; }

      const dur = (sc.duration > 0 && isFinite(sc.duration)) ? sc.duration : 3;

      // 오디오 싱크 기준
      const ac = getAudioCtx();
      const hasAudio = store.audioBuffers?.[si] && eng.currentAudio;
      const el = hasAudio && ac
        ? ac.currentTime - (eng.audioStartTs || 0)
        : (now - eng.startTs) / 1000;

      const prog = Math.min(el / dur, 1);

      // 진행바 업데이트
      const total = store.script.scenes.reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);
      const done  = store.script.scenes.slice(0, si).reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);
      const pct   = Math.min((done + el) / total * 100, 100);

      // 진행바 DOM 직접 업데이트 (React re-render 없이)
      const vp = document.getElementById('vProgReact');
      if (vp) vp.style.width = pct + '%';

      // 자막 prog
      setSubAnimProg(Math.min(prog, 1));

      // 렌더링
      try {
        const TD = Math.min(0.28, dur * 0.15);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (el >= dur - TD && si < store.script.scenes.length - 1) {
            drawTransition(ctx, store, si, Math.min((el - (dur - TD)) / TD, 1), loaded, aspectRatio, CW, CH, Math.min(CW, CH) / 720, store.subAnimProg);
          } else {
            renderFrame(si, prog, Math.min(prog, 1));
          }
        }
      } catch (err) {
        console.error('[tick] 렌더링 에러:', err.message);
      }

      // 씬 전환
      if (prog >= 1) {
        if (si < store.script.scenes.length - 1) {
          const nextSi = si + 1;
          setScene(nextSi);
          eng.startTs    = null;
          setSubAnimProg(0);
          if (!store.muted) playSceneAudio(nextSi);
        } else {
          setPlaying(false);
          stopAudio();
          const overlay = document.getElementById('repeatOverlayReact');
          if (overlay) overlay.hidden = false;
          return;
        }
      }

      eng.raf = requestAnimationFrame(run);
    };

    playSceneAudio(useVideoStore.getState().scene);
    eng.raf = requestAnimationFrame(run);

    return () => {
      if (eng.raf) cancelAnimationFrame(eng.raf);
    };
  }, [playing]);

  // ── 재생 시작 시 씬 초기 렌더 ────────────────────────────
  useEffect(() => {
    if (!playing && script && loaded?.length) {
      renderFrame(scene, 0, 0);
    }
  }, [scene, script, loaded]);

  const togglePlay = useCallback(() => {
    const ac = getAudioCtx();
    if (ac?.state === 'suspended') ac.resume().catch(() => {});
    if (playing) {
      stopAudio();
      setPlaying(false);
      if (engineRef.current?.raf) cancelAnimationFrame(engineRef.current.raf);
    } else {
      document.getElementById('repeatOverlayReact')?.setAttribute('hidden', '');
      setPlaying(true);
    }
  }, [playing, stopAudio, setPlaying]);

  const doReplay = useCallback(() => {
    stopAudio();
    setPlaying(false);
    setScene(0);
    setSubAnimProg(0);
    if (engineRef.current) { engineRef.current.startTs = null; }
    document.getElementById('repeatOverlayReact')?.setAttribute('hidden', '');
    setTimeout(() => setPlaying(true), 80);
  }, [stopAudio, setPlaying, setScene, setSubAnimProg]);

  const toggleMute = useCallback(() => {
    useVideoStore.getState().setMuted(!muted);
  }, [muted]);

  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="phone-notch" />
        <div className="phone-screen" onClick={togglePlay}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

          {/* 유튜브 UI 오버레이 */}
          <YtInfoOverlay script={script} />

          {/* 진행바 */}
          <div className="yt-progress-bar">
            <div className="yt-progress-fill" id="vProgReact" style={{ width: '0%' }} />
          </div>

          {/* 반복 재생 오버레이 */}
          <div id="repeatOverlayReact" className="repeat-overlay" hidden>
            <div className="repeat-box">
              <p className="repeat-question">계속 반복하시겠습니까?</p>
              <div className="repeat-btns">
                <button className="repeat-btn repeat-yes" onClick={e => { e.stopPropagation(); doReplay(); }}>
                  <i className="fas fa-redo" /> 네, 다시 보기
                </button>
                <button className="repeat-btn repeat-no" onClick={e => { e.stopPropagation(); document.getElementById('repeatOverlayReact')?.setAttribute('hidden', ''); }}>
                  <i className="fas fa-times" /> 아니요
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="phone-bar" />
      </div>

      {/* 유튜브 사이드 버튼 */}
      <div className="reel-side yt-side">
        <div className="yt-avatar-wrap">
          <div className="yt-avatar"><span>M</span></div>
          <div className="yt-sub-plus"><i className="fas fa-plus" /></div>
        </div>
        {[
          { icon: 'fa-thumbs-up',        label: '1.2만' },
          { icon: 'fa-thumbs-down',      label: '싫어요' },
          { icon: 'fa-comment-dots',     label: '48' },
          { icon: 'fa-share',            label: '공유' },
          { icon: 'fa-ellipsis-vertical',label: '더보기' },
        ].map((b, i) => (
          <div key={i} className="yt-btn-item">
            <button type="button" className="rsb"><i className={`fas ${b.icon}`} /></button>
            <span className="yt-btn-label">{b.label}</span>
          </div>
        ))}
      </div>

      {/* 컨트롤 */}
      <div className="v-controls-outer">
        <div className="vprog-wrap">
          <div className="vprog-rail"><div className="vprog-bar" id="vProgReact2" /></div>
        </div>
        <div className="v-controls">
          <button className="vcb" onClick={doReplay}><i className="fas fa-rotate-left" /></button>
          <button className="vcb vcb-play" onClick={togglePlay}>
            <i className={`fas ${playing ? 'fa-pause' : 'fa-play'}`} />
          </button>
          <button className="vcb" onClick={toggleMute}>
            <i className={`fas ${muted ? 'fa-volume-mute' : 'fa-volume-up'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function YtInfoOverlay({ script }) {
  if (!script) return null;
  const { audioBuffers, restaurantName } = useVideoStore();
  const hasAudio = audioBuffers?.some(b => b);
  const name = restaurantName || 'MOOVLOG';
  return (
    <div className="yt-info">
      {/* 제목 (script.title) */}
      <p className="yt-info-title">{script.title || name}</p>
      {/* 오디오가 있을 때만 Original Sound 표시 */}
      {hasAudio && (
        <div className="yt-music-row">
          <i className="fas fa-music yt-music-icon" />
          <span className="yt-music-ticker">Original Sound · {name}</span>
        </div>
      )}
    </div>
  );
}

// ── 렌더 함수들 (Canvas 2D API) ──────────────────────────

function ease(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

function drawMedia(ctx, media, effect, prog, CW, CH, SCALE) {
  if (!media) { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, CW, CH); return; }
  if (media.type === 'video') {
    const vid = media.src;
    if (vid._loadFailed || vid.readyState < 2) { ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, CW, CH); return; }
    if (vid.paused) vid.play().catch(() => {});
  }
  const e = ease(prog);
  let sc = 1, ox = 0, oy = 0;
  switch (effect) {
    case 'zoom-in':       sc = 1.0 + e * 0.25; break;
    case 'zoom-in-slow':  sc = 1.0 + e * 0.10; break;
    case 'zoom-out':      sc = 1.25 - e * 0.25; break;
    case 'pan-left':      sc = 1.15; ox =  (1 - e) * CW * 0.15; break;
    case 'pan-right':     sc = 1.15; ox = -(1 - e) * CW * 0.15; break;
    case 'float-up':      sc = 1.10; oy =  (1 - e) * CH * 0.08; break;
    case 'pan-up':        sc = 1.12; oy =  (1 - e) * CH * 0.10; break;
    case 'drift':         sc = 1.08; ox = Math.sin(e * Math.PI) * CW * 0.06; break;
    default:              sc = 1.06 + e * 0.08;
  }
  const el = media.src;
  const sw = media.type === 'video' ? (el.videoWidth || CW)  : el.naturalWidth;
  const sh = media.type === 'video' ? (el.videoHeight || CH) : el.naturalHeight;
  const r  = Math.max(CW / sw, CH / sh), dw = sw * r, dh = sh * r;
  ctx.save();
  ctx.translate(CW / 2 + ox, CH / 2 + oy);
  ctx.scale(sc, sc);
  try { ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh); }
  catch { ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-dw/2, -dh/2, dw, dh); }
  ctx.restore();
}

function drawVignetteGrad(ctx, CW, CH) {
  const g = ctx.createRadialGradient(CW/2, CH/2, CH*0.18, CW/2, CH/2, CH*0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
}

function drawSubtitle(ctx, sc, animProg, CW, CH, SCALE) {
  if (!sc) return;
  const cap1 = sc.caption1 || sc.subtitle || '';
  const cap2 = sc.caption2 || '';
  if (!cap1 && !cap2) return;

  const pos   = sc.subtitle_position || 'lower';
  const style = sc.subtitle_style    || 'detail';

  // 조선 보다 더 위로 옵겨서 yt-info 오버래퍼와 갹치지 않게
  const baseY = pos === 'upper'  ? CH * 0.15
              : pos === 'center' ? CH * 0.42
              : CH * 0.68;    // lower — 기존 0.81에서 위로

  const appear = Math.min(animProg * 4.5, 1);
  const oy     = (1 - ease(appear)) * 16 * SCALE;

  ctx.save();
  ctx.globalAlpha = appear;
  ctx.translate(0, oy);

  // 스타일별 세트 — 인플루언서 TikTok 미학
  const SM = {
    hook:   { main: '#FFFFFF', hl: '#FF2D55', sz: 58 },
    hero:   { main: '#FFE340', hl: '#FF9F0A', sz: 54 },
    cta:    { main: '#CCFF00', hl: '#FF3B30', sz: 52 },
    detail: { main: '#FFFFFF', hl: '#FFFFFF',  sz: 46 },
  };
  const S = SM[style] || SM.detail;
  const fs = Math.round(S.sz * SCALE);

  ctx.font = `900 ${fs}px 'Black Han Sans', 'Noto Sans KR', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // animProg 55% 넘으면 cap2로 전환
  const showCap2 = !!(cap2 && animProg > 0.52);
  const text = showCap2 ? cap2 : cap1;

  const tw   = ctx.measureText(text).width;
  const padX = Math.round(26 * SCALE);
  const padY = Math.round(12 * SCALE);
  const bw   = tw + padX * 2;
  const bh   = fs + padY * 2;

  // 액센트 배경 피도 (hook / cta)
  if (style === 'hook' || style === 'cta' || style === 'hero') {
    const bgGrad = ctx.createLinearGradient(CW/2 - bw/2, 0, CW/2 + bw/2, 0);
    bgGrad.addColorStop(0, 'rgba(0,0,0,0.78)');
    bgGrad.addColorStop(0.5, 'rgba(0,0,0,0.62)');
    bgGrad.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(CW/2 - bw/2, baseY - bh/2, bw, bh, Math.round(bh / 2));
    ctx.fill();
    // 왼쪽 수직 accent 라인
    ctx.fillStyle = S.hl;
    ctx.fillRect(
      CW/2 - bw/2,
      baseY - bh/2 + Math.round(7 * SCALE),
      Math.round(4.5 * SCALE),
      bh - Math.round(14 * SCALE)
    );
  } else {
    // detail: 간단한 반투명 둥근 박스
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.beginPath();
    ctx.roundRect(CW/2 - bw/2, baseY - bh/2, bw, bh, Math.round(10 * SCALE));
    ctx.fill();
  }

  // 두꺼운 스트로크 (TikTok 스타일)
  ctx.strokeStyle = 'rgba(0,0,0,0.92)';
  ctx.lineWidth   = Math.round(7 * SCALE);
  ctx.lineJoin    = 'round';
  ctx.strokeText(text, CW / 2, baseY);

  // 메인 텍스트
  ctx.fillStyle = showCap2 ? S.main : ((style !== 'detail' && !showCap2) ? S.hl : S.main);
  ctx.fillText(text, CW / 2, baseY);

  ctx.restore();
}

function drawChannelTop(ctx, name, CW, CH, SCALE) {
  if (!name) return;
  ctx.save();

  // 상단 어둠운 그라디언트 헤더
  const topH = Math.round(CH * 0.10);
  const grad = ctx.createLinearGradient(0, 0, 0, topH);
  grad.addColorStop(0, 'rgba(0,0,0,0.68)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, topH);

  const PAD = Math.round(18 * SCALE);
  const CY  = Math.round(CH * 0.042);
  const AV  = Math.round(20 * SCALE);

  // 퓜마 아바타 원
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(PAD + AV, CY, AV, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = Math.round(2 * SCALE);
  ctx.stroke();

  ctx.font = `700 ${Math.round(12 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name[0]?.toUpperCase() || 'M', PAD + AV, CY);

  // 슬러그 채널명
  const slug = '@' + name.replace(/\s+/g, '').slice(0, 15);
  ctx.font = `700 ${Math.round(19 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur  = Math.round(5 * SCALE);
  ctx.fillStyle = '#fff';
  ctx.fillText(slug, PAD + AV * 2 + Math.round(8 * SCALE), CY);
  ctx.shadowBlur = 0;

  // 팔로우 버튼 카치문구
  const followX = CW - Math.round(90 * SCALE);
  const followW = Math.round(72 * SCALE);
  const followH = Math.round(28 * SCALE);
  const followY = CY - followH / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = Math.round(1.5 * SCALE);
  ctx.beginPath();
  ctx.roundRect(followX, followY, followW, followH, Math.round(followH / 2));
  ctx.fill();
  ctx.stroke();
  ctx.font = `600 ${Math.round(11 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('팔로우', followX + followW / 2, CY);

  ctx.restore();
}

function drawTransition(ctx, store, fi, t, loaded, aspectRatio, CW, CH, SCALE, subAnimProg) {
  // 기본 크로스페이드 구현
  const e = ease(t);
  const scenes = store.script.scenes;
  const sc1 = scenes[fi];
  const sc2 = scenes[fi + 1];
  const m1  = loaded?.[(sc1?.idx ?? 0) % (loaded?.length || 1)];
  const m2  = loaded?.[(sc2?.idx ?? 0) % (loaded?.length || 1)];

  drawMedia(ctx, m1, sc1?.effect, 1, CW, CH, SCALE);
  drawVignetteGrad(ctx, CW, CH);

  ctx.save();
  ctx.globalAlpha = e;
  drawMedia(ctx, m2, sc2?.effect, 0, CW, CH, SCALE);
  ctx.restore();
}
