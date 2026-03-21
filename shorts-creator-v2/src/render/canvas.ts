/* ============================================================
   render/canvas.ts — Canvas 렌더 유틸
   drawMedia, drawSubtitle, drawColorGrade, applyKenBurns 등
   기존 script.js의 렌더링 함수들을 순수 함수로 분리.
   ============================================================ */
import type { Scene, KenBurnsEffect, LoadedMedia } from '@/types/state';
import type { CaptionStyle, TemplateStyle } from '@/types/template';

export const CW = 1080;
export const CH = 1920;
export const SCALE = 1.5;

/* ── Ken Burns 변환 계산 ── */
export interface Transform {
  sx: number; sy: number;
  sw: number; sh: number;
}

export function kenBurnsTransform(
  effect: KenBurnsEffect,
  prog: number,          // 0..1
  mediaW: number,
  mediaH: number,
): Transform {
  const p = Math.min(Math.max(prog, 0), 1);
  const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic

  // 미디어를 캔버스에 맞게 cover 크기 계산
  const scale = Math.max(CW / mediaW, CH / mediaH);
  const baseW = mediaW * scale;
  const baseH = mediaH * scale;

  let scaleF = 1.0;
  let offX = 0;
  let offY = 0;

  switch (effect) {
    case 'zoom-in':
      scaleF = 1 + 0.08 * ease;
      break;
    case 'zoom-out':
      scaleF = 1.08 - 0.08 * ease;
      break;
    case 'zoom-in-slow':
      scaleF = 1 + 0.04 * ease;
      break;
    case 'pan-left':
      offX = -0.05 * baseW * ease;
      break;
    case 'pan-right':
      offX = 0.05 * baseW * ease;
      break;
    case 'float-up':
      offY = -0.04 * baseH * ease;
      break;
    case 'drift':
      offX = 0.025 * baseW * Math.sin(ease * Math.PI);
      break;
  }

  const w = baseW * scaleF;
  const h = baseH * scaleF;
  const sx = (CW - w) / 2 + offX;
  const sy = (CH - h) / 2 + offY;
  return { sx, sy, sw: w, sh: h };
}

/* ── 미디어 그리기 ── */
export function drawMedia(
  ctx: CanvasRenderingContext2D,
  media: LoadedMedia,
  effect: KenBurnsEffect,
  prog: number,
): void {
  const el = media.el;
  const mW = 'naturalWidth' in el ? el.naturalWidth  : el.videoWidth;
  const mH = 'naturalWidth' in el ? el.naturalHeight : el.videoHeight;
  if (!mW || !mH) return;

  const { sx, sy, sw, sh } = kenBurnsTransform(effect, prog, mW, mH);
  ctx.drawImage(el, sx, sy, sw, sh);
}

/* ── 비네트 그라디언트 ── */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  style: TemplateStyle,
): void {
  const grd = ctx.createLinearGradient(0, 0, 0, CH);
  grd.addColorStop(0,    style.overlay.top);
  grd.addColorStop(0.55, 'rgba(0,0,0,0)');
  grd.addColorStop(1,    style.overlay.bottom);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CW, CH);
}

/* ── 색보정 ── */
export function drawColorGrade(
  ctx: CanvasRenderingContext2D,
  r: number, g: number, b: number,
): void {
  if (r === 1 && g === 1 && b === 1) return;
  ctx.save();
  // 별도 오프스크린이 없으므로 globalCompositeOperation으로 근사 처리
  const makeLayer = (color: string, alpha: number) => {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CW, CH);
  };
  if (r < 1) makeLayer('rgba(0,0,255,1)', (1 - r) * 0.15);
  if (g < 1) makeLayer('rgba(255,0,0,1)', (1 - g) * 0.15);
  if (b < 1) makeLayer('rgba(255,255,0,1)', (1 - b) * 0.15);
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/* ── 자막 렌더링 ── */
const SUBTITLE_SHRINK_THRESHOLD = 7;
const SUBTITLE_MIN_SCALE        = 0.50;
const SAFE_WIDTH                = CW - SCALE * 120;

/**
 * 자막 알파 — 빠른 페이드인 → 유지 → 빠른 페이드아웃
 * prog 0~0.18: 0→1, 0.18~0.82: 1.0 유지, 0.82~1.0: 1→0
 */
function calcSubtitleAlpha(prog: number): number {
  const fadeIn  = 0.18;
  const fadeOut = 0.82;
  if (prog < fadeIn)  return prog / fadeIn;
  if (prog > fadeOut) return Math.max(0, (1.0 - prog) / (1.0 - fadeOut));
  return 1.0;
}

/**
 * 자막 Y 오프셋 — 페이드인 구간만 아래에서 위로 슬라이드
 */
function calcSubtitleSlideY(prog: number): number {
  const fadeIn = 0.18;
  if (prog >= fadeIn) return 0;
  const t = prog / fadeIn;
  // easeOutQuad: 천천히 올라와서 자리잡기
  const ease = 1 - Math.pow(1 - t, 2);
  return (1 - ease) * 30 * SCALE;
}

export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  captionStyle: CaptionStyle,
  prog: number,  // 씬 전체 진행률 0..1
): void {
  if (!scene.caption1) return;

  const alpha  = calcSubtitleAlpha(prog);
  const slideY = calcSubtitleSlideY(prog);
  if (alpha <= 0) return;

  const y = scene.subtitle_position * CH;
  const animY = y + slideY;

  ctx.save();
  ctx.globalAlpha = alpha;

  const lines = [scene.caption1, scene.caption2].filter(Boolean) as string[];
  const lineH = SCALE * 80;

  lines.forEach((line, i) => {
    const baseFont = captionStyle.font;
    let fontSz = parseFontSize(baseFont);

    // 글자수 기반 자동 축소
    if (line.length > SUBTITLE_SHRINK_THRESHOLD) {
      const ratio = SUBTITLE_SHRINK_THRESHOLD / line.length;
      fontSz = Math.max(fontSz * ratio, fontSz * SUBTITLE_MIN_SCALE);
    }

    const font = baseFont.replace(/\d+(?:\.\d+)?px/, `${Math.round(fontSz)}px`);
    ctx.font = font;

    // 너비 초과 시 추가 축소
    let measure = ctx.measureText(line).width;
    if (measure > SAFE_WIDTH) {
      fontSz *= SAFE_WIDTH / measure;
      const clampedFont = baseFont.replace(/\d+(?:\.\d+)?px/, `${Math.round(fontSz)}px`);
      ctx.font = clampedFont;
      measure = ctx.measureText(line).width;
    }

    const textX = CW / 2;
    const textY = animY + i * lineH;

    // 배경 박스 (bgColor가 있는 템플릿)
    if (captionStyle.bgColor) {
      const pad = SCALE * 16;
      ctx.fillStyle = captionStyle.bgColor;
      ctx.beginPath();
      roundRect(ctx, textX - measure / 2 - pad, textY - fontSz * 0.9, measure + pad * 2, fontSz * 1.35, SCALE * 8);
      ctx.fill();
    }

    // 그림자
    ctx.shadowColor = captionStyle.shadow;
    ctx.shadowBlur = SCALE * 12;
    ctx.shadowOffsetY = captionStyle.shadowOffsetY ?? 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // 외곽선
    if (captionStyle.strokeWidth > 0) {
      ctx.strokeStyle = captionStyle.stroke;
      ctx.lineWidth = captionStyle.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(line, textX, textY);
    }

    // 본문 (첫 몇 글자 하이라이트)
    const hlLen = Math.ceil(line.length * 0.35);
    for (let ci = 0; ci < line.length; ci++) {
      const char = line[ci];
      const prev = ctx.measureText(line.slice(0, ci)).width;
      const charX = textX - measure / 2 + prev + ctx.measureText(char).width / 2;
      ctx.fillStyle = ci < hlLen ? captionStyle.highlightColor : captionStyle.color;
      ctx.fillText(char, charX, textY);
    }
  });

  ctx.restore();
}

/* ── 레터박스 (시네마틱) ── */
export function drawLetterbox(ctx: CanvasRenderingContext2D): void {
  const barH = CH * 0.045;
  ctx.fillStyle = 'rgba(0,0,0,0.92)';
  ctx.fillRect(0, 0, CW, barH);
  ctx.fillRect(0, CH - barH, CW, barH);
}

/* ── 유틸 ── */
function parseFontSize(font: string): number {
  const m = font.match(/(\d+(?:\.\d+)?)px/);
  return m ? parseFloat(m[1]) : 48;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
