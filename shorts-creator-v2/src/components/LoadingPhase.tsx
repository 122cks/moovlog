/* ============================================================
   components/LoadingPhase.tsx — 4단계 파이프라인 진행 UI
   ============================================================ */
import { useAppStore } from '@/store/useAppStore';

export function LoadingPhase() {
  const steps = useAppStore((s) => s.stepProgress);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-2">
        <span className="animate-pulse-soft text-5xl">🎬</span>
        <h2 className="font-display text-xl font-black">숏폼 생성 중...</h2>
      </div>

      <div className="w-full space-y-3">
        {steps.map((step, i) => (
          <StepRow key={i} idx={i + 1} {...step} />
        ))}
      </div>
    </div>
  );
}

interface StepRowProps {
  idx: number;
  label: string;
  sub: string;
  status: 'pending' | 'running' | 'done' | 'error';
  pct: number;
}

function StepRow({ idx, label, sub, status, pct }: StepRowProps) {
  const icon =
    status === 'done'    ? '✓' :
    status === 'error'   ? '✕' :
    status === 'running' ? '⟳' : String(idx);

  const color =
    status === 'done'    ? 'text-emerald-400 border-emerald-500' :
    status === 'error'   ? 'text-red-400 border-red-500' :
    status === 'running' ? 'text-brand-pink border-brand-pink animate-spin' :
                           'text-zinc-600 border-zinc-700';

  return (
    <div className={`rounded-xl border p-3 transition ${status === 'running' ? 'border-brand-pink/40 bg-brand-pink/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${color}`}>
          {icon}
        </span>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${status === 'pending' ? 'text-zinc-500' : 'text-white'}`}>{label}</p>
          <p className="text-xs text-zinc-500">{sub}</p>
        </div>
        {status === 'running' && (
          <span className="text-xs text-brand-pink">{pct}%</span>
        )}
      </div>
      {status === 'running' && pct > 0 && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-brand-pink transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
