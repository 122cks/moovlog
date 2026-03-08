/* ============================================================
   App.tsx — 메인 앱 레이아웃
   phase === 'idle': 업로드 → 'loading': 파이프라인 → 'result': 결과
   ============================================================ */
import { useAppStore } from '@/store/useAppStore';
import { ToastContainer } from '@/components/Toast';
import { UploadPhase } from '@/components/UploadPhase';
import { LoadingPhase } from '@/components/LoadingPhase';
import { ResultPhase } from '@/components/ResultPhase';

export default function App() {
  const phase = useAppStore((s) => s.phase);

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-white">
      {phase === 'idle'    && <UploadPhase />}
      {phase === 'loading' && <LoadingPhase />}
      {phase === 'result'  && <ResultPhase />}
      {phase === 'error'   && <UploadPhase />}
      <ToastContainer />
    </div>
  );
}
