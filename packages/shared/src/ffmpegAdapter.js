/**
 * @moovlog/shared — FFmpeg 플랫폼 어댑터  v2.73
 * 웹(WASM), Electron(로컬 바이너리), React Native(ffmpeg-kit) 차이를 추상화
 *
 * 사용법:
 *   const adapter = getFFmpegAdapter();
 *   const result  = await adapter.render(edl, onProgress);
 *
 * 모든 어댑터 공통 인터페이스:
 *   { platform, render(edl, onProgress) → Promise<Blob|string>, info() → object }
 */

/**
 * 현재 실행 환경 감지
 * @returns {'electron' | 'web' | 'native' | 'unknown'}
 */
export function detectPlatform() {
  if (typeof window !== "undefined" && window.electronAPI?.isElectron)
    return "electron";
  if (
    typeof navigator !== "undefined" &&
    /ReactNative/.test(navigator.product || "")
  )
    return "native";
  if (typeof window !== "undefined") return "web";
  return "unknown";
}

/**
 * 플랫폼 정보 반환
 * @returns {{ platform: string, version: string, hwaccel: string|null, threads: number }}
 */
export async function getPlatformInfo() {
  const platform = detectPlatform();

  if (platform === "electron") {
    try {
      const status = await window.electronAPI.ffmpegStatus();
      return {
        platform,
        version: status?.version || "unknown",
        hwaccel: status?.hwaccel || "libx264",
        threads: status?.cpuThreads || navigator.hardwareConcurrency || 4,
      };
    } catch {
      return { platform, version: "unknown", hwaccel: "libx264", threads: 4 };
    }
  }

  if (platform === "native") {
    return {
      platform,
      version: "ffmpeg-kit-react-native",
      hwaccel: "h264_mediacodec",
      threads: navigator.hardwareConcurrency || 4,
    };
  }

  return {
    platform: "web",
    version: "ffmpeg.wasm",
    hwaccel: null,
    threads: navigator.hardwareConcurrency || 4,
  };
}

/**
 * 플랫폼별 FFmpeg 어댑터 반환
 * 각 어댑터는 { platform, render, info } 인터페이스 구현
 */
export function getFFmpegAdapter() {
  const platform = detectPlatform();

  // ─────────────────────────────────────────────────────────────────────
  // Electron: IPC → 로컬 ffmpeg.exe (#1-10)
  // ─────────────────────────────────────────────────────────────────────
  if (platform === "electron") {
    return {
      platform,

      async info() {
        try {
          return await window.electronAPI.ffmpegStatus();
        } catch {
          return {};
        }
      },

      /**
       * @param {import('./edl.js').EDL} edl
       * @param {(msg:string, pct:number)=>void} [onProgress]
       * @returns {Promise<string>} 출력 파일 경로
       */
      async render(edl, onProgress) {
        const api = window.electronAPI;

        const outputPath = await api.saveFile({
          title: "영상 저장 위치 선택",
          defaultPath: `moovlog_${edl.restaurantName || "output"}_${Date.now()}.mp4`,
        });
        if (!outputPath) throw new Error("저장 경로가 선택되지 않았습니다");

        const editList = (edl.scenes || []).map((sc) => ({
          path: sc.path || "",
          start: sc.start ?? 0,
          duration: sc.duration ?? 3,
        }));

        const unsubProgress = api.onRenderProgress?.(({ pct, msg }) => {
          onProgress?.(msg || "", pct || 0);
        });

        const unsubLog = api.onRenderLog?.((line) => {
          onProgress?.(`[log] ${line}`, -1);
        });

        try {
          const result = await api.renderVideo(editList, outputPath, {
            theme: edl.theme || "food",
            fps: edl.fps || 30,
            crf: edl.crf || 22,
            preset: edl.preset || "medium",
            twoPass: edl.twoPass || false,
          });
          return result?.outputPath || outputPath;
        } finally {
          unsubProgress?.();
          unsubLog?.();
        }
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // React Native: ffmpeg-kit 위임 (#11-20)
  // ─────────────────────────────────────────────────────────────────────
  if (platform === "native") {
    return {
      platform: "native",

      async info() {
        return {
          platform: "native",
          version: "ffmpeg-kit-react-native",
          hwaccel: "h264_mediacodec",
        };
      },

      /**
       * RenderBridge.renderWithAndroid 동적 임포트 후 호출
       * @param {import('./edl.js').EDL} edl
       * @param {(msg:string, pct:number)=>void} [onProgress]
       * @returns {Promise<string>} 출력 파일 경로
       */
      async render(edl, onProgress) {
        // android-rn/src/RenderBridge.js 동적 임포트
        const { renderWithAndroid } = await import(
          /* webpackIgnore: true */
          "../../apps/android-rn/src/RenderBridge.js"
        ).catch(() => {
          throw new Error(
            "RenderBridge를 찾을 수 없습니다. android-rn 빌드를 확인하세요.",
          );
        });

        const outputPath = `/storage/emulated/0/DCIM/moovlog/output_${Date.now()}.mp4`;
        return renderWithAndroid(edl.scenes || [], outputPath, {
          theme: edl.theme || "food",
          onProgress: onProgress || (() => {}),
        });
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Web: VideoRenderer.js 동적 임포트
  // ─────────────────────────────────────────────────────────────────────
  return {
    platform: "web",

    async info() {
      return { platform: "web", version: "ffmpeg.wasm", hwaccel: null };
    },

    /**
     * @param {import('./edl.js').EDL} edl
     * @param {Array}  files   - videoStore.files
     * @param {Object} script  - videoStore.script
     * @param {(msg:string, pct:number)=>void} [onProgress]
     * @returns {Promise<Blob>}
     */
    async render(edl, files, script, onProgress) {
      const { renderVideoWithFFmpeg } = await import(
        /* webpackIgnore: true */
        "/src/engine/VideoRenderer.js"
      );
      return renderVideoWithFFmpeg(edl.scenes, files, script, onProgress);
    },
  };
}
