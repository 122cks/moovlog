/**
 * @moovlog/shared — FFmpeg 플랫폼 어댑터
 * 웹(WASM), Electron(로컬 바이너리), React Native(ffmpeg-kit) 차이를 추상화
 *
 * 사용법:
 *   const adapter = getFFmpegAdapter();
 *   const blob = await adapter.render(edl, onProgress);
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
 * 플랫폼별 FFmpeg 어댑터 반환
 * 각 어댑터는 { render(edl, onProgress) → Promise<Blob|string> } 인터페이스 구현
 */
export function getFFmpegAdapter() {
  const platform = detectPlatform();

  if (platform === "electron") {
    return {
      platform,
      /**
       * Electron: window.electronAPI.renderVideo() 호출 → 로컬 ffmpeg.exe 실행
       * @param {import('./edl.js').EDL} edl
       * @param {(msg:string, pct:number)=>void} [onProgress]
       * @returns {Promise<string>} 출력 파일 경로
       */
      async render(edl, onProgress) {
        const api = window.electronAPI;

        // 저장 경로 선택
        const outputPath = await api.saveFile({
          title: "영상 저장 위치 선택",
          defaultPath: `moovlog_${edl.restaurantName}_${Date.now()}.mp4`,
        });
        if (!outputPath) throw new Error("저장 경로가 선택되지 않았습니다");

        // 진행률 구독
        const editList = edl.scenes.map((sc) => ({
          path: sc.path,
          start: sc.start || 0,
          duration: sc.duration || 3,
        }));

        const unsubscribe = api.onRenderProgress(({ pct, msg }) => {
          onProgress?.(msg, pct);
        });

        try {
          const result = await api.renderVideo(editList, outputPath, {
            theme: edl.theme,
            fps: 30,
            crf: 22,
            preset: "fast",
          });
          return result.outputPath;
        } finally {
          unsubscribe();
        }
      },
    };
  }

  if (platform === "web") {
    return {
      platform,
      /**
       * 웹: VideoRenderer.js의 renderVideoWithFFmpeg() 동적 임포트
       * @param {import('./edl.js').EDL} edl
       * @param {Array}  files  - videoStore.files
       * @param {Object} script - videoStore.script
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

  // React Native
  return {
    platform: "native",
    async render(edl, _files, _script, onProgress) {
      // ffmpeg-kit-react-native は별도 패키지에서 구현
      // 여기서는 구조만 정의
      throw new Error("Native 어댑터는 apps/android에서 구현됩니다");
    },
  };
}
