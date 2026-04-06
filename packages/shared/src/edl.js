/**
 * @moovlog/shared — Edit Decision List (EDL) 스키마 정의
 * 웹(React), Electron, React Native 모두에서 공유하는 편집 지시서 형식
 */

/**
 * 단일 씬(클립) 정의
 * @typedef {Object} SceneClip
 * @property {string} path         - 파일 경로 또는 URL (플랫폼별 포맷)
 * @property {number} start        - 시작 시간 (초)
 * @property {number} duration     - 길이 (초)
 * @property {number} [mediaIdx]   - 원본 files 배열 인덱스
 * @property {string} [caption]    - 자막 텍스트
 * @property {string} [narration]  - 나레이션 텍스트
 * @property {string} [effect]     - Ken Burns 효과 이름
 * @property {Object} [focusCoords]- 피사체 좌표 {x:0~1, y:0~1}
 * @property {number} [bestStartPct] - 영상 내 최적 시작 비율 (saliency)
 * @property {string} [filters]    - 추가 FFmpeg vf 필터 문자열
 */

/**
 * Edit Decision List
 * @typedef {Object} EDL
 * @property {string}      id           - 프로젝트 고유 ID
 * @property {string}      restaurantName
 * @property {string}      theme        - 색감 테마 (hansik|cafe|grill...)
 * @property {string}      template     - 편집 템플릿 이름
 * @property {string}      aspectRatio  - '9:16' | '16:9' | '1:1'
 * @property {SceneClip[]} scenes
 * @property {number}      createdAt    - Unix timestamp (ms)
 * @property {string}      [version]    - 앱 버전
 */

/**
 * 새 EDL 객체 생성
 * @param {Partial<EDL>} overrides
 * @returns {EDL}
 */
export function createEDL(overrides = {}) {
  return {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
    restaurantName: "",
    theme: "hansik",
    template: "auto",
    aspectRatio: "9:16",
    scenes: [],
    createdAt: Date.now(),
    version: "v2.72",
    ...overrides,
  };
}

/**
 * EDL 유효성 검사 — 최소 1씬, 각 씬에 duration > 0 필수
 * @param {EDL} edl
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEDL(edl) {
  const errors = [];
  if (!edl?.scenes?.length) errors.push("씬이 최소 1개 이상 필요합니다");
  edl?.scenes?.forEach((s, i) => {
    if (!(s.duration > 0)) errors.push(`씬 ${i + 1}: duration이 0 이하입니다`);
    if (!s.path && !s.url) errors.push(`씬 ${i + 1}: path 또는 url이 없습니다`);
  });
  return { valid: errors.length === 0, errors };
}

/**
 * VideoScript(React 앱 형식) → EDL 변환
 * @param {Object} script   - videoStore의 script 객체
 * @param {Array}  files    - videoStore의 files 배열
 * @returns {EDL}
 */
export function scriptToEDL(script, files) {
  const scenes = (script?.scenes || []).map((sc, i) => {
    const fileItem = files[sc.media_idx ?? i] ?? files[i] ?? {};
    return {
      path: fileItem.url || "",
      start: sc.best_start_pct
        ? sc.best_start_pct * Math.max((sc.duration || 3) * 2, 5)
        : 0,
      duration: Math.max(0.4, sc.duration || 3),
      mediaIdx: sc.media_idx ?? i,
      caption: sc.caption1 || sc.subtitle || "",
      narration: sc.narration || "",
      effect: sc.effect || "zoom-in-slow",
      focusCoords: sc.focus_coords || null,
      bestStartPct: sc.best_start_pct || 0,
    };
  });

  return createEDL({
    restaurantName: script?.restaurant_name || "",
    theme: script?.theme || "hansik",
    template: script?.template || "auto",
    scenes,
  });
}
