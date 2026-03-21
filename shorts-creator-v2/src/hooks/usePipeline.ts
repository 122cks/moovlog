/* ============================================================
   hooks/usePipeline.ts — 5단계 파이프라인 오케스트레이터
   1. 비전분석  2. 스크립트 생성  3. 스마트 미디어 배정
   4. TTS 합성  5. 미디어 프리로드
   ============================================================ */
import { useAppStore } from '@/store/useAppStore';
import { visionAnalysis, generateScript } from '@/api/gemini';
import { generateAllTTS } from '@/api/tts';
import { getTemplate } from '@/config/templates';
import type { LoadedMedia, MediaItem } from '@/types/state';
import type { VisionAnalysis } from '@/schemas/visionSchema';
import type { GeneratedScript } from '@/schemas/scriptSchema';

/**
 * 파이프라인을 바깥에서 직접 호출하는 함수 (훅이 아닌 일반 함수).
 * Zustand 스토어를 직접 getState()로 접근하므로 컴포넌트 외부에서 호출 가능.
 */
export async function runPipeline(): Promise<void> {
  const store = useAppStore.getState();
  const { files, restaurantName, selectedTemplate, selectedHook } = store;

  store.setPhase('loading');
  store.initSteps([
    { label: '영상/이미지 분석 + 업체 파악',    sub: 'Gemini 2.5 Pro 비전 분석' },
    { label: 'Reels 자막 & 내러티브 생성',       sub: '훅 → 스토리 → CTA 완성' },
    { label: '씬별 미디어 스마트 배정',           sub: '감성 점수 & 씬 유형 기반 매핑' },
    { label: 'AI 남성 보이스 합성',              sub: `Typecast Fenrir — ${files.length}컷` },
    { label: '렌더링 준비',                      sub: '미디어 로드 · 애니메이션 설정' },
  ]);

  try {
    /* ── STEP 1: Vision Analysis ── */
    store.setStep(0, { status: 'running' });
    const analysis = await visionAnalysis(restaurantName, files);

    // AI 자동 선택 적용
    if (selectedTemplate === 'auto' && analysis.recommended_template) {
      store.setTemplate(analysis.recommended_template as Parameters<typeof store.setTemplate>[0]);
    }
    store.setStep(0, { status: 'done', pct: 100 });

    /* ── STEP 2: Script Generation (미디어 순서 비구속) ── */
    store.setStep(1, { status: 'running' });
    const mediaCount = files.length;
    const rawScript = await generateScript(
      restaurantName,
      analysis,
      store.selectedTemplate,
      selectedHook,
      mediaCount,
    );
    store.setStep(1, { status: 'done', pct: 100 });

    /* ── STEP 3: Smart Media Assignment ── */
    store.setStep(2, { status: 'running' });
    const assignedScript = smartAssignMedia(rawScript, analysis, mediaCount);
    const script = {
      ...assignedScript,
      scenes: assignedScript.scenes.map((sc) => ({
        ...sc,
        duration: Math.max(2.0, sc.duration),
      })),
    };
    store.setScript(script);
    store.setStep(2, { status: 'done', pct: 100 });

    /* ── STEP 4: TTS ── */
    store.setStep(3, { status: 'running' });
    const audioCtx = new AudioContext();
    const audioBuffers = await generateAllTTS(script.scenes, audioCtx, ({ sceneIdx, total }) => {
      store.setStep(3, { pct: Math.round((sceneIdx + 1) / total * 100) });
    });

    // 씬 duration을 실제 오디오 길이로 갱신
    audioBuffers.forEach((buf, i) => {
      if (!buf) return;
      const dur = Math.max(2.0, Math.round((buf.duration + 0.4) * 10) / 10);
      store.updateScene(i, { duration: dur });
      store.setAudioBuffer(i, buf);
    });
    store.setStep(3, { status: 'done', pct: 100 });

    /* ── STEP 5: Preload Media ── */
    store.setStep(4, { status: 'running' });
    const loaded = await preloadMedia(files.map((f) => f));
    store.setLoaded(loaded);
    store.setStep(4, { status: 'done', pct: 100 });

    store.setPhase('result');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Pipeline] 오류:', msg);
    store.pushToast(`오류: ${msg}`, 'err');
    store.setPhase('error');
  }
}

/* ── 스마트 미디어 배정 ── */

type MediaMeta = VisionAnalysis['per_image'][number];

/**
 * AI가 생성한 스크립트의 media_idx를 vision analysis 결과를 바탕으로 재배정.
 * - 첫 씬: emotional_score 상위 + hook/hero 타입 우선
 * - 마지막 씬: ambiance/hero 타입 우선
 * - 중반 씬: detail/process/wide 활용, 반복 최소화
 * - AI가 잘못된 인덱스를 줬을 경우에도 안전하게 보정
 */
function smartAssignMedia(
  script: GeneratedScript,
  analysis: VisionAnalysis,
  mediaCount: number,
): GeneratedScript {
  if (mediaCount === 0) return script;

  const allMedia = analysis.per_image.length > 0 ? analysis.per_image : buildFallbackMeta(mediaCount);
  const total    = script.scenes.length;

  // 타입별 분류
  const byType: Record<string, MediaMeta[]> = {};
  for (const m of allMedia) {
    (byType[m.type] ??= []).push(m);
  }

  // 각 그룹을 emotional_score 내림차순 정렬
  const sorted = (type: string): MediaMeta[] =>
    (byType[type] ?? []).sort((a, b) => b.emotional_score - a.emotional_score);

  const hookCandidates    = [...sorted('hook'),    ...sorted('hero')].slice(0, 3);
  const heroCandidates    = [...sorted('hero'),    ...sorted('hook')].slice(0, 3);
  const detailCandidates  = [...sorted('detail'),  ...sorted('process')];
  const ambianceCandidates= [...sorted('ambiance'), ...sorted('wide')];

  // 전체 emotional_score 상위 미디어 (fallback)
  const topAll = [...allMedia].sort((a, b) => b.emotional_score - a.emotional_score);

  const recentIdxWindow: number[] = []; // 최근 쓴 idx (연속 반복 방지)

  const pickFrom = (candidates: MediaMeta[], fallback: MediaMeta[]): number => {
    const pool = candidates.length > 0 ? candidates : fallback;
    // 최근 2개와 겹치지 않는 첫 번째 항목 선택
    for (const m of pool) {
      if (!recentIdxWindow.slice(-2).includes(m.idx)) return m.idx;
    }
    return pool[0]?.idx ?? 0;
  };

  const scenes = script.scenes.map((sc, i) => {
    const relPos = total <= 1 ? 0 : i / (total - 1); // 0=첫씬 ~ 1=마지막씬

    let chosen: number;
    if (i === 0) {
      // 첫 씬: 가장 임팩트 있는 미디어
      chosen = pickFrom(hookCandidates, topAll);
    } else if (i === total - 1 && total > 2) {
      // 마지막 씬: 여운 남는 미디어
      chosen = pickFrom(ambianceCandidates.length > 0 ? ambianceCandidates : heroCandidates, topAll);
    } else if (relPos < 0.45) {
      // 초중반: hero/feature
      chosen = pickFrom(heroCandidates, topAll);
    } else if (relPos < 0.78) {
      // 중반: detail/process
      chosen = pickFrom(detailCandidates.length > 0 ? detailCandidates : topAll, topAll);
    } else {
      // 후반: ambiance/wide
      chosen = pickFrom(ambianceCandidates.length > 0 ? ambianceCandidates : topAll, topAll);
    }

    // AI가 추천한 media_idx가 유효하고 현재 선택과 다르면 블렌딩 (60% AI 반영)
    const aiIdx = sc.media_idx;
    if (aiIdx >= 0 && aiIdx < mediaCount && aiIdx !== chosen) {
      // AI 제안이 top-3 emotional_score 안에 있으면 AI 우선
      const aiRank = topAll.findIndex((m) => m.idx === aiIdx);
      if (aiRank <= 2) chosen = aiIdx;
    }

    recentIdxWindow.push(chosen);
    return { ...sc, media_idx: chosen };
  });

  return { ...script, scenes };
}

/** VisionAnalysis per_image 데이터가 없을 때 인덱스만으로 생성하는 fallback */
function buildFallbackMeta(count: number): MediaMeta[] {
  return Array.from({ length: count }, (_, i) => ({
    idx: i,
    type: (i === 0 ? 'hook' : i === count - 1 ? 'ambiance' : 'detail') as MediaMeta['type'],
    best_effect: 'zoom-in' as MediaMeta['best_effect'],
    emotional_score: count - i,
    suggested_duration: 3,
    focus: '',
    focus_coords: { x: 0.5, y: 0.5 },
  }));
}

async function preloadMedia(
  files: Array<MediaItem>,
): Promise<LoadedMedia[]> {
  return Promise.all(
    files.map(
      (item) =>
        new Promise<LoadedMedia>((resolve, reject) => {
          if (item.type === 'image') {
            const img = new Image();
            img.onload  = () => resolve({ type: 'image', el: img });
            img.onerror = () => reject(new Error(`이미지 로드 실패: ${item.url}`));
            img.src     = item.url;
          } else {
            const vid   = document.createElement('video');
            vid.muted   = true;
            vid.preload = 'auto';
            vid.oncanplaythrough = () => resolve({ type: 'video', el: vid });
            vid.onerror          = () => reject(new Error(`영상 로드 실패: ${item.url}`));
            vid.src              = item.url;
          }
        }),
    ),
  );
}

// getTemplate은 파이프라인 내부에서는 참조용으로만 사용
export { getTemplate };
