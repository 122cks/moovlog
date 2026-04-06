// src/components/SystemMonitor.jsx
// CPU/메모리/렌더링 큐 모니터링 대시보드 (#78-80, Electron 전용)
import { useState, useEffect, useRef } from 'react';

/**
 * Electron 환경에서만 실제 데이터를 표시
 * 웹 환경에서는 숨겨진 상태로 렌더링
 */
export default function SystemMonitor({ collapsed = false }) {
  const [stats,    setStats]    = useState(null);
  const [history,  setHistory]  = useState([]);  // CPU% 히스토리 (최대 20개)
  const [visible,  setVisible]  = useState(!collapsed);
  const intervalRef = useRef(null);

  const api = typeof window !== 'undefined' ? window.electronAPI : null;

  useEffect(() => {
    if (!api?.systemStats) return;

    const fetch = async () => {
      try {
        const s = await api.systemStats();
        if (!s) return;
        setStats(s);
        const cpuPct = s.cpu?.usage ?? 0;
        setHistory(prev => [...prev.slice(-19), cpuPct]);
      } catch { /* ignore */ }
    };

    fetch();
    intervalRef.current = setInterval(fetch, 3000);
    return () => clearInterval(intervalRef.current);
  }, [api]);

  // Electron 없으면 미표시
  if (!api?.systemStats) return null;

  const memPct = stats
    ? Math.round(((stats.mem?.total - stats.mem?.free) / stats.mem?.total) * 100)
    : 0;

  const fmtMB = (bytes) => bytes ? `${(bytes / 1024 / 1024).toFixed(0)}MB` : '-';

  const sparkLine = (data, width = 80, height = 28) => {
    if (!data.length) return null;
    const max  = Math.max(...data, 10);
    const step = width / (data.length - 1 || 1);
    const pts  = data.map((v, i) => `${i * step},${height - (v / max) * height}`).join(' ');
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="1.5" />
      </svg>
    );
  };

  return (
    <div style={styles.container}>
      {/* 헤더 (클릭으로 접기) */}
      <div style={styles.header} onClick={() => setVisible(v => !v)}>
        <span style={styles.title}>📊 시스템 모니터</span>
        <span style={{ color: '#666', fontSize: 12 }}>{visible ? '▲' : '▼'}</span>
      </div>

      {visible && (
        <div style={styles.body}>
          {!stats ? (
            <div style={styles.loading}>데이터 로딩 중...</div>
          ) : (
            <>
              {/* CPU */}
              <div style={styles.row}>
                <div style={styles.rowLeft}>
                  <div style={styles.label}>CPU</div>
                  <div style={styles.value}>{stats.cpu?.usage?.toFixed(1) ?? 0}%</div>
                  <div style={styles.sub}>{stats.cpu?.model?.split('@')[0]?.trim() || '알 수 없음'}</div>
                  <div style={styles.sub}>{stats.cpu?.cores}코어 · {stats.cpu?.threads}스레드</div>
                </div>
                <div>
                  {sparkLine(history)}
                  <div style={{ fontSize: 10, color: '#555', textAlign: 'right', marginTop: 2 }}>최근 60초</div>
                </div>
              </div>

              {/* 메모리 */}
              <div style={styles.divider} />
              <div style={styles.row}>
                <div style={styles.rowLeft}>
                  <div style={styles.label}>메모리</div>
                  <div style={styles.value}>{memPct}%</div>
                  <div style={styles.sub}>
                    사용: {fmtMB(stats.mem?.total - stats.mem?.free)} / {fmtMB(stats.mem?.total)}
                  </div>
                </div>
                <BarMeter value={memPct} color={memPct > 85 ? '#f87171' : '#4ade80'} />
              </div>

              {/* 렌더링 큐 */}
              {stats.renderQueue !== undefined && (
                <>
                  <div style={styles.divider} />
                  <div style={styles.row}>
                    <div style={styles.rowLeft}>
                      <div style={styles.label}>렌더 큐</div>
                      <div style={styles.value}>{stats.renderQueue ?? 0}개</div>
                      <div style={styles.sub}>{stats.activeJob ? '렌더링 진행 중' : '대기 중'}</div>
                    </div>
                    <div style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: stats.activeJob ? '#4ade80' : '#555',
                      marginTop: 4,
                      boxShadow: stats.activeJob ? '0 0 6px #4ade80' : 'none',
                    }} />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BarMeter({ value, color }) {
  return (
    <div style={{ width: 80, textAlign: 'right' }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: 3,
        height: 8,
        overflow: 'hidden',
        marginBottom: 4,
      }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: color,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ fontSize: 11, color: '#666' }}>{value}%</div>
    </div>
  );
}

const styles = {
  container: {
    background: '#0f0f1a',
    border: '1px solid #1a1a3a',
    borderRadius: 12,
    overflow: 'hidden',
    color: '#e0e0e0',
    fontSize: 13,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    background: '#0d0d1e',
    borderBottom: '1px solid #1a1a3a',
  },
  title: { fontWeight: 700, fontSize: 14 },
  body: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  loading: { color: '#666', fontSize: 12, textAlign: 'center', padding: '8px 0' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  rowLeft: { flex: 1 },
  label: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 },
  value: { fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#fff' },
  sub:   { fontSize: 11, color: '#888', marginTop: 3 },
  divider: { height: 1, background: '#1a1a3a', margin: '4px 0' },
};
