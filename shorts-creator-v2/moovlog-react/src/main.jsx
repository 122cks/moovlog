// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker 등록 — COOP/COEP 헤더 주입 + crossOriginIsolated 보장
// GitHub Pages는 커스텀 헤더 불가 → SW가 navigate 응답에 헤더 추가
if (navigator.serviceWorker) {
  window.addEventListener('load', () => {
    const swBase = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker
      .register(`${swBase}sw.js`, { scope: swBase })
      .then(reg => {
        // 이미 격리 완료 → 처리 불필요
        if (window.crossOriginIsolated) {
          sessionStorage.removeItem('_coi_attempts');
          return;
        }

        // 재로드 함수 — 최대 3회 시도로 무한 루프 방지
        const doReload = () => {
          if (window.crossOriginIsolated) return;
          const attempts = parseInt(sessionStorage.getItem('_coi_attempts') || '0', 10);
          if (attempts < 3) {
            sessionStorage.setItem('_coi_attempts', String(attempts + 1));
            location.reload();
          }
        };

        if (reg.active) {
          // SW가 이미 활성 상태인데도 격리 안 됨 → SW가 응답 헤더를 주입하도록 재로드
          doReload();
        } else {
          const sw = reg.installing || reg.waiting;
          if (sw) sw.addEventListener('statechange', e => { if (e.target.state === 'activated') doReload(); });
          navigator.serviceWorker.addEventListener('controllerchange', doReload);
        }
      })
      .catch(() => {});
  });
}
