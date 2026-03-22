// src/engine/pipeline.js
// startMake() 파이프라인 — 기존 script.js startMake() 이식 + React store 연동

import { useVideoStore, VIRAL_TRENDS } from '../store/videoStore.js';
import { visionAnalysis, generateScript, researchRestaurant } from './gemini.js';
import { generateAllTTS, ensureAudio, sleep, preprocessNarration } from './tts.js';
import { splitCaptions } from './utils.js';
import { firebaseUploadOriginals, firebaseSaveSession, saveMarketingKit } from './firebase.js';
// firebaseUploadVideo는 VideoPlayer에서 직접 사용 — pipeline에서 pipelineSessionId 노출

// ─── 자막 분할 ────────────────────────────────────────────
// (utils.js에서 임포트, 기존 splitCaptions() 동일)

// ─── 파이프라인 메인 ──────────────────────────────────────
export async function startMake() {
  const store = useVideoStore.getState();
  const {
    files, restaurantName, selectedTemplate,
    setPipeline, donePipelineStep, setScript,
    setAudioBuffers, setLoaded, setShowResult,
    addToast, setAutoStyleName, setTemplate, setHook,
    hidePipeline, reset, setPipelineSessionId, setAnalysis,
  } = store;

  if (!files.length) { addToast('이미지 또는 영상을 올려주세요', 'err'); return; }
  if (!restaurantName.trim()) { addToast('음식점 이름을 입력해주세요', 'err'); return; }

  const { hasGeminiKey } = await import('./gemini.js');
  if (!hasGeminiKey()) { addToast('Gemini API 키가 필요합니다', 'err'); return; }

  // AudioContext 초기화 (iOS 보안 정책 대응)
  const { audioCtx } = ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
  try {
    const _osc = audioCtx.createOscillator(), _gain = audioCtx.createGain();
    _gain.gain.value = 0;
    _osc.connect(_gain); _gain.connect(audioCtx.destination);
    _osc.start(0); _osc.stop(audioCtx.currentTime + 0.05);
  } catch (_) {}
  if ('speechSynthesis' in window) {
    const _u = new SpeechSynthesisUtterance(''); _u.volume = 0; speechSynthesis.speak(_u);
  }

  // 파이프라인 공유 sessionId — originals·video 모두 같은 폴더
  const pipelineSessionId = `${Date.now()}_${restaurantName.trim().replace(/\s+/g, '_')}`;
  setPipelineSessionId(pipelineSessionId);

  // Firebase Storage 업로드 — CORS 설정(gsutil cors set) 전까지 비활성화
  // firebaseUploadOriginals(files, restaurantName, pipelineSessionId).catch(() => {});

  // 화면 꺼짐 방지 (Wake Lock API) — 생성 중 휴대폰 꺼져도 계속 진행
  let _wakeLock = null;
  try {
    if ('wakeLock' in navigator) {
      _wakeLock = await navigator.wakeLock.request('screen');
      console.log('[WakeLock] 화면 잠금 방지 활성화');
    }
  } catch (_wlErr) { /* 지원 안 해도 계속 진행 */ }

  try {
    // ── STEP 1: 식당 인텔리전스 — 데이터 선행형 파이프라인 ─────────────────────
    // 💡 데이터 먼저! 식당 정보 → AI가 "어떤 사진이 핵심인지" 알고 이미지 분석에 들어갑니다
    setPipeline(1, `"${restaurantName}" 식당 인텔리전스 수집 중...`, `데이터 선행형 — Gemini가 시그니처 메뉴·USP·방문 팁을 먼저 확보합니다`);
    const researchData = await researchRestaurant(restaurantName.trim()).catch(() => '');
    if (researchData) addToast('식당 인텔리전스 확보 ✅ — 데이터 기반 시각 분석 시작', 'ok');
    donePipelineStep(1);

    // ── STEP 2: 컨텍스트 기반 Vision Analysis ─────────────────────────────────
    // 💡 식당 정보를 먼저 숙지한 AI가 "어떤 사진이 시그니처 메뉴인지" 판단하며 분석합니다
    setPipeline(2, 'AI 컨텍스트 기반 이미지 분석 중...', '식당 데이터 참고 → 시그니처 메뉴 컷 우선 선별');
    const analysis = await visionAnalysis(restaurantName.trim(), researchData);

    // AI 자동 스타일 선택
    const curState = useVideoStore.getState();
    const userChoseManually = curState.selectedTemplate !== 'auto';
    if (!userChoseManually && analysis.recommended_template) {
      setTemplate(analysis.recommended_template);
    }
    if (analysis.recommended_hook) setHook(analysis.recommended_hook);

    const curTemplate = useVideoStore.getState().selectedTemplate;
    const { TEMPLATE_NAMES } = await import('../store/videoStore.js');
    setAutoStyleName(TEMPLATE_NAMES[curTemplate] || curTemplate);
    addToast(
      userChoseManually
        ? `수동 선택: ${TEMPLATE_NAMES[curTemplate] || curTemplate}`
        : `AI 추천: ${TEMPLATE_NAMES[curTemplate] || curTemplate}`,
      'inf'
    );
    donePipelineStep(2);
    // analysis 저장 (VideoRenderer의 focus_coords · aesthetic_score 활용)
    setAnalysis(analysis);

    // ── STEP 3: Script Generation ─────────────────────────────
    setPipeline(3, 'Instagram Reels 스토리보드 생성 중...', '훅→감성→클로즈업→CTA 내러티브 설계');
    const script = await generateScript(restaurantName.trim(), analysis, useVideoStore.getState().userPrompt, researchData);

    // 🚀 [1 Audio : N Video] blocks → scenes 평탄화 로직
    // AI가 blocks 형식으로 주면 시각 컷을 베고, 오디오는 첫 컷에만 연결
    if (Array.isArray(script.blocks) && script.blocks.length && !script.scenes?.length) {
      let flatScenes = [];
      let globalMediaIdx = 0;
      script.blocks.forEach((block, bIdx) => {
        const cuts = (block.video_cuts && block.video_cuts.length > 0)
          ? block.video_cuts
          : [{ duration: block.total_duration || 3.0, media_idx: block.media_idx }];
        cuts.forEach((cut, cIdx) => {
          // ⚡ [인간화 TTS 튜닝] 단일 마침표·쉼표만 제거, 느낌표·물음표·말줄임표는 보존 (억양 유지)
          let humanNarration = '';
          if (cIdx === 0 && block.narration) {
            humanNarration = block.narration
              .replace(/\.(?!\.)/g, ' ')  // 단일 마침표만 제거 (말줄임표 ... 보존)
              .replace(/,/g, ' ')          // 쉼표 제거 (숨 안 쉬고 랩하게)
              .replace(/\s{2,}/g, ' ')
              .trim();
          }
          flatScenes.push({
            ...cut,
            blockIdx:       bIdx,
            isFirstInBlock: cIdx === 0,
            media_idx:      cut.media_idx !== undefined ? cut.media_idx
                            : (block.media_idx !== undefined ? block.media_idx : globalMediaIdx++),
            caption1:          cIdx === 0 ? (block.caption || block.caption1 || '') : '',
            caption2:          cIdx === 0 ? (block.caption2 || '') : '',
            narration:         humanNarration,
            effect:            cut.effect || block.effect || 'zoom-in',
            subtitle_style:    block.subtitle_style || 'hero',
            energy_level:      block.energy_level || 3,
            retention_strategy: block.retention_strategy || 'build',
          });
        });
      });
      script.scenes = flatScenes;
      console.log(`[Pipeline] blocks 평탄화: ${script.blocks.length}블록 → ${flatScenes.length}씬`);
    }

    setScript(script);
    donePipelineStep(3);

    // ── STEP 4: TTS ─────────────────────────────────────────────────
    setPipeline(4, 'AI 남성 보이스 합성 중...', `Gemini TTS Fenrir — ${script.scenes.length}컷`);
    let audioBuffers;
    try {
      audioBuffers = await generateAllTTS(script.scenes, (msg, type) => addToast(msg, type), script.theme);
    } catch (ttsErr) {
      console.warn('[TTS] 전체 실패, 무음 진행:', ttsErr.message);
      audioBuffers = script.scenes.map(() => null);
      addToast('AI 보이스 실패: 무음 영상으로 진행합니다', 'inf');
    }

    // 오디오 길이로 씬 duration 동기화 (while 루프 — 블록 오디오 잘림 방지)
    const isTrend = VIRAL_TRENDS[useVideoStore.getState().selectedTemplate];
    // analysis.per_image 인덱스 맵 (focus_coords, aesthetic_score 씬에 주입)
    const analysisMap = {};
    for (const p of (analysis.per_image || [])) analysisMap[p.idx] = p;

    const BPM_BEAT   = 0.46875;  // 128 BPM 한 비트
    const finalScenes = [];
    let sceneIdx = 0;
    while (sceneIdx < script.scenes.length) {
      let sc      = script.scenes[sceneIdx];
      const buf   = audioBuffers[sceneIdx];
      const isBlockCut = sc.blockIdx !== undefined;

      if (isBlockCut) {
        // ── 블록 그룹: 같은 blockIdx 컷 전체를 한 번에 처리 ──
        const blockStart = sceneIdx;
        const blockIdx   = sc.blockIdx;
        while (sceneIdx < script.scenes.length && script.scenes[sceneIdx].blockIdx === blockIdx) sceneIdx++;
        const blockScenes = script.scenes.slice(blockStart, sceneIdx);
        const audioDur    = (buf && buf.duration > 0) ? buf.duration : 0;

        // 각 컷 AI 설계 duration 합산
        const rawTotal = blockScenes.reduce((sum, s) => sum + Math.max(BPM_BEAT, s.duration || BPM_BEAT), 0);
        // 필요 최소 총 길이 = audioDur + 0.1s 여백 (타이트 컷오프 방지)
        const minTotal = audioDur > 0 ? audioDur + 0.1 : rawTotal;
        const deficit  = Math.max(0, minTotal - rawTotal);

        // 각 컷 BPM 스냅
        let durations = blockScenes.map(s =>
          Math.max(BPM_BEAT, Math.round(Math.max(BPM_BEAT, s.duration || BPM_BEAT) / BPM_BEAT) * BPM_BEAT)
        );
        // deficit → 마지막 컷에 보정
        if (deficit > 0) durations[durations.length - 1] += Math.ceil(deficit / BPM_BEAT) * BPM_BEAT;

        // BPM 스냅 후에도 부족하면 재보정
        const snappedTotal = durations.reduce((s, d) => s + d, 0);
        if (audioDur > 0 && snappedTotal < audioDur + 0.1) {
          durations[durations.length - 1] += Math.ceil((audioDur + 0.1 - snappedTotal) / BPM_BEAT) * BPM_BEAT;
        }

        blockScenes.forEach((s, j) => {
          let caption1 = s.caption1, caption2 = s.caption2;
          if (!caption1?.trim()) {
            const [c1, c2] = splitCaptions(s.narration || s.subtitle || '');
            caption1 = c1; caption2 = c2;
          }
          const imgMeta = analysisMap[s.media_idx ?? (blockStart + j)] || {};
          finalScenes.push({ ...s, duration: durations[j], caption1, caption2, subtitle: caption1 || s.subtitle || '',
            focus_coords:    imgMeta.focus_coords    || null,
            aesthetic_score: imgMeta.aesthetic_score || null,
            foodie_score:    imgMeta.foodie_score    || null,
            best_start_pct:  imgMeta.best_start_pct  || 0,
          });
        });
      } else {
        // ── 일반 씬 ──
        let duration;
        if (isTrend && isTrend.durations[sceneIdx] !== undefined) {
          const trendDur = isTrend.durations[sceneIdx];
          duration = (buf && buf.duration > 0)
            ? Math.max(trendDur, Math.round((buf.duration + 0.1) * 10) / 10)
            : trendDur;
          if (!sc.effect && isTrend.effect) sc = { ...sc, effect: isTrend.effect[sceneIdx % isTrend.effect.length] };
        } else if (buf && buf.duration > 0) {
          duration = Math.max(2.0, Math.round((buf.duration + 0.1) * 10) / 10);
        } else {
          duration = Math.max(2.0, sc.duration || 3.0);
        }
        duration = Math.max(2.0, Math.round(duration / BPM_BEAT) * BPM_BEAT);

        let caption1 = sc.caption1, caption2 = sc.caption2;
        if (!caption1?.trim()) {
          const [c1, c2] = splitCaptions(sc.narration || sc.subtitle || '');
          caption1 = c1; caption2 = c2;
        }
        const imgMeta = analysisMap[sc.media_idx ?? sceneIdx] || {};
        finalScenes.push({ ...sc, duration, caption1, caption2, subtitle: caption1 || sc.subtitle || '',
          focus_coords:    imgMeta.focus_coords    || null,
          aesthetic_score: imgMeta.aesthetic_score || null,
          foodie_score:    imgMeta.foodie_score    || null,
          best_start_pct:  imgMeta.best_start_pct  || 0,
        });
        sceneIdx++;
      }
    }

    // ── 영상 우선 배치: 사용 없는 영상을 이미지 새으로 교체 (이미지 최대 35%) ──────
    {
      const videoIdxs = files.map((f, i) => f.type === 'video' ? i : -1).filter(i => i >= 0);
      if (videoIdxs.length > 0) {
        const usedVideos = new Set(finalScenes.filter(s => files[s.media_idx]?.type === 'video').map(s => s.media_idx));
        const unusedVideos = videoIdxs.filter(i => !usedVideos.has(i));
        if (unusedVideos.length > 0) {
          const maxImages = Math.ceil(finalScenes.length * 0.35);
          const imageScenes = finalScenes.reduce((acc, s, i) => { if (files[s.media_idx]?.type === 'image') acc.push(i); return acc; }, []);
          const excess = imageScenes.length - maxImages;
          if (excess > 0) {
            let pool = [...unusedVideos], swapped = 0;
            for (let i = 0; i < finalScenes.length && swapped < excess && pool.length; i++) {
              if (files[finalScenes[i].media_idx]?.type === 'image') {
                const vidIdx = pool.shift();
                const meta = analysisMap[vidIdx] || {};
                finalScenes[i] = { ...finalScenes[i], media_idx: vidIdx, best_start_pct: meta.best_start_pct || 0 };
                swapped++;
              }
            }
            if (swapped > 0) console.log(`[Pipeline] 영상 우선: ${swapped}개 이미지 사이년 → 영상으로 교체`);
          }
        }
      }
    }

    // script 업데이트
    setScript({ ...script, scenes: finalScenes });
    setAudioBuffers(audioBuffers);
    donePipelineStep(4);

    // ── STEP 5: 미디어 프리로드 ────────────────────────────────────
    setPipeline(5, '렌더링 준비 중...', '컷 배치 · 애니메이션 · 효과 적용');
    const loaded = await preloadMedia(files);
    setLoaded(loaded);
    await sleep(200);
    donePipelineStep(5);

    // Firebase 세션 저장
    firebaseSaveSession({ ...script, scenes: finalScenes }, restaurantName).catch(() => {});

    // 마케팅 키트 자동 저장 (Firebase)
    saveMarketingKit({
      restaurant:        restaurantName,
      hook_title:        script.marketing?.hook_title || '',
      caption:           script.marketing?.caption || '',
      hashtags_30:       script.marketing?.hashtags_30 || '',
      receipt_review:    script.marketing?.receipt_review || '',
      hook_variations:   script.hook_variations || [],
      naver_clip_tags:   script.naver_clip_tags || '',
      youtube_shorts_tags: script.youtube_shorts_tags || '',
      instagram_caption: script.instagram_caption || '',
      tiktok_tags:       script.tiktok_tags || '',
      hashtags:          script.hashtags || '',
      theme:             script.theme || '',
      vibe_color:        script.vibe_color || '',
    }).catch(() => {});

    await sleep(300);
    hidePipeline();
    setShowResult(true);

  } catch (err) {
    hidePipeline();
    console.error('[startMake]', err);
    addToast('오류: ' + (err?.message || String(err) || '알 수 없는 오류'), 'err');
  } finally {
    // Wake Lock 해제
    if (_wakeLock) { _wakeLock.release().catch(() => {}); _wakeLock = null; }
  }
}

// ─── 미디어 프리로드 (병렬) ───────────────────────────────
async function preloadMedia(files) {
  console.log(`[Preload] ${files.length}개 미디어 병렬 로드 시작`);
  const loadPromises = files.map(async (m, index) => {
    if (m.type === 'image') {
      return new Promise((resolve) => {
        const img = Object.assign(new Image(), { src: m.url });
        img.onload  = () => resolve({ type: 'image', src: img, idx: index });
        img.onerror = () => resolve({ type: 'image', src: img, idx: index, error: true });
      });
    } else {
      return new Promise((resolve) => {
        const vid = Object.assign(document.createElement('video'), {
          src: m.url, muted: true, loop: false, playsInline: true, preload: 'auto',
        });
        const timeout = setTimeout(
          () => resolve({ type: 'video', src: vid, offset: 0, idx: index }),
          5000,
        );
        vid.oncanplay = () => { clearTimeout(timeout); resolve({ type: 'video', src: vid, offset: 0, idx: index }); };
        vid.onerror   = () => { clearTimeout(timeout); vid._loadFailed = true; resolve({ type: 'video', src: vid, offset: 0, idx: index }); };
        vid.load();
      });
    }
  });
  const loaded = await Promise.all(loadPromises);
  return loaded.sort((a, b) => a.idx - b.idx);
}
