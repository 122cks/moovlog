/* ============================================================
   components/ResultPhase.tsx — 완성된 영상 결과 화면
   ============================================================ */
import { useAppStore } from '@/store/useAppStore';
import { VideoCanvas } from '@/components/VideoCanvas';
import { TimelineEditor } from '@/components/TimelineEditor';
import { ExportPanel } from '@/components/ExportPanel';

export function ResultPhase() {
  const reset  = useAppStore((s) => s.reset);
  const script = useAppStore((s) => s.script);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      {/* 상단 바 */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-black">완성된 숏폼</h2>
        <button
          onClick={reset}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-white"
        >
          ← 다시 만들기
        </button>
      </div>

      {/* 프리뷰 캔버스 */}
      <VideoCanvas />

      {/* SNS 태그 */}
      {script?.tags && script.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {script.tags.map((tag) => (
            <span key={tag} className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 타임라인 편집기 */}
      <TimelineEditor />

      {/* 내보내기 */}
      <ExportPanel />
    </div>
  );
}
