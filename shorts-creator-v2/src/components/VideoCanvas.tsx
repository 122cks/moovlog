/* ============================================================
   components/VideoCanvas.tsx
   Canvas 렌더링 + requestAnimationFrame 루프를 캡슐화.
   - 배경 렌더링 캔버스: videoCanvas (낮은 빈도)
   - 자막 전용 캔버스: subtitleCanvas (매 프레임, 위에 겹침)
   ============================================================ */
import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getTemplate } from '@/config/templates';
import {
  drawMedia, drawVignette, drawColorGrade, drawSubtitle, drawLetterbox,
  CW, CH,
} from '@/render/canvas';

export function VideoCanvas() {
  const bgRef  = useRef<HTMLCanvasElement>(null);
  const subRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const playing      = useAppStore((s) => s.playing);
  const muted        = useAppStore((s) => s.muted);
  const scene        = useAppStore((s) => s.scene);
  const script       = useAppStore((s) => s.script);
  const loaded       = useAppStore((s) => s.loaded);
  const audioBuffers = useAppStore((s) => s.audioBuffers);
  const template     = useAppStore((s) => s.selectedTemplate);
  const setPlaying   = useAppStore((s) => s.setPlaying);
  const setScene     = useAppStore((s) => s.setScene);
  const setSubAnim   = useAppStore((s) => s.setSubAnimProg);

  const tplConfig   = getTemplate(template);
  const audioCtxRef = useRef<AudioContext | null>(null);

  /* ── 단일 프레임 렌더링 ── */
  const renderFrame = useCallback(
    (sceneIdx: number, subProg: number) => {
      const bgCtx  = bgRef.current?.getContext('2d');
      const subCtx = subRef.current?.getContext('2d');
      if (!bgCtx || !subCtx || !script) return;

      const sc      = script.scenes[sceneIdx];
      const media   = loaded[sc.media_idx];
      if (!media) return;

      // 배경 캔버스
      bgCtx.clearRect(0, 0, CW, CH);
      drawMedia(bgCtx, media, sc.effect, subProg);
      drawColorGrade(bgCtx, tplConfig.style.colorGrade.r, tplConfig.style.colorGrade.g, tplConfig.style.colorGrade.b);
      drawVignette(bgCtx, tplConfig.style);
      if (tplConfig.style.letterbox) drawLetterbox(bgCtx);

      // 자막 캔버스 (별도 레이어 — 매 프레임 업데이트)
      subCtx.clearRect(0, 0, CW, CH);
      drawSubtitle(subCtx, sc, tplConfig.caption, subProg);
    },
    [script, loaded, tplConfig],
  );

  /* ── 재생 루프 ── */
  useEffect(() => {
    if (!playing || !script) return;

    let startTs: number | null = null;
    let currentSrc: AudioBufferSourceNode | null = null;

    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const sc       = script.scenes[scene];
      const elapsed  = (now - startTs) / 1000;
      const prog     = Math.min(elapsed / sc.duration, 1);

      setSubAnim(prog);
      renderFrame(scene, prog);

      if (prog >= 1) {
        const next = scene + 1;
        if (next < script.scenes.length) {
          setScene(next);
          startTs = now;
          playSceneAudio(next);
        } else {
          setPlaying(false);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const playSceneAudio = (idx: number) => {
      if (!audioCtxRef.current || muted) return;
      const buf = audioBuffers[idx];
      if (!buf) return;
      currentSrc?.stop();
      const src = audioCtxRef.current.createBufferSource();
      currentSrc = src;
      src.buffer = buf;
      src.connect(audioCtxRef.current.destination);
      src.start();
    };

    // AudioContext 초기화 (사용자 제스처 후 첫 재생 시)
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    playSceneAudio(scene);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      currentSrc?.stop();
    };
  }, [playing, scene, script, audioBuffers, muted, renderFrame, setScene, setPlaying, setSubAnim]);

  /* ── 정지 시 현재 프레임 렌더링 ── */
  useEffect(() => {
    if (!playing) renderFrame(scene, 0);
  }, [scene, playing, renderFrame]);

  const handleCanvasClick = () => {
    if (script) setPlaying(!playing);
  };

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl shadow-2xl"
      style={{ width: '100%', maxWidth: 360, aspectRatio: '9/16' }}
    >
      {/* 배경 레이어 */}
      <canvas
        ref={bgRef}
        width={CW}
        height={CH}
        className="absolute inset-0 h-full w-full cursor-pointer"
        onClick={handleCanvasClick}
      />
      {/* 자막 레이어 (pointer-events 없음 — 클릭은 배경 캔버스가 받음) */}
      <canvas
        ref={subRef}
        width={CW}
        height={CH}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {/* 재생 버튼 오버레이 */}
      {!playing && script && (
        <button
          onClick={handleCanvasClick}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30"
          aria-label="재생"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl shadow-lg">
            ▶
          </span>
        </button>
      )}
    </div>
  );
}
