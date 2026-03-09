// src/components/Header.jsx
export default function Header({ activeTab, onTabChange, tabs }) {
  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-play">▶</span>
            <div className="logo-text">
              <span className="logo-title">MOOVLOG</span>
              <span className="logo-sub">{activeTab === 'blog' ? 'Blog Writer' : 'Shorts Creator'}</span>
            </div>
          </div>
          <span className="header-version">v2.18</span>
        </div>

        {/* 앱 탭 내비게이션 */}
        {tabs && (
          <div className="app-tab-nav">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`app-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => onTabChange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Feature Tags — 탭에 따라 다르게 */}
      {activeTab === 'shorts' && (
        <div className="feature-tags">
          <span className="ftag"><i className="fas fa-wand-magic-sparkles" /> AI 자동 스타일</span>
          <span className="ftag"><i className="fab fa-instagram" /> 릴스 최적화</span>
          <span className="ftag"><i className="fab fa-tiktok" /> 틱톡 트렌드</span>
          <span className="ftag"><i className="fas fa-robot" /> 남성 AI 보이스</span>
          <span className="ftag"><i className="fas fa-eye" /> POV 모드</span>
          <span className="ftag"><i className="fas fa-bolt" /> 0.5초 훅</span>
        </div>
      )}
      {activeTab === 'blog' && (
        <div className="feature-tags">
          <span className="ftag"><i className="fas fa-pen-nib" /> AI 블로그 작성</span>
          <span className="ftag"><i className="fab fa-neos" /> 네이버 최적화</span>
          <span className="ftag"><i className="fab fa-instagram" /> 인스타 캡션</span>
          <span className="ftag"><i className="fab fa-youtube" /> 유튜브 태그</span>
          <span className="ftag"><i className="fas fa-hashtag" /> SNS 태그 자동생성</span>
        </div>
      )}

      {/* 스텝 인디케이터 — 숏폼 탭에서만 */}
      {activeTab === 'shorts' && (
        <div className="step-indicator">
          <StepItem n={1} label="업로드" />
          <div className="si-line" />
          <StepItem n={2} label="AI 생성" />
          <div className="si-line" />
          <StepItem n={3} label="결과" />
        </div>
      )}
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

