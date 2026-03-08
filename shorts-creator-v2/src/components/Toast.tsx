/* ============================================================
   components/Toast.tsx — 토스트 알림 컴포넌트
   ============================================================ */
import { useToasts, useAppStore } from '@/store/useAppStore';

const ICONS = { ok: '✓', err: '✕', inf: 'ℹ' } as const;
const COLORS = {
  ok:  'border-emerald-500 bg-emerald-500/10 text-emerald-300',
  err: 'border-red-500 bg-red-500/10 text-red-300',
  inf: 'border-sky-500 bg-sky-500/10 text-sky-300',
} as const;

export function ToastContainer() {
  const toasts      = useToasts();
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`
            pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-2.5
            text-sm font-medium shadow-xl backdrop-blur-md
            animate-slide-up cursor-pointer ${COLORS[t.type]}
          `}
        >
          <span className="text-base">{ICONS[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
