// src/components/ProjectList.jsx
// Firestore 기반 프로젝트 목록 — 기기 간 공유 (#25-26)
import { useState, useEffect, useCallback } from 'react';
import { loadProjects, saveEDLToFirestore } from '../engine/firebase.js';
import { isFirebaseReady } from '../engine/firebase.js';

/**
 * @param {{
 *   onOpen: (project: object) => void,
 *   currentProjectId: string|null
 * }} props
 */
export default function ProjectList({ onOpen, currentProjectId }) {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error,   setError]       = useState(null);
  const [search,  setSearch]      = useState('');

  const refresh = useCallback(async () => {
    if (!isFirebaseReady()) {
      setError('Firebase 연결 없음 (로컬 모드)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await loadProjects(30);
      setProjects(list);
    } catch (e) {
      setError('프로젝트 목록 로드 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = projects.filter(p =>
    !search || (p.restaurantName || p.restaurant || '').toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (ts) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts * 1000);
    return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const platformIcon = (p) => ({
    electron: '🖥️',
    web:      '🌐',
    native:   '📱',
  }[p] || '❓');

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <span style={styles.title}>📁 프로젝트 목록</span>
        <button onClick={refresh} disabled={loading} style={styles.refreshBtn}>
          {loading ? '⏳' : '🔄'} 새로고침
        </button>
      </div>

      {/* 검색 */}
      <input
        type="text"
        placeholder="식당명 검색..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={styles.search}
      />

      {/* 에러 */}
      {error && <div style={styles.error}>{error}</div>}

      {/* 목록 */}
      {loading ? (
        <div style={styles.empty}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>저장된 프로젝트가 없습니다</div>
      ) : (
        <div style={styles.list}>
          {filtered.map(p => (
            <div
              key={p.id}
              style={{
                ...styles.item,
                ...(p.id === currentProjectId ? styles.itemActive : {}),
              }}
              onClick={() => onOpen(p)}
            >
              <div style={styles.itemLeft}>
                <span style={styles.platformIcon}>{platformIcon(p.platform)}</span>
                <div>
                  <div style={styles.itemName}>{p.restaurantName || p.restaurant || '(이름 없음)'}</div>
                  <div style={styles.itemMeta}>
                    씬 {p.scenes?.length ?? 0}개 &nbsp;·&nbsp; {fmtDate(p.updatedAt)}
                    {p.theme && <> &nbsp;·&nbsp; {p.theme}</>}
                  </div>
                </div>
              </div>
              <button
                style={styles.openBtn}
                onClick={e => { e.stopPropagation(); onOpen(p); }}
              >
                열기 →
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.footer}>
        {isFirebaseReady() ? `${filtered.length}개 프로젝트 (Firebase)` : '로컬 모드'}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#0f0f1a',
    border: '1px solid #2a2a4a',
    borderRadius: 12,
    padding: '16px',
    color: '#e0e0e0',
    minWidth: 280,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontWeight: 700, fontSize: 15 },
  refreshBtn: {
    background: 'transparent',
    border: '1px solid #4a4a8a',
    color: '#a0a0d0',
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  search: {
    width: '100%',
    background: '#1a1a2e',
    border: '1px solid #333',
    borderRadius: 6,
    color: '#e0e0e0',
    padding: '6px 10px',
    fontSize: 13,
    marginBottom: 10,
    boxSizing: 'border-box',
  },
  error: { color: '#f87171', fontSize: 12, marginBottom: 8 },
  empty: { color: '#666', fontSize: 13, textAlign: 'center', padding: '20px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1a1a2e',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'border-color 0.2s',
  },
  itemActive: { borderColor: '#6366f1' },
  itemLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  platformIcon: { fontSize: 18 },
  itemName: { fontWeight: 600, fontSize: 13 },
  itemMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  openBtn: {
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  footer: { fontSize: 11, color: '#555', textAlign: 'right', marginTop: 10 },
};
