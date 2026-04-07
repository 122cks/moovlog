/* ============================================================
   components/SceneCutPhase.tsx
   §15 CapCut 스타일 영상 자동컷 — FFmpeg 씬 감지 → 선택 → 렌더링
   ============================================================ */
import { useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { SceneCut } from '@/types/state';

interface SceneCutPhaseProps {
  videoFile: File;
  videoPath: string; // Electron 실제 파일 경로
  onClose: () => void;
}

// 초 → mm:ss 포맷
function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 인코딩 진행률 🥩 메시지
function getMeatMsg(pct: number): string {
  if (pct < 5)  return '재료 준비 중... 🍖';
  if (pct < 20) return `불 달구는 중... 🔥 ${pct}%`;
  if (pct < 50) return `고기 굽는 중 🥩 ${pct}%`;
  if (pct < 80) return `황금 마이야르 반응... ✨ ${pct}%`;
  if (pct < 99) return `거의 완성! 잠깐만요... 🎬 ${pct}%`;
  return '✅ 완성!';
}

export function SceneCutPhase({ videoFile, videoPath, onClose }: SceneCutPhaseProps) {
  const sceneCuts       = useAppStore((s) => s.sceneCuts);
  const detectingScenes = useAppStore((s) => s.detectingScenes);
  const setSceneCuts    = useAppStore((s) => s.setSceneCuts);
  const toggleSceneCut  = useAppStore((s) => s.toggleSceneCut);
  const updateSceneCut  = useAppStore((s) => s.updateSceneCut);
  const setDetecting    = useAppStore((s) => s.setDetectingScenes);
  const pushToast       = useAppStore((s) => s.pushToast);

  const [threshold, setThreshold] = useState(0.3);
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [renderMsg, setRenderMsg] = useState('');
  const [eta, setEta] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const selectedCuts = sceneCuts.filter((c) => c.selected);

  // ── 씬 자동 감지 ─────────────────────────────────────────────────────
  const handleDetect = async () => {
    if (!window.electronAPI?.detectSceneChanges) {
      pushToast('Electron 앱에서만 씬 감지가 가능합니다', 'err');
      return;
    }
    setDetecting(true);
    setSceneCuts([]);
    try {
      const raw = await window.electronAPI.detectSceneChanges({
        filePath: videoPath,
        threshold,
        maxScenes: 30,
      });
      const cuts: SceneCut[] = raw.map((r) => ({
        ...r,
        selected: true,
        caption: '',
      }));
      setSceneCuts(cuts);
      pushToast(`🎬 ${cuts.length}개 씬이 감지되었습니다`, 'ok');
    } catch (e) {
      pushToast(`씬 감지 실패: ${(e as Error).message}`, 'err');
    } finally {
      setDetecting(false);
    }
  };

  // ── 선택된 씬으로 FFmpeg 렌더링 ─────────────────────────────────────
  const handleExport = async () => {
    if (!window.electronAPI) return;
    if (selectedCuts.length === 0) {
      pushToast('씬을 1개 이상 선택해주세요', 'err');
      return;
    }
    setExporting(true);
    setExportPct(0);
    setRenderMsg(getMeatMsg(0));
    setEta(null);

    const jobId = `scene_${Date.now()}`;
    unsubRef.current = window.electronAPI.onRenderProgress((data) => {
      if (!data.jobId.startsWith(jobId.slice(0, 8))) return;
      setExportPct(data.pct);
      setRenderMsg(getMeatMsg(data.pct));
      if (data.eta) setEta(data.eta);
    });

    try {
      const outputPath = await window.electronAPI.saveFile({
        title: '씬컷 영상 저장',
        defaultPath: `sceneCut_${videoFile.name.replace(/\.[^.]+$/, '')}_${new Date().toISOString().slice(0, 10)}.mp4`,
      });
      if (!outputPath) { setExporting(false); return; }

      // editList 빌드: 각 씬 = { path, start, duration, type }
      const editList = selectedCuts.map((cut) => ({
        path: videoPath,
        start: cut.time,
        duration: cut.duration ?? 3,
        type: 'video',
        caption: cut.caption || undefined,
      }));

      await window.electronAPI.renderVideo(editList, outputPath, {}, jobId);
      setRenderMsg('✅ 완성! 폴더가 열렸습니다');
      setExportPct(100);
      pushToast('🥩 렌더링 완료!', 'ok');
      window.electronAPI.cleanupTmpFiles().catch(() => {});
    } catch (e) {
      pushToast(`렌더링 실패: ${(e as Error).message}`, 'err');
      setRenderMsg('');
    } finally {
      setExporting(false);
      unsubRef.current?.();
      unsubRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-brand-dark">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          ← 뒤로
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">🎬 씬 자동컷</p>
          <p className="truncate text-xs text-zinc-400">{videoFile.name}</p>
        </div>
        {selectedCuts.length > 0 && (
          <span className="rounded-full bg-brand-pink/20 px-2.5 py-1 text-xs font-bold text-brand-pink">
            {selectedCuts.length}개 선택
          </span>
        )}
      </div>

      {/* 감지 설정 바 */}
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <span>감도</span>
          <input
            type="range"
            min={0.1}
            max={0.6}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-24 accent-brand-pink"
            disabled={detectingScenes}
          />
          <span className="w-8 text-white">{threshold.toFixed(2)}</span>
        </label>
        <span className="text-xs text-zinc-600">낮을수록 더 많은 씬 감지</span>
        <div className="flex-1" />
        <button
          onClick={handleDetect}
          disabled={detectingScenes || exporting}
          className="flex items-center gap-2 rounded-xl bg-zinc-700 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {detectingScenes ? (
            <>
              <span className="animate-spin">⏳</span>
              감지 중...
            </>
          ) : (
            <>🔍 씬 자동 감지</>
          )}
        </button>
      </div>

      {/* 씬 그리드 */}
      <div className="flex-1 overflow-y-auto p-4">
        {sceneCuts.length === 0 && !detectingScenes && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-4xl">🎬</p>
            <p className="text-base font-bold text-white">씬 자동 감지를 눌러주세요</p>
            <p className="max-w-xs text-sm text-zinc-400">
              FFmpeg가 영상을 분석해서{'\n'}
              장면 전환을 자동으로 찾아드립니다
            </p>
          </div>
        )}
        {detectingScenes && (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <p className="animate-pulse text-4xl">🔍</p>
            <p className="text-sm text-zinc-300">FFmpeg로 씬 경계를 분석하는 중...</p>
          </div>
        )}
        {!detectingScenes && sceneCuts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {sceneCuts.map((cut) => (
              <SceneChip
                key={cut.index}
                cut={cut}
                onToggle={() => toggleSceneCut(cut.index)}
                onUpdate={(patch) => updateSceneCut(cut.index, patch)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 하단 내보내기 바 */}
      <div className="border-t border-zinc-800 bg-zinc-900 p-4">
        {exporting ? (
          <div className="flex flex-col gap-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-brand-pink transition-all duration-300"
                style={{ width: `${exportPct}%` }}
              />
            </div>
            <p className="text-center text-xs text-zinc-400">{renderMsg}</p>
            {eta && <p className="text-center text-[10px] text-zinc-600">{eta}</p>}
          </div>
        ) : (
          <button
            onClick={handleExport}
            disabled={selectedCuts.length === 0 || exporting || detectingScenes}
            className="w-full rounded-xl bg-brand-pink py-3 text-sm font-bold text-white transition hover:bg-pink-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            🥩 선택한 {selectedCuts.length}개 씬으로 영상 만들기
          </button>
        )}
      </div>
    </div>
  );
}

// ── 씬 카드 컴포넌트 ─────────────────────────────────────────────────────
interface SceneChipProps {
  cut: SceneCut;
  onToggle: () => void;
  onUpdate: (patch: Partial<SceneCut>) => void;
}

function SceneChip({ cut, onToggle, onUpdate }: SceneChipProps) {
  const thumbSrc = cut.thumbnailPath
    ? `file://${cut.thumbnailPath.replace(/\\/g, '/')}`
    : null;

  return (
    <div
      onClick={onToggle}
      className={`
        relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition
        ${cut.selected
          ? 'border-brand-pink ring-2 ring-brand-pink/50'
          : 'border-zinc-700 opacity-50'}
      `}
    >
      {/* 썸네일 */}
      <div className="relative aspect-[9/16] w-full bg-zinc-900">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={`씬 ${cut.index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-zinc-700">
            🎞
          </div>
        )}
        {/* 선택 체크 */}
        <div className={`
          absolute right-2 top-2 flex h-5 w-5 items-center justify-center
          rounded-full border-2 text-xs font-bold transition
          ${cut.selected
            ? 'border-brand-pink bg-brand-pink text-white'
            : 'border-zinc-500 bg-zinc-900/60 text-zinc-400'}
        `}>
          {cut.selected ? '✓' : ''}
        </div>
        {/* 시간 뱃지 */}
        <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
          {fmtTime(cut.time)}
        </div>
      </div>

      {/* 씬 정보 */}
      <div className="flex flex-col gap-1 bg-zinc-900 p-2">
        <p className="text-[11px] font-bold text-zinc-300">
          SCENE {cut.index + 1}
          {cut.duration != null && (
            <span className="ml-1 font-normal text-zinc-500">
              · {cut.duration.toFixed(1)}s
            </span>
          )}
        </p>

        {/* 길이 슬라이더 */}
        {cut.selected && (
          <label className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-zinc-500">
              길이 {(cut.duration ?? 3).toFixed(1)}s
            </span>
            <input
              type="range"
              min={0.5}
              max={15}
              step={0.5}
              value={cut.duration ?? 3}
              onChange={(e) => onUpdate({ duration: parseFloat(e.target.value) })}
              className="accent-brand-pink"
            />
          </label>
        )}

        {/* 자막 입력 */}
        {cut.selected && (
          <input
            type="text"
            value={cut.caption}
            maxLength={20}
            placeholder="자막 (선택)"
            onChange={(e) => onUpdate({ caption: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 w-full rounded bg-zinc-800 px-1.5 py-1 text-[11px] text-white outline-none focus:ring-1 focus:ring-brand-pink"
          />
        )}
      </div>
    </div>
  );
}
