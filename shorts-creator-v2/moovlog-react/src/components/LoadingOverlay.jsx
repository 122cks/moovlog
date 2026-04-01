// src/components/LoadingOverlay.jsx
import { useVideoStore } from '../store/videoStore.js';

const STEPS = [
  { icon: 'fa-search',         label: '식당 실시간 정보 조사' },
  { icon: 'fa-utensils',       label: '업체 유형 분류' },
  { icon: 'fa-eye',            label: '시각 분석 + 스타일 선택' },
  { icon: 'fa-film',           label: '스토리보드 설계' },
  { icon: 'fa-link',           label: '영상 컷 삽입 + 자막 매칭 검증' },
  { icon: 'fa-microphone-alt', label: 'AI 음성 합성' },
  { icon: 'fa-video',          label: '렌더링 준비 + 품질 검수' },
];

export default function LoadingOverlay() {
  const { pipeline } = useVideoStore();

  return (
    <div className="loading-wrap">
      <div className="loading-card">
        <div className="ai-loader">
          <div className="ai-ring" />
          <span className="ai-ico"><i className="fas fa-robot" /></span>
        </div>
        <p className="load-title">{pipeline.title || 'AI가 작업 중입니다...'}</p>
        <p className="load-sub">{pipeline.sub || '잠시만 기다려주세요'}</p>

        {pipeline.autoStyleName && (
          <div className="auto-style-badge">
            <span className="asb-label">AI 추천 스타일</span>
            <span className="asb-value">{pipeline.autoStyleName}</span>
          </div>
        )}

        <div className="load-pipeline">
          {STEPS.map((step, i) => {
            const isActive = i === pipeline.step - 1;
            const isDone   = pipeline.done[i];
            return (
              <div key={i} className={`lp-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                <div className="lp-icon"><i className={`fas ${step.icon}`} /></div>
                <div className="lp-info">
                  <span className="lp-name">{step.label}</span>
                  <span className="lp-status">
                    {isDone ? '완료' : isActive ? '진행중...' : '대기중'}
                  </span>
                </div>
                <div className={`lp-check ${isDone ? 'visible' : ''}`}>
                  <i className="fas fa-check" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
