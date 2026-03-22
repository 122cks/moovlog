// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker 등록 — COOP/COEP 헤더 주입 + 첫 활성화 시 한 번 리로드
// GitHub Pages는 커스텀 헤더 불가 → SW가 document 응답에 헤더를 추가함
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: '/moovlog/shorts-creator/' })
      .then(reg => {
        // 이미 격리된 경우 처리 불필요
        if (window.crossOriginIsolated) return;

        // SW 활성화 후 COOP/COEP 헤더를 받으려면 페이지 리로드 필요
        // sessionStorage로 무한 루프 방지
        const doReload = () => {
          if (!window.crossOriginIsolated && !sessionStorage.getItem('_coi_r')) {
            sessionStorage.setItem('_coi_r', '1');
            location.reload();
          }
        };

        if (reg.active) {
          // SW가 이미 활성 상태인데도 격리 안 됨 → 리로드
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
