/**
 * @moovlog/shared — Scene Saliency 분석 유틸
 * 영상/이미지의 최적 시작 지점·피사체 좌표 계산 (플랫폼 독립 순수 JS)
 */

/**
 * 이미지 밝기 히스토그램으로 피사체 위치 추정
 * CanvasAPI 필요 (웹+Electron 지원, React Native는 별도 구현 필요)
 * @param {HTMLImageElement|ImageBitmap} imgEl
 * @param {number} [gridW=8] 분석 격자 폭
 * @param {number} [gridH=8] 분석 격자 높이
 * @returns {{ x: number, y: number }} 정규화 좌표 (0~1)
 */
export function estimateFocusPoint(imgEl, gridW = 8, gridH = 8) {
  try {
    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(gridW * 8, gridH * 8)
        : document.createElement("canvas");
    canvas.width = gridW * 8;
    canvas.height = gridH * 8;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const cellW = canvas.width / gridW;
    const cellH = canvas.height / gridH;
    let maxLum = -1,
      bestX = 0.5,
      bestY = 0.4;

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        let lum = 0,
          count = 0;
        for (
          let py = Math.floor(gy * cellH);
          py < Math.floor((gy + 1) * cellH);
          py++
        ) {
          for (
            let px = Math.floor(gx * cellW);
            px < Math.floor((gx + 1) * cellW);
            px++
          ) {
            const idx = (py * canvas.width + px) * 4;
            lum +=
              0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            count++;
          }
        }
        const avgLum = count ? lum / count : 0;
        if (avgLum > maxLum) {
          maxLum = avgLum;
          bestX = (gx + 0.5) / gridW;
          bestY = (gy + 0.5) / gridH;
        }
      }
    }
    return { x: bestX, y: bestY };
  } catch (_) {
    return { x: 0.5, y: 0.4 };
  }
}

/**
 * 씬 점수화 — saliency 기반 (0~1)
 * 여러 씬을 비교해 중요도 순위를 매길 때 사용
 * @param {Array<{saliency?:number, duration:number}>} scenes
 * @returns {Array<{sceneIdx:number, score:number}>} 점수 내림차순
 */
export function rankScenesBySaliency(scenes) {
  return scenes
    .map((sc, i) => ({
      sceneIdx: i,
      score: (sc.saliency ?? 0.5) * Math.min(1, sc.duration / 3),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * 썸네일 씬 선택 — 최상위 saliency 씬 반환
 * @param {Array} scenes
 * @returns {number} 씬 인덱스
 */
export function pickThumbnailScene(scenes) {
  const ranked = rankScenesBySaliency(scenes);
  return ranked[0]?.sceneIdx ?? 0;
}

/**
 * 총 영상 길이 계산 (초)
 * @param {Array<{duration:number}>} scenes
 */
export function totalDuration(scenes) {
  return scenes.reduce((s, sc) => s + Math.max(0, sc.duration || 0), 0);
}
