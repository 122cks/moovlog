// src/engine/pipeline.js
// startMake() 파이프라인 — 기존 script.js startMake() 이식 + React store 연동

import { useVideoStore, VIRAL_TRENDS } from '../store/videoStore.js';
import { visionAnalysis, generateScript, researchRestaurant } from './gemini.js';
import { generateAllTTS, ensureAudio, sleep, preprocessNarration } from './tts.js';
import { splitCaptions } from './utils.js';
import { firebaseUploadOriginals, firebaseSaveSession } from './firebase.js';
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

  // 원본 파일 Firebase 백그라운드 업로드
  firebaseUploadOriginals(files, restaurantName, pipelineSessionId).catch(() => {});

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

    // 오디오 길이로 씬 duration 동기화
    const isTrend = VIRAL_TRENDS[useVideoStore.getState().selectedTemplate];
    // analysis.per_image 인덱스 맵 (focus_coords, aesthetic_score 씬에 주입)
    const analysisMap = {};
    for (const p of (analysis.per_image || [])) analysisMap[p.idx] = p;

    const finalScenes = script.scenes.map((sc, i) => {
      const buf = audioBuffers[i];
      let duration;
      if (isTrend && isTrend.durations[i] !== undefined) {
        const trendDur = isTrend.durations[i];
        // 트렌드 길이와 실제 오디오 길이 중 더 긴 쪽 선택 → 나레이션 잘림 방지
        duration = (buf && buf.duration > 0)
          ? Math.max(trendDur, Math.round((buf.duration + 0.3) * 10) / 10)
          : trendDur;
        if (!sc.effect && isTrend.effect) sc = { ...sc, effect: isTrend.effect[i % isTrend.effect.length] };
      } else if (buf && buf.duration > 0) {
        duration = Math.max(2.0, Math.round((buf.duration + 0.4) * 10) / 10);
      } else {
        duration = Math.max(2.0, sc.duration || 3.0);
      }
      // 128 BPM 퀀타이징 (0.46초 단위 스냅)
      // 11번: 128 BPM(0.46875초) 단위 컷으로 트렌디한 비트 동기화
      const BPM_BEAT = 0.46875;
      duration = Math.max(2.0, Math.round(duration / BPM_BEAT) * BPM_BEAT);

      // caption 분할 (AI caption 없을 때 폴백)
      let caption1 = sc.caption1, caption2 = sc.caption2;
      if (!caption1?.trim()) {
        const [c1, c2] = splitCaptions(sc.narration || sc.subtitle || '');
        caption1 = c1; caption2 = c2;
      }
      const subtitle = caption1 || sc.subtitle || '';

      // focus_coords, aesthetic_score, foodie_score, best_start_pct 씨에 주입 (VideoRenderer 활용)
      const imgMeta = analysisMap[sc.media_idx ?? i] || {};
      return { ...sc, duration, caption1, caption2, subtitle,
        focus_coords:    imgMeta.focus_coords    || null,
        aesthetic_score: imgMeta.aesthetic_score || null,
        foodie_score:    imgMeta.foodie_score    || null,
        best_start_pct:  imgMeta.best_start_pct  || 0,
      };
    });

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
