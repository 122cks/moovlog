// electron-app/main.js  v2.76
// Electron 메인 프로세스
// ─ #1  FFmpeg 동적 경로   ─ #2  electron-builder.yml 연동
// ─ #3  chmod + 무결성 검사 ─ #4  IPC 실시간 로그 스트리밍
// ─ #5  FFmpeg 프로세스 kill ─ #6  저장 다이얼로그
// ─ #7  NVENC/QuickSync 하드웨어 가속 감지  ─ getBestCodec()
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
// ─ #87 크래시 복구  ─ #88 렌더링 ETA  ─ #89 점프컷(무음제거)
// ─ #90 프록시 워크플로우  ─ #91 세그먼트 병렬렌더링
// ─ #92 무료 엔딩크레딧  ─ #93 렌더링 우선순위

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

// 최근 렌더링 목록 (max 5) — { path, title, time }
const _recentRenders = [];
function addRecentRender(filePath) {
  _recentRenders.unshift({ path: filePath, title: path.basename(filePath), time: Date.now() });
  if (_recentRenders.length > 5) _recentRenders.pop();
}
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

// #7 getBestCodec() — detectHwaccel의 명시적 래퍼 (요청 API 호환)
async function getBestCodec() {
  const hw = await detectHwaccel();
  return hw;
}

// ═══════════════════════════════════════════════════════════════════════════
// §3b  렌더링 ETA 계산 (#88)
// ═══════════════════════════════════════════════════════════════════════════
// renderStart 시각과 현재 진행률로 남은 시간 추정
const _renderStartTimes = new Map(); // jobId → startMs

function calcETA(jobId, pct) {
  if (pct <= 0 || pct >= 100) return null;
  const start = _renderStartTimes.get(jobId);
  if (!start) return null;
  const elapsed = (Date.now() - start) / 1000; // seconds
  const total = (elapsed / pct) * 100;
  const remaining = Math.max(0, total - elapsed);
  const min = Math.floor(remaining / 60);
  const sec = Math.floor(remaining % 60);
  return min > 0 ? `${min}분 ${sec}초 남음` : `${sec}초 남음`;
}

// ═══════════════════════════════════════════════════════════════════════════
// §3c  크래시 복구 감지 (#87)
//  — autosave.json에 status:'rendering' 상태가 남아있으면 비정상 종료로 판단
// ═══════════════════════════════════════════════════════════════════════════
function checkCrashRecovery() {
  try {
    const saved = autoSaveLoad();
    if (saved?.status === 'rendering') {
      return {
        found: true,
        jobId: saved.jobId,
        outputPath: saved.outputPath,
        savedAt: saved.savedAt,
        editList: saved.editList,
        options: saved.options,
      };
    }
  } catch (_) {}
  return { found: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// §4  CPU 코어 수 자동 감지 → -threads 최적화 (#80 / #97)
// ═══════════════════════════════════════════════════════════════════════════
const _CPU_TOTAL = os.cpus().length;
const CPU_THREADS = Math.max(1, Math.floor(_CPU_TOTAL * 0.75)); // 정적 기본값 (status/presets 호환용)

// #97 동적 스레드 계산 — 렌더 시점의 가용 메모리 상황을 반영
// 가용 RAM < 2 GB → 25%  |  < 4 GB → 50%  |  그 이상 → 75%
function getDynamicThreads() {
  const freeMB = os.freemem() / 1048576;
  const ratio = freeMB < 2048 ? 0.25 : freeMB < 4096 ? 0.5 : 0.75;
  const t = Math.max(1, Math.floor(_CPU_TOTAL * ratio));
  console.log(`[DynThread] 가용 RAM ${Math.round(freeMB)} MB → 스레드 ${t}/${_CPU_TOTAL}`);
  return t;
}

// #98 RAM 기반 동적 preset 결정
// 가용 RAM < 2 GB → ultrafast  |  < 4 GB → fast  |  그 이상 → medium
// caller가 'libx264' 이외 코덱을 쓸 땐 무시됨
function getDynamicPreset(userPreset) {
  // 사용자가 명시적으로 고속 preset을 지정한 경우 우선 사용
  if (['ultrafast', 'superfast', 'veryfast'].includes(userPreset)) return userPreset;
  const freeMB = os.freemem() / 1048576;
  if (freeMB < 2048) return 'ultrafast';
  if (freeMB < 4096) return 'fast';
  // RAM ≥ 8GB + 미지정 → 'slow' (고화질 모드, CRF 18과 연동 #21)
  if (freeMB >= 8192 && !userPreset) return 'slow';
  return userPreset || 'medium';
}

// RAM 기반 동적 CRF 결정 — 가용 RAM이 많을수록 고화질(낮은 CRF)
// RAM ≥ 8GB → 18 (최상), ≥ 4GB → 20 (고품질), 그 이하 → 사용자 지정값 유지
function getDynamicCrf(userCrf) {
  const freeMB = os.freemem() / 1048576;
  if (freeMB >= 8192) return 18;
  if (freeMB >= 4096) return 20;
  return userCrf; // 저사양: 사용자가 지정한 값 그대로
}

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
    // #98 10 MB 초과 시 아카이브 폴더로 이동
    if (fs.existsSync(logPath) && fs.statSync(logPath).size > 10 * 1024 * 1024) {
      const archiveDir = path.join(path.dirname(logPath), 'ffmpeg_log_archive');
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.renameSync(logPath, path.join(archiveDir, `ffmpeg_error_${stamp}.log`));
    }
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
  const recentItems =
    _recentRenders.length > 0
      ? _recentRenders.map((r) => ({
          label: r.title,
          click: () => shell.showItemInFolder(r.path),
        }))
      : [{ label: '(없음)', enabled: false }];
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '무브먼트 Shorts Creator', enabled: false },
      { label, enabled: false },
      { type: 'separator' },
      { label: '최근 렌더링', submenu: recentItems },
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

  // #87 크래시 복구 — 시작 시 비정상 종료 감지 후 복구 팝업
  setTimeout(() => {
    if (!mainWindow) return;
    const recovery = checkCrashRecovery();
    if (!recovery.found) return;
    const savedTime = recovery.savedAt
      ? new Date(recovery.savedAt).toLocaleString('ko-KR')
      : '알 수 없음';
    dialog
      .showMessageBox(mainWindow, {
        type: 'warning',
        title: '이전 렌더링 복구',
        message: '앱이 비정상 종료되었습니다.',
        detail:
          `저장 시각: ${savedTime}\n` +
          `출력 경로: ${recovery.outputPath || '알 수 없음'}\n\n` +
          '이전 작업을 복구하시겠습니까?',
        buttons: ['복구하기', '삭제 후 새 시작'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) {
          // 편집 데이터를 렌더러에 전달
          mainWindow?.webContents.send('crash-recovery', recovery);
        } else {
          autoSaveClear();
        }
      });
  }, 3500);

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
// GPU 코덱 오류 여부 판별 (NVENC / QSV / AMF 관련 FFmpeg 에러 메시지)
function isHwaccelError(err) {
  const msg = (err?.message || String(err)).toLowerCase();
  return /nvenc|h264_nvenc|h264_qsv|h264_amf|no hardware|hardware encoder|init_encoder|direct3d|amf_context/.test(
    msg,
  );
}

// FFmpeg raw 에러를 사용자 친화적 한글 메시지로 치환
function humanizeFfmpegError(err) {
  const raw = err?.message || String(err);
  if (/no input specified/i.test(raw))
    return '선택된 영상 소스가 없습니다. 파일을 다시 확인해주세요.';
  if (/no such file|could not open/i.test(raw))
    return `파일을 찾을 수 없습니다. 경로를 확인해주세요.\n(${raw.slice(0, 120)})`;
  if (/invalid data|moov atom not found/i.test(raw))
    return `손상된 영상 파일입니다. 다른 파일로 대체해주세요.\n(${raw.slice(0, 120)})`;
  if (/permission denied/i.test(raw)) return '파일 접근 권한이 없습니다. 폴더 권한을 확인해주세요.';
  return raw; // 기타 에러는 원문 유지
}

ipcMain.handle('render-video', async (event, { editList, outputPath, options = {}, jobId }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg를 찾을 수 없습니다. 경로를 확인해주세요.');

  // ── 입력 검증 (No input specified 방어) ──────────────────────────────
  if (!Array.isArray(editList) || editList.length === 0) {
    throw new Error(
      '영상을 먼저 추가해주세요. 타임라인에 클립이 없으면 렌더링을 시작할 수 없습니다.',
    );
  }

  // 동영상 + 이미지 모두 허용 (이미지는 -loop 1으로 정지 영상 스트림으로 변환)
  const ALLOWED_EXT = /\.(mp4|mov|avi|mkv|webm|m4v|mts|m2ts|flv|wmv|jpg|jpeg|png|webp|gif)$/i;
  for (const clip of editList) {
    const rawPath = (clip.path || '').replace(/^file:\/\/\//, '').replace(/\//g, path.sep);
    if (!rawPath) {
      throw new Error(
        `클립 소스 경로가 비어 있습니다. 파일을 다시 추가해주세요. (순서: ${editList.indexOf(clip) + 1}번째)`,
      );
    }
    if (!ALLOWED_EXT.test(rawPath)) {
      throw new Error(
        `지원하지 않는 파일 형식입니다: "${path.basename(rawPath)}"\n지원 형식: mp4, mov, avi, mkv, webm, jpg, png, webp 등`,
      );
    }
    if (!fs.existsSync(rawPath)) {
      throw new Error(
        `소스 파일을 찾을 수 없습니다: "${path.basename(rawPath)}"\n경로를 확인하거나 파일을 다시 추가해주세요.`,
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────
  const jid = jobId || `job_${Date.now()}`;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const opts = attempt === 1 ? options : { ...options, _forceLibx264: true };
      if (attempt > 1) {
        event.sender.send('render-log', {
          msg: `[폴백] GPU 코덱 오류 → libx264로 재시도 (${attempt}/${MAX_ATTEMPTS})`,
          jobId: jid,
        });
      }
      return await enqueueRender(() => _doRender(event, editList, outputPath, opts, jid));
    } catch (err) {
      const isGpuErr = isHwaccelError(err);
      console.warn(`[render-video] 시도 ${attempt} 실패 (GPU오류=${isGpuErr}):`, err?.message);
      if (!isGpuErr || attempt >= MAX_ATTEMPTS) {
        // fluent-ffmpeg 동기 throw('No input specified' 등)도 한글 메시지로 치환
        const friendlyMsg = humanizeFfmpegError(err);
        throw friendlyMsg !== (err?.message || String(err))
          ? Object.assign(new Error(friendlyMsg), { originalError: err })
          : err;
      }
      // GPU 오류: 캐시 무효화 후 다음 시도에서 libx264 강제 사용
      _hwaccelCache = null;
    }
  }
});

// ── 폴더 와처 IPC ─────────────────────────────────────────────────────────
// watch-folder: 지정 폴더에 VIDEO 파일이 생기면 renderer에 'folder-new-file' 이벤트 전송
const _activeWatchers = new Map(); // watchId → FSWatcher
ipcMain.handle('watch-folder', (event, { folderPath, watchId }) => {
  if (_activeWatchers.has(watchId)) {
    try {
      _activeWatchers.get(watchId).close();
    } catch (_) {}
  }
  const watcher = fs.watch(folderPath, { persistent: false }, (evtType, filename) => {
    if (evtType === 'rename' && filename && /\.(mp4|mov|avi|mkv|webm)$/i.test(filename)) {
      const fullPath = path.join(folderPath, filename);
      // 파일이 실제로 존재하는 경우만(생성 이벤트) 전송
      if (fs.existsSync(fullPath)) {
        event.sender.send('folder-new-file', { watchId, filePath: fullPath, filename });
      }
    }
  });
  _activeWatchers.set(watchId, watcher);
  return { ok: true };
});
ipcMain.handle('unwatch-folder', (_, watchId) => {
  if (_activeWatchers.has(watchId)) {
    try {
      _activeWatchers.get(watchId).close();
    } catch (_) {}
    _activeWatchers.delete(watchId);
  }
  return true;
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
  // #88 ETA: 렌더 시작 시각 기록
  _renderStartTimes.set(jobId, Date.now());
  const send = (msg, pct) => {
    const eta = calcETA(jobId, pct); // #88 남은 시간 계산
    event.sender.send('render-progress', { pct: Math.round(pct), msg, jobId, eta });
    event.sender.send('render-log', { msg, jobId }); // #4 실시간 로그
    setTrayProgress(Math.round(pct)); // #79 트레이
  };

  send('렌더링 준비 중...', 1);
  autoSave({ editList, options, outputPath, jobId, status: 'rendering' }); // #76

  const hw = await detectHwaccel(); // #7
  const {
    theme = 'hansik',
    fps = 30,
    crf = 18, // #2 고화질 기본값 (인스타 릴스 권장 무손실급)
    preset = 'fast',
    width = 1080, // #9 인스타 릴스 표준 가로해상도
    height = 1920, // #9 인스타 릴스 표준 세로해상도
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
    autoPlayAfter = false, // #86 완료 후 영상 자동 재생
    isPremium = false, // #92 무료/유료 구분
    endingCredit = true, // #92 무료 사용자 엔딩 크레딧 여부
    boxblur = true, // #13 해상도 불일치 시 boxblur 배경 채우기 (autoReframe=false 시 활성)
    unsharp = false, // #24 선명도 향상 필터 (unsharp mask)
    nightMode = false, // #28 야간/노이즈 영상 hqdn3d 제거 필터
    qrPath = null, // #10 엔딩 QR 코드 이미지 경로 (options.qrPath)
  } = options;

  const videoCodec = options._forceLibx264 ? 'libx264' : hw.codec;
  const LUT = getLutFilter(theme);
  const totalDur = editList.reduce((s, c) => s + Math.max(0.1, c.duration || 3), 0);
  const n = editList.length;

  return new Promise((resolve, reject) => {
    let cmd = fluent();

    // ── Gapless 스냅: 클립 간 gap이 있으면 앞 클립 duration을 연장 ─────────
    // 타임라인 position 기준으로 정렬 후, 앞 클립 끝과 뒤 클립 시작 사이 간격을 메움
    const snappedList = editList.map((c, i) => {
      if (i === editList.length - 1) return { ...c };
      const next = editList[i + 1];
      const thisEnd = (c.timelinePos || 0) + (c.duration || 3);
      const nextStart = next.timelinePos || 0;
      const gap = nextStart - thisEnd;
      // gap이 0.05초 이상이면 duration을 늘려 붙임 (0.5초 이하 gap만 보정)
      if (gap > 0.05 && gap <= 0.5) {
        return { ...c, duration: (c.duration || 3) + gap };
      }
      return { ...c };
    });

    // 입력 파일들
    const _IS_VIDEO = /\.(mp4|mov|avi|mkv|webm|m4v|mts|m2ts|flv|wmv)$/i;
    snappedList.forEach((clip) => {
      const cleanPath = clip.path
        .replace(/^\/file:\/\/\//, '')
        .replace(/^file:\/\/\//, '')
        .replace(/\//g, path.sep);
      if (_IS_VIDEO.test(cleanPath)) {
        // 동영상 입력: HEVC/H.265 소프트웨어 디코딩 + 손상 프레임 복구
        cmd = cmd.addInputOption('-hwaccel', 'auto');
        cmd = cmd.addInputOption('-fflags', '+genpts+igndts');
        if ((clip.start || 0) > 0) cmd = cmd.addInputOption('-ss', String(clip.start));
      } else {
        // 이미지 입력 (.jpg/.png/.webp 등): -loop 1로 정지 영상 스트림 생성 (#1 동영상 엔진)
        cmd = cmd.addInputOption('-loop', '1');
        cmd = cmd.addInputOption('-framerate', String(fps));
      }
      cmd = cmd.addInputOption('-t', String(Math.max(0.1, clip.duration || 3)));
      cmd = cmd.input(cleanPath);
    });

    // Gapless 스냅 처리 후 totalDur 재계산 (엔딩 크레딧 타이밍 정확도 확보)
    const snappedTotalDur = snappedList.reduce((s, c) => s + Math.max(0.1, c.duration || 3), 0);

    // BGM 입력 (#32)
    const hasBgm = bgmPath && fs.existsSync(bgmPath);
    if (hasBgm) cmd = cmd.input(bgmPath);

    // 워터마크 입력 (#31)
    const hasWm = watermark?.path && fs.existsSync(watermark.path);
    if (hasWm) cmd = cmd.input(watermark.path);

    // ── 필터 그래프 ──────────────────────────────────────────────────────
    const filters = [];

    // 각 씬 스케일·크롭 (#35 자동 리프레임, #11 비디오 스트림, #13 boxblur, #24 unsharp, #28 hqdn3d)
    // format=yuv420p 선행 → HEVC/AV1 등 비표준 픽셀 포맷으로 인한 검은 화면 방지
    for (let i = 0; i < n; i++) {
      const speed = speedRamp !== 1.0 ? `,setpts=${1 / speedRamp}*PTS` : '';
      const ptsReset = ',setpts=PTS-STARTPTS'; // 클립 간 타임스탬프 리셋 — 검은 화면 방지 (#14)
      const sharpFilter = unsharp ? ',unsharp=5:5:0.8:3:3:0.4' : ''; // #24 선명도 보정
      const noiseFilter = nightMode ? ',hqdn3d=4:3:6:4.5' : ''; // #28 야간 노이즈 제거
      if (autoReframe) {
        // 9:16 자동 크롭: 2배 확대 후 중앙 크롭, sws_flags=lanczos (#26)
        filters.push(
          `[${i}:v]format=yuv420p,scale=${width * 2}:-2:flags=lanczos,` +
            `crop=${width}:${height}:(iw-${width})/2:(ih-${height})/2,` +
            `setsar=1,fps=${fps}${ptsReset}${speed}${sharpFilter}${noiseFilter}[v${i}]`,
        );
      } else if (boxblur) {
        // boxblur 배경 채우기: 원본 비율 유지 + 블러 배경으로 빈 공간 채움 (#13 해상도 불일치)
        filters.push(
          `[${i}:v]split=2[bg${i}_r][fg${i}_r]`,
          `[bg${i}_r]format=yuv420p,scale=${width}:${height}:flags=lanczos,setsar=1,boxblur=20[bg${i}]`,
          `[fg${i}_r]format=yuv420p,scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos[fg${i}]`,
          `[bg${i}][fg${i}]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=${fps}${ptsReset}${speed}${sharpFilter}${noiseFilter}[v${i}]`,
        );
      } else {
        filters.push(
          `[${i}:v]format=yuv420p,scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,` +
            `crop=${width}:${height},setsar=1,fps=${fps}${ptsReset}${speed}${sharpFilter}${noiseFilter}[v${i}]`,
        );
      }
    }

    // concat 또는 xfade (#8, #34)
    let lastVid = 'vc';
    if (crossfade > 0 && n > 1) {
      // xfade 연쇄 — snappedList 기준 duration으로 offset 계산
      let prev = 'v0';
      for (let i = 1; i < n; i++) {
        const out = i === n - 1 ? 'vc' : `cf${i}`;
        const offset = snappedList
          .slice(0, i)
          .reduce((s, c) => s + Math.max(0.1, c.duration || 3) - crossfade, 0);
        filters.push(
          `[${prev}][v${i}]xfade=transition=fade:duration=${crossfade}:offset=${Math.max(0, offset)}[${out}]`,
        );
        prev = out;
      }
    } else {
      filters.push(`${snappedList.map((_, i) => `[v${i}]`).join('')}concat=n=${n}:v=1:a=0[vc]`);
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

    // #10 엔딩 크레딧 — 마지막 2초 엔딩 애니메이션
    // • 엔딩 시작 시점부터 키프레임 기반 alpha 페이드인 (0→1)
    // • QR 코드 이미지가 있으면 overlay 크레딧 + 모든 찾는 drawtext
    if (endingCredit && snappedTotalDur > 2) {
      const creditStart = Math.max(0, snappedTotalDur - 2);
      const creditLabel = `vc_credit_${jobId}`.replace(/-/g, '_');
      // 시간 t 기반 페이드인: 0 → 1 (1초 동안)
      const fadeExpr = `if(gte(t,${creditStart}),min((t-${creditStart})*2\,1),0)`;
      // 주 텍스트: '이동블로그 무브먼트'
      filters.push(
        `[${lastVid}]drawtext=` +
          `text='이동블로그 무브먼트':` +
          `fontsize=44:fontcolor=white:alpha='${fadeExpr}':` +
          `x=(w-text_w)/2:y=h-140:` +
          `box=1:boxcolor=black@0.6:boxborderw=12[${creditLabel}]`,
      );
      lastVid = creditLabel;

      // QR 코드 이미지 오버레이 + 페이드인 (#10)
      const hasQr = qrPath && fs.existsSync(qrPath);
      if (hasQr) {
        const qrIdx = n + (hasBgm ? 1 : 0) + (hasWm ? 1 : 0);
        cmd = cmd.addInputOption('-loop', '1').addInputOption('-t', '2').input(qrPath);
        const qrLabel = `vc_qr_${jobId}`.replace(/-/g, '_');
        filters.push(
          `[${qrIdx}:v]scale=160:-1,format=yuv420p[qr_img]`,
          // alpha 스케일링으로 페이드인 효과 (format yuva 미지원 시 생략 가능)
          `[${lastVid}][qr_img]overlay=(W-w)/2:H-h-200:enable='gte(t,${creditStart})':shortest=0[${qrLabel}]`,
        );
        lastVid = qrLabel;
      }
    }

    cmd.complexFilter(filters.join(';'), [lastVid]);

    // 오디오 출력 (#32 BGM 믹싱, #85 노멀라이즈, #7 샘플레이트 통일)
    // aresample=44100: 모든 오디오를 44100Hz로 통일 → A/V 싱크 불일치 방지
    const _fadeStart = Math.max(0, snappedTotalDur - 1).toFixed(3);
    const _afadeStr = `afade=t=out:st=${_fadeStart}:d=1`;
    if (hasBgm) {
      const normFilter = normalizeAudio ? `,loudnorm=I=-16:LRA=11:TP=-1.5` : '';
      cmd.audioFilter(
        `[${n}:a]aresample=44100,aloop=loop=-1:size=2000000000,atrim=duration=${snappedTotalDur},volume=${bgmVolume}${normFilter},${_afadeStr}[bgm_a]`,
      );
      cmd.addOption('-map', '[bgm_a]');
    } else if (normalizeAudio) {
      // BGM 없이 원본 오디오만 노멀라이즈 + 마지막 1초 페이드아웃
      cmd.audioFilter(`aresample=44100,loudnorm=I=-16:LRA=11:TP=-1.5,${_afadeStr}`);
    } else {
      // 원본 오디오 그대로지만 마지막 1초 페이드아웃 적용
      cmd.audioFilter(`aresample=44100,${_afadeStr}`);
    }

    // 출력 옵션 (#7 하드웨어코덱, #78 2패스, #80 스레드)
    const dynamicCrf = getDynamicCrf(crf); // RAM 기반 CRF 자동 조정
    const outOpts = [
      `-c:v ${videoCodec}`,
      videoCodec === 'libx264'
        ? `-preset ${getDynamicPreset(preset)}` // #98 RAM 기반 동적 preset
        : videoCodec === 'h264_nvenc'
          ? `-preset p4 -rc constqp`
          : videoCodec === 'h264_qsv'
            ? `-global_quality ${dynamicCrf}`
            : '',
      videoCodec === 'libx264'
        ? `-crf ${dynamicCrf}`
        : videoCodec === 'h264_nvenc'
          ? `-cq ${dynamicCrf}`
          : '',
      videoCodec === 'h264_videotoolbox' ? `-q:v ${Math.round(dynamicCrf / 2)}` : '',
      twoPass && videoCodec === 'libx264'
        ? `-pass 2 -passlogfile "${path.join(os.tmpdir(), 'moovlog_pass')}"`
        : '',
      // 인스타 릴스 권장 최소 비트레이트 5,000 kbps 보장 (#23)
      videoCodec === 'libx264' ? `-minrate 5000k -maxrate 8000k -bufsize 16000k` : '',
      // 키프레임 간격 30 고정 → 깔두기 현상 방지 (#25)
      videoCodec === 'libx264' ? '-g 30' : '',
      // BT.709 색공간 명시 → 색 빠짐 현상 방지 (#27)
      videoCodec === 'libx264' ? '-color_primaries bt709 -color_trc bt709 -colorspace bt709' : '',
      `-threads ${getDynamicThreads()}`, // #97 동적 스레드
      '-c:a aac',
      '-b:a 192k', // 128k에서 192k로 상향
      '-movflags +faststart',
      '-pix_fmt yuv420p',
      // 만들어진 영상의 회전 메타데이터 시에를 강제 제거 (9:16 옵려지는 문제 방지)
      '-map_metadata 0',
      '-metadata:s:v:0 rotate=0',
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
      const friendlyMsg = humanizeFfmpegError(err);
      const wrappedErr =
        friendlyMsg !== (err?.message || String(err))
          ? Object.assign(new Error(friendlyMsg), { originalError: err })
          : err;
      reject(wrappedErr);
    });

    cmd.on('end', () => {
      renderJobs.delete(jobId);
      autoSaveClear();
      send('✅ 렌더링 완료!', 100);
      setTrayProgress(100); // #79
      addRecentRender(outputPath); // 트레이 최근 렌더링 목록 업데이트

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

// ── 키워드 거리 기반 클립 정렬 (#3 맥락 분석) ──────────────────────────────
// 블로그 본문/파일명 분석으로 클립 순서를 자동 최적화:
//   - 제목과 가장 가까운 이미지 → 1번 클립 (후킹)
//   - 볶음밥/메뉴판/주차 등 → 마지막 배치
//   - screenshot/unnamed → 뒤로 밀기
ipcMain.handle('sort-clips-by-keywords', (_, { clips, title = '', bodyText = '' }) => {
  const LAST_KW = /볶음밥|메뉴판|주차|디저트|후식|계산서|영수증|출구|주차장|실내|전경|인테리어/i;
  const MAIN_KW = /고기|메인|삼겹살|갈비|스테이크|회|초밥|랍스터|새우|불고기|맛집|대표|시그니처/i;
  const SKIP_KW = /screenshot|unnamed|img_\d{4}|kakao|thumbnail/i;

  // 제목 토큰 추출 (2글자 이상)
  const titleTokens = title.split(/\s+/).filter((w) => w.length >= 2);

  const scored = clips.map((clip, idx) => {
    const src = clip.path || clip.src || '';
    const filename = path.basename(src).toLowerCase();
    const alt = (clip.alt || clip.caption || clip.description || '').toLowerCase();
    const combined = `${filename} ${alt}`;

    let score = idx * 10; // 기본: 원래 순서 유지

    // 마지막 배치 키워드 → 높은 점수
    if (LAST_KW.test(combined)) score = 100000 + idx;

    // 메인 음식 키워드 → 낮은 점수 (앞으로)
    if (MAIN_KW.test(combined) && !LAST_KW.test(combined)) score = -1000 + idx;

    // 제목 키워드 매칭 → 가장 앞 (1번 클립, 후킹)
    if (titleTokens.some((w) => combined.includes(w))) score = -10000 + idx;

    // 본문 거리 기반 정렬: bodyText에서 이미지 위치를 파악해 순서 결정
    if (bodyText && src) {
      const fname = path.basename(src);
      const pos = bodyText.indexOf(fname);
      if (pos !== -1) {
        // 본문 내 등장 위치를 0–9999 범위로 정규화해 기본 score 보정
        const normalizedPos = Math.round((pos / Math.max(bodyText.length, 1)) * 9999);
        if (score > -1000) score = normalizedPos + idx;
      }
    }

    // 품질 낮은 파일명 → 뒤로 밀기
    if (SKIP_KW.test(filename)) score = 50000 + idx;

    return { ...clip, _score: score };
  });

  scored.sort((a, b) => a._score - b._score);
  return scored.map(({ _score, ...clip }) => clip);
});

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

// ═══════════════════════════════════════════════════════════════════════════
// §11  v2.75 추가 IPC
// ═══════════════════════════════════════════════════════════════════════════

// #87 GPU 코덱 조회 (렌더러에서 직접 호출)
ipcMain.handle('get-best-codec', () => getBestCodec());

// #88 렌더링 ETA 조회
ipcMain.handle('get-render-eta', (_, { jobId, pct }) => calcETA(jobId, pct));

// #89 점프컷 — 무음 구간 감지 (ffprobe silencedetect)
ipcMain.handle('detect-silence', async (_, { filePath, threshold = -35, minDuration = 0.5 }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i',
      filePath,
      '-af',
      `silencedetect=noise=${threshold}dB:d=${minDuration}`,
      '-f',
      'null',
      process.platform === 'win32' ? 'NUL' : '/dev/null',
    ];
    let stderr = '';
    const proc = cp.spawn(FFMPEG_PATH, args);
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', () => {
      // silencedetect 파싱: silence_start / silence_end
      const starts = [...stderr.matchAll(/silence_start: (\d+\.?\d*)/g)].map((m) => +m[1]);
      const ends = [...stderr.matchAll(/silence_end: (\d+\.?\d*)/g)].map((m) => +m[1]);
      const segments = starts.map((s, i) => ({ start: s, end: ends[i] ?? s + minDuration }));
      resolve(segments);
    });
    proc.on('error', reject);
  });
});

// #89 점프컷 — 무음 구간 제거 후 새 영상 출력
ipcMain.handle('remove-silence', async (_, { filePath, silences, outputPath }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
  if (!silences?.length) {
    // 무음 없으면 그대로 copy
    fs.copyFileSync(filePath, outputPath);
    return outputPath;
  }
  // #91 터보모드: GPU 코덱 자동 선택
  const hw = await getBestCodec();
  const vCodec = hw.codec;
  const codecOpts =
    vCodec === 'h264_nvenc'
      ? ['-c:v', 'h264_nvenc', '-preset', 'p4', '-rc', 'vbr', '-cq', '22']
      : vCodec === 'h264_qsv'
        ? ['-c:v', 'h264_qsv', '-global_quality', '22']
        : ['-c:v', 'libx264', '-crf', '22'];

  // silences를 반전해서 유음(소리 있는) 구간 목록 생성
  return new Promise((resolve, reject) => {
    fluent.ffprobe(filePath, (err, meta) => {
      if (err) return reject(err);
      const dur = meta.format.duration;
      // keep 구간 계산 (무음 밖)
      const keeps = [];
      let t = 0;
      for (const s of silences.sort((a, b) => a.start - b.start)) {
        if (s.start > t + 0.01) keeps.push({ s: t, e: s.start });
        t = s.end;
      }
      if (t < dur - 0.1) keeps.push({ s: t, e: dur });
      if (!keeps.length) return reject(new Error('유음 구간 없음'));

      // trim + concat 필터 구성
      const filters = [];
      keeps.forEach((k, i) => {
        filters.push(`[0:v]trim=${k.s}:${k.e},setpts=PTS-STARTPTS[v${i}]`);
        filters.push(`[0:a]atrim=${k.s}:${k.e},asetpts=PTS-STARTPTS[a${i}]`);
      });
      const vIn = keeps.map((_, i) => `[v${i}]`).join('');
      const aIn = keeps.map((_, i) => `[a${i}]`).join('');
      filters.push(`${vIn}concat=n=${keeps.length}:v=1:a=0[vc]`);
      filters.push(`${aIn}concat=n=${keeps.length}:v=0:a=1[ac]`);

      fluent(filePath)
        .complexFilter(filters, ['vc', 'ac'])
        .outputOptions([...codecOpts, '-c:a', 'aac', '-b:a', '128k'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  });
});

// #90 프록시 워크플로우 — 4K 영상을 720p 저화질로 변환해 편집 성능 향상
ipcMain.handle('create-proxy', async (_, { videoPath, outputDir }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
  const dir = outputDir || os.tmpdir();
  const baseName = path.basename(videoPath, path.extname(videoPath));
  const proxyPath = path.join(dir, `${baseName}_proxy.mp4`);
  if (fs.existsSync(proxyPath)) return proxyPath; // 캐시 재사용
  return new Promise((resolve, reject) =>
    fluent(videoPath)
      .outputOptions([
        '-vf',
        'scale=720:-2',
        '-c:v',
        'libx264',
        '-crf',
        '28',
        '-preset',
        'fast',
        '-c:a',
        'aac',
        '-b:a',
        '96k',
        '-movflags',
        '+faststart',
      ])
      .output(proxyPath)
      .on('end', () => resolve(proxyPath))
      .on('error', reject)
      .run(),
  );
});

// #91 세그먼트 병렬 렌더링 (터보모드: GPU 코덱 자동 적용)
ipcMain.handle('render-segments', async (event, { editList, outputPath, options, jobId }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');

  // #91 터보모드: GPU 코덱 감지 후 options에 주입
  const hw = await getBestCodec();
  const turboOptions = {
    ...options,
    // _doRender는 detectHwaccel()로 직접 코덱을 구하지만, 이미 캐시된 값이 hw.codec으로 넘어오므
    _forcedCodec: hw.codec, // 미래 확장용 턜그 (현재 _doRender는 detectHwaccel 캐시 사용)
  };

  const segments = 2; // 2분할 병렬
  const chunkSize = Math.ceil(editList.length / segments);
  const chunks = [];
  for (let i = 0; i < editList.length; i += chunkSize) {
    chunks.push(editList.slice(i, i + chunkSize));
  }

  const tmpFiles = chunks.map((_, i) => path.join(os.tmpdir(), `seg_render_${jobId}_${i}.mp4`));

  // 렌더 시작 알림
  event.sender.send('render-log', {
    msg: `[터보모드] 코덱=${hw.codec} | ${hw.accel || 'CPU'} | ${chunks.length}분할 병렬 시작`,
    jobId,
  });

  try {
    // 각 세그먼트를 _doRender로 병렬 처리
    await Promise.all(
      chunks.map((chunk, i) =>
        _doRender(event, chunk, tmpFiles[i], turboOptions, `${jobId}_s${i}`),
      ),
    );

    // concat demuxer 목록 파일 생성
    const listFile = path.join(os.tmpdir(), `concat_${jobId}.txt`);
    fs.writeFileSync(listFile, tmpFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n'));

    // concat (복사 1밤 인코딩 없이 빠르게 연결)
    await new Promise((resolve, reject) =>
      fluent(listFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run(),
    );

    // 임시 파일 정리
    tmpFiles.forEach((f) => fs.rmSync(f, { force: true }));
    fs.rmSync(listFile, { force: true });

    return { outputPath, success: true, codec: hw.codec, accel: hw.accel };
  } catch (err) {
    tmpFiles.forEach((f) => fs.rmSync(f, { force: true }));
    throw err;
  }
});

// #93 렌더링 우선순위 설정 (Windows: BELOW_NORMAL / 기타 무시)
ipcMain.handle('set-render-priority', (_, { jobId, priority = 'low' }) => {
  const job = renderJobs.get(jobId);
  if (!job?.pid || process.platform !== 'win32') return false;
  try {
    // /ABOVENORMAL /NORMAL /BELOWNORMAL /LOW /IDLE
    const map = { high: 'ABOVENORMAL', normal: 'NORMAL', low: 'BELOWNORMAL', idle: 'IDLE' };
    const cls = map[priority] || 'BELOWNORMAL';
    cp.execSync(`wmic process where ProcessId=${job.pid} CALL SetPriority "${cls}"`, {
      timeout: 3000,
    });
    return true;
  } catch (_) {
    return false;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// §12  v2.76 추가 IPC
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// #94 PathSwapper — 프록시(720p) editList를 원본(4K) 경로로 교체
//  사용법: swap-proxy-paths 에 { editList, proxyMap } 전달
//  proxyMap: { "proxyPath": "originalPath", ... }
// ─────────────────────────────────────────────────────────────────────────
ipcMain.handle('swap-proxy-paths', (_, { editList, proxyMap = {} }) => {
  if (!editList?.length) return editList;
  return editList.map((clip) => {
    const normalizedProxy = clip.path?.replace(/\\/g, '/');
    const originalPath = proxyMap[normalizedProxy] || proxyMap[clip.path];
    if (!originalPath) return clip; // 매핑 없으면 그대로
    // 원본 파일이 존재하는지 검증
    if (!fs.existsSync(originalPath)) {
      console.warn(`[PathSwapper] 원본 파일 없음: ${originalPath} → 프록시 유지`);
      return clip;
    }
    return { ...clip, path: originalPath, _isProxy: false, _proxyPath: clip.path };
  });
});

// #94 프록시 생성 + 원본→프록시 맵 반환 (배치 처리)
ipcMain.handle('create-proxy-batch', async (_, { videoPaths, outputDir }) => {
  if (!FFMPEG_PATH) throw new Error('FFmpeg 없음');
  const dir = outputDir || path.join(os.tmpdir(), 'moovlog_proxy');
  fs.mkdirSync(dir, { recursive: true });

  const results = {}; // proxyPath → originalPath 역방향 + 정방향
  const proxyMap = {}; // originalPath → proxyPath

  await Promise.allSettled(
    videoPaths.map(async (videoPath) => {
      const baseName = path.basename(videoPath, path.extname(videoPath));
      const proxyPath = path.join(dir, `${baseName}_proxy.mp4`);

      if (!fs.existsSync(proxyPath)) {
        await new Promise((resolve, reject) =>
          fluent(videoPath)
            .outputOptions([
              '-vf',
              'scale=720:-2',
              '-c:v',
              'libx264',
              '-crf',
              '28',
              '-preset',
              'fast',
              '-c:a',
              'aac',
              '-b:a',
              '96k',
              '-movflags',
              '+faststart',
            ])
            .output(proxyPath)
            .on('end', resolve)
            .on('error', reject)
            .run(),
        );
      }
      proxyMap[videoPath] = proxyPath;
      proxyMap[videoPath.replace(/\\/g, '/')] = proxyPath.replace(/\\/g, '/');
      // 역방향 (프록시→원본) — swap-proxy-paths 가 사용
      results[proxyPath.replace(/\\/g, '/')] = videoPath;
    }),
  );

  return { proxyMap, reverseMap: results };
});

// ─────────────────────────────────────────────────────────────────────────
// #95 에러 원격 리포팅 — Webhook(Discord/Slack/Firebase) 전송
//  환경변수 MOOVLOG_ERROR_WEBHOOK 에 URL 설정 시 활성화
// ─────────────────────────────────────────────────────────────────────────
async function remoteReportError(context, errorMsg, extra = {}) {
  // 1) 심각도 판단: 'fatal' 키워드 포함 시만 전송
  const isFatal = /fatal|crash|SIGKILL|out of memory/i.test(errorMsg);

  let webhookUrl = null;
  try {
    const cfg = require('./config.v2.js');
    webhookUrl = cfg.ERROR_WEBHOOK || process.env.MOOVLOG_ERROR_WEBHOOK;
  } catch (_) {
    webhookUrl = process.env.MOOVLOG_ERROR_WEBHOOK;
  }

  // 항상 로컬 로그 기록
  appendFfmpegLog(context, `[${isFatal ? 'FATAL' : 'ERROR'}] ${errorMsg}`);

  if (!webhookUrl || !isFatal) return;

  // Discord-style payload (Slack/Firebase Functions도 유사 JSON)
  const payload = {
    username: '무브먼트 ErrorBot',
    embeds: [
      {
        title: `🚨 ${isFatal ? 'FATAL' : 'ERROR'} — ${context}`,
        description: errorMsg.slice(0, 1000),
        color: isFatal ? 0xff0000 : 0xff9900,
        fields: [
          { name: 'OS', value: `${process.platform} ${process.arch}`, inline: true },
          { name: 'Version', value: app.getVersion(), inline: true },
          { name: 'Time', value: new Date().toLocaleString('ko-KR'), inline: false },
          ...Object.entries(extra).map(([k, v]) => ({ name: k, value: String(v), inline: true })),
        ],
      },
    ],
  };

  try {
    const https = require('https');
    const body = JSON.stringify(payload);
    const url = new URL(webhookUrl);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      () => {},
    );
    req.on('error', () => {}); // 전송 실패 무시
    req.write(body);
    req.end();
  } catch (_) {}
}

// 렌더러에서 에러 리포팅 트리거
ipcMain.handle('report-error', (_, { context, message, extra }) =>
  remoteReportError(context || 'renderer', message || '(no message)', extra),
);

// FFmpeg 에러 발생 시 자동 리포팅 (appendFfmpegLog wrapper 확장)
ipcMain.handle('get-error-webhook-status', () => {
  let webhookUrl = null;
  try {
    const cfg = require('./config.v2.js');
    webhookUrl = cfg.ERROR_WEBHOOK || process.env.MOOVLOG_ERROR_WEBHOOK;
  } catch (_) {
    webhookUrl = process.env.MOOVLOG_ERROR_WEBHOOK;
  }
  return { configured: !!webhookUrl };
});

// ═══════════════════════════════════════════════════════════════════════════
// §13  v2.77 추가 IPC
// ═══════════════════════════════════════════════════════════════════════════

// ─ #97 마지막 렌더 옵션 저장 / 불러오기 ─────────────────────────────────
// 저장 항목: resolution, codec, crf, fps, preset, twoPass, normalizeAudio
// JS 호출: await window.electronAPI.saveRenderOptions({ resolution:'1080', ... })
//          const { opts } = await window.electronAPI.loadRenderOptions();
const _renderOptsPath = () => getUserDataPath('last_render_opts.json');

// #97 기본 렌더 옵션 (파일 손상 시 fallback)
const _DEFAULT_RENDER_OPTS = {
  resolution: '1080',
  codec: 'libx264',
  crf: 23,
  fps: 30,
  preset: 'medium',
  twoPass: false,
  normalizeAudio: false,
};

ipcMain.handle('save-render-options', (_, opts = {}) => {
  try {
    fs.writeFileSync(_renderOptsPath(), JSON.stringify({ ...opts, savedAt: Date.now() }), 'utf8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('load-render-options', () => {
  const filePath = _renderOptsPath();
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    // 최소 유효성 검사 — 필수 키 없으면 손상으로 간주
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.crf === 'undefined') {
      throw new Error('schema_invalid');
    }
    return { ok: true, opts: parsed };
  } catch (e) {
    // 파일 없음이거나 JSON 파싱 실패(손상) → 기본값 반환 + 파일 재기록
    const isCorrupt = e.message !== 'schema_invalid' && !e.message.includes('ENOENT');
    if (isCorrupt) {
      console.warn('[RenderOpts] 설정 파일 손상 감지, 기본값으로 복구합니다.');
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }
    return { ok: false, opts: _DEFAULT_RENDER_OPTS, isDefault: true };
  }
});
