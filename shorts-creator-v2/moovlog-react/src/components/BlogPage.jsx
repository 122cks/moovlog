// src/components/BlogPage.jsx
// 블로그 포스팅 생성기 페이지 — index2.html을 React로 이식
import { useState, useRef, useCallback } from 'react';
import { generateBlogPost } from '../engine/gemini.js';
import { useVideoStore } from '../store/videoStore.js';

const TABS = [
  { id: 'blog',  label: '📝 블로그 포스팅' },
  { id: 'sns',   label: '📱 SNS 태그' },
  { id: 'guide', label: '🟢 네이버 등록' },
];

export default function BlogPage() {
  const { addToast } = useVideoStore();

  // ── 폼 상태 ──────────────────────────────────────────────
  const [files, setFiles]       = useState([]);   // { file, url, type }[]
  const [name, setName]         = useState('');
  const [location, setLocation] = useState('');
  const [keywords, setKeywords] = useState('');
  const [extra, setExtra]       = useState('');

  // ── 생성 결과 ─────────────────────────────────────────────
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [loadLabel, setLoadLabel] = useState('');
  const [activeTab, setActiveTab] = useState('blog');

  const fileInputRef = useRef();
  const dropRef      = useRef();

  // ── 파일 추가 ─────────────────────────────────────────────
  const addFiles = useCallback((list) => {
    const ok = f => f.type.startsWith('image/') || f.type.startsWith('video/');
    const valid = list.filter(ok).slice(0, 10 - files.length);
    const items = valid.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
    }));
    setFiles(prev => [...prev, ...items]);
  }, [files.length]);

  const removeFile = useCallback((idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

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

  // ── 생성 실행 ─────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!name.trim()) { addToast('음식점 이름을 입력해주세요', 'err'); return; }
    setLoading(true);
    setResult(null);
    try {
      setLoadLabel('이미지를 분석 중...');
      const r = await generateBlogPost({
        name: name.trim(),
        location: location.trim(),
        keywords: keywords.trim(),
        extra: extra.trim(),
        imageFiles: files.map(f => f.file),
      });
      setResult(r);
      setActiveTab('blog');
      addToast('블로그 포스팅 생성 완료 ✓', 'ok');
    } catch (err) {
      console.error(err);
      addToast('오류: ' + (err.message || '알 수 없는 오류'), 'err');
    } finally {
      setLoading(false);
      setLoadLabel('');
    }
  };

  // ── 클립보드 복사 ─────────────────────────────────────────
  const copyText = async (text, label = '') => {
    try {
      await navigator.clipboard.writeText(text);
      addToast((label || '텍스트') + ' 복사 완료 ✓', 'ok');
    } catch {
      addToast('복사 실패 — 직접 선택 후 Ctrl+C 하세요', 'inf');
    }
  };

  // ── 전체 복사 ─────────────────────────────────────────────
  const fullCopy = () => {
    if (!result) return;
    const text = (result.title ? result.title + '\n\n' : '') + (result.body || '');
    copyText(text, '제목 + 본문');
  };

  // ── 다시 작성 ─────────────────────────────────────────────
  const reset = () => { setResult(null); setActiveTab('blog'); };

  // ── 로딩 화면 ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="blog-loading-wrap">
        <div className="loading-card">
          <div className="ai-loader">
            <div className="ai-ring" />
            <span className="ai-ico"><i className="fas fa-pen-nib" /></span>
          </div>
          <p className="load-title">{loadLabel}</p>
          <p className="load-sub">Gemini 2.5 가 글을 쓰고 있습니다...</p>
          <div className="load-pipeline">
            <div className="lp-item active"><div className="lp-icon"><i className="fas fa-eye" /></div><div><span className="lp-name">시각 자료 분석</span><span className="lp-status">이미지 읽는 중...</span></div></div>
            <div className="lp-item"><div className="lp-icon"><i className="fas fa-feather-alt" /></div><div><span className="lp-name">블로그 본문 작성</span><span className="lp-status">대기 중</span></div></div>
            <div className="lp-item"><div className="lp-icon"><i className="fas fa-hashtag" /></div><div><span className="lp-name">SNS 태그 생성</span><span className="lp-status">대기 중</span></div></div>
          </div>
        </div>
      </div>
    );
  }

  // ── 결과 화면 ─────────────────────────────────────────────
  if (result) {
    return (
      <main className="app-main blog-result-wrap">
        <button className="re-btn" style={{ marginBottom: 16 }} onClick={reset}>
          <i className="fas fa-arrow-left" /> 다시 작성
        </button>

        {/* 탭 */}
        <div className="blog-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`btab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        {/* 블로그 본문 탭 */}
        {activeTab === 'blog' && (
          <div className="blog-pane-content">
            <div className="blog-section">
              <div className="blog-section-title">
                <span>제목</span>
                <button className="blog-copy-btn" onClick={() => copyText(result.title || '', '제목')}>
                  <i className="fas fa-copy" /> 복사
                </button>
              </div>
              <div className="blog-text">{result.title}</div>
            </div>
            <div className="blog-section">
              <div className="blog-section-title">
                <span>본문 (네이버 스마트에디터에 붙여넣기)</span>
                <button className="blog-copy-btn" onClick={() => copyText(result.body || '', '본문')}>
                  <i className="fas fa-copy" /> 복사
                </button>
              </div>
              <p className="blog-info-hint">
                <i className="fas fa-info-circle" /> [사진 N] · [영상 N] 위치에 해당 파일을 에디터에 직접 삽입하세요
              </p>
              <div className="blog-text blog-body-text">{result.body}</div>
            </div>
            <button className="make-btn" onClick={fullCopy} style={{ marginTop: 8 }}>
              <span className="make-glow" />
              <i className="fas fa-copy" /> 제목 + 본문 전체 복사
            </button>
          </div>
        )}

        {/* SNS 태그 탭 */}
        {activeTab === 'sns' && (
          <div className="blog-pane-content">
            <TagSection badge="naver"   badgeLabel="N 클립"      hint="300자"  text={result.naver_clip_tags}     onCopy={() => copyText(result.naver_clip_tags || '', '네이버 태그')} />
            <TagSection badge="youtube" badgeLabel="▶ 유튜브 쇼츠" hint="100자"  text={result.youtube_shorts_tags}  onCopy={() => copyText(result.youtube_shorts_tags || '', '유튜브 태그')} />
            <TagSection badge="insta"   badgeLabel="◎ 인스타 릴스" hint="캡션+태그" text={result.instagram_caption}  onCopy={() => copyText(result.instagram_caption || '', '인스타 캡션')} />
            <TagSection badge="tiktok"  badgeLabel="♪ 틱톡 태그"   hint="5개"    text={result.tiktok_tags}          onCopy={() => copyText(result.tiktok_tags || '', '틱톡 태그')} />
          </div>
        )}

        {/* 네이버 등록 가이드 탭 */}
        {activeTab === 'guide' && (
          <div className="blog-pane-content">
            <div className="naver-guide-card">
              <div className="naver-guide-title">
                <i className="fas fa-info-circle" /> 네이버 블로그 붙여넣기 방법
              </div>
              <ol className="naver-guide-list">
                <li>아래 버튼으로 <strong>네이버 블로그 에디터</strong>를 엽니다</li>
                <li><strong>새 글 쓰기</strong> → 제목 입력란에 제목 붙여넣기</li>
                <li>본문 영역 클릭 → <strong>Ctrl+V (붙여넣기)</strong></li>
                <li>사진은 <strong>에디터 사진 아이콘</strong>으로 직접 업로드</li>
                <li>오른쪽 <strong>태그 입력란</strong>에 네이버 클립 태그 붙여넣기</li>
                <li><strong>발행</strong> 버튼 클릭</li>
              </ol>
              <a
                href="https://blog.naver.com/PostWriteForm.naver"
                target="_blank"
                rel="noreferrer"
                className="naver-open-btn"
              >
                <i className="fas fa-external-link-alt" /> 네이버 블로그 에디터 열기
              </a>
            </div>
            <div className="dl-box" style={{ marginTop: 14 }}>
              <p className="dl-title"><i className="fas fa-lightbulb" /> 더 쉽게 하는 방법</p>
              <p className="dl-desc">
                <b>① 전체 복사</b> 후 네이버 블로그 에디터에 <b>Ctrl+V</b>로 붙여넣기<br />
                <b>② 사진</b>은 에디터에서 직접 드래그 앤 드롭으로 추가<br />
                <b>③ 네이버 태그</b>는 복사 후 태그 입력란에 붙여넣기
              </p>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ── 입력 화면 ─────────────────────────────────────────────
  return (
    <main className="app-main">

      {/* 업로드 영역 */}
      <section className="card">
        <div className="card-label">
          <span className="num">01</span>
          <div>
            <h2>이미지 · 영상 업로드</h2>
            <p>음식점 사진과 영상을 올려주세요 (최대 10개)</p>
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
          <span className="pick-btn"><i className="fas fa-folder-open" /> 파일 선택</span>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={onFileChange} />
          <p className="drop-hint">JPG · PNG · MP4 · MOV</p>
        </div>
        {files.length > 0 && (
          <div className="thumb-grid" style={{ marginTop: 14 }}>
            {files.map((m, i) => (
              <div key={i} className="ti">
                {m.type === 'image'
                  ? <img src={m.url} alt="" />
                  : <video src={m.url} muted playsInline />}
                <span className="ti-badge">{i + 1}</span>
                <button className="ti-remove" onClick={e => { e.stopPropagation(); removeFile(i); }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 음식점 정보 입력 */}
      <section className="card">
        <div className="card-label">
          <span className="num">02</span>
          <div>
            <h2>음식점 정보</h2>
            <p>이름·지역 입력 → AI가 블로그 포스팅 전체를 작성합니다</p>
          </div>
        </div>

        <div className="blog-form-row">
          <i className="fas fa-store name-icon" />
          <input className="name-input" type="text" placeholder="음식점 이름 (예: 을지로 돈부리집)" maxLength={40} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="blog-form-row">
          <i className="fas fa-map-marker-alt name-icon" />
          <input className="name-input" type="text" placeholder="위치 (예: 서울 중구 을지로)" maxLength={60} value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div className="blog-form-row">
          <i className="fas fa-key name-icon" style={{ color: 'var(--accent2)' }} />
          <input className="name-input" type="text" placeholder="키워드 (예: 인천 맛집, 산곡동 고기집)" maxLength={120} value={keywords} onChange={e => setKeywords(e.target.value)} />
        </div>
        <div className="blog-form-row" style={{ alignItems: 'flex-start', paddingTop: 8 }}>
          <i className="fas fa-comment-alt name-icon" style={{ marginTop: 4 }} />
          <textarea
            className="name-input blog-textarea"
            placeholder="추가 지시사항 (선택) — 예: 3인 방문, 웨이팅 30분, 직화 구이 강조"
            maxLength={400}
            rows={3}
            value={extra}
            onChange={e => setExtra(e.target.value)}
          />
        </div>
      </section>

      {/* 생성 버튼 */}
      <button
        className="make-btn"
        onClick={handleGenerate}
        disabled={!name.trim()}
      >
        <span className="make-glow" />
        <i className="fas fa-pen-nib" />
        <span>AI 블로그 포스팅 생성</span>
      </button>
      <p className="make-hint">이미지 분석 → 리뷰 본문 · SNS 태그 · 네이버 클립 태그 자동 생성</p>
    </main>
  );
}

// ── 태그 섹션 서브컴포넌트 ────────────────────────────────
function TagSection({ badge, badgeLabel, hint, text, onCopy }) {
  return (
    <div className="sns-card" style={{ marginBottom: 10 }}>
      <div className="sns-card-head">
        <span className={`sns-badge ${badge}`}>{badgeLabel}</span>
        <span className="sns-limit">{hint}</span>
        <button className="sns-copy-btn" onClick={onCopy}>
          <i className="fas fa-copy" /> 복사
        </button>
      </div>
      <div className="sns-text">{text || '—'}</div>
    </div>
  );
}
