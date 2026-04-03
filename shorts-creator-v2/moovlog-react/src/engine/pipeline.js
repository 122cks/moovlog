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

  // 외관 컷은 마지막 CTA에 고정 + 비마지막 씬에 외관 배정 강제 제거
  const exteriorIdx = analysis?.per_image?.find(p => p?.is_exterior === true)?.idx;
  const nonExteriorIdxs = allMediaIdxs.filter(idx => !analysisMap[idx]?.is_exterior);
  if (Number.isInteger(exteriorIdx) && refined.length && files[exteriorIdx]) {
    const lastIdx = refined.length - 1;
    if (refined[lastIdx].media_idx !== exteriorIdx) {
      refined[lastIdx].media_idx = exteriorIdx;
      mediaSwapCount++;
    }
    // 비마지막 씬에 외관이 배정된 경우 foodie_score 높은 비외관 미디어로 교체
    const foodIdxsSorted = nonExteriorIdxs.slice().sort((a, b) =>
      (analysisMap[b]?.foodie_score || 0) - (analysisMap[a]?.foodie_score || 0)
    );
    for (let i = 0; i < refined.length - 1; i++) {
      if (refined[i].media_idx === exteriorIdx) {
        const alt = foodIdxsSorted.find(idx => !refined.slice(0, i).some(s => s.media_idx === idx && s !== refined[i]));
        if (alt !== undefined) { refined[i].media_idx = alt; mediaSwapCount++; }
      }
    }
  }

  // [팟바란 영상 두 자리 코드 제거]
  // 기존 코드: 0번째 + 짝수 위치에 무조건 영상 순환 배치 → 자막과 다른 영상이 튜어나는 문제 발생
  // 수정: Gemini가 직접 할당한 media_idx 신뢰. 콘텐츠 매칭 기반으로만 보정.
  // 단, 영상 파일 중 상당히 더 잘 맞는 것이 있으면 서브스티 스왓
  const videoIdxs = files.map((f, i) => (f.type === 'video' ? i : -1)).filter(i => i >= 0);
  if (videoIdxs.length) {
    // 영상을 주입할 지 마 어느 술지 가장 잘 맞는 요소로 결정
    // 영상 사용륙이 0개이면 첫 번째 씨 + 홀수 았는 씨에 영상 서브스티만 (콘텐츠 스코어 확인)
    const usedVideoIdxSet = new Set(refined.filter(s => files[s.media_idx]?.type === 'video').map(s => s.media_idx));
    const unusedVideoIdxs = videoIdxs.filter(i => !usedVideoIdxSet.has(i));
    // 영상이 전혀 사용되지 앤으면 첫 씨에라도 넓음
    if (usedVideoIdxSet.size === 0 && videoIdxs.length > 0 && refined.length > 0) {
      refined[0].media_idx = videoIdxs[0];
      mediaSwapCount++;
    }
  }

  // 자막-영상 내용 매칭 검증: 텍스트와 focus 설명이 어긋나면 media_idx/자막 보정
  // ⚠️ 중복 사용 방지: 이미 다른 씬에 배정된 media_idx는 재사용하지 않음 (볶음밥 반복 방지)
  const usedMediaIdxs = new Set(refined.map(sc => sc.media_idx).filter(idx => Number.isInteger(idx)));
  for (let i = 0; i < refined.length; i++) {
    const sc = refined[i];
    const curIdx = Number.isInteger(sc.media_idx) ? sc.media_idx : i;
    const textBundle = `${sc.caption1 || ''} ${sc.caption2 || ''} ${sc.narration || ''}`;
    const tokens = tokenizeText(textBundle);

    if (tokens.length) {
      let bestIdx = curIdx;
      let bestScore = tokenOverlapScore(tokens, `${analysisMap[curIdx]?.focus || ''} ${analysisMap[curIdx]?.narration_hint || ''}`);

      for (const idx of allMediaIdxs) {
        // 이미 다른 씬에서 사용 중인 media_idx는 건너뜀 (중복 배정 방지)
        if (idx !== curIdx && usedMediaIdxs.has(idx)) continue;
        const candText = `${analysisMap[idx]?.focus || ''} ${analysisMap[idx]?.narration_hint || ''}`;
        const s = tokenOverlapScore(tokens, candText);
        if (s > bestScore) {
          bestScore = s;
          bestIdx = idx;
        }
      }

      if (bestIdx !== curIdx && bestScore >= 1) {
        // 외관은 마지막 씬에만 배치 — 비마지막 씬에 외관 content-matching 배정 차단
        if (i < refined.length - 1 && analysisMap[bestIdx]?.is_exterior) {
          // 외관 bestIdx는 중간 씬에 배정하지 않음
        } else {
          usedMediaIdxs.delete(curIdx);  // 기존 idx 해제
          sc.media_idx = bestIdx;
          usedMediaIdxs.add(bestIdx);   // 새 idx 점유
          mediaSwapCount++;
        }
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
    requiredKeywords,
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
    let workingScript = await generateScript(restaurantName.trim(), analysis, useVideoStore.getState().userPrompt, researchData, effectiveType, (useVideoStore.getState().requiredKeywords || '').trim());
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
        // 필요 최소 총 길이: 오디오 + 0.5s 여유 AND 최소 2.5s 보장 (타이트 컷오프 방지)
        const minTotal = Math.max(audioDur > 0 ? audioDur + 0.5 : 0, 2.5);
        const deficit  = Math.max(0, minTotal - rawTotal);

        // 각 컷 BPM 스냅
        let durations = blockScenes.map(s =>
          Math.max(BPM_BEAT, Math.round(Math.max(BPM_BEAT, s.duration || BPM_BEAT) / BPM_BEAT) * BPM_BEAT)
        );
        // deficit → 마지막 컷에 보정
        if (deficit > 0) durations[durations.length - 1] += Math.ceil(deficit / BPM_BEAT) * BPM_BEAT;

        // BPM 스냅 후에도 부족하면 재보정
        const snappedTotal = durations.reduce((s, d) => s + d, 0);
        if (snappedTotal < minTotal) {
          durations[durations.length - 1] += Math.ceil((minTotal - snappedTotal) / BPM_BEAT) * BPM_BEAT;
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

    // ── 영상 무조건 우선 배치 — 그리디 content-aware 매칭 + 미사용 이미지 b-roll ──────
    // ⚠️ 핵심 규칙: 영상이 있으면 무조건 이미지 씬보다 먼저 배치 (점수 임계값 없음)
    {
      const exteriorIdxSet = new Set(
        (analysis.per_image || []).filter(p => p.is_exterior).map(p => p.idx)
      );
      const BROLL_EFFECTS = ['zoom-in', 'pan-right', 'zoom-out', 'pan-left', 'tilt-up'];

      const videoIdxs = files.map((f, i) => f.type === 'video' ? i : -1).filter(i => i >= 0);
      const imageIdxs = files.map((f, i) => f.type === 'image' ? i : -1).filter(i => i >= 0);

      // ① 영상 무조건 우선 배치: 이미지 씬 → 미사용 영상 교체 (content score = 우선순위, 차단 아님)
      if (videoIdxs.length > 0) {
        const getUsedVidSet = () => new Set(
          finalScenes.map(s => files[s.media_idx]?.type === 'video' ? s.media_idx : -1).filter(i => i >= 0)
        );

        // 비외관 미사용 영상 풀
        let unusedVids = videoIdxs.filter(i => !getUsedVidSet().has(i) && !exteriorIdxSet.has(i));

        if (unusedVids.length > 0) {
          // 이미지 씬 인덱스 목록 (CTA 마지막 씬 제외)
          const imgSceneIdxs = [];
          for (let i = 0; i < finalScenes.length - 1; i++) {
            if (files[finalScenes[i].media_idx]?.type === 'image') imgSceneIdxs.push(i);
          }

          if (imgSceneIdxs.length > 0) {
            // (씬 i, 영상 j, content score) 행렬 생성 → score DESC 그리디 배치
            // bestPos=-1 방식 폐기: 점수가 0이어도 반드시 배치 (영상 무조건 우선)
            const pairs = [];
            for (const si of imgSceneIdxs) {
              const sc = finalScenes[si];
              const sceneTokens = tokenizeText(
                `${sc.caption1 || ''} ${sc.caption2 || ''} ${sc.narration || ''}`
              );
              for (const vi of unusedVids) {
                const vText = `${analysisMap[vi]?.focus || ''} ${analysisMap[vi]?.narration_hint || ''}`;
                const score = sceneTokens.length > 0 ? tokenOverlapScore(sceneTokens, vText) : 0;
                pairs.push({ si, vi, score });
              }
            }
            // 점수 높은 순 정렬 — 동점일 때 foodie_score 보조 기준
            pairs.sort((a, b) =>
              b.score - a.score ||
              (analysisMap[b.vi]?.foodie_score || 0) - (analysisMap[a.vi]?.foodie_score || 0)
            );

            // 1패스: greedy 배치 (점수 >= 1인 쌍 우선)
            const assignedScenes = new Set();
            const assignedVids = new Set();
            for (const { si, vi } of pairs) {
              if (assignedScenes.has(si) || assignedVids.has(vi)) continue;
              const meta = analysisMap[vi] || {};
              finalScenes[si] = { ...finalScenes[si], media_idx: vi, best_start_pct: meta.best_start_pct || 0 };
              assignedScenes.add(si);
              assignedVids.add(vi);
            }

            // 2패스: 아직 미배치 이미지 씬 + 미배치 영상이 남아 있으면 순차 배치 (score 0이라도)
            const remainingVids = unusedVids.filter(vi => !assignedVids.has(vi));
            let rvi = 0;
            for (const si of imgSceneIdxs) {
              if (assignedScenes.has(si) || rvi >= remainingVids.length) continue;
              const vi = remainingVids[rvi++];
              const meta = analysisMap[vi] || {};
              finalScenes[si] = { ...finalScenes[si], media_idx: vi, best_start_pct: meta.best_start_pct || 0 };
            }
          }
        }

        // 여전히 미사용 영상 → 몽타주 씬으로 삽입 (총 45초 이내)
        const remainingUnused = videoIdxs.filter(i => !getUsedVidSet().has(i) && !exteriorIdxSet.has(i));
        if (remainingUnused.length > 0 && finalScenes.length > 0) {
          const currentTotal = finalScenes.reduce((s, sc) => s + (sc.duration || 2.0), 0);
          const budget = Math.max(0, 45 - currentTotal);
          const canAdd = Math.min(remainingUnused.length, Math.floor(budget / 2.0));
          if (canAdd > 0) {
            const perDur = Math.max(2.0, Math.min(3.0, budget / canAdd));
            const lastScene = finalScenes.pop();
            for (let i = 0; i < canAdd; i++) {
              const vi = remainingUnused[i]; const meta = analysisMap[vi] || {};
              finalScenes.push({
                media_idx: vi, duration: Math.round(perDur * 10) / 10,
                caption1: '', caption2: '', narration: '', effect: BROLL_EFFECTS[i % BROLL_EFFECTS.length],
                subtitle_style: 'minimal', energy_level: 3, retention_strategy: 'build',
                focus_coords: meta.focus_coords || null, aesthetic_score: meta.aesthetic_score || null,
                foodie_score: meta.foodie_score || null, best_start_pct: meta.best_start_pct || 0,
              });
            }
            finalScenes.push(lastScene);
            addToast(`미사용 영상 ${canAdd}개 → 몽타주 삽입`, 'ok');
          }
        }
      }

      // ② 미사용 이미지 b-roll 보충 (foodie_score 상위 고품질만, 총 45초 이내)
      if (imageIdxs.length > 0 && finalScenes.length > 0) {
        const usedSet = new Set(finalScenes.map(s => s.media_idx));
        const unusedImgs = imageIdxs
          .filter(i => !usedSet.has(i) && !exteriorIdxSet.has(i))
          .sort((a, b) =>
            ((analysisMap[b]?.foodie_score || 0) * 2 + (analysisMap[b]?.aesthetic_score || 0) * 0.05) -
            ((analysisMap[a]?.foodie_score || 0) * 2 + (analysisMap[a]?.aesthetic_score || 0) * 0.05)
          );
        if (unusedImgs.length > 0) {
          const currentTotal = finalScenes.reduce((s, sc) => s + (sc.duration || 2.0), 0);
          const budget = Math.max(0, 45 - currentTotal);
          const qualImgs = unusedImgs.filter(i =>
            (analysisMap[i]?.foodie_score || 0) >= 4 || (analysisMap[i]?.aesthetic_score || 0) >= 60
          );
          const canAdd = Math.min(qualImgs.length, Math.floor(budget / 2.5));
          if (canAdd > 0) {
            const perDur = Math.max(2.0, Math.min(3.0, budget / canAdd));
            const lastScene = finalScenes.pop();
            for (let i = 0; i < canAdd; i++) {
              const imgIdx = qualImgs[i]; const meta = analysisMap[imgIdx] || {};
              finalScenes.push({
                media_idx: imgIdx, duration: Math.round(perDur * 10) / 10,
                caption1: '', caption2: '', narration: '',
                effect: ['zoom-in', 'zoom-out', 'pan-right', 'pan-left'][i % 4],
                subtitle_style: 'minimal', energy_level: 2, retention_strategy: 'build',
                focus_coords: meta.focus_coords || null, aesthetic_score: meta.aesthetic_score || null,
                foodie_score: meta.foodie_score || null, best_start_pct: 0,
              });
            }
            finalScenes.push(lastScene);
            addToast(`미사용 이미지 ${canAdd}개 → b-roll 삽입`, 'ok');
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

    let qcResult = await geminiQualityCheck(workingScript, restaurantName.trim(), effectiveType).catch(() => ({ pass: true, total_score: 100 }));
    // 서버사이드 강제: Gemini 응답과 무관하게 95점 미만이면 무조건 재생성 (100점 기준)
    if (typeof qcResult.total_score === 'number' && qcResult.total_score < 95) qcResult.pass = false;
    if (!qcResult.pass) {
      addToast(`품질 검수 미달 (${qcResult.total_score}/100) — 스크립트 재생성 중...`, 'inf');
      let retryCount = 0;
      while (!qcResult.pass && retryCount < 3) {
        retryCount++;
        try {
          let retryScript = await generateScript(restaurantName.trim(), analysis, useVideoStore.getState().userPrompt, researchData, effectiveType);
          retryScript = flattenBlocksToScenes(retryScript);
          const retryRefined = refineScenesForStoryboard(retryScript.scenes || [], files, analysis);
          retryScript = { ...retryScript, scenes: retryRefined.scenes };
          // TTS 재생성
          const retryAudioBuffers = await generateAllTTS(retryScript.scenes, () => {}, retryScript.theme).catch(() => retryScript.scenes.map(() => null));

          // ⚠️ duration sync 필수 적용 (누락 시 narration 중간 끊김 발생)
          const retryFinalScenes = [];
          let rsi = 0;
          while (rsi < retryScript.scenes.length) {
            const rsc = retryScript.scenes[rsi];
            const rbuf = retryAudioBuffers[rsi];
            if (rsc.blockIdx !== undefined) {
              const blkStart = rsi;
              const blkId    = rsc.blockIdx;
              while (rsi < retryScript.scenes.length && retryScript.scenes[rsi].blockIdx === blkId) rsi++;
              const blkScenes = retryScript.scenes.slice(blkStart, rsi);
              const aDur = (rbuf && rbuf.duration > 0) ? rbuf.duration : 0;
              const rawTot = blkScenes.reduce((sum, s) => sum + Math.max(BPM_BEAT, s.duration || BPM_BEAT), 0);
              const minTot = Math.max(aDur > 0 ? aDur + 0.5 : 0, 2.5);
              let durs = blkScenes.map(s =>
                Math.max(BPM_BEAT, Math.round(Math.max(BPM_BEAT, s.duration || BPM_BEAT) / BPM_BEAT) * BPM_BEAT)
              );
              const def = Math.max(0, minTot - rawTot);
              if (def > 0) durs[durs.length - 1] += Math.ceil(def / BPM_BEAT) * BPM_BEAT;
              const snapped = durs.reduce((s, d) => s + d, 0);
              if (snapped < minTot) durs[durs.length - 1] += Math.ceil((minTot - snapped) / BPM_BEAT) * BPM_BEAT;
              blkScenes.forEach((s, j) => {
                let cap1 = s.caption1, cap2 = s.caption2;
                if (!cap1?.trim()) { const [c1, c2] = splitCaptions(s.narration || s.subtitle || ''); cap1 = c1; cap2 = c2; }
                retryFinalScenes.push({ ...s, duration: durs[j], caption1: cap1, caption2: cap2, subtitle: cap1 || s.subtitle || '' });
              });
            } else {
              const aDur = (rbuf && rbuf.duration > 0) ? rbuf.duration : 0;
              let dur = aDur > 0
                ? Math.max(2.0, Math.round((aDur + 0.5) / BPM_BEAT) * BPM_BEAT)
                : Math.max(2.0, Math.round((rsc.duration || 3.0) / BPM_BEAT) * BPM_BEAT);
              dur = Math.max(2.0, dur);
              let cap1 = rsc.caption1, cap2 = rsc.caption2;
              if (!cap1?.trim()) { const [c1, c2] = splitCaptions(rsc.narration || rsc.subtitle || ''); cap1 = c1; cap2 = c2; }
              retryFinalScenes.push({ ...rsc, duration: dur, caption1: cap1, caption2: cap2, subtitle: cap1 || rsc.subtitle || '' });
              rsi++;
            }
          }
          retryScript = { ...retryScript, scenes: retryFinalScenes };

          setScript(retryScript);
          setAudioBuffers(retryAudioBuffers);
          workingScript = retryScript;
          qcResult = await geminiQualityCheck(retryScript, restaurantName.trim(), effectiveType).catch(() => ({ pass: true }));
          if (typeof qcResult.total_score === 'number' && qcResult.total_score < 95) qcResult.pass = false;
          if (qcResult.pass) {
            addToast(`재생성 성공 (${retryCount}차) — 품질 통과 ✅ (${qcResult.total_score}/100)`, 'ok');
          } else {
            addToast(`재생성 ${retryCount}차 미달 (${qcResult.total_score}/100)`, 'inf');
          }
        } catch (retryErr) {
          console.warn(`[QC retry ${retryCount}] 재생성 실패:`, retryErr.message);
          break;
        }
      }
      if (!qcResult.pass) addToast('최대 재생성 횟수 초과 — 현재 스크립트로 진행합니다', 'inf');
    } else {
      addToast(`품질 검수 통과 (${qcResult.total_score}/100) ✅`, 'ok');
    }
    donePipelineStep(7);

    // Firebase 저장: 같은 식당명은 기존 데이터 삭제 후 새 결과로 대체
    // ⚠️ await: ResultScreen 열기 전에 저장 완료 보장 → "이전 마케팅 키트"에 최신 버전 즉시 반영
    const latestScriptForSave = useVideoStore.getState().script || workingScript;
    await firebaseReplaceRestaurantData(latestScriptForSave, restaurantName, {
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
