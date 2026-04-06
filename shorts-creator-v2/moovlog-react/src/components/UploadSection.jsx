// src/components/UploadSection.jsx
import { useCallback, useRef, useState, useEffect } from 'react';
import { useVideoStore, TEMPLATE_NAMES, TEMPLATE_HINTS, RESTAURANT_TYPES } from '../store/videoStore.js';
import { startMake } from '../engine/pipeline.js';
import { setGeminiKey } from '../engine/gemini.js';
import { setTypeCastKeys } from '../engine/tts.js';
import { getMarketingKits, searchMarketingKits } from '../engine/firebase.js';
import { saveDraft, loadDraft, loadDriveSession, clearDriveSession, loadLastResult, clearLastResult } from '../engine/sessionPersistence.js';
import { loadToken } from '../engine/AuthService.js';
import DrivePicker from './DrivePicker.jsx';
import PromptInput from './PromptInput.jsx';

// ── 이전 마케팅 키트 탭 패널 (버튼 → 모달) ────────────────
function KitTabsPanel({ kit, addToast }) {
  const [openTab, setOpenTab] = useState(null);
  const TABS = [
    { id: 'insta',   label: '인스타',  color: '#e1306c', val: kit.instagramCaption },
    { id: 'nclip',   label: 'N클립',   color: '#03c75a', val: kit.naverClipTags },
    { id: 'shorts',  label: '쇼츠',    color: '#ff0000', val: kit.youtubeShortsTags },
    { id: 'tiktok',  label: '틱톡',    color: '#6fc2f5', val: kit.tiktokTags },
    { id: 'receipt', label: 'N영수증', color: '#03c75a', val: kit.receiptReview },
    { id: 'tags',    label: '#태그',   color: '#a855f7', val: kit.hashtags30 },
  ].filter(t => t.val?.trim());

  if (!TABS.length) return <p style={{ color: '#666', fontSize: '0.75rem', fontStyle: 'italic', margin: 0 }}>저장된 태그 데이터가 없습니다</p>;

  const active = TABS.find(t => t.id === openTab);
  return (
    <div style={{ padding: '4px 14px 12px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setOpenTab(t.id)}
            style={{
              background: t.color + '22', border: `1px solid ${t.color}66`,
              borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
              color: t.color, fontWeight: 700, fontSize: '0.78rem',
            }}
          >{t.label}</button>
        ))}
      </div>
      {active && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setOpenTab(null)}
        >
          <div
            style={{ background: '#1a1a1a', borderRadius: 16, width: '100%', maxWidth: 460, padding: 20, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 800, color: active.color, fontSize: '0.95rem' }}>{active.label}</span>
              <button onClick={() => setOpenTab(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8rem', color: '#eee', flex: 1, overflowY: 'auto', lineHeight: 1.7, margin: 0 }}>{active.val}</pre>
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(active.val); addToast(`${active.label} 복사 완료 ✨`, 'ok'); }
                catch { addToast('복사 실패', 'err'); }
              }}
              style={{ marginTop: 14, background: active.color, border: 'none', borderRadius: 10, padding: 10, cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.85rem', width: '100%' }}
            >복사하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UploadSection() {
  const {
    files, addFiles, addFilesAsync, removeFile, restaurantName, setRestaurantName,
    selectedTemplate, setTemplate, aspectRatio, setAspectRatio,
    restaurantType, setRestaurantType,
    requiredKeywords, setRequiredKeywords,
    selectedHook, setHook, userPrompt, setUserPrompt,
    setScript, setQcScore, setShowResult,
    addToast, showResult,
  } = useVideoStore();

  const fileInputRef = useRef();
  const dropRef      = useRef();
  const kitListRef   = useRef();   // 마케팅 키트 목록 스크롤 컨테이너
  const itemRefs     = useRef({}); // 각 아코디언 아이템 ref
  const saveDraftTimer = useRef(null);

  // 마케팅 키트 이력
  const [kitHistory,   setKitHistory]   = useState([]);
  const [kitSearch,    setKitSearch]    = useState('');
  const [kitLoading,   setKitLoading]   = useState(false);
  const [selectedKit,  setSelectedKit]  = useState(null); // 펼쳐볼 키트

  // 이어하기 세션
  const [driveResume, setDriveResume] = useState(null);  // Drive 파일 메타데이터
  const [prevResult,  setPrevResult]  = useState(null);  // 이전 생성 결과

  const loadKits = useCallback(async (kw = '') => {
    setKitLoading(true);
    setSelectedKit(null);
    try {
      const r = kw.trim() ? await searchMarketingKits(kw.trim()) : await getMarketingKits(20);
      setKitHistory(r);
    } catch { /* Firebase 미연결 시 조용히 실패 */ }
    finally { setKitLoading(false); }
  }, []);

  useEffect(() => { loadKits(); }, [loadKits]);

  // 마운트 시: 폼 초안 복원 + 이전 Drive/결과 세션 확인
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      if (draft.restaurantName)  setRestaurantName(draft.restaurantName);
      if (draft.restaurantType)  setRestaurantType(draft.restaurantType);
      if (draft.selectedTemplate) setTemplate(draft.selectedTemplate);
      if (draft.selectedHook)    setHook(draft.selectedHook);
      if (draft.aspectRatio)     setAspectRatio(draft.aspectRatio);
      if (draft.userPrompt)      setUserPrompt(draft.userPrompt);
      if (draft.requiredKeywords) setRequiredKeywords(draft.requiredKeywords);
    }
    const driveSession = loadDriveSession();
    if (driveSession?.files?.length) setDriveResume(driveSession);

    const lastResult = loadLastResult();
    if (lastResult?.script) setPrevResult(lastResult);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 폼 상태 자동 저장 (600ms debounce)
  useEffect(() => {
    clearTimeout(saveDraftTimer.current);
    saveDraftTimer.current = setTimeout(() => {
      saveDraft({ restaurantName, restaurantType, selectedTemplate, selectedHook, aspectRatio, userPrompt, requiredKeywords });
    }, 600);
    return () => clearTimeout(saveDraftTimer.current);
  }, [restaurantName, restaurantType, selectedTemplate, selectedHook, aspectRatio, userPrompt, requiredKeywords]);

  // ResultScreen에서 돌아올 때(showResult: true→false) 최신 키트 자동 새로고침
  const prevShowResult = useRef(false);
  useEffect(() => {
    if (prevShowResult.current && !showResult) {
      loadKits(kitSearch);
    }
    prevShowResult.current = showResult;
  }, [showResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drive 파일 재다운로드 ────────────────────────────────
  const handleReDriveDownload = useCallback(async (driveFiles) => {
    const token = loadToken();
    if (!token) {
      addToast('Google Drive 재로그인이 필요합니다. Drive 버튼을 눌러 로그인하세요.', 'inf');
      return;
    }
    addToast(`Drive에서 ${driveFiles.length}개 파일 다시 불러오는 중...`, 'inf');
    try {
      const downloaded = await Promise.all(driveFiles.map(async (doc) => {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}?alt=media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.status === 401) throw new Error('Drive 토큰 만료 — Drive 버튼으로 재로그인하세요.');
        if (!res.ok) throw new Error(`'${doc.name}' 다운로드 실패 (${res.status})`);
        const blob = await res.blob();
        return new File([blob], doc.name, { type: doc.mimeType || blob.type });
      }));
      await (addFilesAsync || addFiles)(downloaded);
      addToast(`${downloaded.length}개 파일 복원 완료 ✅`, 'ok');
    } catch (err) {
      addToast(err.message || 'Drive 파일 복원 실패 — Drive 버튼으로 다시 선택해주세요.', 'err');
    }
  }, [addFiles, addFilesAsync, addToast]);

  // ── 이전 결과 복원 ───────────────────────────────────────
  const handleRestoreResult = useCallback((saved) => {
    if (saved.restaurantName) setRestaurantName(saved.restaurantName);
    if (saved.script) setScript(saved.script);
    if (typeof saved.qcScore === 'number') setQcScore(saved.qcScore);
    setShowResult(true);
    addToast(`「${saved.restaurantName}」 이전 결과를 불러왔습니다 ✅`, 'ok');
  }, [setRestaurantName, setScript, setQcScore, setShowResult, addToast]);

  // ── 드래그앤드롭 ─────────────────────────────────────────
  const onDragOver  = useCallback(e => { e.preventDefault(); dropRef.current?.classList.add('over'); }, []);
  const onDragLeave = useCallback(() => dropRef.current?.classList.remove('over'), []);
  const onDrop      = useCallback(e => {
    e.preventDefault();
    dropRef.current?.classList.remove('over');
    addFiles([...e.dataTransfer.files]);
  }, [addFiles]);

  const onFileChange = useCallback(e => {
    addFiles([...e.target.files]);
    e.target.value = '';
  }, [addFiles]);

  // ── API 키 설정 (설정 아이콘 클릭) ──────────────────────
  const handleSetKey = useCallback(() => {
    const key = prompt('Gemini API 키를 입력하세요:',
      localStorage.getItem('moovlog_gemini_key') || '');
    if (key !== null) {
      localStorage.setItem('moovlog_gemini_key', key);
      setGeminiKey(key);
      addToast('Gemini API 키 저장 완료', 'ok');
    }

    // TypeCast 키 8개 입력
    const existingKeys = [1,2,3,4,5,6,7,8]
      .map(n => localStorage.getItem(`moovlog_typecast_key${n > 1 ? n : ''}`) || '')
      .join('\n');
    const tcInput = prompt(
      'TypeCast API 키를 입력하세요 (한 줄에 하나씩, 여러 줄 또는 콤마 구분 가능, 최대 8개):',
      existingKeys
    );
    if (tcInput !== null) {
      // 콤마 또는 줄바꽔으로 구분하여 개별 키 배열 생성
      const parsed = tcInput
        .split(/[,\n]/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 8);
      parsed.forEach((k, i) => {
        const lsName = `moovlog_typecast_key${i > 0 ? i + 1 : ''}`;
        localStorage.setItem(lsName, k);
      });
      // 사용하지 않는 키 슬롯 코사
      for (let i = parsed.length + 1; i <= 8; i++) {
        localStorage.removeItem(`moovlog_typecast_key${i > 1 ? i : ''}`);
      }
      setTypeCastKeys(parsed);
      addToast(`TypeCast 키 ${parsed.length}개 로테이션 설정 완료 ✅`, 'ok');
    }
  }, [addToast]);

  const RATIOS = [
    { value: '9:16', icon: 'fa-mobile-alt', label: '9:16 쇼츠' },
    { value: '1:1',  icon: 'fa-instagram',  label: '1:1 피드',  fab: true },
    { value: '16:9', icon: 'fa-tv',          label: '16:9 유튜브' },
  ];

  const TEMPLATES = Object.entries(TEMPLATE_NAMES).filter(([k]) => k !== 'auto');

  return (
    <main className="app-main">

      {/* ── 이어서 진행 패널 ───────────────────────────────── */}
      {(driveResume || prevResult) && (
        <div className="card" style={{ marginBottom: 14, border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.07)', padding: '12px 16px' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '0.88rem', color: '#c4b5fd' }}>
            <i className="fas fa-redo-alt" style={{ marginRight: 6 }} />이전 작업 이어서 진행
          </p>
          {driveResume && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
              <svg width="14" height="12" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span style={{ flex: 1, fontSize: '0.81rem', color: '#ccc' }}>
                Drive {driveResume.files.length}개 파일 — {driveResume.files.slice(0, 2).map(f => f.name).join(', ')}{driveResume.files.length > 2 ? ` 외 ${driveResume.files.length - 2}개` : ''}
              </span>
              <button
                onClick={() => handleReDriveDownload(driveResume.files)}
                style={{ background: '#4285F4', border: 'none', borderRadius: 8, padding: '6px 13px', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
              >다시 불러오기</button>
              <button
                onClick={() => { clearDriveSession(); setDriveResume(null); }}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.95rem', lineHeight: 1 }}
                title="이 항목 숨기기"
              >✕</button>
            </div>
          )}
          {prevResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: driveResume ? '1px solid rgba(255,255,255,0.07)' : 'none', marginTop: driveResume ? 8 : 0 }}>
              <i className="fas fa-film" style={{ color: '#a78bfa', fontSize: '1rem', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.81rem', color: '#ccc' }}>
                {prevResult.restaurantName} — 이전 생성 결과
                {typeof prevResult.qcScore === 'number' ? ` (QC ${prevResult.qcScore}/100)` : ''}
              </span>
              <button
                onClick={() => handleRestoreResult(prevResult)}
                style={{ background: '#7c3aed', border: 'none', borderRadius: 8, padding: '6px 13px', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
              >결과 복원</button>
              <button
                onClick={() => { clearLastResult(); setPrevResult(null); }}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.95rem', lineHeight: 1 }}
                title="이 항목 숨기기"
              >✕</button>
            </div>
          )}
        </div>
      )}

      {/* 화면 비율 선택 */}
      <div className="ratio-row">
        {RATIOS.map(r => (
          <button
            key={r.value}
            className={`ratio-btn ${aspectRatio === r.value ? 'active' : ''}`}
            onClick={() => setAspectRatio(r.value)}
          >
            <i className={`${r.fab ? 'fab' : 'fas'} ${r.icon}`} /> {r.label}
          </button>
        ))}
      </div>

      {/* 업로드 영역 */}
      <section className="card" id="secUpload">
        <div className="card-label">
          <span className="num">01</span>
          <div>
            <h2>이미지 · 영상 업로드</h2>
            <p>사진와 영상 클립을 올려주세요 (업로드 최다 50개를 모두 사용함)</p>
          </div>
        </div>

        <div
          ref={dropRef}
          className="drop-area"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-icon"><i className="fas fa-cloud-upload-alt" /></div>
          <p className="drop-text">여기에 끌어다 놓거나</p>
          <span className="pick-btn">
            <i className="fas fa-folder-open" /> 파일 선택
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={onFileChange}
          />
          <p className="drop-hint">JPG · PNG · MP4 · MOV · 최다 50개</p>
        </div>

        <div className="drive-row">
          <DrivePicker />
        </div>

        {/* 썸네일 그리드 */}
        {files.length > 0 && (
          <div className="thumb-grid">
            {files.map((m, i) => (
              <div key={i} className="ti">
                {m.type === 'image'
                  ? <img src={m.url} alt="" />
                  : <video src={m.url} muted playsInline />
                }
                <span className="ti-badge">{i + 1}</span>
                <button
                  className="ti-remove"
                  onClick={e => { e.stopPropagation(); removeFile(i); }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 음식점 이름 입력 */}
      <div className="name-card">
        <div className="name-row">
          <i className="fas fa-store name-icon" />
          <input
            type="text"
            className="name-input"
            placeholder="음식점 이름 입력 (예: 을지로 돈부리집)"
            maxLength={40}
            value={restaurantName}
            onChange={e => setRestaurantName(e.target.value)}
          />
          <button className="key-btn" onClick={handleSetKey} title="API 키 설정">
            <i className="fas fa-key" />
          </button>
        </div>
        <p className="ai-auto-hint">
          <i className="fas fa-sparkles" /> AI가 이미지를 분석해 최적의 스타일 · 훅 · 템플릿을 자동 선택합니다
        </p>
      </div>

      {/* 업체 유형 선택 — Step 0: 파이프라인 유형 분류단계 */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            🏪 업체 유형 선택
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>— 유형별 최신 쇼츠/릴스 스타일로 자동 설계</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {Object.entries(RESTAURANT_TYPES).map(([key, info]) => (
            <button
              key={key}
              className={`tpl-chip ${restaurantType === key ? 'active' : ''}`}
              onClick={() => setRestaurantType(key)}
              title={info.hint || ''}
            >{info.label}</button>
          ))}
        </div>
      </div>

      {/* 템플릿 수동 선택 */}
      <div className="tpl-picker">
        <button
          className={`tpl-chip ${selectedTemplate === 'auto' ? 'active' : ''}`}
          onClick={() => setTemplate('auto')}
        >🤖 AI 자동</button>
        {TEMPLATES.map(([key, name]) => (
          <button
            key={key}
            className={`tpl-chip ${selectedTemplate === key ? 'active' : ''}`}
            onClick={() => setTemplate(key)}
            title={TEMPLATE_HINTS[key] || ''}
          >{name}</button>
        ))}
      </div>

      {/* AI 특별 요청 */}
      <PromptInput />

      {/* 필수 키워드 */}
      <div style={{ marginTop: '12px', width: '100%' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#aaa', fontSize: '0.82rem' }}>
          📌 필수 포함 키워드 <span style={{ color: '#555', fontWeight: '400' }}>(선택 — 주요 SNS 태그에 반드시 포함)</span>
        </label>
        <input
          type="text"
          className="name-input"
          style={{ fontSize: '0.85rem', padding: '9px 12px', width: '100%', boxSizing: 'border-box' }}
          placeholder="예: 부개동맛집, 인천삼겹살, 숙성삼겹살 (쉼표 구분)"
          value={requiredKeywords}
          onChange={e => setRequiredKeywords(e.target.value)}
        />
      </div>

      {/* 생성 버튼 */}
      <button
        className="make-btn"
        onClick={startMake}
        disabled={!files.length || !restaurantName.trim()}
      >
        <span className="make-glow" />
        <i className="fas fa-wand-magic-sparkles" />
        <span>AI 숏폼 자동 생성</span>
      </button>
      <p className="make-hint">이미지 분석 → 스타일 자동 선택 → 스크립트 → 나레이션 → 영상 완성</p>

      {/* 마케팅 키트 이력 */}
      <section className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#ccc' }}>
            <i className="fas fa-history" style={{ marginRight: 6, color: '#a78bfa' }} />
            이전 마케팅 키트
          </p>
          <button
            onClick={() => loadKits(kitSearch)}
            disabled={kitLoading}
            style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            {kitLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-sync-alt" />}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            className="name-input"
            style={{ flex: 1, fontSize: '0.82rem', padding: '7px 12px' }}
            placeholder="음식점 이름으로 검색..."
            value={kitSearch}
            onChange={e => setKitSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadKits(kitSearch)}
          />
          <button className="re-btn" style={{ minWidth: 40 }} onClick={() => loadKits(kitSearch)} disabled={kitLoading}>
            <i className="fas fa-search" />
          </button>
        </div>
        <div ref={kitListRef} style={{ maxHeight: '55vh', overflowY: 'scroll', display: 'flex', flexDirection: 'column', gap: 6, overflowX: 'hidden' }}>
          {kitHistory.length === 0 && !kitLoading && (
            <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '10px 0', fontSize: '0.78rem' }}>
              저장된 마케팅 키트가 없습니다
            </p>
          )}
          {kitHistory.map(item => {
            const isOpen = selectedKit?.id === item.id;
            const dateStr = item.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || '';
            return (
              <div
                key={item.id}
                ref={el => { itemRefs.current[item.id] = el; }}
                style={{ border: `1px solid ${isOpen ? '#7c3aed66' : '#333'}`, borderRadius: 10, overflow: 'hidden', background: isOpen ? 'rgba(124,58,237,0.06)' : '#1e1e1e', transition: 'border-color 0.15s' }}>
                {/* 헤더 행: 클릭하면 토글 */}
                <button
                  onClick={() => {
                    if (isOpen) {
                      setSelectedKit(null);
                    } else {
                      setRestaurantName(item.restaurant || '');
                      setSelectedKit(item);
                      addToast(`「${item.restaurant}」 불러오기 완료`, 'ok');
                      // 열린 아이템으로 자동 스크롤 (컨테이너 내부 scrollTop 직접 조정)
                      setTimeout(() => {
                        const el = itemRefs.current[item.id];
                        const container = kitListRef.current;
                        if (el && container) {
                          const containerRect = container.getBoundingClientRect();
                          const elRect = el.getBoundingClientRect();
                          container.scrollTop += elRect.top - containerRect.top - 8;
                        }
                      }, 80);
                    }
                  }}
                  style={{
                    width: '100%', background: 'none', border: 'none', padding: '9px 14px',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isOpen ? '#c4b5fd' : '#eee' }}>{item.restaurant || '—'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>{dateStr}</span>
                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '0.7rem', color: '#666' }} />
                  </div>
                </button>
                {/* 펼쳐진 내용 — 버튼형 모달 */}
                {isOpen && <KitTabsPanel kit={item} addToast={addToast} />}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
