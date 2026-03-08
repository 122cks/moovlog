/* ============================================================
   components/ExportPanel.tsx
   WebCodecs 내보내기 진행 상황 표시 + 다운로드 버튼
   ============================================================ */
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { exportWebCodecs } from '@/export/webcodecs';

export function ExportPanel() {
  const script        = useAppStore((s) => s.script);
  const loaded        = useAppStore((s) => s.loaded);
  const audioBuffers  = useAppStore((s) => s.audioBuffers);
  const template      = useAppStore((s) => s.selectedTemplate);
  const exporting     = useAppStore((s) => s.exporting);
  const exportProgress = useAppStore((s) => s.exportProgress);
  const setExporting  = useAppStore((s) => s.setExporting);
  const setProgress   = useAppStore((s) => s.setExportProgress);
  const pushToast     = useAppStore((s) => s.pushToast);

  const [dlUrl, setDlUrl] = useState<string | null>(null);

  const handleExport = async () => {
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
      <h3 className="text-sm font-bold text-zinc-200">영상 내보내기</h3>

      {exporting ? (
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-brand-pink transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-center text-xs text-zinc-400">{pct}% 인코딩 중...</p>
        </div>
      ) : (
        <button
          onClick={handleExport}
          className="w-full rounded-xl bg-brand-pink py-2.5 text-sm font-bold text-white transition hover:bg-pink-500 active:scale-95"
        >
          ⬇ MP4 내보내기
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
