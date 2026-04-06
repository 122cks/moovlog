// src/App.jsx
import { useEffect, useState } from 'react';
import { useVideoStore } from './store/videoStore.js';
import { initFirebase }  from './engine/firebase.js';
import { setGeminiKey }  from './engine/gemini.js';
import { setTypeCastKeys } from './engine/tts.js';
import { warmupFFmpeg }  from './engine/VideoRenderer.js';

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
  const { pipeline, showResult, ffmpegReady, ffmpegWarmMsg } = useVideoStore();
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

    // ── FFmpeg 엔진 백그라운드 예열 ─────────────────────────────────────────────
    // crossOriginIsolated가 true일 때 (COOP/COEP 헤더 적용) 즉시 예열 시작
    // → 사용자가 "만들기" 버튼 클릭 시 FFmpeg가 이미 초기화돼 있어 즉시 렌더링 가능
    if (window.crossOriginIsolated) {
      const { setFfmpegReady, setFfmpegWarmMsg } = useVideoStore.getState();
      setFfmpegWarmMsg('엔진 예열 중... (최초 1회)');
      warmupFFmpeg((msg) => {
        if (msg?.startsWith('✅')) {
          setFfmpegReady(true);
          setFfmpegWarmMsg('');
        } else {
          setFfmpegWarmMsg(msg || '');
        }
      });
    }
  }, []);

  return (
    <div className="app-root">
      <Header activeTab={activeTab} onTabChange={setActiveTab} tabs={APP_TABS} />

      {/* FFmpeg 엔진 예열 상태 배너 */}
      {ffmpegWarmMsg && !ffmpegReady && (
        <div style={{
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '8px', margin: '8px 12px 0', padding: '7px 12px',
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#c084fc',
        }}>
          <i className="fas fa-spinner fa-spin" style={{ flexShrink: 0 }} />
          <span>{ffmpegWarmMsg}</span>
          <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '0.68rem' }}>
            (두 번째 접속부터 즉시 시작)
          </span>
        </div>
      )}
      {ffmpegReady && (
        <div style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: '8px', margin: '8px 12px 0', padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#34d399',
          animation: 'fadeIn 0.4s ease',
        }}>
          <i className="fas fa-check-circle" />
          <span>🎬 시네마틱 렌더링 엔진 준비 완료</span>
        </div>
      )}

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

