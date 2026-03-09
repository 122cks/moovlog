// src/components/ResultScreen.jsx
import { useVideoStore } from '../store/videoStore.js';
import VideoPlayer  from './VideoPlayer.jsx';
import SceneList    from './SceneList.jsx';
import ExportPanel  from './ExportPanel.jsx';
import SNSTags      from './SNSTags.jsx';

// ── 3종 훅 베리에이션 선택 UI ──────────────────────────────
function HookPicker({ variations, script, setScript, addToast }) {
  if (!variations?.length) return null;
  const LABELS = { shock: '🔥 충격형', info: 'ℹ️ 정보형', pov: '👤 1인칭' };
  const handleSelect = (h) => {
    const newScenes = script.scenes ? [...script.scenes] : [];
    if (newScenes.length > 0) {
      newScenes[0] = { ...newScenes[0], caption1: h.caption1, caption2: h.caption2, narration: h.narration };
    }
    setScript({ ...script, scenes: newScenes });
    addToast(`${LABELS[h.type] || h.type} 훅으로 교체 완료! ✨`, 'ok');
  };
  return (
    <div className="hook-picker-wrap">
      <p className="marketing-title"><i className="fas fa-fish" /> AI PD의 3종 훅 전략</p>
      <div className="hook-grid">
        {variations.map((h, i) => (
          <div key={i} className="hook-card" onClick={() => handleSelect(h)}>
            <span className="hook-type">{LABELS[h.type] || h.type}</span>
            <p className="hook-cap">{h.caption1}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 마케팅 에셋 복사 버튼 섹션 ─────────────────────────────
function MarketingAssets({ marketing, addToast }) {
  if (!marketing) return null;
  const copy = async (text, label) => {
    try { await navigator.clipboard.writeText(text); addToast(`${label} 복사 완료! ✨`, 'ok'); }
    catch { addToast('복사 실패 — 직접 선택해서 복사해주세요', 'err'); }
  };
  return (
    <div className="marketing-assets-box">
      <p className="marketing-title"><i className="fas fa-rocket" /> 릴스 떡상 마케팅 키트</p>
      {marketing.hook_title && (
        <div className="marketing-row">
          <span className="marketing-label">🎣 훅 제목</span>
          <button className="marketing-copy-btn" onClick={() => copy(marketing.hook_title, '훅 제목')}>
            <i className="fas fa-copy" /> 복사
          </button>
          <p className="marketing-text">{marketing.hook_title}</p>
        </div>
      )}
      {marketing.caption && (
        <div className="marketing-row">
          <span className="marketing-label">✍️ 인스타 캡션</span>
          <button className="marketing-copy-btn" onClick={() => copy(marketing.caption, '인스타 캡션')}>
            <i className="fas fa-copy" /> 복사
          </button>
          <p className="marketing-text" style={{ whiteSpace: 'pre-line', fontSize: '0.75rem' }}>{marketing.caption}</p>
        </div>
      )}
      {marketing.hashtags_30 && (
        <div className="marketing-row">
          <span className="marketing-label">🏷️ 해시태그 30개</span>
          <button className="marketing-copy-btn" onClick={() => copy(marketing.hashtags_30, '해시태그 30개')}>
            <i className="fas fa-copy" /> 한번에 복사
          </button>
          <p className="marketing-text" style={{ fontSize: '0.68rem', lineHeight: 1.8, color: '#a855f7' }}>{marketing.hashtags_30}</p>
        </div>
      )}
      {marketing.receipt_review && (
        <div className="marketing-row">
          <span className="marketing-label">🧢 네이버 영수증 리뷰</span>
          <button className="marketing-copy-btn" onClick={() => copy(marketing.receipt_review, '영수증 리뷰')}>
            <i className="fas fa-copy" /> 복사
          </button>
          <p className="marketing-text">{marketing.receipt_review}</p>
        </div>
      )}
    </div>
  );
}

export default function ResultScreen() {
  const { script, audioBuffers, reset, setShowResult, addToast, setScript } = useVideoStore();

  const totalSec = script?.scenes?.reduce((a, s) => a + (s.duration || 0), 0) || 0;
  const hasAudio = audioBuffers?.some(b => b);

  const goBack = () => { setShowResult(false); };
  const doReset = () => { reset(); };

  return (
    <div className="result-wrap">
      <div className="result-inner">
        {/* 헤더 */}
        <div className="result-header">
          <button className="result-back-btn" onClick={goBack}>
            <i className="fas fa-arrow-left" />
          </button>
          <div className="result-title-box">
            <p className="result-label">생성 완료</p>
            <p className="result-sub">{script?.scenes?.length || 0}개 씬 · {totalSec.toFixed(1)}초</p>
          </div>
          <div className="badge-group">
          <div className={`audio-badge ${hasAudio ? '' : 'muted'}`}>
            <i className={`fas ${hasAudio ? 'fa-microphone-alt' : 'fa-volume-mute'}`} />
            <span>{hasAudio ? 'AI 보이스' : '무음'}</span>
          </div>
        </div>
        </div>

        {/* 영상 플레이어 */}
        <VideoPlayer />

        {/* 씬 목록 */}
        <SceneList />

        {/* 저장 패널 */}
        <ExportPanel />

        {/* 마케팅 에셋 키트 */}
        {script?.marketing && <MarketingAssets marketing={script.marketing} addToast={addToast} />}

        {/* 3종 훅 빆리에이션 */}
        {script?.hook_variations?.length > 0 && (
          <HookPicker variations={script.hook_variations} script={script} setScript={setScript} addToast={addToast} />
        )}

        {/* SNS 태그 */}
        {script && <SNSTags script={script} />}

        {/* 다시 만들기 */}
        <button className="re-btn" onClick={doReset}>
          <i className="fas fa-redo" /> 다시 만들기
        </button>
      </div>
    </div>
  );
}
