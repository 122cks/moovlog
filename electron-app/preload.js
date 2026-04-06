// electron-app/preload.js  v2.73
// contextBridge — 렌더러(React)에 window.electronAPI 를 안전하게 노출
// 모든 IPC 채널을 포함: 렌더링·파일·시스템·자동저장·미디어 편집

'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// 이벤트 구독 헬퍼 (메모리 누수 방지를 위해 항상 해제 함수 반환)
function subscribe(channel, callback) {
  const handler = (_, data) => callback(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('electronAPI', {
  // ── 환경 플래그 ────────────────────────────────────────────────────────
  isElectron: true,

  // ── FFmpeg 상태 (#1, #7, #48) ──────────────────────────────────────────
  ffmpegStatus: () => ipcRenderer.invoke('ffmpeg-status'),

  // ── 시스템 정보 (#10) ──────────────────────────────────────────────────
  systemStats: () => ipcRenderer.invoke('system-stats'),

  // ── 파일 다이얼로그 (#6) ───────────────────────────────────────────────
  openFiles: (opts) => ipcRenderer.invoke('open-file-dialog', opts),
  saveFile: (opts) => ipcRenderer.invoke('save-file-dialog', opts),
  showInFolder: (p) => ipcRenderer.invoke('show-item-in-folder', p),

  // ── 기본 렌더링 (#1-10, #31-40) ─────────────────────────────────────────
  renderVideo: (editList, outputPath, options, jobId) =>
    ipcRenderer.invoke('render-video', {
      editList,
      outputPath,
      options,
      jobId,
    }),

  // ── 렌더링 제어 (#5, #36) ──────────────────────────────────────────────
  cancelRender: (jobId) => ipcRenderer.invoke('cancel-render', jobId),
  pauseRender: (jobId) => ipcRenderer.invoke('pause-render', jobId),
  resumeRender: (jobId) => ipcRenderer.invoke('resume-render', jobId),

  // ── 렌더링 진행률 구독 (#4) ────────────────────────────────────────────
  onRenderProgress: (cb) => subscribe('render-progress', cb),

  // ── 실시간 FFmpeg 로그 구독 (#4) ──────────────────────────────────────
  onRenderLog: (cb) => subscribe('render-log', cb),

  // ── 내보내기 프리셋 (#40) ─────────────────────────────────────────────
  getRenderPresets: () => ipcRenderer.invoke('get-render-presets'),

  // ── 미디어 분석 ───────────────────────────────────────────────────────
  probeMedia: (filePath) => ipcRenderer.invoke('probe-media', filePath),
  // #3 키워드 거리 기반 클립 정렬
  sortClipsByKeywords: (opts) => ipcRenderer.invoke('sort-clips-by-keywords', opts),

  // ── 썸네일 추출 (#37) ─────────────────────────────────────────────────
  extractThumbnail: (opts) => ipcRenderer.invoke('extract-thumbnail', opts),

  // ── BGM 믹싱 (#32) ────────────────────────────────────────────────────
  mixBGM: (opts) => ipcRenderer.invoke('mix-bgm', opts),

  // ── 워터마크 (#31) ────────────────────────────────────────────────────
  addWatermark: (opts) => ipcRenderer.invoke('add-watermark', opts),

  // ── 자막 삽입 (#33) ───────────────────────────────────────────────────
  addSubtitle: (opts) => ipcRenderer.invoke('add-subtitle', opts),

  // ── 영상 분할 (#57) ───────────────────────────────────────────────────
  splitVideo: (opts) => ipcRenderer.invoke('split-video', opts),

  // ── 속도 조절 (#60) ───────────────────────────────────────────────────
  speedRamp: (opts) => ipcRenderer.invoke('speed-ramp', opts),

  // ── 자동 저장 (#76) ───────────────────────────────────────────────────
  autoSave: (data) => ipcRenderer.invoke('auto-save', data),
  autoSaveLoad: () => ipcRenderer.invoke('auto-save-load'),
  autoSaveClear: () => ipcRenderer.invoke('auto-save-clear'),

  // ── 앱 정보 ───────────────────────────────────────────────────────────
  appInfo: () => ipcRenderer.invoke('app-info'),

  // ── #97 마지막 렌더 옵션 저장/불러오기 ──────────────────────────────
  saveRenderOptions: (opts) => ipcRenderer.invoke('save-render-options', opts),
  loadRenderOptions: () => ipcRenderer.invoke('load-render-options'),

  // ── 폴더 와처 ─────────────────────────────────────────────────────────
  watchFolder: (folderPath, watchId) => ipcRenderer.invoke('watch-folder', { folderPath, watchId }),
  unwatchFolder: (watchId) => ipcRenderer.invoke('unwatch-folder', watchId),
  onFolderNewFile: (cb) => subscribe('folder-new-file', cb),

  // ── [#2] 렌더 검증 오류 — 누락 클립 인덱스 목록 ─────────────────────
  // missingIndices: 존재하지 않는 파일의 editList 인덱스 배열
  // 렌더러에서 이 이벤트를 받아 해당 클립을 빨간색으로 하이라이트 하세요.
  onRenderValidationError: (cb) => subscribe('render-validation-error', cb),

  // ── [#6 임시 파일 클리너] 렌더링 완료 후 tmp 파일 삭제 ─────────────
  cleanupTmpFiles: () => ipcRenderer.invoke('cleanup-tmp-files'),

  // ── [#8 에러 로그 스냅샷] FFmpeg 오류 시 editList 경로 리포트 저장 ──
  renderErrorSnapshot: (opts) => ipcRenderer.invoke('render-error-snapshot', opts),
});
