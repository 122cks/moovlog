// src/components/SceneList.jsx
import { useState } from 'react';
import { useVideoStore } from '../store/videoStore.js';
import { formatDuration } from '../engine/utils.js';
import SceneEditor from './SceneEditor.jsx';

export default function SceneList() {
  const { script, scene: currentScene } = useVideoStore();
  const [editIdx, setEditIdx] = useState(null);

  if (!script?.scenes?.length) return null;

  return (
    <>
      <details className="scenes-details">
        <summary><i className="fas fa-list-ul" /> 생성된 장면 스크립트</summary>
        <div className="scene-list">
          {script.scenes.map((sc, i) => (
            <div
              key={i}
              className={`scard ${i === currentScene ? 'active' : ''}`}
              id={`sc${i}`}
            >
              <div className="scard-num">
                SCENE {i + 1} · {formatDuration(Math.round(sc.duration || 0))} · {sc.subtitle_style || 'detail'}
                <button className="scard-edit-btn" onClick={() => setEditIdx(i)}>수정</button>
              </div>
              <div className="scard-sub">
                {sc.caption1}{sc.caption2 ? ` / ${sc.caption2}` : ''}
              </div>
              <div className="scard-nar">{sc.narration}</div>
            </div>
          ))}
        </div>
      </details>

      {editIdx !== null && (
        <SceneEditor sceneIdx={editIdx} onClose={() => setEditIdx(null)} />
      )}
    </>
  );
}
