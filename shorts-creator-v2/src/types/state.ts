/* ============================================================
   types/state.ts — 앱 전체 상태 타입 정의
   기존 script.js의 전역 `S` 객체를 완전히 대체
   ============================================================ */

/** 업로드된 미디어 파일 (이미지 or 영상) */
export interface MediaItem {
  file: File;
  /** URL.createObjectURL() 결과 */
  url: string;
  type: 'image' | 'video';
  /**
   * [Electron 전용] 실제 파일시스템 경로 (file.path).
   * 일반 브라우저에서는 undefined — FFmpeg IPC 호출 시 필수.
   */
  path?: string;
  /**
   * [Electron 전용] FFmpeg 추출 썸네일 경로 (영상 전용).
   * 추출 전에는 undefined, 추출 후 `file://` URL로 설정.
   */
  thumbnailUrl?: string;
}

/** preload() 이후 로드된 미디어 요소 */
export type LoadedMedia =
  | { type: 'image'; el: HTMLImageElement }
  | { type: 'video'; el: HTMLVideoElement };

/** 단일 씬(Scene) — AI가 생성하고 편집 가능 */
export interface Scene {
  /** 미디어 배열에서의 인덱스 */
  media_idx: number;
  /** 씬 재생 시간(초). 오디오 합성 후 실제 길이로 덮어씀 */
  duration: number;
  /** 나레이션 텍스트 */
  narration: string;
  /** 틱톡 스타일 자막 첫 번째 줄 */
  caption1: string;
  /** 자막 두 번째 줄 (없을 수 있음) */
  caption2?: string;
  /** Ken Burns 효과 종류 */
  effect: KenBurnsEffect;
  /** 씬 전환 효과 */
  transition: TransitionType;
  /** 자막 세로 위치: 0(상단) ~ 1(하단) */
  subtitle_position: number;
  /** 씬 배경음 볼륨 재정의 (기본: 1.0) */
  bgm_volume?: number;
}

export type KenBurnsEffect =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'zoom-in-slow'
  | 'float-up'
  | 'drift';

export type TransitionType = 'fade' | 'wipe' | 'zoom' | 'none';

/** AI가 생성한 전체 영상 스크립트 */
export interface VideoScript {
  /** 첫 씬 훅 문구 */
  hook: string;
  /** 씬 배열 */
  scenes: Scene[];
  /** 전체 한 줄 설명 */
  summary: string;
  /** SNS 해시태그 */
  tags: string[];
  /** 유튜브 숏츠 타이틀 */
  youtube_title: string;
  /** 유튜브 숏츠 설명 */
  youtube_desc: string;
  /** 인스타그램 캡션 */
  instagram_caption: string;
}

/** 선택 가능한 콘텐츠 템플릿 */
export type TemplateKey =
  | 'auto'
  | 'cinematic'
  | 'viral'
  | 'aesthetic'
  | 'mukbang'
  | 'vlog'
  | 'review'
  | 'story'
  | 'info';

/** 선택 가능한 오프닝 훅 스타일 */
export type HookKey =
  | 'question'
  | 'shock'
  | 'challenge'
  | 'secret'
  | 'ranking'
  | 'pov';

/**
 * [§15 씬 자동 감지] FFmpeg detect-scene-changes 결과 단위
 * 영상에서 자동 추출된 씬 컷 정보
 */
export interface SceneCut {
  /** 영상 내 시작 시각 (초) */
  time: number;
  /** 씬 재생 길이 (초). 마지막 씬은 null → 수동 입력 */
  duration: number | null;
  /** FFmpeg 추출 썸네일 절대 경로 */
  thumbnailPath: string | null;
  /** 사용자 선택 여부 */
  selected: boolean;
  /** 자막/메모 */
  caption: string;
  /** 내부 인덱스 */
  index: number;
}

/** 전체 앱 상태 — Zustand 스토어 shape */
export interface AppState {
  /* ── 입력 ── */
  files: MediaItem[];
  restaurantName: string;
  selectedTemplate: TemplateKey;
  selectedHook: HookKey;

  /* ── 로드된 미디어 ── */
  loaded: LoadedMedia[];

  /* ── 생성 결과 ── */
  script: VideoScript | null;
  /** 씬별 합성된 AudioBuffer (null = 미합성) */
  audioBuffers: (AudioBuffer | null)[];

  /* ── 재생 상태 ── */
  playing: boolean;
  muted: boolean;
  scene: number;
  /** 현재 씬 내 진행률 0..1 */
  subAnimProg: number;

  /* ── 편집 상태 ── */
  editingSceneIdx: number | null;

  /* ── 파이프라인 진행 ── */
  phase: PipelinePhase;
  stepProgress: StepProgress[];

  /* ── 내보내기 ── */
  exporting: boolean;
  exportProgress: number; // 0..1

  /* ── [§15] 씬 자동 감지 결과 ── */
  sceneCuts: SceneCut[];
  /** 씬 감지 중 여부 */
  detectingScenes: boolean;
}

export type PipelinePhase = 'idle' | 'loading' | 'result' | 'error';

export interface StepProgress {
  label: string;
  sub: string;
  status: 'pending' | 'running' | 'done' | 'error';
  /** 0..100 */
  pct: number;
}

/** 토스트 알림 */
export interface Toast {
  id: string;
  message: string;
  type: 'ok' | 'err' | 'inf';
}
