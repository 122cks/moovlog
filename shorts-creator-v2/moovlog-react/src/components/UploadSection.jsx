// src/components/UploadSection.jsx
import { useCallback, useRef } from 'react';
import { useVideoStore, TEMPLATE_NAMES, TEMPLATE_HINTS } from '../store/videoStore.js';
import { startMake } from '../engine/pipeline.js';
import { setGeminiKey } from '../engine/gemini.js';
import DrivePicker from './DrivePicker.jsx';

export default function UploadSection() {
  const {
    files, addFiles, removeFile, restaurantName, setRestaurantName,
    selectedTemplate, setTemplate, aspectRatio, setAspectRatio,
    addToast,
  } = useVideoStore();

  const fileInputRef = useRef();
  const dropRef      = useRef();

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
      addToast('API 키 저장 완료', 'ok');
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
            <p>사진과 영상 클립을 올려주세요 (최대 10개)</p>
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
          <p className="drop-hint">JPG · PNG · MP4 · MOV</p>
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
    </main>
  );
}
