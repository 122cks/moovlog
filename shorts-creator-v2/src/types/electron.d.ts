// types/electron.d.ts — window.electronAPI 전역 타입 통합 선언
// 여러 컴포넌트에서 각자 declare global을 선언하면 타입 충돌 발생 → 이 파일만 사용

interface ElectronAPI {
  isElectron: boolean;

  // 파일 다이얼로그
  saveFile: (opts: { title?: string; defaultPath?: string }) => Promise<string | null>;
  openFiles: (opts?: unknown) => Promise<string[]>;
  showInFolder: (p: string) => Promise<void>;

  // 렌더링
  renderVideo: (
    editList: unknown[],
    outputPath: string,
    options: unknown,
    jobId: string,
  ) => Promise<{ outputPath: string; success: boolean }>;
  cancelRender: (jobId: string) => Promise<boolean>;
  pauseRender:  (jobId: string) => Promise<boolean>;
  resumeRender: (jobId: string) => Promise<boolean>;

  // 렌더링 진행률 구독
  onRenderProgress: (
    cb: (data: { pct: number; msg: string; jobId: string; eta?: string }) => void,
  ) => () => void;
  onRenderLog: (cb: (data: { msg: string; jobId: string }) => void) => () => void;
  onRenderValidationError: (
    cb: (data: { missingIndices: number[] }) => void,
  ) => () => void;

  // 미디어 분석
  probeMedia: (filePath: string) => Promise<unknown>;
  extractThumbnail: (opts: { filePath: string; time?: number }) => Promise<string>;
  splitVideo: (opts: unknown) => Promise<unknown>;
  sortClipsByKeywords: (opts: { clips: unknown[]; title?: string }) => Promise<unknown[]>;

  // 사일런스/씬
  detectSilence: (opts: { filePath: string; threshold?: number; minDuration?: number }) => Promise<{ start: number; end: number }[]>;

  // [§15] 씬 자동 감지
  detectSceneChanges: (opts: {
    filePath: string;
    threshold?: number;
    maxScenes?: number;
  }) => Promise<Array<{
    index: number;
    time: number;
    duration: number | null;
    thumbnailPath: string | null;
  }>>;

  // 임시 파일 정리
  cleanupTmpFiles: () => Promise<{ deleted: number }>;

  // 에러 스냅샷
  renderErrorSnapshot: (opts: { editList: unknown[]; errorMsg: string }) => Promise<{ ok: boolean; path?: string }>;

  // 자동 저장
  autoSave: (data: unknown) => Promise<void>;
  autoSaveLoad: () => Promise<unknown>;
  autoSaveClear: () => Promise<void>;

  // 앱 정보
  appInfo: () => Promise<{ version: string }>;
  ffmpegStatus: () => Promise<unknown>;
  systemStats: () => Promise<unknown>;

  // 폴더 와처
  watchFolder: (folderPath: string, watchId: string) => Promise<{ ok: boolean }>;
  unwatchFolder: (watchId: string) => Promise<boolean>;
  onFolderNewFile: (cb: (data: { watchId: string; filePath: string; filename: string }) => void) => () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}

