/* ============================================================
   components/ExportPanel.tsx
   WebCodecs 내보내기 | Electron(FFmpeg) 렌더링 분기
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { exportWebCodecs } from '@/export/webcodecs';

// [#5 인코딩 진행률] 퍼센트별 🥩 메시지 매핑
function getMeatMsg(pct: number): string {
  if (pct < 5)  return '재료 준비 중... 🍖';
  if (pct < 20) return `불 달구는 중... 🔥 ${pct}%`;
  if (pct < 50) return `고기 굽는 중 🥩 ${pct}%`;
  if (pct < 80) return `황금 마이야르 반응... ✨ ${pct}%`;
  if (pct < 99) return `거의 완성! 잠깐만요... 🎬 ${pct}%`;
  return '✅ 완성! 폴더가 자동으로 열립니다';
}

export function ExportPanel() {
  const script        = useAppStore((s) => s.script);
  const files         = useAppStore((s) => s.files);
  const loaded        = useAppStore((s) => s.loaded);
  const audioBuffers  = useAppStore((s) => s.audioBuffers);
  const template      = useAppStore((s) => s.selectedTemplate);
  const restaurantName = useAppStore((s) => s.restaurantName);
  const exporting     = useAppStore((s) => s.exporting);
  const exportProgress = useAppStore((s) => s.exportProgress);
  const setExporting  = useAppStore((s) => s.setExporting);
  const setProgress   = useAppStore((s) => s.setExportProgress);
  const pushToast     = useAppStore((s) => s.pushToast);

  const [dlUrl, setDlUrl] = useState<string | null>(null);
  const [renderMsg, setRenderMsg] = useState('');
  const [eta, setEta] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Electron 환경 여부
  const isElectron = !!(window.electronAPI?.isElectron);

  // 컴포넌트 언마운트 시 구독 해제
  useEffect(() => () => { unsubRef.current?.(); }, []);

  // ─── Electron(FFmpeg) 렌더링 ──────────────────────────────────────────
  const handleElectronExport = async () => {
    if (!script || exporting || !window.electronAPI) return;
    setDlUrl(null);
    setExporting(true);
    setProgress(0);
    setRenderMsg(getMeatMsg(0));
    setEta(null);

    const jobId = `job_${Date.now()}`;

    // [#5] onRenderProgress 구독 — 실시간 🥩 메시지
    unsubRef.current = window.electronAPI.onRenderProgress((data) => {
      if (data.jobId !== jobId && !data.jobId.startsWith(jobId)) return;
      setProgress(data.pct / 100);
      setRenderMsg(getMeatMsg(data.pct));
      if (data.eta) setEta(data.eta);
    });

    try {
      // [#4 고기 영상 자동 탐지] 파일명 우선순위 정렬 (순서 참고용, editList는 media_idx 기반)
      void window.electronAPI.sortClipsByKeywords({
        clips: files.map((f, i) => ({ ...f, _idx: i })),
        title: restaurantName,
      });

      // editList 빌드 — path 기반 (FFmpeg 필수)
      const editList = script.scenes.map((scene) => {
        const mediaFile = files[scene.media_idx];
        return {
          path:     mediaFile?.path || '',
          name:     mediaFile?.file.name || '',
          type:     mediaFile?.type || 'image',
          duration: scene.duration,
        };
      }).filter((c) => c.path); // [Step 2 안전장치] 경로 없는 클립 제거

      // [Step 2 안전장치] 경로 없는 클립이 있으면 즉시 중단
      const missing = script.scenes.length - editList.length;
      if (missing > 0) {
        throw new Error(`${missing}개 파일의 경로를 읽을 수 없습니다.\nElectron 앱에서 파일을 다시 선택해주세요.`);
      }

      // 저장 경로 선택
      const outputPath = await window.electronAPI.saveFile({
        title: '영상 저장',
        defaultPath: `moovlog_${restaurantName || 'shorts'}_${new Date().toISOString().slice(0, 10)}.mp4`,
      });
      if (!outputPath) { setExporting(false); return; }

      await window.electronAPI.renderVideo(editList, outputPath, { theme: template }, jobId);

      pushToast('🥩 렌더링 완료! 폴더가 열렸습니다', 'ok');
      setRenderMsg('✅ 완성!');
      setProgress(1);

      // [#6 임시파일 클리너] 렌더링 완료 후 tmp 파일 정리
      window.electronAPI.cleanupTmpFiles().catch(() => {});
    } catch (e) {
      const msg = (e as Error).message || '렌더링 실패';
      pushToast(`렌더링 실패: ${msg}`, 'err');
      setRenderMsg('');

      // [#8 에러 로그 스냅샷] editList 경로 상태 저장
      window.electronAPI?.renderErrorSnapshot({
        editList: script.scenes.map((scene) => ({
          path:     files[scene.media_idx]?.path || '(없음)',
          name:     files[scene.media_idx]?.file.name || '(없음)',
          duration: scene.duration,
        })),
        errorMsg: msg,
      }).catch(() => {});
    } finally {
      setExporting(false);
      unsubRef.current?.();
      unsubRef.current = null;
    }
  };

  // ─── WebCodecs 내보내기 (비-Electron) ───────────────────────────────────
  const handleWebExport = async () => {
    if (!script || exporting) return;
    setDlUrl(null);
    setExporting(true);

    try {
      const blob = await exportWebCodecs({
        script,
        loaded,
        audioBuffers: audioBuffers as AudioBuffer[],
        template,
        onProgress: setProgress,
      });
      const url = URL.createObjectURL(blob);
      setDlUrl(url);
      pushToast('영상 내보내기 완료! ↓ 다운로드', 'ok');
    } catch (e) {
      pushToast(`내보내기 실패: ${(e as Error).message}`, 'err');
    } finally {
      setExporting(false);
    }
  };

  if (!script) return null;

  const pct = Math.round(exportProgress * 100);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-700 bg-brand-card p-4">
      <h3 className="text-sm font-bold text-zinc-200">
        영상 내보내기 {isElectron && <span className="ml-1 text-xs font-normal text-emerald-400">FFmpeg 모드</span>}
      </h3>

      {/* [#9 멀티 렌더링 방지] exporting 시 버튼 비활성 + 진행바 표시 */}
      {exporting ? (
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-brand-pink transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-center text-xs text-zinc-400">
            {isElectron ? renderMsg : `${pct}% 인코딩 중...`}
          </p>
          {isElectron && eta && (
            <p className="text-center text-[10px] text-zinc-600">{eta}</p>
          )}
        </div>
      ) : (
        <button
          onClick={isElectron ? handleElectronExport : handleWebExport}
          disabled={exporting}
          className="w-full rounded-xl bg-brand-pink py-2.5 text-sm font-bold text-white transition hover:bg-pink-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isElectron ? '🥩 FFmpeg로 굽기 (고품질 MP4)' : '⬇ MP4 내보내기'}
        </button>
      )}

      {dlUrl && (
        <a
          href={dlUrl}
          download="moovlog-shorts.webm"
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-bold text-white transition hover:bg-emerald-500"
        >
          💾 다운로드
        </a>
      )}
    </div>
  );
}
