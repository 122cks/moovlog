// src/components/VideoPlayer.jsx
// Canvas + 재생 루프 — React ref로 엔진 격리, 상태는 Zustand

import { useEffect, useRef, useCallback, useState } from 'react';
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
  const [showSafeZone, setShowSafeZone] = useState(false);

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
    if (showSafeZone && !playing) drawSafeZone(ctx, CW, CH);

    // 씬 진입 flash burst
    if (prog < 0.10) {
      const flashT = 1 - prog / 0.10;
      ctx.fillStyle = `rgba(255,255,255,${flashT * 0.45})`;
      ctx.fillRect(0, 0, CW, CH);
    }
  }, [script, loaded, aspectRatio, subAnimProg, restaurantName, showSafeZone, playing]);

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
          <button
            className={`vcb${showSafeZone ? ' vcb-active' : ''}`}
            onClick={() => setShowSafeZone(v => !v)}
            title="안전 영역 표시"
          >
            <i className="fas fa-crop-alt" />
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

// ── Safe Zone 가이드 (인스타그램·틱톡·유튜브쇼츠 UI 영역 표시) ──────
function drawSafeZone(ctx, CW, CH) {
  const topH    = Math.round(CH * 0.15);   // 상단 15% — 채널명/상태바 영역
  const bottomH = Math.round(CH * 0.28);   // 하단 28% — 좋아요/댓글/공유 버튼 영역
  const sideW   = Math.round(CW * 0.08);   // 좌우 8% — 텍스트 컷 방지 여백

  // 세미-투명 빨간 오버레이 — UI가 가리는 영역
  ctx.save();
  const danger = 'rgba(255,40,40,0.28)';
  ctx.fillStyle = danger;
  ctx.fillRect(0, 0, CW, topH);
  ctx.fillRect(0, CH - bottomH, CW, bottomH);
  ctx.fillRect(0, 0, sideW, CH);
  ctx.fillRect(CW - sideW, 0, sideW, CH);

  // 안전 영역 테두리 (초록 점선)
  ctx.strokeStyle = 'rgba(80,255,120,0.85)';
  ctx.lineWidth   = Math.max(2, CW * 0.003);
  ctx.setLineDash([Math.round(CW * 0.025), Math.round(CW * 0.015)]);
  ctx.strokeRect(
    sideW, topH,
    CW - sideW * 2, CH - topH - bottomH
  );
  ctx.setLineDash([]);

  // 라벨
  ctx.font = `bold ${Math.round(CW * 0.034)}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ 상단 UI', CW / 2, topH / 2 + Math.round(CW * 0.017));
  ctx.fillText('⚠ 하단 버튼/캡션', CW / 2, CH - bottomH / 2 + Math.round(CW * 0.017));
  ctx.fillStyle = 'rgba(80,255,120,0.95)';
  ctx.fillText('✓ 안전 영역', CW / 2, topH + Math.round(CH * 0.06));
  ctx.restore();
}

function drawSubtitle(ctx, sc, animProg, CW, CH, SCALE) {
  if (!sc) return;
  const cap1 = sc.caption1 || sc.subtitle || '';
  const cap2 = sc.caption2 || '';
  if (!cap1 && !cap2) return;

  const pos   = sc.subtitle_position || 'lower';
  const style = sc.subtitle_style    || 'detail';

  const baseY = pos === 'upper'  ? CH * 0.16
              : pos === 'center' ? CH * 0.44
              : CH * 0.70;    // lower

  const appear = Math.min(animProg * 5.0, 1);
  const oy     = (1 - ease(appear)) * 20 * SCALE;

  ctx.save();
  ctx.globalAlpha = appear;
  ctx.translate(0, oy);

  // ── 스타일 세트 (2026 릴스/쇼츠 최신 미학) ───────────────
  const SM = {
    hook:      { main: '#FFFFFF', hl: '#FF2D55',  sz: 54, bg: 'gradient' },
    hero:      { main: '#FFE340', hl: '#FF9F0A',  sz: 50, bg: 'gradient' },
    cta:       { main: '#CCFF00', hl: '#FF3B30',  sz: 48, bg: 'gradient' },
    detail:    { main: '#FFFFFF', hl: '#FFFFFF',  sz: 44, bg: 'simple'   },
    bold_drop: { main: '#FFFFFF', hl: '#FFD60A',  sz: 56, bg: 'bold'     },
    minimal:   { main: '#FFFFFF', hl: '#FFFFFFA0', sz: 40, bg: 'none'    },
    elegant:   { main: '#FFE8C0', hl: '#FFC87A',  sz: 44, bg: 'elegant'  },
  };
  const S = SM[style] || SM.detail;
  const fs = Math.round(S.sz * SCALE);

  ctx.font = `500 ${fs}px 'Noto Sans KR', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // animProg 60% 이후 cap2로 전환 (오디오 싱크 기준)
  const showCap2 = !!(cap2 && animProg > 0.60);
  const text = showCap2 ? cap2 : cap1;
  if (!text) { ctx.restore(); return; }

  const tw   = ctx.measureText(text).width;
  const padX = Math.round(30 * SCALE);
  const padY = Math.round(14 * SCALE);
  const bw   = Math.min(tw + padX * 2, CW * 0.92);
  const bh   = fs + padY * 2;

  // ── 배경 박스 ─────────────────────────────────────────────
  if (S.bg === 'gradient' || S.bg === 'bold') {
    const bgGrad = ctx.createLinearGradient(CW/2 - bw/2, 0, CW/2 + bw/2, 0);
    if (S.bg === 'bold') {
      bgGrad.addColorStop(0,   'rgba(0,0,0,0.88)');
      bgGrad.addColorStop(0.5, 'rgba(20,20,20,0.80)');
      bgGrad.addColorStop(1,   'rgba(0,0,0,0.88)');
    } else {
      bgGrad.addColorStop(0,   'rgba(0,0,0,0.80)');
      bgGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
      bgGrad.addColorStop(1,   'rgba(0,0,0,0.80)');
    }
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(CW/2 - bw/2, baseY - bh/2, bw, bh, Math.round(bh * 0.35));
    ctx.fill();

    // 왼쪽 수직 accent 라인
    const accentH = bh - Math.round(14 * SCALE);
    ctx.fillStyle = S.hl;
    ctx.beginPath();
    ctx.roundRect(
      CW/2 - bw/2,
      baseY - accentH/2,
      Math.round(5 * SCALE),
      accentH,
      Math.round(3 * SCALE)
    );
    ctx.fill();

    if (S.bg === 'bold') {
      // bold_drop: 하단 컬러 라인 (TikTok 시그니처)
      ctx.fillStyle = S.hl;
      ctx.beginPath();
      ctx.roundRect(
        CW/2 - bw/2,
        baseY + bh/2 - Math.round(5 * SCALE),
        bw,
        Math.round(5 * SCALE),
        [0, 0, Math.round(bh * 0.35), Math.round(bh * 0.35)]
      );
      ctx.fill();
    }

  } else if (S.bg === 'elegant') {
    // 에세이: 반투명 블러 느낌 + 좌측 세로 라인
    ctx.fillStyle = 'rgba(0,0,0,0.60)';
    ctx.beginPath();
    ctx.roundRect(CW/2 - bw/2, baseY - bh/2, bw, bh, Math.round(10 * SCALE));
    ctx.fill();
    ctx.fillStyle = S.hl;
    ctx.fillRect(
      CW/2 - bw/2,
      baseY - bh/2 + Math.round(8 * SCALE),
      Math.round(4 * SCALE),
      bh - Math.round(16 * SCALE)
    );
  } else if (S.bg === 'simple') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(CW/2 - bw/2, baseY - bh/2, bw, bh, Math.round(12 * SCALE));
    ctx.fill();
  }
  // minimal: 배경 없음 (그림자만)

  // ── 텍스트 렌더링 ─────────────────────────────────────────
  const strokeW = S.bg === 'minimal' ? Math.round(9 * SCALE) : Math.round(7 * SCALE);
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  ctx.lineWidth   = strokeW;
  ctx.lineJoin    = 'round';
  ctx.strokeText(text, CW / 2, baseY);

  ctx.fillStyle = showCap2 ? S.main : (style !== 'detail' && style !== 'minimal' && style !== 'elegant' ? S.hl : S.main);
  ctx.fillText(text, CW / 2, baseY);

  // bold_drop: 하이라이트 단어 강조 (첫 단어 다른 색)
  if (style === 'bold_drop' || style === 'hook') {
    const words = text.split(' ');
    if (words.length > 1) {
      const firstWord = words[0];
      const rest      = ' ' + words.slice(1).join(' ');
      const fw   = ctx.measureText(firstWord).width;
      const rw   = ctx.measureText(rest).width;
      const totalW = fw + rw;
      const startX = CW/2 - totalW/2;

      ctx.font = `600 ${fs}px 'Noto Sans KR', sans-serif`;
      ctx.strokeText(firstWord, startX + fw/2, baseY);
      ctx.fillStyle = S.hl;
      ctx.fillText(firstWord, startX + fw/2, baseY);

      ctx.strokeText(rest, startX + fw + rw/2, baseY);
      ctx.fillStyle = S.main;
      ctx.fillText(rest, startX + fw + rw/2, baseY);
    }
  }

  ctx.restore();
}

function drawChannelTop(ctx, name, CW, CH, SCALE) {
  if (!name) return;
  ctx.save();

  // 상단 어두운 그라디언트 헤더 (높이 증가)
  const topH = Math.round(CH * 0.13);
  const grad = ctx.createLinearGradient(0, 0, 0, topH);
  grad.addColorStop(0, 'rgba(0,0,0,0.80)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, topH);

  const PAD = Math.round(18 * SCALE);
  const CY  = Math.round(CH * 0.048);
  const AV  = Math.round(24 * SCALE);

  // 아바타 원
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(PAD + AV, CY, AV, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = Math.round(2.5 * SCALE);
  ctx.stroke();

  ctx.font = `700 ${Math.round(14 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name[0]?.toUpperCase() || 'M', PAD + AV, CY);

  // ── 음식점 이름 (크고 선명하게) ──────────────────────────
  const nameX = PAD + AV * 2 + Math.round(10 * SCALE);
  const nameFontSize = Math.round(28 * SCALE);
  ctx.font = `800 ${nameFontSize}px 'Black Han Sans', 'Noto Sans KR', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // 텍스트 그림자 (가독성)
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur  = Math.round(8 * SCALE);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(2 * SCALE);

  // 흰색 메인 이름
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(name.slice(0, 16), nameX, CY - Math.round(7 * SCALE));

  // @슬러그 (작게)
  ctx.shadowBlur = Math.round(4 * SCALE);
  ctx.shadowOffsetY = 0;
  ctx.font = `500 ${Math.round(14 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('@' + name.replace(/\s+/g, '').slice(0, 14), nameX, CY + Math.round(16 * SCALE));
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 팔로우 버튼
  const followX = CW - Math.round(96 * SCALE);
  const followW = Math.round(76 * SCALE);
  const followH = Math.round(32 * SCALE);
  const followY = CY - followH / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = Math.round(1.5 * SCALE);
  ctx.beginPath();
  ctx.roundRect(followX, followY, followW, followH, Math.round(followH / 2));
  ctx.fill();
  ctx.stroke();
  ctx.font = `600 ${Math.round(13 * SCALE)}px 'Noto Sans KR', sans-serif`;
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

// ── 외부 렌더 API (ExportPanel에서 씬별 프레임 렌더에 사용) ──
export const ASPECT_MAP_EX = {
  '9:16':  { CW: 1080, CH: 1920 },
  '1:1':   { CW: 1080, CH: 1080 },
  '16:9':  { CW: 1920, CH: 1080 },
};

export function renderFrameToCtx(ctx, { script, loaded, aspectRatio, restaurantName }, si, prog, subAnim) {
  const { CW, CH } = ASPECT_MAP_EX[aspectRatio] || ASPECT_MAP_EX['9:16'];
  const SCALE = Math.min(CW, CH) / 720;
  const sc = script?.scenes?.[si];
  if (!sc) return;
  const media = loaded?.[(sc.idx ?? 0) % Math.max(loaded?.length || 1, 1)] || null;

  ctx.clearRect(0, 0, CW, CH);
  drawMedia(ctx, media, sc.effect, prog, CW, CH, SCALE);
  drawVignetteGrad(ctx, CW, CH);
  drawChannelTop(ctx, restaurantName, CW, CH, SCALE);
  drawSubtitle(ctx, sc, subAnim, CW, CH, SCALE);

  if (prog < 0.10) {
    const flashT = 1 - prog / 0.10;
    ctx.fillStyle = `rgba(255,255,255,${flashT * 0.45})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}
