// electron-app/main.js
// Electron 메인 프로세스 — 창 생성, 로컬 FFmpeg 렌더링, IPC 핸들러

"use strict";

const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const cp = require("child_process");
const fluent = require("fluent-ffmpeg");

// ─── FFmpeg 바이너리 경로 설정 ─────────────────────────────────────────────────
// 배포 시: extraResources로 번들된 경로.  개발 시: 로컬 경로 폴백
function resolveFfmpegPath() {
  // 1) electron-builder extraResources 경로 (배포 패키징 시)
  const bundled = path.join(process.resourcesPath, "ffmpeg-bin", "ffmpeg.exe");
  if (fs.existsSync(bundled)) return bundled;

  // 2) 개발 환경 — 프로젝트 내 로컬 FFmpeg full build
  const localBuild = path.resolve(
    __dirname,
    "../ffmpeg-2026-04-06-git-7fd2be97b9-full_build",
    "ffmpeg-2026-04-06-git-7fd2be97b9-full_build",
    "bin",
    "ffmpeg.exe",
  );
  if (fs.existsSync(localBuild)) return localBuild;

  // 3) PATH에서 시스템 FFmpeg 탐색
  try {
    const which = cp
      .execSync("where ffmpeg")
      .toString()
      .trim()
      .split("\n")[0]
      .trim();
    if (which) return which;
  } catch (_) {}

  return null; // 없으면 null — 렌더러에 오류 알림
}

function resolveFfprobePath() {
  const bundled = path.join(process.resourcesPath, "ffmpeg-bin", "ffprobe.exe");
  if (fs.existsSync(bundled)) return bundled;
  const localBuild = path.resolve(
    __dirname,
    "../ffmpeg-2026-04-06-git-7fd2be97b9-full_build",
    "ffmpeg-2026-04-06-git-7fd2be97b9-full_build",
    "bin",
    "ffprobe.exe",
  );
  if (fs.existsSync(localBuild)) return localBuild;
  return null;
}

const FFMPEG_PATH = resolveFfmpegPath();
const FFPROBE_PATH = resolveFfprobePath();

if (FFMPEG_PATH) fluent.setFfmpegPath(FFMPEG_PATH);
if (FFPROBE_PATH) fluent.setFfprobePath(FFPROBE_PATH);

// ─── 윈도우 창 생성 ────────────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: "무브먼트 Shorts Creator",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // 보안: 렌더러와 Node 격리
      nodeIntegration: false, // 보안: 렌더러에서 Node 직접 사용 금지
      webSecurity: false, // file:// → 로컬 리소스 로드 허용
    },
  });

  // 배포 빌드: 웹앱 dist/index.html 로드
  const distIndex = path.resolve(
    __dirname,
    "../shorts-creator-v2/moovlog-react/dist/index.html",
  );

  // 개발: localhost:5173 (vite dev server)
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    // 빌드 없으면 GitHub Pages URL 폴백
    mainWindow.loadURL("https://122cks.github.io/moovlog/shorts-creator/");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (!mainWindow) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ─── IPC: FFmpeg 상태 확인 ─────────────────────────────────────────────────────
ipcMain.handle("ffmpeg-status", () => ({
  available: !!FFMPEG_PATH,
  path: FFMPEG_PATH,
  version: getFFmpegVersion(),
}));

function getFFmpegVersion() {
  if (!FFMPEG_PATH) return null;
  try {
    return cp
      .execSync(`"${FFMPEG_PATH}" -version`, { timeout: 3000 })
      .toString()
      .split("\n")[0]
      .trim();
  } catch (_) {
    return null;
  }
}

// ─── IPC: 파일 선택 대화상자 ───────────────────────────────────────────────────
ipcMain.handle("open-file-dialog", async (_, opts = {}) => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: opts.title || "미디어 파일 선택",
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "미디어",
        extensions: ["mp4", "mov", "avi", "mkv", "jpg", "jpeg", "png", "webp"],
      },
      { name: "영상", extensions: ["mp4", "mov", "avi", "mkv"] },
      { name: "이미지", extensions: ["jpg", "jpeg", "png", "webp"] },
      { name: "전체", extensions: ["*"] },
    ],
    ...opts,
  });
  return filePaths || [];
});

// ─── IPC: 저장 위치 선택 ──────────────────────────────────────────────────────
ipcMain.handle("save-file-dialog", async (_, opts = {}) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: opts.title || "영상 저장",
    defaultPath:
      opts.defaultPath ||
      path.join(app.getPath("downloads"), "moovlog_result.mp4"),
    filters: [{ name: "MP4 영상", extensions: ["mp4"] }],
  });
  return filePath || null;
});

// ─── IPC: 파일 탐색기에서 열기 ────────────────────────────────────────────────
ipcMain.handle("show-item-in-folder", (_, filePath) => {
  shell.showItemInFolder(filePath);
});

// ─── IPC: 영상 렌더링 (로컬 FFmpeg) ──────────────────────────────────────────
// editList: Array<{
//   path:     string   (파일 경로 — file://는 제거)
//   start:    number   (초 단위 시작점)
//   duration: number   (초 단위 길이)
//   filters?: string   (추가 vf 필터, 선택)
// }>
// outputPath: string  (출력 파일 경로)
// options: { theme, fps, crf, preset, width, height }
ipcMain.handle(
  "render-video",
  async (event, { editList, outputPath, options = {} }) => {
    if (!FFMPEG_PATH)
      throw new Error("FFmpeg를 찾을 수 없습니다. 설치 경로를 확인해주세요.");

    const {
      theme = "hansik",
      fps = 30,
      crf = 22,
      preset = "fast",
      width = 720,
      height = 1280,
    } = options;

    // LUT/색감 보정 필터 (테마별)
    const LUT = getLutFilter(theme);

    return new Promise((resolve, reject) => {
      let cmd = fluent();

      // 모든 씬 입력 추가
      editList.forEach((clip) => {
        const cleanPath = clip.path
          .replace(/^file:\/\/\//, "")
          .replace(/\//g, path.sep);
        cmd = cmd.input(cleanPath);
        if (clip.start > 0) cmd = cmd.inputOption("-ss", String(clip.start));
        cmd = cmd.inputOption("-t", String(clip.duration));
      });

      // 필터 그래프: 각 씬 스케일 → concat → LUT
      const scaleFilters = editList.map(
        (_, i) =>
          `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,` +
          `crop=${width}:${height},setsar=1,fps=${fps}[v${i}]`,
      );
      const concatInputs = editList.map((_, i) => `[v${i}]`).join("");
      const concatFilter = `${concatInputs}concat=n=${editList.length}:v=1:a=0[vc]`;
      const lutFilter = `[vc]${LUT}[vout]`;

      const filterComplex = [...scaleFilters, concatFilter, lutFilter].join(
        "; ",
      );

      // 총 길이 추정 (프로그레스 계산용)
      const totalDur = editList.reduce((s, c) => s + c.duration, 0);

      cmd
        .complexFilter(filterComplex, "vout")
        .outputOptions([
          `-c:v libx264`,
          `-preset ${preset}`,
          `-crf ${crf}`,
          `-pix_fmt yuv420p`,
          `-movflags +faststart`,
          `-an`, // 오디오 없음 (TTS는 별도)
        ])
        .output(outputPath)
        .on("start", (cmd) => {
          console.log("[Electron FFmpeg] 시작:", cmd.substring(0, 120) + "...");
          event.sender.send("render-progress", {
            pct: 0,
            msg: "렌더링 시작...",
          });
        })
        .on("stderr", (line) => {
          // time= HH:MM:SS.xx 파싱 → 진행률
          const m = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
          if (m) {
            const elapsed =
              parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
            const pct = Math.min(99, Math.round((elapsed / totalDur) * 100));
            event.sender.send("render-progress", {
              pct,
              msg: `렌더링 중... ${pct}%`,
            });
          }
        })
        .on("end", () => {
          event.sender.send("render-progress", { pct: 100, msg: "✅ 완료!" });
          resolve({ success: true, outputPath });
        })
        .on("error", (err) => {
          console.error("[Electron FFmpeg] 오류:", err.message);
          reject(new Error("FFmpeg 오류: " + err.message));
        })
        .run();
    });
  },
);

// ─── IPC: ffprobe 영상 정보 분석 ──────────────────────────────────────────────
ipcMain.handle("probe-media", (_, filePath) => {
  const cleanPath = filePath
    .replace(/^file:\/\/\//, "")
    .replace(/\//g, path.sep);
  return new Promise((resolve, reject) => {
    fluent.ffprobe(cleanPath, (err, data) => {
      if (err) reject(new Error(err.message));
      else resolve(data);
    });
  });
});

// ─── 테마별 LUT 필터 (VideoRenderer.js 와 동일 로직) ─────────────────────────
function getLutFilter(theme) {
  const LUTs = {
    cafe: "curves=preset=vintage,eq=saturation=1.2:brightness=0.03:contrast=1.08,unsharp=3:3:0.8:3:3:0.0",
    grill:
      "eq=contrast=1.1:saturation=1.5:brightness=0.02,unsharp=5:5:1.5:5:5:0.0",
    hansik: "eq=saturation=1.15:contrast=1.08,unsharp=3:3:0.8:3:3:0.0",
    premium:
      "eq=contrast=1.05:saturation=1.3:brightness=0.04,curves=preset=lighter,unsharp=5:5:1.0:5:5:0.0",
    pub: "eq=saturation=1.4:contrast=1.15:brightness=-0.02,unsharp=3:3:0.9:3:3:0.0",
    seafood: "eq=saturation=1.3:hue=3:brightness=0.03,unsharp=3:3:1.0:3:3:0.0",
    chinese:
      "eq=saturation=1.5:contrast=1.2:brightness=-0.03,unsharp=3:3:0.8:3:3:0.0",
  };
  return LUTs[theme] || LUTs.hansik;
}
