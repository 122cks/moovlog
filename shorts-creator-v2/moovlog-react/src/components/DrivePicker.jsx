// src/components/DrivePicker.jsx
// v2.51: Google Picker(iframe/popup) → Drive REST API 직접 브라우저로 교체
//   COOP same-origin이 docs.google.com 팝업 통신을 차단하는 문제 해결
import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useVideoStore } from '../store/videoStore.js';
import { saveToken, loadToken, clearToken } from '../engine/AuthService.js';

const DRIVE_ICON = (
  <svg width="16" height="14" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);

const DRIVE_Q = "(mimeType='image/png' or mimeType='image/jpeg' or mimeType='image/jpg' or mimeType='image/webp' or mimeType='video/mp4' or mimeType='video/quicktime' or mimeType='video/x-m4v') and trashed=false";

async function listDriveFiles(accessToken, pageToken = null, nameFilter = '') {
  let q = DRIVE_Q;
  if (nameFilter.trim()) q += ` and name contains '${nameFilter.replace(/'/g, "\\'")}'`;
  const params = new URLSearchParams({
    q,
    fields: 'nextPageToken,files(id,name,mimeType,thumbnailLink,size)',
    pageSize: '50',
    orderBy: 'modifiedTime desc',
  });
  if (pageToken) params.set('pageToken', pageToken);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) throw Object.assign(new Error('TOKEN_EXPIRED'), { code: 401 });
  if (!res.ok) throw new Error(`Drive API 오류 (${res.status})`);
  return res.json();
}

function DriveBrowserModal({ accessToken, onClose, onConfirm, addToast }) {
  const [driveFiles, setDriveFiles] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);
  const lastFilter = useRef('');
  const lastClickedIdx = useRef(null); // Shift 다중 선택용 마지막 클릭 인덱스

  const loadFiles = useCallback(async (reset, nameFilter) => {
    setListLoading(true);
    try {
      const pageToken = reset ? null : nextPageToken;
      const result = await listDriveFiles(accessToken, pageToken, nameFilter);
      setDriveFiles(prev => reset ? (result.files || []) : [...prev, ...(result.files || [])]);
      setNextPageToken(result.nextPageToken || null);
    } catch (err) {
      addToast(err.message || 'Drive 파일 목록 오류', 'err');
    } finally {
      setListLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, nextPageToken]);

  useEffect(() => { loadFiles(true, ''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id, idx, e) => {
    if (e?.shiftKey && lastClickedIdx.current !== null && lastClickedIdx.current !== idx) {
      // Shift 클릭: lastClickedIdx ~ idx 범위 전체 선택/해제
      const from = Math.min(lastClickedIdx.current, idx);
      const to   = Math.max(lastClickedIdx.current, idx);
      const rangeIds = driveFiles.slice(from, to + 1).map(f => f.id);
      setSelected(prev => {
        const next = new Set(prev);
        // 현재 클릭 항목이 이미 선택돼 있으면 범위 해제, 아니면 범위 선택
        const shouldSelect = !prev.has(id);
        rangeIds.forEach(rid => { shouldSelect ? next.add(rid) : next.delete(rid); });
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
    lastClickedIdx.current = idx;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    lastFilter.current = search;
    loadFiles(true, search);
  };

  const handleConfirm = async () => {
    const picked = driveFiles.filter(f => selected.has(f.id));
    if (!picked.length) { addToast('선택된 파일이 없습니다.', 'err'); return; }
    setDownloading(true);
    addToast(`${picked.length}개 파일 다운로드 중...`, 'inf');
    try {
      const files = await Promise.all(picked.map(async (doc) => {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error(`'${doc.name}' 다운로드 실패 (${res.status})`);
        const blob = await res.blob();
        if (!blob.size) throw new Error(`'${doc.name}' 공유 권한을 확인하세요.`);
        return new File([blob], doc.name, { type: doc.mimeType || blob.type });
      }));
      onConfirm(files);
    } catch (err) {
      addToast(err.message || '다운로드 중 오류 발생', 'err');
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#1a1a2e', borderRadius: 16, width: 'min(96vw, 560px)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* 헤더 */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
            {DRIVE_ICON} &nbsp;Google Drive 파일 선택
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
        </div>
        {/* 검색 */}
        <form onSubmit={handleSearch} style={{ padding: '10px 18px', display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="파일명 검색..."
            style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 8, padding: '7px 11px', color: '#fff', fontSize: '0.8rem' }}
          />
          <button type="submit" style={{ background: '#7c3aed', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>검색</button>
        </form>
        {/* 파일 그리드 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
          {listLoading && driveFiles.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', padding: '30px 0', fontSize: '0.82rem' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />불러오는 중...
            </p>
          )}
          {!listLoading && driveFiles.length === 0 && (
            <p style={{ color: '#666', textAlign: 'center', padding: '30px 0', fontSize: '0.82rem' }}>파일이 없습니다</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
            {driveFiles.map((file, idx) => {
              const isSel = selected.has(file.id);
              const isVid = file.mimeType?.startsWith('video/');
              return (
                <button
                  key={file.id}
                  onClick={e => toggleSelect(file.id, idx, e)}
                  style={{ background: isSel ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)', border: `2px solid ${isSel ? '#7c3aed' : 'transparent'}`, borderRadius: 10, padding: 5, cursor: 'pointer', textAlign: 'left', position: 'relative', transition: 'all 0.12s' }}
                >
                  {isSel && (
                    <div style={{ position: 'absolute', top: 3, right: 3, background: '#7c3aed', borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', color: '#fff', zIndex: 1 }}>✓</div>
                  )}
                  <div style={{ width: '100%', aspectRatio: '1', background: '#222', borderRadius: 6, marginBottom: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {file.thumbnailLink
                      ? <img src={file.thumbnailLink} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" referrerPolicy="no-referrer" />
                      : <span style={{ fontSize: '1.4rem' }}>{isVid ? '🎬' : '🖼️'}</span>
                    }
                  </div>
                  <p style={{ margin: 0, fontSize: '0.6rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{file.name}</p>
                </button>
              );
            })}
          </div>
          {nextPageToken && !listLoading && (
            <button
              onClick={() => loadFiles(false, lastFilter.current)}
              style={{ display: 'block', margin: '12px auto 0', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 20px', color: '#ccc', cursor: 'pointer', fontSize: '0.78rem' }}
            >더 불러오기</button>
          )}
          {listLoading && driveFiles.length > 0 && (
            <p style={{ color: '#888', textAlign: 'center', padding: '10px 0', fontSize: '0.78rem' }}><i className="fas fa-spinner fa-spin" /></p>
          )}
        </div>
        {/* 하단 */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#888', fontSize: '0.76rem' }}>{selected.size > 0 ? `${selected.size}개 선택됨` : '파일을 클릭해서 선택하세요 (Shift+클릭: 범위 선택)'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid #444', borderRadius: 8, padding: '7px 14px', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem' }}>취소</button>
            <button
              onClick={handleConfirm}
              disabled={!selected.size || downloading}
              style={{ background: selected.size && !downloading ? '#7c3aed' : '#444', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', cursor: selected.size ? 'pointer' : 'not-allowed', fontSize: '0.8rem' }}
            >{downloading ? '다운로드 중...' : `${selected.size || 0}개 추가`}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true; s.defer = true;
    s.onload = resolve; s.onerror = resolve;
    document.body.appendChild(s);
  });
}

export default function DrivePicker({ addFiles: addFilesProp }) {
  const [ready, setReady] = useState(false);
  const [modalToken, setModalToken] = useState(null); // null = 닫힘, string = 열림
  const tokenClientRef = useRef(null);
  const clientIdRef    = useRef('');

  const { addFilesAsync: storeAddFilesAsync, addToast } = useVideoStore();
  const addFiles = addFilesProp || storeAddFilesAsync;

  useEffect(() => {
    loadScript('https://accounts.google.com/gsi/client').then(() => setReady(true));
  }, []);

  const getClientId = () => {
    const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (envId) return envId.trim();
    let id = localStorage.getItem('moovlog_google_client_id') || '';
    if (!id) {
      id = prompt(
        'Google OAuth 클라이언트 ID를 입력하세요.\n(GCP 콘솔 > 사용자 인증 정보 > OAuth 클라이언트 ID)\n예: 123456789-abc.apps.googleusercontent.com',
        ''
      ) || '';
      if (id) localStorage.setItem('moovlog_google_client_id', id.trim());
    }
    return id.trim();
  };

  const requestNewToken = (clientId) => {
    // 매번 새로운 클라이언트 생성 — 만료/재시도 시 stale 상태 방지
    clientIdRef.current = clientId;
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (resp) => {
        if (resp.error) {
          clearToken();
          if (resp.error === 'redirect_uri_mismatch' || resp.error === 'idpiframe_initialization_failed') {
            addToast('GCP 콘솔 "Authorized JavaScript origins"에 https://122cks.github.io 를 추가하세요.', 'err');
          } else if (resp.error !== 'popup_closed_by_user' && resp.error !== 'access_denied') {
            addToast('Google 로그인 실패: ' + resp.error, 'err');
          }
          return;
        }
        saveToken(resp.access_token);
        setModalToken(resp.access_token);
      },
    });
    tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
  };

  const handleClick = () => {
    if (!ready) { addToast('Google API 로딩 중...', 'inf'); return; }
    const clientId = getClientId();
    if (!clientId) { addToast('클라이언트 ID가 필요합니다.', 'err'); return; }

    // FFmpeg 보안 모드(COOP) 활성 시 Google 로그인 팝업이 차단될 수 있음
    if (globalThis.crossOriginIsolated) {
      addToast('FFmpeg 보안 모드 활성화 상태입니다. 로그인이 안 되면 새 탭에서 페이지를 다시 열어주세요.', 'inf');
    }

    const validToken = loadToken();
    if (validToken) {
      setModalToken(validToken);
      return;
    }
    requestNewToken(clientId);
  };

  const handleConfirm = (files) => {
    addFiles(files);
    addToast(`${files.length}개 파일을 드라이브에서 추가했습니다!`, 'ok');
    setModalToken(null);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="drive-import-btn"
        title="Google Drive에서 사진/영상 불러오기"
      >
        <svg width="18" height="15" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
        </svg>
        드라이브에서 가져오기
      </button>
      {modalToken && (
        <DriveBrowserModal
          accessToken={modalToken}
          onClose={() => setModalToken(null)}
          onConfirm={handleConfirm}
          addToast={addToast}
        />
      )}
    </>
  );
}
