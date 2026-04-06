// src/components/SceneEditor.jsx
import { useState } from 'react';
import { useVideoStore } from '../store/videoStore.js';
import { fetchTypeCastTTS, fetchTTSWithRetry, hasTypeCastKeys,
         preprocessNarration, rotateTypeCastKey, getAudioCtx } from '../engine/tts.js';

export default function SceneEditor({ sceneIdx, onClose }) {
  const { script, updateScene, audioBuffers, updateAudioBuffer, addToast, files } = useVideoStore();
  const sc = script?.scenes?.[sceneIdx];
  if (!sc) return null;

  const [caption,   setCaption]   = useState(sc.caption1 || sc.subtitle || '');
  const [narration, setNarration] = useState(sc.narration || '');
  const [duration,  setDuration]  = useState(sc.duration > 0 ? sc.duration : 3.0);
  const [loading,   setLoading]   = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSave = async () => {
    setLoading(true);
    try {
      // 캡션/길이 즉시 적용
      updateScene(sceneIdx, { caption1: caption, subtitle: caption, duration });

      if (narration.trim() && narration !== sc.narration) {
        setStatusMsg('음성 재합성 중...');
        const text = preprocessNarration(narration);
        let newBuf = null;

        if (hasTypeCastKeys()) {
          const { _typeCastKeys } = await import('../engine/tts.js').then(m => ({ _typeCastKeys: [] }));
          // 모든 키 순환 시도
          let tcErr = null;
          for (let attempt = 0; attempt < 7; attempt++) {
            try { newBuf = await fetchTypeCastTTS(text); break; }
            catch (e) { tcErr = e; rotateTypeCastKey(); }
          }
          if (!newBuf) throw tcErr || new Error('Typecast 모든 키 소진');
        } else {
          newBuf = await fetchTTSWithRetry(text, sceneIdx);
        }

        updateAudioBuffer(sceneIdx, newBuf);
        if (newBuf?.duration > 0) {
          const newDur = Math.max(2.0, Math.round((newBuf.duration + 0.4) * 10) / 10);
          updateScene(sceneIdx, { narration, duration: newDur });
          setDuration(newDur);
        }
        addToast(`SCENE ${sceneIdx + 1} 음성 재합성 완료!`, 'ok');
      } else {
        updateScene(sceneIdx, { narration });
        addToast(`SCENE ${sceneIdx + 1} 수정 완료`, 'ok');
      }
      onClose();
    } catch (e) {
      addToast(`음성 재생성 실패: ${e.message}`, 'err');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">
            {loading ? <><i className="fas fa-spinner fa-spin" /> {statusMsg}</> : `SCENE ${sceneIdx + 1} 편집`}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <label className="modal-label">캡션 (자막)</label>
        <input
          className="modal-input"
          type="text"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="자막 텍스트"
        />

        <label className="modal-label">씬 재생 길이 (초)</label>
        <input
          className="modal-input"
          type="number"
          step="0.1" min="0.5" max="15"
          value={duration}
          onChange={e => setDuration(parseFloat(e.target.value))}
        />

        <label className="modal-label">나레이션</label>
        <textarea
          className="modal-textarea"
          rows={4}
          value={narration}
          onChange={e => setNarration(e.target.value)}
          placeholder="나레이션 텍스트"
        />

        {/* ── A-B Roll 미디어 교체 ─────────────────────────────── */}
        {files?.length > 1 && (
          <>
            <label className="modal-label">미디어 교체 (A-B Roll)</label>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
              gap: '6px', maxHeight: '160px', overflowY: 'auto',
              background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px',
            }}>
              {files.map((f, i) => {
                const isSelected = (sc.media_idx ?? sceneIdx % files.length) === i;
                return (
                  <div
                    key={i}
                    onClick={() => updateScene(sceneIdx, { media_idx: i })}
                    style={{
                      cursor: 'pointer', borderRadius: '6px', overflow: 'hidden',
                      border: isSelected ? '2px solid #a855f7' : '2px solid transparent',
                      opacity: isSelected ? 1 : 0.6,
                      transition: 'all 0.15s',
                      aspectRatio: '9/16', background: '#111',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title={`미디어 ${i + 1}${isSelected ? ' (현재)' : ''}`}
                  >
                    {f.type === 'video'
                      ? <video src={f.url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                      : <img src={f.url} alt={`미디어 ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    }
                    {isSelected && (
                      <div style={{
                        position: 'absolute', bottom: '2px', right: '2px',
                        background: '#a855f7', borderRadius: '3px',
                        fontSize: '0.6rem', color: '#fff', padding: '0 3px',
                      }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="modal-btns">
          <button className="modal-btn-cancel" onClick={onClose}>취소</button>
          <button className="modal-btn-save" onClick={handleSave} disabled={loading}>
            {loading ? '처리 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
