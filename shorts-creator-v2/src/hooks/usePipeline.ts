/* ============================================================
   hooks/usePipeline.ts — 4단계 파이프라인 오케스트레이터
   (useAppStore dispatch 패턴 — 어디서 실수해도 로그가 찍힘)
   ============================================================ */
import { useAppStore } from '@/store/useAppStore';
import { visionAnalysis, generateScript } from '@/api/gemini';
import { generateAllTTS } from '@/api/tts';
import { getTemplate } from '@/config/templates';
import type { LoadedMedia } from '@/types/state';

/**
 * 파이프라인을 바깥에서 직접 호출하는 함수 (훅이 아닌 일반 함수).
 * Zustand 스토어를 직접 getState()로 접근하므로 컴포넌트 외부에서 호출 가능.
 */
export async function runPipeline(): Promise<void> {
  const store = useAppStore.getState();
  const { files, restaurantName, selectedTemplate, selectedHook } = store;

  store.setPhase('loading');
  store.initSteps([
    { label: '이미지 분석 + 스타일 자동 선택', sub: 'Gemini 2.5 Pro 비전 분석' },
    { label: 'Reels 스토리보드 생성',          sub: 'Hook → 감성 → CTA 내러티브' },
    { label: 'AI 남성 보이스 합성',             sub: `Typecast Fenrir — ${files.length}컷` },
    { label: '렌더링 준비',                     sub: '미디어 로드 · 애니메이션 설정' },
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

    /* ── STEP 2: Script Generation ── */
    store.setStep(1, { status: 'running' });
    const rawScript = await generateScript(restaurantName, analysis, store.selectedTemplate, selectedHook);
    const script = {
      ...rawScript,
      scenes: rawScript.scenes.map((sc) => ({
        ...sc,
        // 음성 합성 전 임시 duration — TTS 후 덮어씀
        duration: Math.max(2.0, sc.duration),
      })),
    };
    store.setScript(script);
    store.setStep(1, { status: 'done', pct: 100 });

    /* ── STEP 3: TTS ── */
    store.setStep(2, { status: 'running' });
    const audioCtx = new AudioContext();
    const audioBuffers = await generateAllTTS(script.scenes, audioCtx, ({ sceneIdx, total }) => {
      store.setStep(2, { pct: Math.round((sceneIdx + 1) / total * 100) });
    });

    // 씬 duration을 실제 오디오 길이로 갱신
    audioBuffers.forEach((buf, i) => {
      if (!buf) return;
      const dur = Math.max(2.0, Math.round((buf.duration + 0.4) * 10) / 10);
      store.updateScene(i, { duration: dur });
      store.setAudioBuffer(i, buf);
    });
    store.setStep(2, { status: 'done', pct: 100 });

    /* ── STEP 4: Preload Media ── */
    store.setStep(3, { status: 'running' });
    const loaded = await preloadMedia(files.map((f) => f));
    store.setLoaded(loaded);
    store.setStep(3, { status: 'done', pct: 100 });

    store.setPhase('result');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Pipeline] 오류:', msg);
    store.pushToast(`오류: ${msg}`, 'err');
    store.setPhase('error');
  }
}

async function preloadMedia(
  files: Array<{ url: string; type: 'image' | 'video' }>,
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
