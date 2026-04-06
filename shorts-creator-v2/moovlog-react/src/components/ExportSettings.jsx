// src/components/ExportSettings.jsx
// 렌더링 품질 프리셋 선택 + 하드웨어 가속 정보 표시 (#40, #8)
import { useState, useEffect } from 'react';

const WEB_PRESETS = [
  { id: 'draft',    label: '초안 (빠름)',      desc: '480p, CRF 32, 빠른 프리셋',       crf: 32, res: '480p',  preset: 'ultrafast' },
  { id: 'fast',     label: '빠른 렌더',        desc: '720p, CRF 28, fast 프리셋',       crf: 28, res: '720p',  preset: 'fast'      },
  { id: 'balanced', label: '균형 (기본)',       desc: '1080p, CRF 22, medium 프리셋',    crf: 22, res: '1080p', preset: 'medium', recommended: true },
  { id: 'quality',  label: '고화질',           desc: '1080p, CRF 18, slow 프리셋',      crf: 18, res: '1080p', preset: 'slow'      },
  { id: 'archive',  label: '아카이브 (2-pass)', desc: '1080p, 2-pass, veryslow 프리셋',  crf: 16, res: '1080p', preset: 'veryslow', twoPass: true },
];

/**
 * @param {{
 *   onSelect: (preset: object) => void,
 *   selected: string,
 *   disabled?: boolean
 * }} props
 */
export default function ExportSettings({ onSelect, selected = 'balanced', disabled = false }) {
  const [presets,  setPresets]  = useState(WEB_PRESETS);
  const [hwInfo,   setHwInfo]   = useState(null);
  const [loading,  setLoading]  = useState(false);

  const api = typeof window !== 'undefined' ? window.electronAPI : null;

  useEffect(() => {
    if (!api) return;

    // Electron에서 프리셋 + 하드웨어 가속 정보 가져오기
    setLoading(true);
    Promise.all([
      api.getRenderPresets?.().catch(() => null),
      api.ffmpegStatus?.().catch(() => null),
    ]).then(([electronPresets, status]) => {
      if (electronPresets?.length) setPresets(electronPresets);
      if (status) setHwInfo(status);
    }).finally(() => setLoading(false));
  }, [api]);

  const current = presets.find(p => p.id === selected) || presets[2];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>⚙️ 내보내기 설정</span>
        {loading && <span style={styles.loadingBadge}>감지 중...</span>}
      </div>

      {/* 하드웨어 가속 정보 (Electron만) */}
      {hwInfo && (
        <div style={styles.hwInfo}>
          <span style={{ color: hwInfo.hwaccel !== 'libx264' ? '#4ade80' : '#888' }}>
            {hwInfo.hwaccel !== 'libx264' ? '⚡' : '🔧'} {hwInfo.hwaccel || 'libx264'}
          </span>
          {hwInfo.cpuThreads && (
            <span style={styles.hwChip}>{hwInfo.cpuThreads} 스레드</span>
          )}
          <span style={styles.hwChip}>{hwInfo.version?.split(' ')[2] || 'FFmpeg'}</span>
        </div>
      )}

      {/* 프리셋 목록 */}
      <div style={styles.presetList}>
        {presets.map(p => (
          <button
            key={p.id}
            disabled={disabled}
            onClick={() => onSelect(p)}
            style={{
              ...styles.presetBtn,
              ...(p.id === selected ? styles.presetBtnActive : {}),
              ...(disabled ? styles.presetBtnDisabled : {}),
            }}
          >
            <div style={styles.presetTop}>
              <span style={styles.presetLabel}>{p.label}</span>
              {p.recommended && <span style={styles.badge}>추천</span>}
              {p.twoPass    && <span style={{ ...styles.badge, background: '#7c3aed' }}>2-pass</span>}
            </div>
            <div style={styles.presetDesc}>{p.desc}</div>
          </button>
        ))}
      </div>

      {/* 현재 선택 요약 */}
      <div style={styles.summary}>
        선택: <strong>{current.label}</strong>
        {current.crf   && <> · CRF {current.crf}</>}
        {current.res   && <> · {current.res}</>}
        {current.twoPass && <> · 2-pass 인코딩</>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#0f0f1a',
    border: '1px solid #2a2a4a',
    borderRadius: 12,
    padding: '16px',
    color: '#e0e0e0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: { fontWeight: 700, fontSize: 15 },
  loadingBadge: { fontSize: 11, color: '#888', background: '#1a1a2e', borderRadius: 4, padding: '2px 6px' },
  hwInfo: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
    fontSize: 12,
  },
  hwChip: {
    background: '#1a1a2e',
    border: '1px solid #333',
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: 11,
    color: '#aaa',
  },
  presetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 12,
  },
  presetBtn: {
    background: '#1a1a2e',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '8px 12px',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#e0e0e0',
    transition: 'border-color 0.15s',
  },
  presetBtnActive: {
    borderColor: '#6366f1',
    background: '#1e1e3f',
  },
  presetBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  presetTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  presetLabel: { fontWeight: 600, fontSize: 13 },
  badge: {
    background: '#059669',
    color: '#fff',
    borderRadius: 4,
    fontSize: 10,
    padding: '1px 6px',
    fontWeight: 700,
  },
  presetDesc: { fontSize: 11, color: '#888' },
  summary: {
    fontSize: 12,
    color: '#aaa',
    borderTop: '1px solid #222',
    paddingTop: 10,
  },
};
