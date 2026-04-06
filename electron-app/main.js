// electron-app/main.js  v2.74
// Electron 메인 프로세스
// ─ #1  FFmpeg 동적 경로   ─ #2  electron-builder.yml 연동
// ─ #3  chmod + 무결성 검사 ─ #4  IPC 실시간 로그 스트리밍
// ─ #5  FFmpeg 프로세스 kill ─ #6  저장 다이얼로그
// ─ #7  NVENC/QuickSync 하드웨어 가속 감지
// ─ #8  concat 필터 + 크로스페이드 ─ #9  Windows 알림 + 트레이
// ─ #10 CPU·메모리 모니터링
// ─ #31 워터마크  ─ #32 BGM믹싱  ─ #33 자막  ─ #34 크로스페이드
// ─ #35 9:16 자동크롭  ─ #36 일시정지/재개  ─ #37 썸네일추출
// ─ #39 LUT필터  ─ #40 내보내기프리셋
// ─ #57 영상분할  ─ #60 속도조절  ─ #74 렌더링큐  ─ #76 자동저장
// ─ #78 2패스인코딩  ─ #79 트레이진행률  ─ #80 CPU스레드최적화
// ─ #81 powerSaveBlocker  ─ #82 렌더 후 폴더 자동 열기
// ─ #83 auto-updater  ─ #84 FFmpeg 에러 로그파일
// ─ #85 볼륨 노멀라이즈  ─ #86 완료 후 영상 자동재생

'use strict';

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Notification,
  Tray,
  Menu,
  nativeImage,
  powerSaveBlocker, // #81
} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');
const fluent = require('fluent-ffmpeg');

// #83 — 자동 업데이트 (패키징 환경에서만 활성화)
let autoUpdater = null;
if (app.isPackaged) {
  try {
    autoUpdater = require('electron-updater').autoUpdater;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
  } catch (_) {}
}

// ═══════════════════════════════════════════════════════════════════════════
// §1  FFmpeg 바이너리 경로 동적 할당 (#1, #2, #3)
// ═══════════════════════════════════════════════════════════════════════════
function resolveBin(name) {
  const exe = process.platform === 'win32' ? `${name}.exe` : name;

  // 1) electron-builder extraResources 번들 (패키징)
  if (process.resourcesPath) {
    const bundled = path.join(process.resourcesPath, 'ffmpeg-bin', exe);
    if (fs.existsSync(bundled)) return bundled;
  }

  // 2) 개발 환경 – 프로젝트 로컬 빌드
  const variants = [
    path.resolve(
      __dirname,
      '../ffmpeg-2026-04-06-git-7fd2be97b9-full_build',
      'ffmpeg-2026-04-06-git-7fd2be97b9-full_build',
      'bin',
      exe,
    ),
    path.resolve(__dirname, '../../bin', exe),
    path.resolve(__dirname, '../bin', exe),
  ];
  for (const v of variants) if (fs.existsSync(v)) return v;

  // 3) PATH 시스템 바이너리
  try {
    const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
    const result = cp.execSync(cmd, { timeout: 3000 }).toString().trim().split(/\r?\n/)[0].trim();
    if (result && fs.existsSync(result)) return result;
  } catch (_) {}

  return null;
}

const FFMPEG_PATH = resolveBin('ffmpeg');
const FFPROBE_PATH = resolveBin('ffprobe');

if (FFMPEG_PATH) fluent.setFfmpegPath(FFMPEG_PATH);
if (FFPROBE_PATH) fluent.setFfprobePath(FFPROBE_PATH);

// #3 – 바이너리 실행 권한 부여 (macOS / Linux)
function ensureExec(p) {
  if (p && process.platform !== 'win32') {
    try {
      fs.chmodSync(p, 0o755);
    } catch (_) {}
  }
}
ensureExec(FFMPEG_PATH);
ensureExec(FFPROBE_PATH);

// ═══════════════════════════════════════════════════════════════════════════
// §2  바이너리 무결성 검사 — SHA-256 해시 캐시 (#48)
// ═══════════════════════════════════════════════════════════════════════════
function getUserDataPath(file) {
  // app.getPath은 ready 이후에만 사용 가능
  try {
    return path.join(app.getPath('userData'), file);
  } catch (_) {
    return path.join(os.tmpdir(), file);
  }
}
let _hashCache = {};
function loadHashCache() {
  try {
    _hashCache = JSON.parse(fs.readFileSync(getUserDataPath('ffmpeg_hashes.json'), 'utf8'));
  } catch (_) {}
}
function saveHashCache() {
  try {
    fs.writeFileSync(getUserDataPath('ffmpeg_hashes.json'), JSON.stringify(_hashCache));
  } catch (_) {}
}
function getFileHash(filePath) {
  const stat = fs.statSync(filePath);
  const cached = _hashCache[filePath];
  if (cached && cached.mtime === stat.mtimeMs) return cached.hash;
  const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  _hashCache[filePath] = { hash, mtime: stat.mtimeMs };
  saveHashCache();
  return hash;
}

// ═══════════════════════════════════════════════════════════════════════════
// §3  하드웨어 가속 감지 (#7 – NVENC / QuickSync / AMF / VideoToolbox)
// ═══════════════════════════════════════════════════════════════════════════
let _hwaccelCache = null;
async function detectHwaccel() {
  if (_hwaccelCache) return _hwaccelCache;
  if (!FFMPEG_PATH) return (_hwaccelCache = { codec: 'libx264', accel: null });

  async function tryCodec(codec) {
    return new Promise((resolve) => {
      cp.exec(
        `"${FFMPEG_PATH}" -hide_banner -loglevel error -f lavfi -i color=black:s=16x16:d=0.1 -vcodec ${codec} -f null -`,
        { timeout: 5000 },
        (err) => resolve(!err),
      );
    });
  }

  let codec = 'libx264',
    accel = null;
  if (process.platform === 'win32') {
    if (await tryCodec('h264_nvenc')) {
      codec = 'h264_nvenc';
      accel = 'NVENC (NVIDIA)';
    } else if (await tryCodec('h264_qsv')) {
      codec = 'h264_qsv';
      accel = 'QuickSync (Intel)';
    } else if (await tryCodec('h264_amf')) {
      codec = 'h264_amf';
      accel = 'AMF (AMD)';
    }
  } else if (process.platform === 'darwin') {
    if (await tryCodec('h264_videotoolbox')) {
      codec = 'h264_videotoolbox';
      accel = 'VideoToolbox';
    }
  }
  console.log(`[HW-ACCEL] codec=${codec}  accel=${accel || '없음'}`);
  return (_hwaccelCache = { codec, accel });
}

// ═══════════════════════════════════════════════════════════════════════════
// §4  CPU 코어 수 자동 감지 → -threads 최적화 (#80)
// ═══════════════════════════════════════════════════════════════════════════
const CPU_THREADS = Math.max(1, Math.floor(os.cpus().length * 0.75));

// ═══════════════════════════════════════════════════════════════════════════
// §5  렌더링 큐 (#74) + 프로세스 추적 (#5) + powerSaveBlocker (#81)
// ═══════════════════════════════════════════════════════════════════════════
const renderJobs = new Map(); // jobId → { cmd, pid }
const renderQueue = []; // 대기 작업
let activeJobs = 0;
const MAX_JOBS = 1;

// #81 절전 모드 차단 — 렌더링 중에는 PC가 절전 모드로 들어가지 않도록
let _powerSaveId = null;
function beginPowerBlock() {
  if (_powerSaveId === null) {
    _powerSaveId = powerSaveBlocker.start('prevent-app-suspension');
  }
}
function endPowerBlock() {
  if (_powerSaveId !== null && powerSaveBlocker.isStarted(_powerSaveId)) {
    powerSaveBlocker.stop(_powerSaveId);
    _powerSaveId = null;
  }
}

// #84 FFmpeg 에러 로그 파일 경로
function getFfmpegLogPath() {
  try {
    return path.join(app.getPath('userData'), 'ffmpeg_error.log');
  } catch (_) {
    return path.join(os.tmpdir(), 'ffmpeg_error.log');
  }
}
function appendFfmpegLog(jobId, line) {
  try {
    const logPath = getFfmpegLogPath();
    const entry = `[${new Date().toISOString()}][${jobId}] ${line}\n`;
    fs.appendFileSync(logPath, entry, 'utf8');
  } catch (_) {}
}

function enqueueRender(task) {
  return new Promise((resolve, reject) => {
    renderQueue.push({ task, resolve, reject });
    drainQueue();
  });
}
function drainQueue() {
  if (activeJobs >= MAX_JOBS || !renderQueue.length) return;
  const { task, resolve, reject } = renderQueue.shift();
  activeJobs++;
  beginPowerBlock(); // #81 렌더링 시작 → 절전 차단
  task()
    .then(resolve)
    .catch(reject)
    .finally(() => {
      activeJobs--;
      if (activeJobs === 0) endPowerBlock(); // #81 모든 작업 완료 → 절전 재허용
      drainQueue();
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// §6  자동 저장 (#76)
// ═══════════════════════════════════════════════════════════════════════════
function autoSave(data) {
  try {
    fs.writeFileSync(
      getUserDataPath('autosave.json'),
      JSON.stringify({ ...data, savedAt: Date.now() }),
    );
  } catch (_) {}
}
function autoSaveLoad() {
  try {
    return JSON.parse(fs.readFileSync(getUserDataPath('autosave.json'), 'utf8'));
  } catch (_) {
    return null;
  }
}
function autoSaveClear() {
  try {
    fs.unlinkSync(getUserDataPath('autosave.json'));
  } catch (_) {}
}

// ═══════════════════════════════════════════════════════════════════════════
// §7  창 & 시스템 트레이 생성 (#9, #79)
// ═══════════════════════════════════════════════════════════════════════════
let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: '무브먼트 Shorts Creator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  const distIndex = path.resolve(__dirname, '../shorts-creator-v2/moovlog-react/dist/index.html');

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadURL('https://122cks.github.io/moovlog/shorts-creator/');
  }
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('무브먼트 Shorts Creator');
  setTrayProgress(-1);
}

function setTrayProgress(pct) {
  if (!tray) return;
  const label = pct < 0 ? '대기 중' : pct >= 100 ? '✅ 렌더링 완료' : `렌더링 ${pct}%`;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '무브먼트 Shorts Creator', enabled: false },
      { label, enabled: false },
      { type: 'separator' },
      {
        label: '창 표시',
        click: () => (mainWindow ? mainWindow.show() : createWindow()),
      },
      { label: '종료', click: () => app.quit() },
    ]),
  );
  tray.setToolTip(`무브먼트 — ${label}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// §10  애플리케이션 메뉴 (#15, #18, #19)
// ═══════════════════════════════════════════════════════════════════════════
function buildAppMenu() {
  const template = [
    {
      label: '파일',
      submenu: [
        {
          label: '자동 저장 불러오기',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu-load-autosave'),
        },
        { type: 'separator' },
        { label: '종료', role: 'quit' },
      ],
    },
    {
      label: '보기',
      submenu: [
        {
          label: '개발자 도구',
          accelerator: 'F12',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        { type: 'separator' },
        { label: '실제 크기', role: 'resetZoom' },
        { label: '확대', role: 'zoomIn' },
        { label: '축소', role: 'zoomOut' },
        { type: 'separator' },
        { label: '전체화면', role: 'togglefullscreen' },
      ],
    },
    {
      label: '렌더링',
      submenu: [
        {
          label: '렌더링 취소',
          accelerator: 'CmdOrCtrl+.',
          click: () => mainWindow?.webContents.send('menu-cancel-render'),
        },
        {
          label: '렌더링 일시정지 / 재개',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('menu-toggle-pause'),
        },
        { type: 'separator' },
        {
          label: 'FFmpeg 상태 확인',
          click: () => {
            const available = !!FFMPEG_PATH;
            dialog
              .showMessageBox(mainWindow, {
                type: available ? 'info' : 'error',
                title: 'FFmpeg 상태',
                message: available
                  ? `✅ FFmpeg 경로:\n${FFMPEG_PATH}`
                  : '❌ FFmpeg를 찾을 수 없습니다.',
                detail: available
                  ? undefined
                  : 'https://github.com/BtbN/FFmpeg-Builds/releases 에서 다운로드 후 PATH에 추가하거나 프로젝트 ffmpeg-bin 폴더에 복사하세요.',
                buttons: available ? ['확인'] : ['다운로드 페이지 열기', '닫기'],
              })
              .then(({ response }) => {
                if (!available && response === 0)
                  shell.openExternal('https://github.com/BtbN/FFmpeg-Builds/releases');
              });
          },
        },
      ],
    },
    {
      label: '도움말',
      submenu: [
        {
          label: `버전 v${app.getVersion()}`,
          enabled: false,
        },
        { type: 'separator' },
        {
          label: 'GitHub 페이지',
          click: () => shell.openExternal('https://github.com/122cks/moovlog'),
        },
        {
          label: '릴리스 노트',
          click: () => shell.openExternal('https://github.com/122cks/moovlog/releases'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  loadHashCache();
  buildAppMenu();
  createWindow();
  createTray();

  // FFmpeg 없음 경고 (#1)
  if (!FFMPEG_PATH) {
    setTimeout(() => {
      if (!mainWindow) return;
      dialog
        .showMessageBox(mainWindow, {
          type: 'error',
          title: 'FFmpeg 없음',
          message: 'FFmpeg 바이너리를 찾을 수 없습니다.',
          detail:
            '렌더링 기능을 사용하려면 FFmpeg가 필요합니다.\nhttps://github.com/BtbN/FFmpeg-Builds/releases 에서 다운로드 후\nPATH에 추가하거나 ffmpeg-bin 폴더에 복사하세요.',
          buttons: ['다운로드 페이지 열기', '나중에'],
        })
        .then(({ response }) => {
          if (response === 0) shell.openExternal('https://github.com/BtbN/FFmpeg-Builds/releases');
        });
    }, 2000);
  }

  // #83 자동 업데이트 확인 (패키징 환경에서만)
  if (autoUpdater) {
    autoUpdater.on('update-available', (info) => {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: '업데이트 사용 가능',
          message: `새 버전 v${info.version}이 있습니다.`,
          detail: '지금 다운로드하시겠습니까? 설치는 앱 종료 시 자동으로 진행됩니다.',
          buttons: ['지금 다운로드', '나중에'],
        })
        .then(({ response }) => {
          if (response === 0) autoUpdater.downloadUpdate();
        });
    });
    autoUpdater.on('update-downloaded', () => {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: '업데이트 준비 완료',
          message: '업데이트가 준비됐습니다. 지금 설치하고 재시작하시겠습니까?',
          buttons: ['지금 재시작', '나중에'],
        })
        .then(({ response }) => {
          if (response === 0) autoUpdater.quitAndInstall();
        });
    });
    autoUpdater.on('error', (err) => {
      console.error('[AutoUpdater]', err?.message || err);
    });
    // 앱 시작 30초 후 업데이트 확인 (서버 부하 분산)
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 30000);
  }

  detectHwaccel().catch(() => {}); // 백그라운드 감지
  app.on('activate', () => {
    if (!mainWindow) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ═══════════════════════════════════════════════════════════════════════════
// IPC 핸들러
// ═══════════════════════════════════════════════════════════════════════════

// ── FFmpeg 상태 (#1, #7, #48) ────────────────────────────────────────────
ipcMain.handle('ffmpeg-status', async () => {
  const hw = await detectHwaccel();
  let hash = null;
  if (FFMPEG_PATH) {
    try {
      hash = getFileHash(FFMPEG_PATH).slice(0, 16) + '…';
    } catch (_) {}
  }
  return {
    available: !!FFMPEG_PATH,
    path: FFMPEG_PATH,
    version: getVersion(),
    hwaccel: hw.accel,
    codec: hw.codec,
    threads: CPU_THREADS,
    hash,
    queued: renderQueue.length,
    active: activeJobs,
  };
});

function getVersion() {
  if (!FFMPEG_PATH) return null;
  try {
    return cp
      .execSync(`"${FFMPEG_PATH}" -version`, { timeout: 3000 })
      .toString()
      .split('\n')[0]
      .trim();
  } catch (_) {
    return null;
  }
}

// ── CPU·메모리 모니터링 (#10) ─────────────────────────────────────────────
ipcMain.handle('system-stats', () => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const cpus = os.cpus();
  return {
    cpuModel: cpus[0]?.model || 'unknown',
    cpuCores: cpus.length,
    threads: CPU_THREADS,
    memUsedMB: Math.round(used / 1024 / 1024),
    memTotalMB: Math.round(total / 1024 / 1024),
    memPercent: Math.round((used / total) * 100),
    platform: process.platform,
    arch: process.arch,
  };
});

// ── 파일 선택 다이얼로그 ──────────────────────────────────────────────────
ipcMain.handle('open-file-dialog', async (_, opts = {}) => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: opts.title || '미디어 파일 선택',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: '미디어',
        extensions: ['mp4', 'mov', 'avi', 'mkv', 'jpg', 'jpeg', 'png', 'webp', 'gif'],
      },
      { name: '영상', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
      { name: '이미지', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
      { name: '음악', extensions: ['mp3', 'm4a', 'aac', 'wav', 'ogg'] },
      { name: '전체', extensions: ['*'] },
    ],
    ...opts,
  });
  return filePaths || [];
});

// ── 저장 경로 선택 (#6) ───────────────────────────────────────────────────
ipcMain.handle('save-file-dialog', async (_, opts = {}) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: opts.title || '영상 저장',
    defaultPath: opts.defaultPath || path.join(app.getPath('downloads'), 'moovlog_result.mp4'),
    filters: [
      { name: 'MP4 영상', extensions: ['mp4'] },
      { name: '전체', extensions: ['*'] },
    ],
  });
  return filePath || null;
});

// ── 탐색기에서 열기 ──────────────────────────────────────────────────────
ipcMain.handle('show-item-in-folder', (_, p) => shell.showItemInFolder(p));

// #82 폴더 열기 (openPath)
ipcMain.handle('open-path', (_, p) => shell.openPath(p));

// #83 수동 업데이트 확인
ipcMain.handle('check-for-updates', async () => {
  if (!autoUpdater) return { available: false, reason: 'updater-not-loaded' };
  try {
    const result = await autoUpdater.checkForUpdates();
    return { available: !!result?.updateInfo, info: result?.updateInfo };
  } catch (e) {
    return { available: false, error: e.message };
  }
});

// #84 FFmpeg 에러 로그 조회
ipcMain.handle('get-ffmpeg-error-log', () => {
  try {
    const logPath = getFfmpegLogPath();
    if (!fs.existsSync(logPath)) return { content: '', path: logPath };
    const content = fs.readFileSync(logPath, 'utf8');
    // 최근 200줄만 반환
    const lines = content.split('\n');
    return {
      content: lines.slice(-200).join('\n'),
      path: logPath,
      total: lines.length,
    };
  } catch (e) {
    return { content: '', error: e.message };
  }
});
// #84 에러 로그 삭제
ipcMain.handle('clear-ffmpeg-error-log', () => {
  try {
    fs.unlinkSync(getFfmpegLogPath());
    return true;
  } catch (_) {
    return false;
  }
});

// ── 자동 저장 IPC (#76) ───────────────────────────────────────────────────
ipcMain.handle('auto-save', (_, d) => {
  autoSave(d);
  return true;
});
ipcMain.handle('auto-save-load', () => autoSaveLoad());
ipcMain.handle('auto-save-clear', () => {
  autoSaveClear();
  return true;
});

// ── 앱 정보 ──────────────────────────────────────────────────────────────
ipcMain.handle('app-info', () => ({
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
  ffmpegPath: FFMPEG_PATH,
  userData: app.getPath('userData'),
}));

// ── 렌더링 프리셋 (#40) ──────────────────────────────────────────────────
ipcMain.handle('get-render-presets', async () => {
  const hw = await detectHwaccel();
  return {
    hwaccel: hw,
    threads: CPU_THREADS,
    presets: [
      {
        id: 'draft',
        label: '초안 (초고속)',
        crf: 35,
        preset: 'ultrafast',
        fps: 15,
        twoPass: false,
      },
      {
        id: 'fast',
        label: '빠름',
        crf: 28,
        preset: 'fast',
        fps: 30,
        twoPass: false,
      },
      {
        id: 'balanced',
        label: '균형 (권장)',
        crf: 22,
        preset: 'medium',
        fps: 30,
        twoPass: false,
      },
      {
        id: 'quality',
        label: '고품질',
        crf: 18,
        preset: 'slow',
        fps: 60,
        twoPass: false,
      },
      {
        id: 'archive',
        label: '최고품질 (2-Pass)',
        crf: 14,
        preset: 'veryslow',
        fps: 60,
        twoPass: true,
      },
    ],
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// §8  메인 렌더링 IPC (#1-10, #31-40, #74, #76, #78, #79, #80)
// ═══════════════════════════════════════════════════════════════════════════
ipcMain.handle('render-video', async (event, { editList, outputPath, options = {}, jobId }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg를 찾을 수 없습니다. 경로를 확인해주세요.');
  const jid = jobId || `job_${Date.now()}`;
  return enqueueRender(() => _doRender(event, editList, outputPath, options, jid));
});

// ── 렌더링 취소 (#5) ─────────────────────────────────────────────────────
ipcMain.handle('cancel-render', (_, jobId) => {
  const job = renderJobs.get(jobId);
  if (!job) return false;
  try {
    job.cmd.kill('SIGKILL');
  } catch (_) {}
  renderJobs.delete(jobId);
  return true;
});

// ── 일시정지 / 재개 (#36) ─────────────────────────────────────────────────
ipcMain.handle('pause-render', (_, jobId) => killSignal(jobId, 'SIGSTOP', 'pssuspend'));
ipcMain.handle('resume-render', (_, jobId) => killSignal(jobId, 'SIGCONT', 'pssuspend -r'));

function killSignal(jobId, unixSig, winCmd) {
  const job = renderJobs.get(jobId);
  if (!job?.pid) return false;
  try {
    if (process.platform === 'win32') {
      cp.execSync(`${winCmd} ${job.pid}`, { timeout: 2000 });
    } else {
      process.kill(job.pid, unixSig);
    }
    return true;
  } catch (_) {
    return false;
  }
}

// ─── 실제 렌더링 함수 ────────────────────────────────────────────────────
async function _doRender(event, editList, outputPath, options, jobId) {
  const send = (msg, pct) => {
    event.sender.send('render-progress', { pct: Math.round(pct), msg, jobId });
    event.sender.send('render-log', { msg, jobId }); // #4 실시간 로그
    setTrayProgress(Math.round(pct)); // #79 트레이
  };

  send('렌더링 준비 중...', 1);
  autoSave({ editList, options, outputPath, jobId, status: 'rendering' }); // #76

  const hw = await detectHwaccel(); // #7
  const {
    theme = 'hansik',
    fps = 30,
    crf = 22,
    preset = 'fast',
    width = 720,
    height = 1280,
    watermark = null, // #31 { path, position, scale }
    subtitle = null, // #33 { text, fontPath, size, color, y }
    bgmPath = null, // #32
    bgmVolume = 0.15, // #32
    twoPass = false, // #78
    crossfade = 0, // #34 전환 효과 초
    autoReframe = true, // #35 9:16 자동 크롭
    speedRamp = 1.0, // #60
    normalizeAudio = false, // #85 볼륨 노멀라이즈
    autoOpenFolder = true, // #82 렌더 후 폴더 자동 열기
    autoPlayAfter = false, // #86 렌더 후 영상 자동 재생
  } = options;

  const videoCodec = hw.codec;
  const LUT = getLutFilter(theme);
  const totalDur = editList.reduce((s, c) => s + Math.max(0.1, c.duration || 3), 0);
  const n = editList.length;

  return new Promise((resolve, reject) => {
    let cmd = fluent();

    // 입력 파일들
    editList.forEach((clip) => {
      const cleanPath = clip.path.replace(/^file:\/\/\//, '').replace(/\//g, path.sep);
      if ((clip.start || 0) > 0) cmd = cmd.addInputOption('-ss', String(clip.start));
      cmd = cmd.addInputOption('-t', String(Math.max(0.1, clip.duration || 3)));
      cmd = cmd.input(cleanPath);
    });

    // BGM 입력 (#32)
    const hasBgm = bgmPath && fs.existsSync(bgmPath);
    if (hasBgm) cmd = cmd.input(bgmPath);

    // 워터마크 입력 (#31)
    const hasWm = watermark?.path && fs.existsSync(watermark.path);
    if (hasWm) cmd = cmd.input(watermark.path);

    // ── 필터 그래프 ──────────────────────────────────────────────────────
    const filters = [];

    // 각 씬 스케일·크롭 (#35 자동 리프레임)
    for (let i = 0; i < n; i++) {
      const speed = speedRamp !== 1.0 ? `,setpts=${1 / speedRamp}*PTS` : '';
      if (autoReframe) {
        filters.push(
          `[${i}:v]scale=${width * 2}:-2,` +
            `crop=${width}:${height}:(iw-${width})/2:(ih-${height})/2,` +
            `setsar=1,fps=${fps}${speed}[v${i}]`,
        );
      } else {
        filters.push(
          `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,` +
            `crop=${width}:${height},setsar=1,fps=${fps}${speed}[v${i}]`,
        );
      }
    }

    // concat 또는 xfade (#8, #34)
    let lastVid = 'vc';
    if (crossfade > 0 && n > 1) {
      // xfade 연쇄
      let prev = 'v0';
      for (let i = 1; i < n; i++) {
        const out = i === n - 1 ? 'vc' : `cf${i}`;
        const offset = editList
          .slice(0, i)
          .reduce((s, c) => s + Math.max(0.1, c.duration || 3) - crossfade, 0);
        filters.push(
          `[${prev}][v${i}]xfade=transition=fade:duration=${crossfade}:offset=${Math.max(0, offset)}[${out}]`,
        );
        prev = out;
      }
    } else {
      filters.push(`${editList.map((_, i) => `[v${i}]`).join('')}concat=n=${n}:v=1:a=0[vc]`);
    }

    // LUT 색감 (#39)
    filters.push(`[${lastVid}]${LUT}[vc_lut]`);
    lastVid = 'vc_lut';

    // 자막 drawtext (#33)
    if (subtitle?.text) {
      const sz = subtitle.size || 40;
      const col = subtitle.color || 'white';
      const ypos = subtitle.y || `h-${sz * 2}`;
      const ff = subtitle.fontPath
        ? `fontfile='${subtitle.fontPath.replace(/\\/g, '/').replace(/:/g, '\\:')}':`
        : '';
      const txt = subtitle.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
      filters.push(
        `[${lastVid}]drawtext=${ff}text='${txt}':fontsize=${sz}:fontcolor=${col}:` +
          `x=(w-text_w)/2:y=${ypos}:box=1:boxcolor=black@0.5:boxborderw=8[vc_sub]`,
      );
      lastVid = 'vc_sub';
    }

    // 워터마크 overlay (#31)
    if (hasWm) {
      const wmIdx = n + (hasBgm ? 1 : 0);
      const sc = watermark.scale || 0.12;
      const posM = {
        topleft: '10:10',
        topright: `W-w-10:10`,
        bottomleft: `10:H-h-10`,
        bottomright: `W-w-10:H-h-10`,
      };
      const ov = posM[watermark.position || 'bottomright'];
      filters.push(`[${wmIdx}:v]scale=iw*${sc}:-1[wm],[${lastVid}][wm]overlay=${ov}[vc_wm]`);
      lastVid = 'vc_wm';
    }

    cmd.complexFilter(filters.join(';'), [lastVid]);

    // 오디오 출력 (#32 BGM 믹싱, #85 노멀라이즈)
    if (hasBgm) {
      const normFilter = normalizeAudio ? `,loudnorm=I=-16:LRA=11:TP=-1.5` : '';
      cmd.audioFilter(
        `[${n}:a]aloop=loop=-1:size=2000000000,atrim=duration=${totalDur},volume=${bgmVolume}${normFilter}[bgm_a]`,
      );
      cmd.addOption('-map', '[bgm_a]');
    } else if (normalizeAudio) {
      // BGM 없이 원본 오디오만 노멀라이즈
      cmd.audioFilter('loudnorm=I=-16:LRA=11:TP=-1.5');
    }

    // 출력 옵션 (#7 하드웨어코덱, #78 2패스, #80 스레드)
    const outOpts = [
      `-c:v ${videoCodec}`,
      videoCodec === 'libx264'
        ? `-preset ${preset}`
        : videoCodec === 'h264_nvenc'
          ? `-preset p4 -rc constqp`
          : videoCodec === 'h264_qsv'
            ? `-global_quality ${crf}`
            : '',
      videoCodec === 'libx264' ? `-crf ${crf}` : videoCodec === 'h264_nvenc' ? `-cq ${crf}` : '',
      videoCodec === 'h264_videotoolbox' ? `-q:v ${Math.round(crf / 2)}` : '',
      twoPass && videoCodec === 'libx264'
        ? `-pass 2 -passlogfile "${path.join(os.tmpdir(), 'moovlog_pass')}"`
        : '',
      `-threads ${CPU_THREADS}`,
      '-c:a aac',
      '-b:a 128k',
      '-movflags +faststart',
      '-pix_fmt yuv420p',
    ].filter(Boolean);

    cmd.outputOptions(outOpts).output(outputPath);

    // 진행률 + 실시간 로그 (#4)
    cmd.on('start', (cmdLine) => {
      send('인코딩 시작...', 5);
      event.sender.send('render-log', {
        msg: `▶ ${cmdLine.slice(0, 300)}`,
        jobId,
      });
    });

    cmd.on('stderr', (line) => {
      event.sender.send('render-log', { msg: line, jobId }); // #4
      // #84 에러 키워드 포함 행만 로그 파일에 기록
      if (/error|warning|invalid|fail/i.test(line)) {
        appendFfmpegLog(jobId, line);
      }
      const m = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (m) {
        const elapsed = +m[1] * 3600 + +m[2] * 60 + +m[3];
        send(
          `인코딩 중... ${Math.round((elapsed / totalDur) * 100)}%`,
          5 + (elapsed / totalDur) * 90,
        );
      }
    });

    // PID 추적 (#5)
    const origRun = cmd.run.bind(cmd);
    cmd.run = function () {
      origRun();
      // fluent-ffmpeg 내부 프로세스 PID 접근
      setTimeout(() => {
        const proc = cmd._ffmpegProc;
        if (proc) renderJobs.set(jobId, { cmd, pid: proc.pid });
      }, 300);
    };

    renderJobs.set(jobId, { cmd, pid: null });

    cmd.on('error', (err) => {
      renderJobs.delete(jobId);
      autoSaveClear();
      reject(err);
    });

    cmd.on('end', () => {
      renderJobs.delete(jobId);
      autoSaveClear();
      send('✅ 렌더링 완료!', 100);
      setTrayProgress(100); // #79

      // Windows 알림 (#9)
      if (Notification.isSupported()) {
        new Notification({
          title: '🎬 제작 완료 — 무브먼트 Shorts Creator',
          body: `저장 완료: ${path.basename(outputPath)}`,
          silent: false,
        }).show();
      }

      // #82 렌더 후 폴더 자동 열기 (탐색기에서 파일 선택)
      if (autoOpenFolder) {
        shell.showItemInFolder(outputPath);
      }

      // #86 완료 후 영상 자동 재생
      if (autoPlayAfter) {
        shell.openPath(outputPath).catch(() => {});
      }

      resolve({ outputPath, success: true });
    });

    // 1-pass 선행 실행 (#78)
    if (twoPass && videoCodec === 'libx264') {
      const passLog = path.join(os.tmpdir(), 'moovlog_pass');
      try {
        send('1차 패스 분석 중...', 2);
        const passArgs = [
          '-y',
          '-loglevel',
          'error',
          '-f',
          'lavfi',
          '-i',
          'color=black:s=720x1280:d=1',
          '-c:v',
          'libx264',
          '-preset',
          preset,
          '-pass',
          '1',
          '-passlogfile',
          passLog,
          '-an',
          '-f',
          'null',
          process.platform === 'win32' ? 'NUL' : '/dev/null',
        ];
        cp.execFileSync(FFMPEG_PATH, passArgs, { timeout: 60000 });
        send('2차 패스 인코딩 시작...', 3);
      } catch (_) {
        // 1패스 실패 시 단순 인코딩 진행
      }
    }

    cmd.run();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// §9  단일 목적 IPC들
// ═══════════════════════════════════════════════════════════════════════════

// ffprobe 미디어 분석
ipcMain.handle(
  'probe-media',
  (_, filePath) =>
    new Promise((resolve, reject) =>
      fluent.ffprobe(filePath, (err, meta) => (err ? reject(err) : resolve(meta))),
    ),
);

// 썸네일 추출 (#37)
ipcMain.handle('extract-thumbnail', async (_, { filePath, time = 1, outputDir }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
  const dir = outputDir || os.tmpdir();
  const file = `thumb_${Date.now()}.jpg`;
  return new Promise((resolve, reject) =>
    fluent(filePath)
      .screenshots({
        timestamps: [time],
        filename: file,
        folder: dir,
        size: '720x?',
      })
      .on('end', () => resolve(path.join(dir, file)))
      .on('error', reject),
  );
});

// BGM 믹싱 (#32)
ipcMain.handle('mix-bgm', async (_, { videoPath, bgmPath, volume = 0.15, outputPath }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
  return new Promise((resolve, reject) =>
    fluent(videoPath)
      .input(bgmPath)
      .complexFilter(
        [
          `[1:a]volume=${volume},aloop=loop=-1:size=2000000000,atrim=duration=999[bgm]`,
          `[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[outa]`,
        ],
        'outa',
      )
      .outputOptions(['-c:v copy', '-c:a aac', '-b:a 128k', '-shortest'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run(),
  );
});

// 워터마크 단독 (#31)
ipcMain.handle(
  'add-watermark',
  async (_, { videoPath, watermarkPath, position = 'bottomright', scale = 0.12, outputPath }) => {
    if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
    const posMap = {
      topleft: '10:10',
      topright: 'W-w-10:10',
      bottomleft: '10:H-h-10',
      bottomright: 'W-w-10:H-h-10',
    };
    return new Promise((resolve, reject) =>
      fluent(videoPath)
        .input(watermarkPath)
        .complexFilter(
          [`[1:v]scale=iw*${scale}:-1[wm]`, `[0:v][wm]overlay=${posMap[position]}[out]`],
          'out',
        )
        .outputOptions(['-c:a copy'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run(),
    );
  },
);

// 자막 .srt 삽입 (#33)
ipcMain.handle('add-subtitle', async (_, { videoPath, srtPath, outputPath }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
  const safeSubPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
  return new Promise((resolve, reject) =>
    fluent(videoPath)
      .videoFilter(`subtitles='${safeSubPath}'`)
      .outputOptions(['-c:a copy'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run(),
  );
});

// 영상 분할 (#57 — 15초 쇼츠 자동 분할)
ipcMain.handle('split-video', async (_, { videoPath, segmentDuration = 15, outputDir }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
  const dir = outputDir || os.tmpdir();
  const pattern = path.join(dir, `seg_%03d.mp4`);
  return new Promise((resolve, reject) =>
    fluent(videoPath)
      .outputOptions([
        '-c copy',
        '-map 0',
        `-segment_time ${segmentDuration}`,
        '-f segment',
        '-reset_timestamps 1',
      ])
      .output(pattern)
      .on('end', () => {
        const files = fs
          .readdirSync(dir)
          .filter((f) => f.match(/^seg_\d+\.mp4$/))
          .sort()
          .map((f) => path.join(dir, f));
        resolve(files);
      })
      .on('error', reject)
      .run(),
  );
});

// 속도 조절 (#60)
ipcMain.handle('speed-ramp', async (_, { videoPath, speed = 1.5, outputPath }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
  const pts = 1 / speed;
  const tempo = Math.min(2, Math.max(0.5, speed));
  return new Promise((resolve, reject) =>
    fluent(videoPath)
      .complexFilter([`[0:v]setpts=${pts}*PTS[v]`, `[0:a]atempo=${tempo}[a]`], ['v', 'a'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run(),
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// §10  LUT 색감 필터 (#39)
// ═══════════════════════════════════════════════════════════════════════════
function getLutFilter(theme) {
  const T = {
    hansik: 'eq=saturation=1.25:contrast=1.05:brightness=0.02,hue=h=5',
    cinema: "eq=saturation=0.8:contrast=1.2:brightness=-0.03,curves=r='0/0 0.5/0.45 1/1'",
    vivid: 'eq=saturation=1.5:contrast=1.1:brightness=0.04',
    retro: 'hue=h=-10:s=0.8,eq=gamma_r=1.1:gamma_b=0.9:contrast=1.05',
    bw: 'hue=s=0,eq=contrast=1.2:brightness=-0.05',
    warm: 'hue=h=8:s=1.1,eq=gamma_r=1.05:gamma_b=0.95',
    cool: 'hue=h=-8:s=1.05,eq=gamma_r=0.95:gamma_b=1.05',
    food: 'eq=saturation=1.3:contrast=1.08:brightness=0.05,hue=h=3',
    night: 'eq=saturation=0.9:contrast=1.3:brightness=-0.05',
    spring: 'eq=saturation=1.2:brightness=0.05,hue=h=10',
  };
  return T[theme] || T.hansik;
}
