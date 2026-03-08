// src/App.jsx
import { useEffect } from 'react';
import { useVideoStore } from './store/videoStore.js';
import { initFirebase }  from './engine/firebase.js';
import { setGeminiKey }  from './engine/gemini.js';
import { setTypeCastKeys } from './engine/tts.js';

import Header          from './components/Header.jsx';
import UploadSection   from './components/UploadSection.jsx';
import LoadingOverlay  from './components/LoadingOverlay.jsx';
import ResultScreen    from './components/ResultScreen.jsx';
import ToastContainer  from './components/ToastContainer.jsx';

import './styles/app.css';

export default function App() {
  const { pipeline, showResult } = useVideoStore();

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

    // 버전 표시
    document.title = '무브먼트 Shorts Creator v2';
  }, []);

  return (
    <div className="app-root">
      <Header />

      {/* 업로드 화면 */}
      {!showResult && <UploadSection />}

      {/* 로딩 오버레이 */}
      {pipeline.visible && <LoadingOverlay />}

      {/* 결과 화면 */}
      {showResult && <ResultScreen />}

      {/* 토스트 */}
      <ToastContainer />
    </div>
  );
}
