// src/components/RenderProgressBar.jsx
// 렌더링 진행률 UI — Electron IPC 실시간 연동 (#61-63)
// · 진행률 바 + 로그 터미널 + 취소/일시정지/재개 버튼
import { useState, useEffect, useRef } from 'react';

/**
 * @param {{ jobId: string|null, onClose: ()=>void }} props
 */
export default function RenderProgressBar({ jobId, onClose }) {
  const [pct, setPct]       = useState(0);
  const [logs, setLogs]     = useState([]);
  const [status, setStatus] = useState('idle'); // idle | running | paused | done | error
  const [elapsed, setElapsed] = useState(0);
  const logRef  = useRef(null);
  const timerRef = useRef(null);
  const startTs  = useRef(Date.now());

  const api = typeof window !== 'undefined' ? window.electronAPI : null;

  useEffect(() => {
    if (!api || !jobId) return;

    startTs.current = Date.now();
    setStatus('running');

    // 경과 시간 타이머
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTs.current) / 1000));
    }, 1000);

    // 진행률 구독
    const unsubProgress = api.onRenderProgress(({ pct: p, msg, jobId: jid }) => {
      if (jid && jid !== jobId) return;
      setPct(Math.max(0, Math.min(100, Math.round(p))));
      if (msg) setLogs(prev => [...prev.slice(-199), `[${new Date().toLocaleTimeString()}] ${msg}`]);
      if (p >= 100) {
        setStatus('done');
        clearInterval(timerRef.current);
      }
    });

    // FFmpeg 로그 스트림 구독
    const unsubLog = api.onRenderLog?.((line) => {
      setLogs(prev => [...prev.slice(-199), line]);
    });

    return () => {
      unsubProgress?.();
      unsubLog?.();
      clearInterval(timerRef.current);
    };
  }, [jobId, api]);

  // 로그 자동 스크롤
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleCancel = async () => {
    if (!api?.cancelRender || !jobId) return;
    await api.cancelRender(jobId);
    setStatus('error');
    clearInterval(timerRef.current);
  };

  const handlePause = async () => {
    if (!api?.pauseRender || !jobId) return;
    await api.pauseRender(jobId);
    setStatus('paused');
  };

  const handleResume = async () => {
    if (!api?.resumeRender || !jobId) return;
    await api.resumeRender(jobId);
    setStatus('running');
  };

  const statusColor = {
    idle:    '#888',
    running: '#4ade80',
    paused:  '#fbbf24',
    done:    '#60a5fa',
    error:   '#f87171',
  }[status] || '#888';

  const statusLabel = {
    idle:    '대기 중',
    running: '렌더링 중',
    paused:  '일시정지',
    done:    '완료',
    error:   '취소/오류',
  }[status] || '';

  if (!jobId && status === 'idle') return null;

  return (
    <div style={{
      background: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: 12,
      padding: '16px 20px',
      marginTop: 16,
      color: '#e0e0e0',
      fontFamily: 'monospace',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          🎬 렌더링&nbsp;
          <span style={{ color: statusColor, fontSize: 12 }}>● {statusLabel}</span>
        </span>
        <span style={{ fontSize: 12, color: '#aaa' }}>경과: {fmtTime(elapsed)}</span>
      </div>

      {/* 진행률 바 */}
      <div style={{ background: '#0f0f2a', borderRadius: 6, height: 16, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${statusColor}, #a78bfa)`,
          transition: 'width 0.3s ease',
          borderRadius: 6,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
        <span>{pct}%</span>
        {status === 'done' && <span style={{ color: '#60a5fa' }}>✓ 렌더링 완료</span>}
      </div>

      {/* 컨트롤 버튼 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {status === 'running' && (
          <button onClick={handlePause} style={btnStyle('#fbbf24')}>⏸ 일시정지</button>
        )}
        {status === 'paused' && (
          <button onClick={handleResume} style={btnStyle('#4ade80')}>▶ 재개</button>
        )}
        {(status === 'running' || status === 'paused') && (
          <button onClick={handleCancel} style={btnStyle('#f87171')}>✕ 취소</button>
        )}
        {(status === 'done' || status === 'error') && (
          <button onClick={onClose} style={btnStyle('#60a5fa')}>닫기</button>
        )}
      </div>

      {/* 로그 터미널 */}
      <div
        ref={logRef}
        style={{
          background: '#0a0a1a',
          borderRadius: 6,
          padding: '8px 10px',
          height: 140,
          overflowY: 'auto',
          fontSize: 11,
          color: '#7dd3fc',
          lineHeight: 1.5,
        }}
      >
        {logs.length === 0
          ? <span style={{ color: '#555' }}>FFmpeg 로그가 여기 표시됩니다...</span>
          : logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
  };
}
