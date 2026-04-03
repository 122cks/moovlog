// src/components/ResultScreen.jsx
import React, { useState, useRef } from 'react';
import { useVideoStore } from '../store/videoStore.js';
import { fetchTTSWithRetry, preprocessNarration, getAudioCtx } from '../engine/tts.js';
import { extractThumbnail } from '../engine/VideoRenderer.js';
import VideoPlayer  from './VideoPlayer.jsx';
import SceneList    from './SceneList.jsx';
import ExportPanel  from './ExportPanel.jsx';
import SNSTags      from './SNSTags.jsx';
import { getMarketingKits, searchMarketingKits, deleteMarketingKit } from '../engine/firebase.js';

// ── 🔴 Auto-Recovery: 빈 오디오 씬 감지 + 개별 재합성 ────
function AutoRecovery({ scenes, audioBuffers, addToast }) {
  const { updateAudioBuffer, updateScene } = useVideoStore();
  const [recovering, setRecovering] = useState({}); // { [sceneIdx]: true }

  // 나레이션은 있는데 버퍼가 null인 씬만 추출
  const failedScenes = (scenes || [])
    .map((sc, i) => ({ sc, i }))
    .filter(({ sc, i }) => sc.narration?.trim() && !audioBuffers?.[i]);

  if (!failedScenes.length) return null;

  const handleResynth = async (sc, i) => {
    if (recovering[i]) return;
    setRecovering(r => ({ ...r, [i]: true }));
    addToast(`씬 ${i + 1} 음성 재합성 중...`, 'inf');
    try {
      const ac = getAudioCtx();
      if (ac?.state === 'suspended') await ac.resume();
      const text = preprocessNarration(sc.narration);
      const buf  = await fetchTTSWithRetry(text, i, sc.energy_level ?? 3);
      updateAudioBuffer(i, buf);
      // 오디오 길이에 맞게 씬 duration도 동기화
      const newDur = Math.max(2.0, Math.round((buf.duration + 0.4) * 10) / 10);
      updateScene(i, { duration: newDur });
      addToast(`씬 ${i + 1} 음성 복구 완료 ✅`, 'ok');
    } catch (e) {
      addToast(`씬 ${i + 1} 재합성 실패: ${e.message}`, 'err');
    } finally {
      setRecovering(r => ({ ...r, [i]: false }));
    }
  };

  return (
    <div className="marketing-assets-box" style={{ border: '1px solid rgba(255,80,80,0.4)', background: 'rgba(255,50,50,0.07)' }}>
      <p className="marketing-title" style={{ color: '#ff6b6b' }}>
        <i className="fas fa-exclamation-triangle" /> {failedScenes.length}개 씬 음성 누락 — 자동 복구
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        {failedScenes.map(({ sc, i }) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px 12px' }}>
            <span style={{ flex: 1, fontSize: '0.8rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              씬 {i + 1}: {sc.caption1 || sc.narration?.substring(0, 20) || '(내용 없음)'}
            </span>
            <button
              onClick={() => handleResynth(sc, i)}
              disabled={!!recovering[i]}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: recovering[i] ? '#555' : '#e74c3c', color: '#fff',
                fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap',
              }}
            >
              <i className={`fas ${recovering[i] ? 'fa-spinner fa-spin' : 'fa-redo'}`} />
              {recovering[i] ? ' 합성 중...' : ' 음성 복구'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 🎯 플랫폼 최적화 선택기 ────────────────────────────────
function PlatformOptimizer({ target, setTarget, addToast }) {
  const PLATFORMS = [
    { id: 'reels',  label: '◎ 릴스',  color: '#E1306C', desc: '9:16 세이프존 적용' },
    { id: 'shorts', label: '▶ 쇼츠',  color: '#FF0000', desc: 'YT UI 하단 회피' },
    { id: 'tiktok', label: '♪ 틱톡',  color: '#6FC2F5', desc: '하단 버튼 영역 확보' },
  ];
  return (
    <div className="marketing-assets-box">
      <p className="marketing-title"><i className="fas fa-layer-group" /> 플랫폼 최적화 (세이프 존)</p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => { setTarget(p.id); addToast(`${p.label} 세이프존 모드 적용됨`, 'ok'); }}
            style={{
              flex: 1, padding: '10px 6px', borderRadius: '12px', border: `1.5px solid ${target === p.id ? p.color : '#333'}`,
              background: target === p.id ? `${p.color}22` : '#1a1a1a', color: target === p.id ? p.color : '#aaa',
              fontSize: '0.8rem', fontWeight: target === p.id ? 800 : 500, cursor: 'pointer',
              transition: 'all 0.18s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            }}
          >
            <span>{p.label}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{p.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 📸 AI 썸네일 팩토리 ───────────────────────────────────
function ThumbnailMaker({ scenes, files, script, addToast }) {
  const [loading, setLoading] = useState(false);
  const [thumbUrl, setThumbUrl] = useState(null);

  const handleCreate = async () => {
    if (loading) return;
    setLoading(true);
    addToast('AI가 가장 식욕 자극 프레임을 찾는 중...', 'inf');
    try {
      const blob = await extractThumbnail(scenes, files, script, msg => console.log('[Thumb]', msg));
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
      setThumbUrl(URL.createObjectURL(blob));
      addToast('바이럴 썸네일 생성 완료! ✨', 'ok');
    } catch (err) {
      addToast('썸네일 생성 실패: ' + err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-assets-box" style={{ marginTop: '12px' }}>
      <p className="marketing-title"><i className="fas fa-camera-retro" /> AI 썸네일 팩토리</p>
      <button
        className="make-btn"
        onClick={handleCreate}
        disabled={loading}
        style={{ marginTop: '10px', height: '44px', fontSize: '0.88rem', opacity: loading ? 0.7 : 1 }}
      >
        <i className={loading ? 'fas fa-spinner fa-spin' : 'fas fa-magic'} />
        {loading ? ' 베스트 프레임 분석 중...' : ' 고대비 바이럴 썸네일 추출'}
      </button>
      {thumbUrl && (
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={thumbUrl} alt="썸네일" style={{ width: '80px', height: '142px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #FF2D55' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0 }}>저장 후 릴스 표지로 직접 업로드하세요!</p>
            <a
              href={thumbUrl}
              download="moovlog_thumb.jpg"
              style={{
                display: 'inline-block', padding: '8px 16px', borderRadius: '8px',
                background: '#FF2D55', color: '#fff', fontSize: '0.85rem',
                fontWeight: 700, textDecoration: 'none', textAlign: 'center',
              }}
            >
              <i className="fas fa-download" /> 이미지 저장
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3종 훅 베리에이션 선택 UI (TTS 재합성 통합) ────────────
function HookPicker({ variations, script, setScript, addToast }) {
  const { updateAudioBuffer } = useVideoStore();
  const [loading, setLoading] = useState(false);

  if (!variations?.length) return null;
  const LABELS = { shock: '🔥 충격형', info: 'ℹ️ 정보형', pov: '👤 1인칭' };

  const handleSelect = async (h) => {
    if (loading) return;
    setLoading(true);
    addToast(`${LABELS[h.type] || h.type} 스타일로 변경 중...`, 'inf');
    try {
      // 1. AudioContext 재개 (브라우저 정책 대응)
      const ac = getAudioCtx();
      if (ac?.state === 'suspended') await ac.resume();

      // 2. 새로운 나레이션 음성 합성
      const processedText = preprocessNarration(h.narration);
      const newBuffer = await fetchTTSWithRetry(processedText, 0);

      // 3. 자막 + 음성 + 씬 시간 동시 업데이트
      const newScenes = script.scenes ? [...script.scenes] : [];
      if (newScenes.length > 0) {
        newScenes[0] = {
          ...newScenes[0],
          caption1: h.caption1,
          caption2: h.caption2,
          narration: h.narration,
          duration: Math.max(2.0, Math.round((newBuffer.duration + 0.4) * 10) / 10),
        };
      }
      updateAudioBuffer(0, newBuffer);
      setScript({ ...script, scenes: newScenes });
      addToast(`${LABELS[h.type] || h.type} 훅 & 음성 교체 완료! ✨`, 'ok');
    } catch (err) {
      console.error('[HookPicker] 재합성 실패:', err);
      addToast('음성 재합성 실패: 자막만 교체합니다.', 'err');
      // 음성 실패해도 자막은 교체
      const newScenes = script.scenes ? [...script.scenes] : [];
      if (newScenes.length > 0) {
        newScenes[0] = { ...newScenes[0], caption1: h.caption1, caption2: h.caption2, narration: h.narration };
      }
      setScript({ ...script, scenes: newScenes });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hook-picker-wrap" style={{ opacity: loading ? 0.7 : 1 }}>
      <p className="marketing-title">
        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-fish'}`} />
        {loading ? ' AI가 목소리 만드는 중...' : ' AI PD의 3종 훅 전략'}
      </p>
      <div className="hook-grid">
        {variations.map((h, i) => (
          <div key={i} className={`hook-card${loading ? ' disabled' : ''}`} onClick={() => handleSelect(h)}>
            <span className="hook-type">{LABELS[h.type] || h.type}</span>
            <p className="hook-cap">{h.caption1}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 마케팅 에셋 복사 버튼 섹션 ─────────────────────────────
function MarketingAssets({ marketing, addToast }) {
  if (!marketing) return null;
  const copy = async (text, label) => {
    try { await navigator.clipboard.writeText(text); addToast(`${label} 복사 완료! ✨`, 'ok'); }
    catch { addToast('복사 실패 — 직접 선택해서 복사해주세요', 'err'); }
  };
  return (
    <div className="marketing-assets-box">
      <p className="marketing-title"><i className="fas fa-rocket" /> 릴스 떡상 마케팅 키트</p>
      {marketing.hook_title && (
        <div className="marketing-row">
          <span className="marketing-label">🎣 훅 제목</span>
          <button className="marketing-copy-btn" onClick={() => copy(marketing.hook_title, '훅 제목')}>
            <i className="fas fa-copy" /> 복사
          </button>
          <p className="marketing-text">{marketing.hook_title}</p>
        </div>
      )}
      {marketing.caption && (
        <div className="marketing-row">
          <span className="marketing-label">✍️ 인스타 캡션</span>
          <button className="marketing-copy-btn" onClick={() => copy(marketing.caption, '인스타 캡션')}>
            <i className="fas fa-copy" /> 복사
          </button>
          <p className="marketing-text" style={{ whiteSpace: 'pre-line', fontSize: '0.75rem' }}>{marketing.caption}</p>
        </div>
      )}
      {marketing.hashtags_30 && (
        <div className="marketing-row">
          <span className="marketing-label">🏷️ 해시태그 30개</span>
          <button className="marketing-copy-btn" onClick={() => copy(marketing.hashtags_30, '해시태그 30개')}>
            <i className="fas fa-copy" /> 한번에 복사
          </button>
          <p className="marketing-text" style={{ fontSize: '0.68rem', lineHeight: 1.8, color: '#a855f7' }}>{marketing.hashtags_30}</p>
        </div>
      )}
      {marketing.receipt_review && (
        <div className="marketing-row">
          <span className="marketing-label">🧢 네이버 영수증 리뷰</span>
          <button className="marketing-copy-btn" onClick={() => copy(marketing.receipt_review, '영수증 리뷰')}>
            <i className="fas fa-copy" /> 복사
          </button>
          <p className="marketing-text">{marketing.receipt_review}</p>
        </div>
      )}
    </div>
  );
}

export default function ResultScreen() {
  const { script, audioBuffers, files, targetPlatform, setTargetPlatform,
          reset, setShowResult, addToast, setScript } = useVideoStore();

  const totalSec = script?.scenes?.reduce((a, s) => a + (s.duration || 0), 0) || 0;
  const hasAudio = audioBuffers?.some(b => b);

  // 마케팅 키트 이력
  const [kitHistory,     setKitHistory]     = useState([]);
  const [kitSearch,      setKitSearch]      = useState('');
  const [showKitHistory, setShowKitHistory] = useState(false);
  const [kitLoading,     setKitLoading]     = useState(false);
  const [loadedKit,      setLoadedKit]      = useState(null);
  const [kitDeleting,    setKitDeleting]    = useState(false);
  const kitPanelRef = useRef(null);

  const loadKitHistory = async (kw = '') => {
    setKitLoading(true);
    try {
      const results = kw.trim()
        ? await searchMarketingKits(kw.trim())
        : await getMarketingKits(20);
      setKitHistory(results);
    } catch (e) { addToast('이력 로드 실패: ' + e.message, 'err'); }
    finally { setKitLoading(false); }
  };

  const loadKitFromHistory = (item) => {
    setScript({
      ...script,
      marketing: {
        hook_title:     item.hookTitle     || '',
        caption:        item.caption       || '',
        hashtags_30:    item.hashtags30    || '',
        receipt_review: item.receiptReview || '',
      },
      hook_variations:     item.hookVariations   || [],
      naver_clip_tags:     item.naverClipTags    || '',
      youtube_shorts_tags: item.youtubeShortsTags || '',
      instagram_caption:   item.instagramCaption  || '',
      tiktok_tags:         item.tiktokTags        || '',
      hashtags:            item.hashtags          || '',
    });
    setShowKitHistory(false);
    setLoadedKit(item);
    addToast(`"${item.restaurant}" 마케팅 키트 로드 완료 ✓`, 'ok');
    // 패널이 보이는 위치로 스크롤
    setTimeout(() => kitPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const deleteKit = async (id, restaurantName, e) => {
    e?.stopPropagation();
    if (!id || kitDeleting) return;
    if (!confirm(`"${restaurantName}" 키트를 삭제할까요?`)) return;
    setKitDeleting(true);
    try {
      await deleteMarketingKit(id);
      setKitHistory(h => h.filter(x => x.id !== id));
      if (loadedKit?.id === id) setLoadedKit(null);
      addToast('마케팅 키트 삭제 완료', 'ok');
    } catch (err) {
      addToast('삭제 실패: ' + err.message, 'err');
    } finally {
      setKitDeleting(false);
    }
  };

  const goBack = () => { setShowResult(false); };
  const doReset = () => { reset(); };

  return (
    <div className="result-wrap">
      <div className="result-inner">
        {/* 헤더 */}
        <div className="result-header">
          <button className="result-back-btn" onClick={goBack}>
            <i className="fas fa-arrow-left" />
          </button>
          <div className="result-title-box">
            <p className="result-label">생성 완료</p>
            <p className="result-sub">{script?.scenes?.length || 0}개 씬 · {totalSec.toFixed(1)}초</p>
          </div>
          <div className="badge-group">
          <div className={`audio-badge ${hasAudio ? '' : 'muted'}`}>
            <i className={`fas ${hasAudio ? 'fa-microphone-alt' : 'fa-volume-mute'}`} />
            <span>{hasAudio ? 'AI 보이스' : '무음'}</span>
          </div>
        </div>
        </div>

        {/* 영상 플레이어 */}
        <VideoPlayer />

        {/* 🔴 음성 누락 씬 자동 복구 */}
        <AutoRecovery scenes={script?.scenes} audioBuffers={audioBuffers} addToast={addToast} />

        {/* 🎯 플랫폼 최적화 */}
        <PlatformOptimizer target={targetPlatform} setTarget={setTargetPlatform} addToast={addToast} />

        {/* 📸 AI 썸네일 */}
        <ThumbnailMaker scenes={script?.scenes || []} files={files} script={script} addToast={addToast} />

        {/* 씬 목록 */}
        <SceneList />

        {/* 저장 패널 */}
        <ExportPanel />

        {/* 마케팅 에셋 키트 — 파이프라인 결과에도 표시(top-level 필드 폴백) */}
        {(script?.marketing || script?.hook_title || script?.caption) && (
          <MarketingAssets
            marketing={script.marketing || {
              hook_title:     script.hook_title || '',
              caption:        script.caption || '',
              hashtags_30:    script.hashtags_30 || '',
              receipt_review: script.receipt_review || '',
            }}
            addToast={addToast}
          />
        )}

        {/* 🗂️ 마케팅 키트 이력 / 로드된 키트 통합 패널 */}
        <div ref={kitPanelRef} className="marketing-assets-box" style={{ marginTop: 8, ...(loadedKit ? { border: '1.5px solid #7c3aed66', background: 'rgba(124,58,237,0.07)' } : {}) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="marketing-title" style={{ margin: 0 }}>
              {loadedKit
                ? <><i className="fas fa-check-circle" style={{ color: '#7c3aed' }} /> {loadedKit.restaurant}</>
                : <><i className="fas fa-history" /> 이전 마케팅 키트</>
              }
            </p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {loadedKit && (
                <>
                  <button
                    onClick={() => { setLoadedKit(null); setShowKitHistory(true); }}
                    style={{ background: 'none', color: '#aaa', border: '1px solid #444', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.73rem' }}
                  >
                    ← 목록
                  </button>
                  <button
                    onClick={e => deleteKit(loadedKit.id, loadedKit.restaurant, e)}
                    disabled={kitDeleting}
                    style={{ background: 'none', color: '#ff6b6b', border: '1px solid #ff6b6b55', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.73rem' }}
                  >
                    {kitDeleting ? <i className="fas fa-spinner fa-spin" /> : '🗑️ 삭제'}
                  </button>
                  <button onClick={() => setLoadedKit(null)} style={{ background: 'none', color: '#666', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                </>
              )}
              {!loadedKit && (
                <button
                  onClick={() => { setShowKitHistory(p => !p); if (!showKitHistory && !kitHistory.length) loadKitHistory(); }}
                  style={{ background: 'none', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {showKitHistory ? '닫기' : '불러오기'}
                </button>
              )}
            </div>
          </div>

          {/* 이력 목록 — 2열 그리드 */}
          {!loadedKit && showKitHistory && (
            <>
              <div style={{ display: 'flex', gap: 8, margin: '10px 0' }}>
                <input
                  className="name-input"
                  style={{ flex: 1, fontSize: '0.85rem', padding: '8px 12px' }}
                  placeholder="음식점 이름으로 검색..."
                  value={kitSearch}
                  onChange={e => setKitSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadKitHistory(kitSearch)}
                />
                <button className="re-btn" style={{ minWidth: 44 }} onClick={() => loadKitHistory(kitSearch)} disabled={kitLoading}>
                  {kitLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-search" />}
                </button>
              </div>
              {kitHistory.length === 0 && !kitLoading && (
                <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '12px 0', fontSize: '0.8rem' }}>저장된 이력이 없습니다</p>
              )}
              {/* 2열 그리드 — 스크롤 가능 컨테이너 */}
              <div style={{ maxHeight: '400px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', marginTop: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {kitHistory.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10,
                      padding: '10px 12px', cursor: 'pointer', position: 'relative',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed55'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                  >
                    {/* 개별 삭제 버튼 */}
                    <button
                      onClick={e => deleteKit(item.id, item.restaurant, e)}
                      disabled={kitDeleting}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        background: 'rgba(255,107,107,0.12)', color: '#ff6b6b',
                        border: 'none', borderRadius: 6, padding: '2px 6px',
                        cursor: 'pointer', fontSize: '0.65rem', lineHeight: '1.4',
                      }}
                      title="삭제"
                    >
                      🗑️
                    </button>
                    {/* 음식점명 클릭 → 불러오기 */}
                    <div onClick={() => loadKitFromHistory(item)}>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', margin: '0 20px 4px 0', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.restaurant || '—'}
                      </p>
                      <p style={{ fontSize: '0.65rem', color: '#666', margin: '0 0 6px' }}>
                        {item.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || ''}
                      </p>
                      {item.hookTitle && (
                        <p style={{ fontSize: '0.7rem', color: '#888', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🎣 {item.hookTitle}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </>
          )}

          {/* 로드된 키트 전체 데이터 표시 */}
          {loadedKit && (
            <div style={{ marginTop: 12, maxHeight: '520px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {[
                { label: '🎣 훅 제목',          val: loadedKit.hookTitle },
                { label: '✍️ 인스타 캡션',        val: loadedKit.caption },
                { label: '🏷️ 해시태그 30개',      val: loadedKit.hashtags30 },
                { label: '🧾 네이버 영수증 리뷰',   val: loadedKit.receiptReview },
                { label: '📎 네이버 클립 태그',    val: loadedKit.naverClipTags },
                { label: '◎ 릴스 캡션',          val: loadedKit.instagramCaption },
                { label: '▶ 유튜브 쇼츠 태그',    val: loadedKit.youtubeShortsTags },
                { label: '♪ 틱톡 태그',          val: loadedKit.tiktokTags },
              ].map(({ label, val }) => (
                <div key={label} className="marketing-row" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="marketing-label" style={{ margin: 0 }}>{label}</span>
                    {val && (
                      <button className="marketing-copy-btn" onClick={async () => {
                        try { await navigator.clipboard.writeText(val); addToast(`${label} 복사 완료!`, 'ok'); }
                        catch { addToast('복사 실패', 'err'); }
                      }}><i className="fas fa-copy" /> 복사</button>
                    )}
                  </div>
                  <p className="marketing-text" style={{
                    whiteSpace: 'pre-line', fontSize: '0.78rem', margin: 0,
                    color: val ? (label.includes('태그') || label.includes('해시태그') ? '#a855f7' : '#ddd') : '#666',
                    background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 12px',
                    fontStyle: val ? 'normal' : 'italic',
                  }}>{val || '(저장된 데이터 없음)'}</p>
                </div>
              ))}
              {loadedKit.hookVariations?.length > 0 && (
                <div className="marketing-row" style={{ marginBottom: 8 }}>
                  <span className="marketing-label">🎣 3종 훅 베리에이션</span>
                  {loadedKit.hookVariations.map((h, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 12px', marginTop: 6, fontSize: '0.75rem' }}>
                      <span style={{ color: '#a855f7', fontWeight: 700 }}>{h.type}</span>
                      <span style={{ color: '#fff', marginLeft: 8 }}>{h.caption1}</span>
                      {h.caption2 && <span style={{ color: '#aaa', marginLeft: 6 }}>/ {h.caption2}</span>}
                      {h.narration && <p style={{ color: '#888', marginTop: 4, margin: '4px 0 0', fontStyle: 'italic' }}>{h.narration}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3종 훅 베리에이션 */}
        {script?.hook_variations?.length > 0 && (
          <HookPicker variations={script.hook_variations} script={script} setScript={setScript} addToast={addToast} />
        )}

        {/* SNS 태그 */}
        {script && <SNSTags script={script} />}

        {/* 다시 만들기 */}
        <button className="re-btn" onClick={doReset}>
          <i className="fas fa-redo" /> 다시 만들기
        </button>
      </div>
    </div>
  );
}
