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

    const tcKeys = [1,2,3,4,5,6,7].map(n => {
      const envKey = import.meta.env[`VITE_TYPECAST_KEY${n > 1 ? '_' + n : ''}`] || '';
      const lsKey  = localStorage.getItem(`moovlog_typecast_key${n > 1 ? n : ''}`) || '';
      return envKey || lsKey;
    });
    setTypeCastKeys(tcKeys);

    initFirebase();

    document.title = '무브먼트 Shorts Creator v2';
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

