// src/engine/pipeline.js
// startMake() 파이프라인 — 기존 script.js startMake() 이식 + React store 연동

import { useVideoStore, VIRAL_TRENDS, RESTAURANT_STYLE_PRESETS } from '../store/videoStore.js';
import { visionAnalysis, researchRestaurant } from './gemini.js';
import { generateScript } from './gemini-script.js';
import { detectRestaurantType, geminiQualityCheck } from './gemini-classify.js';
import { generateAllTTS, ensureAudio, sleep } from './tts.js';
import { splitCaptions } from './utils.js';
import { firebaseUploadOriginals, firebaseReplaceRestaurantData } from './firebase.js';
// firebaseUploadVideo는 VideoPlayer에서 직접 사용 — pipeline에서 pipelineSessionId 노출

// ─── 자막 분할 ────────────────────────────────────────────
// (utils.js에서 임포트, 기존 splitCaptions() 동일)

function flattenBlocksToScenes(script) {
  if (!Array.isArray(script?.blocks) || !script.blocks.length || script.scenes?.length) return script;
  const flatScenes = [];
  let globalMediaIdx = 0;

  script.blocks.forEach((block, bIdx) => {
    const cuts = (block.video_cuts && block.video_cuts.length > 0)
      ? block.video_cuts
      : [{ duration: block.total_duration || 3.0, media_idx: block.media_idx }];

    cuts.forEach((cut, cIdx) => {
      let humanNarration = '';
      if (cIdx === 0 && block.narration) {
        humanNarration = block.narration
          .replace(/\.(?!\.)/g, ' ')
          .replace(/,/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
      flatScenes.push({
        ...cut,
        blockIdx: bIdx,
        isFirstInBlock: cIdx === 0,
        media_idx: cut.media_idx !== undefined
          ? cut.media_idx
          : (block.media_idx !== undefined ? block.media_idx : globalMediaIdx++),
        caption1: cIdx === 0 ? (block.caption || block.caption1 || '') : '',
        caption2: cIdx === 0 ? (block.caption2 || '') : '',
        narration: humanNarration,
        effect: cut.effect || block.effect || 'zoom-in',
        subtitle_style: block.subtitle_style || 'hero',
        energy_level: block.energy_level || 3,
        retention_strategy: block.retention_strategy || 'build',
      });
    });
  });

  console.log(`[Pipeline] blocks 평탄화: ${script.blocks.length}블록 → ${flatScenes.length}씬`);
  return { ...script, scenes: flatScenes };
}

function tokenizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);
}

function tokenOverlapScore(tokens, text) {
  if (!tokens.length) return 0;
  const source = String(text || '').toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (source.includes(t)) score += 1;
  }
  return score;
}

function refineScenesForStoryboard(scenes, files, analysis) {
  if (!Array.isArray(scenes) || !scenes.length) {
    return { scenes: Array.isArray(scenes) ? scenes : [], mediaSwapCount: 0, subtitleFixCount: 0 };
  }

  const refined = scenes.map(sc => ({ ...sc }));
  const analysisMap = {};
  for (const p of (analysis?.per_image || [])) analysisMap[p.idx] = p;
  const allMediaIdxs = files.map((_, i) => i);
  let mediaSwapCount = 0;
  let subtitleFixCount = 0;

  // 전체 스토리보드 확정 후 영상 컷을 사이사이에 배치
  const videoIdxs = files.map((f, i) => (f.type === 'video' ? i : -1)).filter(i => i >= 0);
  if (videoIdxs.length) {
    let videoCursor = 0;
    for (let i = 0; i < refined.length; i++) {
      const curIdx = Number.isInteger(refined[i].media_idx) ? refined[i].media_idx : i;
      const curType = files[curIdx]?.type;
      const preferVideo = i === 0 || i % 2 === 1;
      if (preferVideo && curType !== 'video') {
        refined[i].media_idx = videoIdxs[videoCursor % videoIdxs.length];
        videoCursor++;
        mediaSwapCount++;
      } else if (curType === 'video') {
        videoCursor++;
      }
    }
  }

  // 외관 컷은 마지막 CTA에 고정
  const exteriorIdx = analysis?.per_image?.find(p => p?.is_exterior === true)?.idx;
  if (Number.isInteger(exteriorIdx) && refined.length && files[exteriorIdx]) {
    const lastIdx = refined.length - 1;
    if (refined[lastIdx].media_idx !== exteriorIdx) {
      refined[lastIdx].media_idx = exteriorIdx;
      mediaSwapCount++;
    }
  }

  // 자막-영상 내용 매칭 검증: 텍스트와 focus 설명이 어긋나면 media_idx/자막 보정
  for (let i = 0; i < refined.length; i++) {
    const sc = refined[i];
    const curIdx = Number.isInteger(sc.media_idx) ? sc.media_idx : i;
    const textBundle = `${sc.caption1 || ''} ${sc.caption2 || ''} ${sc.narration || ''}`;
    const tokens = tokenizeText(textBundle);

    if (tokens.length) {
      let bestIdx = curIdx;
      let bestScore = tokenOverlapScore(tokens, `${analysisMap[curIdx]?.focus || ''} ${analysisMap[curIdx]?.narration_hint || ''}`);

      for (const idx of allMediaIdxs) {
        const candText = `${analysisMap[idx]?.focus || ''} ${analysisMap[idx]?.narration_hint || ''}`;
        const s = tokenOverlapScore(tokens, candText);
        if (s > bestScore) {
          bestScore = s;
          bestIdx = idx;
        }
      }

      if (bestIdx !== curIdx && bestScore >= 2) {
        sc.media_idx = bestIdx;
        mediaSwapCount++;
      }
    }

    const capNorm = String(sc.caption1 || '').replace(/\s+/g, '');
    const narNorm = String(sc.narration || '').replace(/\s+/g, '');
    if (capNorm && narNorm && capNorm === narNorm) {
      const shorter = String(sc.caption1 || '').replace(/[.!?]/g, '').trim().slice(0, 12);
      if (shorter && shorter !== sc.caption1) {
        sc.caption1 = shorter;
        subtitleFixCount++;
      }
    }

    const selectedMeta = analysisMap[Number.isInteger(sc.media_idx) ? sc.media_idx : i];
    if (sc.caption1 && !sc.caption2 && selectedMeta?.focus) {
      const capTokens = tokenizeText(sc.caption1);
      if (tokenOverlapScore(capTokens, selectedMeta.focus) === 0) {
        const hint = String(selectedMeta.focus).split(/[,.]/)[0].trim().slice(0, 10);
        if (hint) {
          sc.caption2 = hint;
          subtitleFixCount++;
        }
      }
    }
  }

  return { scenes: refined, mediaSwapCount, subtitleFixCount };
}

// ─── 파이프라인 메인 ──────────────────────────────────────
export async function startMake() {
  const store = useVideoStore.getState();
  const {
    files, restaurantName, selectedTemplate,
    restaurantType, setDetectedRestaurantType,
    setPipeline, donePipelineStep, setScript,
    setAudioBuffers, setLoaded, setShowResult,
    addToast, setAutoStyleName, setTemplate, setHook,
    hidePipeline, resetPipelineProgress, setPipelineSessionId, setAnalysis,
  } = store;

  if (!files.length) { addToast('이미지 또는 영상을 올려주세요', 'err'); return; }
  if (!restaurantName.trim()) { addToast('음식점 이름을 입력해주세요', 'err'); return; }

  const { hasGeminiKey } = await import('./gemini.js');
  if (!hasGeminiKey()) { addToast('Gemini API 키가 필요합니다', 'err'); return; }

  resetPipelineProgress();

  // AudioContext 초기화 (iOS 보안 정책 대응)
  const { audioCtx } = ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
  try {
    const _osc = audioCtx.createOscillator(), _gain = audioCtx.createGain();
    _gain.gain.value = 0;
    _osc.connect(_gain); _gain.connect(audioCtx.destination);
    _osc.start(0); _osc.stop(audioCtx.currentTime + 0.05);
  } catch (_) {}
  if (window.speechSynthesis) {
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
    if (navigator.wakeLock) {
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

    // ── STEP 2: 업체 유형 분류 ────────────────────────────────────────────────
    setPipeline(2, '업체 유형 분류 중...', '음식점 유형에 맞는 파이프라인 전략을 선택합니다');
    let effectiveType = restaurantType && restaurantType !== 'auto' ? restaurantType : '';
    if (!effectiveType) {
      // 사용자가 'auto' 선택 → AI가 자동 분류
      const tempAnalysis = { keywords: [], mood: '', menu: [] };
      const detected = await detectRestaurantType(restaurantName.trim(), tempAnalysis, researchData).catch(() => 'auto');
      effectiveType = detected !== 'auto' ? detected : '';
      if (effectiveType) {
        setDetectedRestaurantType(effectiveType);
        addToast(`업체 유형 감지: ${effectiveType}`, 'inf');
      }
    } else {
      setDetectedRestaurantType(effectiveType);
    }
    donePipelineStep(2);

    // ── STEP 3: 컨텍스트 기반 Vision Analysis ─────────────────────────────────
    // 💡 식당 정보를 먼저 숙지한 AI가 "어떤 사진이 시그니처 메뉴인지" 판단하며 분석합니다
    setPipeline(3, 'AI 컨텍스트 기반 이미지 분석 중...', '식당 데이터 참고 → 시그니처 메뉴 컷 우선 선별');
    const analysis = await visionAnalysis(restaurantName.trim(), researchData, effectiveType);

    // AI 자동 스타일 선택 + 업종별 프리셋 보정
    const curState = useVideoStore.getState();
    const userChoseManually = curState.selectedTemplate !== 'auto';
    const preset = effectiveType ? RESTAURANT_STYLE_PRESETS[effectiveType] : null;

    if (!userChoseManually) {
      const autoTemplate = preset?.template || analysis.recommended_template;
      if (autoTemplate) setTemplate(autoTemplate);

      if (preset?.hook) {
        setHook(preset.hook);
      } else if (analysis.recommended_hook) {
        setHook(analysis.recommended_hook);
      }
    } else if (analysis.recommended_hook) {
      setHook(analysis.recommended_hook);
    }

    const curTemplate = useVideoStore.getState().selectedTemplate;
    const { TEMPLATE_NAMES } = await import('../store/videoStore.js');
    setAutoStyleName(TEMPLATE_NAMES[curTemplate] || curTemplate);
    addToast(
      userChoseManually
        ? `수동 선택: ${TEMPLATE_NAMES[curTemplate] || curTemplate}`
        : `AI 추천: ${TEMPLATE_NAMES[curTemplate] || curTemplate}${effectiveType ? ` · 업종(${effectiveType}) 최적화` : ''}`,
      'inf'
    );
    donePipelineStep(3);
    // analysis 저장 (VideoRenderer의 focus_coords · aesthetic_score 활용)
    setAnalysis(analysis);

    // ── STEP 4: 전체 스토리보드 우선 설계 ─────────────────────────────
    setPipeline(4, '전체 스토리보드 설계 중...', '먼저 내러티브 구조를 완성하고 컷 배치는 다음 단계에서 보정합니다');
    let workingScript = await generateScript(restaurantName.trim(), analysis, useVideoStore.getState().userPrompt, researchData, effectiveType);
    workingScript = flattenBlocksToScenes(workingScript);
    setScript(workingScript);
    donePipelineStep(4);

    // ── STEP 5: 영상 삽입 설계 + 자막 매칭 검증 ─────────────────────────
    setPipeline(5, '영상 컷 삽입 + 자막 매칭 검증 중...', '스토리보드 확정 후 영상 위치와 자막-컷 정합성을 자동 교정합니다');
    const refinedPlan = refineScenesForStoryboard(workingScript.scenes || [], files, analysis);
    workingScript = { ...workingScript, scenes: refinedPlan.scenes };
    setScript(workingScript);
    if (refinedPlan.mediaSwapCount > 0) {
      addToast(`컷 보정 완료: ${refinedPlan.mediaSwapCount}개 씬 media_idx 재배치`, 'ok');
    }
    if (refinedPlan.subtitleFixCount > 0) {
      addToast(`자막 보정 완료: ${refinedPlan.subtitleFixCount}개 씬 자막 수정`, 'ok');
    }
    donePipelineStep(5);

    // ── STEP 6: TTS ─────────────────────────────────────────────────
    setPipeline(6, 'AI 남성 보이스 합성 중...', `Gemini TTS Fenrir — ${workingScript.scenes.length}컷`);
    let audioBuffers;
    try {
      audioBuffers = await generateAllTTS(workingScript.scenes, (msg, type) => addToast(msg, type), workingScript.theme);
    } catch (ttsErr) {
      console.warn('[TTS] 전체 실패, 무음 진행:', ttsErr.message);
      audioBuffers = workingScript.scenes.map(() => null);
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
    while (sceneIdx < workingScript.scenes.length) {
      let sc      = workingScript.scenes[sceneIdx];
      const buf   = audioBuffers[sceneIdx];
      const isBlockCut = sc.blockIdx !== undefined;

      if (isBlockCut) {
        // ── 블록 그룹: 같은 blockIdx 컷 전체를 한 번에 처리 ──
        const blockStart = sceneIdx;
        const blockIdx   = sc.blockIdx;
        while (sceneIdx < workingScript.scenes.length && workingScript.scenes[sceneIdx].blockIdx === blockIdx) sceneIdx++;
        const blockScenes = workingScript.scenes.slice(blockStart, sceneIdx);
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
    workingScript = { ...workingScript, scenes: finalScenes };
    setScript(workingScript);
    setAudioBuffers(audioBuffers);
    donePipelineStep(6);

    // ── STEP 7: 렌더링 준비 + AI 품질 검수 ─────────────────────────────
    setPipeline(7, '렌더링 준비 + 품질 검수 중...', '컷 배치 · 애니메이션 · 효과 적용 후 최종 QA를 수행합니다');
    const loaded = await preloadMedia(files);
    setLoaded(loaded);
    await sleep(200);

    let qcResult = await geminiQualityCheck(workingScript, restaurantName.trim(), effectiveType).catch(() => ({ pass: true }));
    if (!qcResult.pass) {
      addToast(`품질 검수 미달 (${qcResult.total_score}/50) — 스크립트 재생성 중...`, 'inf');
      let retryCount = 0;
      while (!qcResult.pass && retryCount < 2) {
        retryCount++;
        try {
          let retryScript = await generateScript(restaurantName.trim(), analysis, useVideoStore.getState().userPrompt, researchData, effectiveType);
          retryScript = flattenBlocksToScenes(retryScript);
          const retryRefined = refineScenesForStoryboard(retryScript.scenes || [], files, analysis);
          retryScript = { ...retryScript, scenes: retryRefined.scenes };
          // TTS 재생성
          const retryAudioBuffers = await generateAllTTS(retryScript.scenes, () => {}, retryScript.theme).catch(() => retryScript.scenes.map(() => null));
          setScript(retryScript);
          setAudioBuffers(retryAudioBuffers);
          workingScript = retryScript;
          qcResult = await geminiQualityCheck(retryScript, restaurantName.trim(), effectiveType).catch(() => ({ pass: true }));
          if (qcResult.pass) {
            addToast(`재생성 성공 (${retryCount}차) — 품질 통과 ✅`, 'ok');
          } else {
            addToast(`재생성 ${retryCount}차 미달 (${qcResult.total_score}/50)`, 'inf');
          }
        } catch (retryErr) {
          console.warn(`[QC retry ${retryCount}] 재생성 실패:`, retryErr.message);
          break;
        }
      }
      if (!qcResult.pass) addToast('최대 재생성 횟수 초과 — 현재 스크립트로 진행합니다', 'inf');
    } else {
      addToast(`품질 검수 통과 (${qcResult.total_score}/50) ✅`, 'ok');
    }
    donePipelineStep(7);

    // Firebase 저장: 같은 식당명은 기존 데이터 삭제 후 새 결과로 대체
    const latestScriptForSave = useVideoStore.getState().script || workingScript;
    firebaseReplaceRestaurantData(latestScriptForSave, restaurantName, {
      restaurant: latestScriptForSave.restaurant || restaurantName,
      hook_title: latestScriptForSave.marketing?.hook_title || '',
      caption: latestScriptForSave.marketing?.caption || '',
      hashtags_30: latestScriptForSave.marketing?.hashtags_30 || '',
      receipt_review: latestScriptForSave.marketing?.receipt_review || '',
      hook_variations: latestScriptForSave.hook_variations || [],
      naver_clip_tags: latestScriptForSave.naver_clip_tags || '',
      youtube_shorts_tags: latestScriptForSave.youtube_shorts_tags || '',
      instagram_caption: latestScriptForSave.instagram_caption || '',
      tiktok_tags: latestScriptForSave.tiktok_tags || '',
      hashtags: latestScriptForSave.hashtags || '',
      theme: latestScriptForSave.theme || '',
      vibe_color: latestScriptForSave.vibe_color || '',
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
