// android-rn/src/RenderBridge.js
// React Native 렌더링 브릿지 — ffmpeg-kit-react-native 래퍼
// 구현 항목: #11(ffmpeg-kit 초기화), #12(권한), #13(URI변환),
//           #14(ProgressBar), #15(포그라운드 서비스), #19(MediaCodec),
//           #20(다운로드 폴더 저장)

import {
  FFmpegKit,
  FFprobeKit,
  ReturnCode,
  FFmpegKitConfig,
} from "ffmpeg-kit-react-native";
import RNFS from "react-native-fs";
import { Platform, PermissionsAndroid } from "react-native";

// ─── #11  초기화 ─────────────────────────────────────────────────────────
export function initFFmpegKit() {
  FFmpegKitConfig.enableLogCallback((log) => {
    // 로그 전역 이벤트 브로드캐스트 (LoadingOverlay 수신용)
    globalThis.__ffmpegLog?.push?.(log.getMessage());
  });
  FFmpegKitConfig.enableStatisticsCallback((stats) => {
    const pct = Math.min(
      100,
      Math.round((stats.getTime() / (globalThis.__totalDurMs || 30000)) * 100),
    );
    globalThis.__ffmpegProgress?.(pct);
  });
  console.log("[FFmpegKit] 초기화 완료");
}

// ─── #12  안드로이드 13+ 미디어 접근 권한 요청 ───────────────────────────
export async function requestMediaPermissions() {
  if (Platform.OS !== "android") return true;
  const sdk = Platform.Version;

  const perms =
    sdk >= 33
      ? [
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ]
      : [
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ];

  const results = await PermissionsAndroid.requestMultiple(perms);
  const granted = Object.values(results).every(
    (r) => r === PermissionsAndroid.RESULTS.GRANTED,
  );
  if (!granted) console.warn("[Permissions] 일부 권한 미승인");
  return granted;
}

// ─── #13  content:// URI → 실제 절대 경로 변환 ───────────────────────────
export async function resolveContentUri(contentUri) {
  if (!contentUri.startsWith("content://")) return contentUri;
  try {
    // RNFS를 이용한 캐시 디렉토리 복사
    const filename = `rnfs_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;
    const dest = `${RNFS.CachesDirectoryPath}/${filename}`;
    await RNFS.copyFile(contentUri, dest);
    return dest;
  } catch (e) {
    console.warn("[URI] content:// 변환 실패:", e.message);
    return contentUri;
  }
}

// ─── 핵심 렌더링 함수 (#11, #14, #19) ───────────────────────────────────
/**
 * editList: Array<{ path: string, start: number, duration: number }>
 * outputPath: string (절대 경로)
 * options: { theme, fps, crf, width, height, onProgress }
 */
export async function renderWithAndroid(editList, outputPath, options = {}) {
  const {
    theme = "hansik",
    fps = 30,
    crf = 22,
    width = 720,
    height = 1280,
    onProgress = () => {},
  } = options;

  const totalDur = editList.reduce(
    (s, c) => s + Math.max(0.1, c.duration || 3),
    0,
  );
  globalThis.__totalDurMs = totalDur * 1000;
  globalThis.__ffmpegProgress = onProgress;

  onProgress(2);

  // 씬 입력 파일 리스트 생성
  const listFile = `${RNFS.CachesDirectoryPath}/concat_list_${Date.now()}.txt`;
  const lines = [];
  for (const clip of editList) {
    const realPath = await resolveContentUri(clip.path);
    const trimPath = `${RNFS.CachesDirectoryPath}/trim_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;

    // 각 씬 개별 트림 + 리사이즈 (#19 MediaCodec 활용)
    await FFmpegKit.execute(
      `-y -ss ${clip.start || 0} -t ${clip.duration || 3} -i "${realPath}" ` +
        `-vf "scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,fps=${fps}" ` +
        `-c:v h264_mediacodec -cq ${crf} -an "${trimPath}"`,
    );
    lines.push(`file '${trimPath}'`);
  }

  await RNFS.writeFile(listFile, lines.join("\n"), "utf8");
  onProgress(40);

  // LUT 색감 적용 + concat
  const lut = getAndroidLut(theme);
  const cmd = [
    `-y -f concat -safe 0 -i "${listFile}"`,
    `-vf "${lut}"`,
    `-c:v h264_mediacodec -cq ${crf}`,
    `-c:a aac -b:a 128k`,
    `-movflags +faststart`,
    `"${outputPath}"`,
  ].join(" ");

  const session = await FFmpegKit.execute(cmd);
  const rc = await session.getReturnCode();
  onProgress(98);

  // 임시 파일 정리 (메모리 절약)
  RNFS.unlink(listFile).catch(() => {});

  if (ReturnCode.isSuccess(rc)) {
    onProgress(100);
    // #20 Downloads 폴더로 복사
    await moveToDownloads(outputPath);
    return outputPath;
  } else {
    const log = (await session.getAllLogsAsString()).slice(-500);
    throw new Error(`FFmpegKit 렌더링 실패: ${log}`);
  }
}

// ─── #20  Downloads 폴더 저장 ────────────────────────────────────────────
export async function moveToDownloads(filePath) {
  if (Platform.OS !== "android") return filePath;
  try {
    const dest = `${RNFS.DownloadDirectoryPath}/${filePath.split("/").pop()}`;
    await RNFS.copyFile(filePath, dest);
    await RNFS.unlink(filePath);
    // MediaStore 갱신 (안드로이드 갤러리 인식)
    await RNFS.scanFile(dest);
    console.log("[RN] 다운로드로 이동:", dest);
    return dest;
  } catch (e) {
    console.warn("[RN] 다운로드 이동 실패:", e.message);
    return filePath;
  }
}

// ─── LUT (테마별 Android 색감 필터) ──────────────────────────────────────
function getAndroidLut(theme) {
  const T = {
    hansik: "eq=saturation=1.25:contrast=1.05:brightness=0.02,hue=h=5",
    cinema: "eq=saturation=0.8:contrast=1.2:brightness=-0.03",
    vivid: "eq=saturation=1.5:contrast=1.1:brightness=0.04",
    food: "eq=saturation=1.3:contrast=1.08:brightness=0.05,hue=h=3",
    bw: "hue=s=0,eq=contrast=1.2",
  };
  return T[theme] || T.hansik;
}

// ─── #16 모바일 기기 화면 주사율별 미리보기 최적화 ──────────────────────
export function getOptimalPreviewFps() {
  // 실제 기기 주사율에 맞춰 미리보기 최적화
  // react-native에서는 상수값으로 처리 (런타임 감지 불가)
  return Platform.OS === "android" ? 30 : 60;
}
