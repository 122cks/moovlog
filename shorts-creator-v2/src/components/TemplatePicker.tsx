/* ============================================================
   components/TemplatePicker.tsx — 템플릿 선택 칩 UI
   ============================================================ */
import { TEMPLATES } from '@/config/templates';
import { useAppStore } from '@/store/useAppStore';
import type { TemplateKey } from '@/types/state';

export function TemplatePicker() {
  const selected  = useAppStore((s) => s.selectedTemplate);
  const setTpl    = useAppStore((s) => s.setTemplate);
  const pushToast = useAppStore((s) => s.pushToast);

  const handleSelect = (key: TemplateKey) => {
    setTpl(key);
    pushToast(
      key === 'auto' ? 'AI가 영상에 맞게 자동 선택합니다' : `${TEMPLATES[key as Exclude<TemplateKey,'auto'>]?.emoji ?? ''} ${TEMPLATES[key as Exclude<TemplateKey,'auto'>]?.name ?? key} 템플릿 선택됨`,
      'inf',
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* AI 자동 */}
      <Chip
        label="🤖 AI 자동"
        active={selected === 'auto'}
        onClick={() => handleSelect('auto')}
      />
      {/* 각 템플릿 */}
      {(Object.entries(TEMPLATES) as [Exclude<TemplateKey,'auto'>, (typeof TEMPLATES)[Exclude<TemplateKey,'auto'>]][]).map(
        ([key, cfg]) => (
          <Chip
            key={key}
            label={`${cfg.emoji} ${cfg.name}`}
            active={selected === key}
            onClick={() => handleSelect(key)}
          />
        ),
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-full px-3 py-1.5 text-xs font-semibold transition
        ${active
          ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/30'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}
      `}
    >
      {label}
    </button>
  );
}
