/* ============================================================
   components/TimelineEditor.tsx
   씬별 duration / 자막 / 나레이션 인라인 편집 타임라인.
   ============================================================ */
import { useAppStore } from '@/store/useAppStore';
import type { Scene } from '@/types/state';

export function TimelineEditor() {
  const script      = useAppStore((s) => s.script);
  const currentIdx  = useAppStore((s) => s.scene);
  const setScene    = useAppStore((s) => s.setScene);
  const updateScene = useAppStore((s) => s.updateScene);

  if (!script) return null;

  return (
    <div className="flex flex-col gap-2 overflow-x-auto pb-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
        타임라인
      </h3>
      <div className="flex gap-2">
        {script.scenes.map((sc, i) => (
          <SceneChip
            key={i}
            idx={i}
            scene={sc}
            active={i === currentIdx}
            onSelect={() => setScene(i)}
            onUpdate={(patch) => updateScene(i, patch)}
          />
        ))}
      </div>
    </div>
  );
}

interface SceneChipProps {
  idx: number;
  scene: Scene;
  active: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Scene>) => void;
}

function SceneChip({ idx, scene, active, onSelect, onUpdate }: SceneChipProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        flex min-w-[100px] cursor-pointer flex-col rounded-xl border p-2 text-xs transition
        ${active
          ? 'border-brand-pink bg-brand-pink/10 ring-1 ring-brand-pink'
          : 'border-zinc-700 bg-brand-card hover:border-zinc-500'}
      `}
    >
      <span className="mb-1 font-bold text-zinc-300">SCENE {idx + 1}</span>

      {/* duration 슬라이더 */}
      <label className="flex flex-col gap-0.5">
        <span className="text-zinc-500">길이 {scene.duration.toFixed(1)}s</span>
        <input
          type="range"
          min={1.0}
          max={8.0}
          step={0.1}
          value={scene.duration}
          onChange={(e) => onUpdate({ duration: parseFloat(e.target.value) })}
          onClick={(e) => e.stopPropagation()}
          className="accent-brand-pink"
        />
      </label>

      {/* caption1 편집 */}
      <input
        type="text"
        value={scene.caption1}
        maxLength={16}
        onChange={(e) => onUpdate({ caption1: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-full rounded bg-zinc-800 px-1.5 py-0.5 text-white outline-none focus:ring-1 focus:ring-brand-pink"
        placeholder="자막 1"
      />
      <input
        type="text"
        value={scene.caption2 ?? ''}
        maxLength={16}
        onChange={(e) => onUpdate({ caption2: e.target.value || undefined })}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 w-full rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400 outline-none focus:ring-1 focus:ring-zinc-500"
        placeholder="자막 2 (선택)"
      />
    </div>
  );
}
