// src/App.jsx
import { useEffect, useState } from 'react';
import { useVideoStore } from './store/videoStore.js';
import { initFirebase }  from './engine/firebase.js';
import { setGeminiKey }  from './engine/gemini.js';
import { setTypeCastKeys } from './engine/tts.js';

import Header          from './components/Header.jsx';
import UploadSection   from './components/UploadSection.jsx';
import LoadingOverlay  from './components/LoadingOverlay.jsx';
import ResultScreen    from './components/ResultScreen.jsx';
import BlogPage        from './components/BlogPage.jsx';
import ToastContainer  from './components/ToastContainer.jsx';

import './styles/app.css';

// 앱 탭 정의
const APP_TABS = [
  { id: 'shorts', label: '🎬 숏폼 만들기' },
  { id: 'blog',   label: '📝 블로그 포스팅' },
];

export default function App() {
  const { pipeline, showResult } = useVideoStore();
  const [activeTab, setActiveTab] = useState('shorts');

  useEffect(() => {
    // API 키 초기화
    const gKey = import.meta.env.VITE_GEMINI_KEY || localStorage.getItem('moovlog_gemini_key') || '';
    setGeminiKey(gKey);

    const tcKeys = [1,2,3,4,5,6,7,8].flatMap(n => {
      const envKey = import.meta.env[`VITE_TYPECAST_KEY${n > 1 ? '_' + n : ''}`] || '';
      const lsKey  = localStorage.getItem(`moovlog_typecast_key${n > 1 ? n : ''}`) || '';
      const raw = envKey || lsKey;
      // 혹시 콤마/줄바꿈으로 여러 키가 하나의 문자열로 저장된 경우 분리
      return raw ? raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [];
    }).slice(0, 8);
    setTypeCastKeys(tcKeys);
    console.log(`[App] TypeCast 키 로드: ${tcKeys.length}개`);

    initFirebase();

    document.title = '무브먼트 Shorts Creator v2';

    // ── 조기 COI 감지 ──────────────────────────────────────────────────────────
    // SW가 이미 컨트롤 중인데 crossOriginIsolated가 false이면 (도구 손실 없는 초기 상태에서) 재로드
    // 아직 파일/스크립트가 없을 때만 재로드해서 데이터 손실 방지
    if (!window.crossOriginIsolated && navigator.serviceWorker?.controller) {
      const store = useVideoStore.getState();
      if (!store.files.length && !store.script) {
        const attempts = parseInt(sessionStorage.getItem('_coi_attempts') || '0', 10);
        if (attempts < 3) {
          sessionStorage.setItem('_coi_attempts', String(attempts + 1));
          console.log('[App] SW 활성 but !crossOriginIsolated → 재로드 (COI 헤더 확보)');
          location.reload();
        }
      }
    }
  }, []);

  return (
    <div className="app-root">
      <Header activeTab={activeTab} onTabChange={setActiveTab} tabs={APP_TABS} />

      {/* 숏폼 탭 */}
      {activeTab === 'shorts' && (
        <>
          {!showResult && <UploadSection />}
          {pipeline.visible && <LoadingOverlay />}
          {showResult && <ResultScreen />}
        </>
      )}

      {/* 블로그 탭 */}
      {activeTab === 'blog' && <BlogPage />}

      <ToastContainer />
    </div>
  );
}

