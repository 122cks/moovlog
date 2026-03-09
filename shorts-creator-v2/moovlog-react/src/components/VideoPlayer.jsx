// src/components/VideoPlayer.jsx
// HTML5 기반 미디어 렌더러 — Canvas 대신 <img>/<video> 사용으로 깜빡임 원천 차단
// 💡 핵심 1: Ken Burns CSS는 이미지에만 적용 (비디오에 적용 시 깜빡임·끊김 발생)
// 💡 핵심 2: 씬 인덱스(scene)가 바뀔 때만 <video> key 갱신 → 불필요한 재생성 차단

import { useEffect, useRef, useCallback, useState } from 'react';
import { useVideoStore } from '../store/videoStore.js';
import { getAudioCtx } from '../engine/tts.js';

export default function VideoPlayer() {
  const videoRef  = useRef(null);
  const audioRef  = useRef(null);
  const [safeZone, setSafeZone] = useState(false); // 인스타 세이프 존 가이드 토글

  const {
    script, files, playing, muted, scene,
    audioBuffers, restaurantName,
    setPlaying, setScene, setSubAnimProg,
  } = useVideoStore();

  const currentScene = script?.scenes[scene];
  const fileIdx      = currentScene?.media_idx ?? scene;
  const currentFile  = files?.[fileIdx];
  const isImage      = currentFile?.type === 'image';
  const effectClass  = currentScene?.effect ? `effect-${currentScene.effect}` : '';
  const vibeColor    = script?.vibe_color || null;  // Gemini 테마 컬러 (null 시 기본 스타일 유지)

  // ── 비디오: 씬 전환 시 0초로 되감고 재생 + Adaptive Sync ─
  useEffect(() => {
    if (!isImage && videoRef.current) {
      const video = videoRef.current;
      const onMetadata = () => {
        // 클립 길이 ÷ 씬 duration → 슬로우모션(0.25x) ~ 정속(1.0x) 사이로 자동 조율
        // 0.25 미만은 freeze frame(loop=false)으로 처리되므로 최저 0.25로 고정
        if (video.duration && isFinite(video.duration) && currentScene?.duration) {
          const rate = video.duration / currentScene.duration;
          video.playbackRate = Math.max(0.25, Math.min(1.0, rate));
        }
      };
      video.addEventListener('loadedmetadata', onMetadata);
      video.currentTime = 0;
      video.play().catch(() => {});
      return () => video.removeEventListener('loadedmetadata', onMetadata);
    }
  }, [scene, isImage]);

  // ── 씬 자동 진행 (duration 후 다음 씬으로) ───────────────
  useEffect(() => {
    if (!playing || !script) return;
    const sc  = script.scenes[scene];
    if (!sc) return;
    const dur = (sc.duration > 0 && isFinite(sc.duration) ? sc.duration : 3) * 1000;

    const timer = setTimeout(() => {
      const st      = useVideoStore.getState();
      if (!st.playing) return;
      const nextSi  = st.scene + 1;
      if (nextSi < (st.script?.scenes?.length ?? 0)) {
        setScene(nextSi);
        setSubAnimProg(0);
      } else {
        setPlaying(false);
        document.getElementById('repeatOverlayReact')?.removeAttribute('hidden');
      }
    }, dur);

    return () => clearTimeout(timer);
  }, [playing, scene, script]);

  // ── 진행바 업데이트 ──────────────────────────────────────
  useEffect(() => {
    if (!playing || !script) return;
    const sc  = script.scenes[scene];
    if (!sc) return;
    const dur = (sc.duration > 0 && isFinite(sc.duration) ? sc.duration : 3) * 1000;
    const total = script.scenes.reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);
    const done  = script.scenes.slice(0, scene).reduce((a, s) => a + ((s.duration > 0 && isFinite(s.duration)) ? s.duration : 3), 0);

    const start = performance.now();
    let raf;
    const tick = (now) => {
      const el  = Math.min((now - start) / 1000, dur / 1000);
      const pct = Math.min((done + el) / total * 100, 100);
      const bar = document.getElementById('vProgReact');
      if (bar) bar.style.width = pct + '%';
      setSubAnimProg(Math.min(el / (dur / 1000), 1));
      if (el < dur / 1000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, scene, script]);

  // ── TTS 오디오 재생 ──────────────────────────────────────
  useEffect(() => {
    if (!playing || muted) return;
    const buf = audioBuffers?.[scene];
    if (!buf) return;
    const ac = getAudioCtx();
    if (!ac) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    src.start(0);
    audioRef.current = src;
    return () => { try { src.stop(); } catch (_) {} };
  }, [playing, scene, muted]);

  // ── 컨트롤 핸들러 ────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const ac = getAudioCtx();
    if (ac?.state === 'suspended') ac.resume().catch(() => {});
    if (playing) {
      try { audioRef.current?.stop(); } catch (_) {}
    }
    setPlaying(!playing);
  }, [playing, setPlaying]);

  const doReplay = useCallback(() => {
    try { audioRef.current?.stop(); } catch (_) {}
    setPlaying(false);
    setScene(0);
    setSubAnimProg(0);
    document.getElementById('repeatOverlayReact')?.setAttribute('hidden', '');
    setTimeout(() => setPlaying(true), 80);
  }, [setPlaying, setScene, setSubAnimProg]);

  // ── 스크립트 없을 때 빈 폰 ─────────────────────────────
  if (!script || !files?.length) return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="phone-notch" />
        <div className="phone-screen" style={{ background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#444', fontSize: '0.85rem' }}>스크립트 생성 후 미리보기</p>
        </div>
        <div className="phone-bar" />
      </div>
    </div>
  );

  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="phone-notch" />
        <div className="phone-screen" onClick={togglePlay}>

          {/* ── 미디어 레이어 ── */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor: '#000' }}>
            <div className="vignette-overlay" />
            {currentFile && (isImage ? (
              <img
                key={`img-${scene}`}
                src={currentFile.url}
                alt="scene"
                className={`video-media-content ${effectClass}`}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  '--dur': `${currentScene?.duration ?? 3}s`,
                  animationDuration: `${currentScene?.duration ?? 3}s`,
                }}
              />
            ) : (
              <video
                ref={videoRef}
                key={`vid-${scene}-${fileIdx}`}
                src={currentFile.url}
                className={`video-media-content ${effectClass}`}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  '--dur': `${currentScene?.duration ?? 3}s`,
                }}
                autoPlay muted playsInline
              />
            ))}
          </div>

          {/* ── 자막 오버레이 ── */}
          {currentScene && (
            <div
              key={`sub-${scene}`}
              style={{
                position: 'absolute', bottom: '15%',
                left: 0, width: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '10px',
                zIndex: 50, pointerEvents: 'none',
              }}
            >
              {currentScene.caption1 && (
                <div className="animate-subtitle-pop dynamic-subtitle" style={{
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: '#FFFFFF', padding: '10px 22px',
                  borderRadius: '50px',
                  fontSize: '2.2rem', fontWeight: '900',
                  letterSpacing: '-1px',
                  textAlign: 'center', maxWidth: '85%',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  wordBreak: 'keep-all', lineHeight: '1.2',
                }}>
                  {currentScene.caption1}
                </div>
              )}
              {currentScene.caption2 && (
                <div className="animate-subtitle-drop dynamic-subtitle" style={{
                  backgroundColor: vibeColor ? vibeColor : 'rgba(255,234,0,0.92)',
                  color: '#000000', padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: '1.3rem', fontWeight: '700',
                  textAlign: 'center', maxWidth: '80%',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  wordBreak: 'keep-all',
                }}>
                  {currentScene.caption2}
                </div>
              )}
            </div>
          )}

          {/* ── 인스타그램 세이프 존 가이드 오버레이 ── */}
          {safeZone && (
            <div className="safe-zone-overlay" style={{ position: 'absolute', inset: 0, zIndex: 60, pointerEvents: 'none' }}>
              {/* 상단 UI 영역 (프로필·팔로우) */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '14%', background: 'rgba(255,0,0,0.15)', borderBottom: '1px dashed rgba(255,100,100,0.7)' }}>
                <span style={{ position: 'absolute', bottom: 4, left: 8, fontSize: '0.5rem', color: 'rgba(255,150,150,0.9)', fontWeight: 700 }}>⚠ 상단 UI 영역</span>
              </div>
              {/* 하단 UI 영역 (좋아요·댓글·공유) */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'rgba(255,165,0,0.10)', borderTop: '1px dashed rgba(255,165,0,0.7)' }}>
                <span style={{ position: 'absolute', top: 4, left: 8, fontSize: '0.5rem', color: 'rgba(255,180,80,0.9)', fontWeight: 700 }}>⚠ 하단 버튼 영역</span>
              </div>
              {/* 안전 자막 구역 표시 */}
              <div style={{ position: 'absolute', bottom: '14%', left: 0, right: 0, height: '26%', border: '1px solid rgba(0,255,0,0.6)', background: 'rgba(0,255,0,0.05)' }}>
                <span style={{ position: 'absolute', top: 4, left: 8, fontSize: '0.5rem', color: 'rgba(100,255,100,0.9)', fontWeight: 700 }}>✅ 자막 세이프 존</span>
              </div>
            </div>
          )}

          {/* ── 채널명 상단 ── */}
          {restaurantName && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
              padding: '10px 14px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.70), transparent)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700,
            }}>
              {restaurantName}
            </div>
          )}

          {/* ── 유튜브 UI 오버레이 ── */}
          <YtInfoOverlay script={script} />

          {/* ── 진행바 ── */}
          <div className="yt-progress-bar">
            <div className="yt-progress-fill" id="vProgReact" style={{ width: '0%' }} />
          </div>

          {/* ── 반복 재생 오버레이 ── */}
          <div id="repeatOverlayReact" className="repeat-overlay" hidden>
            <div className="repeat-box">
              <p className="repeat-question">계속 반복하시겠습니까?</p>
              <div className="repeat-btns">
                <button className="repeat-btn repeat-yes" onClick={e => { e.stopPropagation(); doReplay(); }}>
                  <i className="fas fa-redo" /> 네, 다시 보기
                </button>
                <button className="repeat-btn repeat-no" onClick={e => {
                  e.stopPropagation();
                  document.getElementById('repeatOverlayReact')?.setAttribute('hidden', '');
                }}>
                  <i className="fas fa-times" /> 아니요
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="phone-bar" />
      </div>

      {/* ── 유튜브 사이드 버튼 ── */}
      <div className="reel-side yt-side">
        <div className="yt-avatar-wrap">
          <div className="yt-avatar"><span>M</span></div>
          <div className="yt-sub-plus"><i className="fas fa-plus" /></div>
        </div>
        {[
          { icon: 'fa-thumbs-up',         label: '1.2만' },
          { icon: 'fa-thumbs-down',       label: '싫어요' },
          { icon: 'fa-comment-dots',      label: '48' },
          { icon: 'fa-share',             label: '공유' },
          { icon: 'fa-ellipsis-vertical', label: '더보기' },
        ].map((b, i) => (
          <div key={i} className="yt-btn-item">
            <button type="button" className="rsb"><i className={`fas ${b.icon}`} /></button>
            <span className="yt-btn-label">{b.label}</span>
          </div>
        ))}
      </div>

      {/* ── 컨트롤 ── */}
      <div className="v-controls-outer">
        <div className="vprog-wrap">
          <div className="vprog-rail"><div className="vprog-bar" id="vProgReact2" /></div>
        </div>
        <div className="v-controls">
          <button className="vcb" onClick={doReplay}><i className="fas fa-rotate-left" /></button>
          <button className="vcb vcb-play" onClick={togglePlay}>
            <i className={`fas ${playing ? 'fa-pause' : 'fa-play'}`} />
          </button>
          <button className="vcb" onClick={() => useVideoStore.getState().setMuted(!muted)}>
            <i className={`fas ${muted ? 'fa-volume-mute' : 'fa-volume-up'}`} />
          </button>
          <button
            className={`vcb${safeZone ? ' vcb-active' : ''}`}
            onClick={() => setSafeZone(v => !v)}
            title="인스타 세이프 존 가이드"
          >
            <i className="fas fa-th" />
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
      <p className="yt-info-title">{script.title || name}</p>
      {hasAudio && (
        <div className="yt-music-row">
          <i className="fas fa-music yt-music-icon" />
          <span className="yt-music-ticker">Original Sound · {name}</span>
        </div>
      )}
    </div>
  );
}

// ── 外 ExportPanel 캔버스 렌더 API (영상 내보내기용) ─────────────────────────

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
  const sw = media.type === 'video' ? (el.videoWidth  || CW) : el.naturalWidth;
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

  const baseY = pos === 'upper'  ? CH * 0.16
              : pos === 'center' ? CH * 0.44
              : CH * 0.70;

  const showCap2 = !!(cap2 && animProg > 0.60);
  const appear = showCap2
    ? Math.min((animProg - 0.60) * 10.0, 1)
    : Math.min(animProg * 5.0, 1);
  const oy = (1 - ease(appear)) * 18 * SCALE;

  const popScale = appear < 0.45
    ? 0.80 + (appear / 0.45) * 0.32
    : 1.12 - ((appear - 0.45) / 0.55) * 0.12;

  ctx.save();
  ctx.globalAlpha = appear;
  ctx.translate(0, oy);
  ctx.translate(CW / 2, baseY);
  ctx.scale(popScale, popScale);
  ctx.translate(-CW / 2, -baseY);

  const SM = {
    hook:      { main: '#FFFFFF', hl: '#FF2D55',   sz: 54, bg: 'gradient' },
    hero:      { main: '#FFE340', hl: '#FF9F0A',   sz: 50, bg: 'gradient' },
    cta:       { main: '#CCFF00', hl: '#FF3B30',   sz: 48, bg: 'gradient' },
    detail:    { main: '#FFFFFF', hl: '#FFFFFF',   sz: 44, bg: 'simple'   },
    bold_drop: { main: '#FFFFFF', hl: '#FFD60A',   sz: 56, bg: 'bold'     },
    minimal:   { main: '#FFFFFF', hl: '#FFFFFFA0', sz: 40, bg: 'none'     },
    elegant:   { main: '#FFE8C0', hl: '#FFC87A',   sz: 44, bg: 'elegant'  },
  };
  const S = SM[style] || SM.detail;
  const fs = Math.round(S.sz * SCALE);

  ctx.font = `500 ${fs}px 'Noto Sans KR', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = showCap2 ? cap2 : cap1;
  if (!text) { ctx.restore(); return; }

  const tw   = ctx.measureText(text).width;
  const padX = Math.round(30 * SCALE);
  const padY = Math.round(14 * SCALE);
  const bw   = Math.min(tw + padX * 2, CW * 0.92);
  const bh   = fs + padY * 2;

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

    const accentH = bh - Math.round(14 * SCALE);
    ctx.fillStyle = S.hl;
    ctx.beginPath();
    ctx.roundRect(CW/2 - bw/2, baseY - accentH/2, Math.round(5 * SCALE), accentH, Math.round(3 * SCALE));
    ctx.fill();

    if (S.bg === 'bold') {
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
    ctx.fillStyle = 'rgba(0,0,0,0.60)';
    ctx.beginPath();
    ctx.roundRect(CW/2 - bw/2, baseY - bh/2, bw, bh, Math.round(10 * SCALE));
    ctx.fill();
    ctx.fillStyle = S.hl;
    ctx.fillRect(CW/2 - bw/2, baseY - bh/2 + Math.round(8 * SCALE), Math.round(4 * SCALE), bh - Math.round(16 * SCALE));
  } else if (S.bg === 'simple') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(CW/2 - bw/2, baseY - bh/2, bw, bh, Math.round(12 * SCALE));
    ctx.fill();
  }

  const strokeW = S.bg === 'minimal' ? Math.round(9 * SCALE) : Math.round(7 * SCALE);
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  ctx.lineWidth   = strokeW;
  ctx.lineJoin    = 'round';
  ctx.strokeText(text, CW / 2, baseY);

  ctx.fillStyle = showCap2 ? S.main : (style !== 'detail' && style !== 'minimal' && style !== 'elegant' ? S.hl : S.main);
  ctx.fillText(text, CW / 2, baseY);

  if (style === 'bold_drop' || style === 'hook') {
    const words = text.split(' ');
    if (words.length > 1) {
      const firstWord = words[0];
      const rest      = ' ' + words.slice(1).join(' ');
      const fw   = ctx.measureText(firstWord).width;
      const rw   = ctx.measureText(rest).width;
      const startX = CW/2 - (fw + rw)/2;
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
  const topH = Math.round(CH * 0.13);
  const grad = ctx.createLinearGradient(0, 0, 0, topH);
  grad.addColorStop(0, 'rgba(0,0,0,0.80)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, topH);

  const PAD = Math.round(18 * SCALE);
  const CY  = Math.round(CH * 0.048);
  const AV  = Math.round(24 * SCALE);

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

  const nameX = PAD + AV * 2 + Math.round(10 * SCALE);
  const nameFontSize = Math.round(28 * SCALE);
  ctx.font = `800 ${nameFontSize}px 'Black Han Sans', 'Noto Sans KR', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur  = Math.round(8 * SCALE);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(2 * SCALE);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(name.slice(0, 16), nameX, CY - Math.round(7 * SCALE));

  ctx.shadowBlur = Math.round(4 * SCALE);
  ctx.shadowOffsetY = 0;
  ctx.font = `500 ${Math.round(14 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('@' + name.replace(/\s+/g, '').slice(0, 14), nameX, CY + Math.round(16 * SCALE));
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

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
  const mediaIdx = sc.media_idx !== undefined ? sc.media_idx : (sc.idx ?? si);
  const media = loaded?.[mediaIdx % Math.max(loaded?.length || 1, 1)] || null;

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

