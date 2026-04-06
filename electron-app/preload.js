// electron-app/preload.js
// 보안 IPC 브리지 — contextBridge로 안전하게 노출
// 렌더러(React)에서 window.electronAPI 로 접근

"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /** FFmpeg 설치 상태 확인 */
  ffmpegStatus: () => ipcRenderer.invoke("ffmpeg-status"),

  /** 미디어 파일 선택 다이얼로그 */
  openFiles: (opts) => ipcRenderer.invoke("open-file-dialog", opts),

  /** 저장 위치 다이얼로그 */
  saveFile: (opts) => ipcRenderer.invoke("save-file-dialog", opts),

  /** 파일 탐색기에서 열기 */
  showInFolder: (filePath) =>
    ipcRenderer.invoke("show-item-in-folder", filePath),

  /**
   * 영상 렌더링 시작 (로컬 FFmpeg)
   * @param {Array<{path:string, start:number, duration:number}>} editList
   * @param {string} outputPath
   * @param {{theme?:string, fps?:number, crf?:number}} options
   */
  renderVideo: (editList, outputPath, options) =>
    ipcRenderer.invoke("render-video", { editList, outputPath, options }),

  /** 렌더링 진행률 콜백 등록 ({pct:number, msg:string}) */
  onRenderProgress: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on("render-progress", handler);
    // 해제 함수 반환
    return () => ipcRenderer.removeListener("render-progress", handler);
  },

  /** ffprobe 영상 메타 분석 */
  probeMedia: (filePath) => ipcRenderer.invoke("probe-media", filePath),

  /** Electron 환경 여부 플래그 */
  isElectron: true,
});
