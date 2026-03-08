// src/components/ResultScreen.jsx
import { useVideoStore } from '../store/videoStore.js';
import VideoPlayer  from './VideoPlayer.jsx';
import SceneList    from './SceneList.jsx';
import ExportPanel  from './ExportPanel.jsx';
import SNSTags      from './SNSTags.jsx';

export default function ResultScreen() {
  const { script, audioBuffers, reset, setShowResult } = useVideoStore();

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
            <div className="audio-badge">
              <i className="fas fa-microphone-alt" />
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
