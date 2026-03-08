// src/components/SceneEditor.jsx
import { useState } from 'react';
import { useVideoStore } from '../store/videoStore.js';
import { fetchTypeCastTTS, fetchTTSWithRetry, hasTypeCastKeys,
         preprocessNarration, rotateTypeCastKey, getAudioCtx } from '../engine/tts.js';

export default function SceneEditor({ sceneIdx, onClose }) {
  const { script, updateScene, audioBuffers, updateAudioBuffer, addToast } = useVideoStore();
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
