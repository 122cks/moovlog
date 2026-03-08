// src/components/Header.jsx
export default function Header() {
  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-play">▶</span>
            <div className="logo-text">
              <span className="logo-title">MOOVLOG</span>
              <span className="logo-sub">Shorts Creator</span>
            </div>
          </div>
          <span className="header-version">v2.0 React</span>
        </div>
      </header>

      <div className="feature-tags">
        <span className="ftag"><i className="fas fa-wand-magic-sparkles"></i> AI 자동 스타일</span>
        <span className="ftag"><i className="fab fa-instagram"></i> 릴스 최적화</span>
        <span className="ftag"><i className="fab fa-tiktok"></i> 틱톡 트렌드</span>
        <span className="ftag"><i className="fas fa-robot"></i> 남성 AI 보이스</span>
      </div>

      <div className="step-indicator">
        <StepItem n={1} label="업로드" />
        <div className="si-line" />
        <StepItem n={2} label="AI 생성" />
        <div className="si-line" />
        <StepItem n={3} label="결과" />
      </div>
    </>
  );
}

function StepItem({ n, label }) {
  return (
    <div className="si-item">
      <span className="si-num">{n}</span>
      <span className="si-label">{label}</span>
    </div>
  );
}
