/* ============================================================
   store/useAppStore.ts — Zustand 전역 상태 스토어
   기존 script.js의 전역 `S` 객체 + 수동 DOM 조작을 대체.
   모든 상태 변경은 이 스토어의 액션을 통해서만 발생한다.
   ============================================================ */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppState, MediaItem, LoadedMedia, VideoScript, Toast, PipelinePhase, StepProgress } from '@/types/state';
import type { TemplateKey, HookKey } from '@/types/state';

/* ── 액션 타입 정의 ── */
interface AppActions {
  // 미디어
  addFiles:       (files: MediaItem[]) => void;
  removeFile:     (idx: number) => void;
  setLoaded:      (loaded: LoadedMedia[]) => void;

  // 입력
  setRestaurantName: (name: string) => void;
  setTemplate:    (tpl: TemplateKey) => void;
  setHook:        (hook: HookKey) => void;

  // 스크립트 & 오디오
  setScript:      (script: VideoScript) => void;
  setAudioBuffer: (idx: number, buf: AudioBuffer | null) => void;

  // 재생 상태
  setPlaying:     (playing: boolean) => void;
  toggleMuted:    () => void;
  setScene:       (scene: number) => void;
  setSubAnimProg: (prog: number) => void;

  // 편집
  setEditingScene: (idx: number | null) => void;
  updateScene:     (idx: number, patch: Partial<VideoScript['scenes'][number]>) => void;

  // 파이프라인
  setPhase:       (phase: PipelinePhase) => void;
  setStep:        (idx: number, patch: Partial<StepProgress>) => void;
  initSteps:      (steps: Pick<StepProgress, 'label' | 'sub'>[]) => void;

  // 내보내기
  setExporting:   (v: boolean) => void;
  setExportProgress: (v: number) => void;

  // 토스트
  pushToast:      (msg: string, type: Toast['type']) => void;
  removeToast:    (id: string) => void;

  // 리셋
  reset:          () => void;
}

/* ── 초기 상태 ── */
const INITIAL: AppState & { toasts: Toast[] } = {
  files: [],
  restaurantName: '',
  selectedTemplate: 'auto',
  selectedHook: 'question',
  loaded: [],
  script: null,
  audioBuffers: [],
  playing: false,
  muted: false,
  scene: 0,
  subAnimProg: 0,
  editingSceneIdx: null,
  phase: 'idle',
  stepProgress: [],
  exporting: false,
  exportProgress: 0,
  toasts: [],
};

export const useAppStore = create<AppState & { toasts: Toast[] } & AppActions>()(
  devtools(
    (set, get) => ({
      ...INITIAL,

      /* ── 미디어 ── */
      addFiles: (files) =>
        set((s) => ({ files: [...s.files, ...files].slice(0, 10) }), false, 'addFiles'),

      removeFile: (idx) =>
        set((s) => ({ files: s.files.filter((_, i) => i !== idx) }), false, 'removeFile'),

      setLoaded: (loaded) => set({ loaded }, false, 'setLoaded'),

      /* ── 입력 ── */
      setRestaurantName: (restaurantName) => set({ restaurantName }, false, 'setRestaurantName'),
      setTemplate: (selectedTemplate) => set({ selectedTemplate }, false, 'setTemplate'),
      setHook: (selectedHook) => set({ selectedHook }, false, 'setHook'),

      /* ── 스크립트 & 오디오 ── */
      setScript: (script) =>
        set({ script, audioBuffers: new Array(script.scenes.length).fill(null) }, false, 'setScript'),

      setAudioBuffer: (idx, buf) =>
        set((s) => {
          const audioBuffers = [...s.audioBuffers];
          audioBuffers[idx] = buf;
          return { audioBuffers };
        }, false, 'setAudioBuffer'),

      /* ── 재생 ── */
      setPlaying: (playing) => set({ playing }, false, 'setPlaying'),
      toggleMuted: () => set((s) => ({ muted: !s.muted }), false, 'toggleMuted'),
      setScene: (scene) => set({ scene, subAnimProg: 0 }, false, 'setScene'),
      setSubAnimProg: (subAnimProg) => set({ subAnimProg }, false, 'setSubAnimProg'),

      /* ── 편집 ── */
      setEditingScene: (editingSceneIdx) => set({ editingSceneIdx }, false, 'setEditingScene'),

      updateScene: (idx, patch) =>
        set((s) => {
          if (!s.script) return {};
          const scenes = s.script.scenes.map((sc, i) => (i === idx ? { ...sc, ...patch } : sc));
          return { script: { ...s.script, scenes } };
        }, false, 'updateScene'),

      /* ── 파이프라인 ── */
      setPhase: (phase) => set({ phase }, false, 'setPhase'),

      initSteps: (steps) =>
        set({
          stepProgress: steps.map((s) => ({ ...s, status: 'pending' as const, pct: 0 })),
        }, false, 'initSteps'),

      setStep: (idx, patch) =>
        set((s) => {
          const stepProgress = s.stepProgress.map((sp, i) => (i === idx ? { ...sp, ...patch } : sp));
          return { stepProgress };
        }, false, 'setStep'),

      /* ── 내보내기 ── */
      setExporting: (exporting) => set({ exporting }, false, 'setExporting'),
      setExportProgress: (exportProgress) => set({ exportProgress }, false, 'setExportProgress'),

      /* ── 토스트 ── */
      pushToast: (message, type) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }), false, 'pushToast');
        // 4초 후 자동 제거
        setTimeout(() => get().removeToast(id), 4000);
      },

      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }), false, 'removeToast'),

      /* ── 리셋 ── */
      reset: () => set(INITIAL, false, 'reset'),
    }),
    { name: 'moovlog-app-store' },
  ),
);

/* ── 편의 셀렉터 훅 (렌더링 범위 최소화) ── */
export const useToasts       = () => useAppStore((s) => s.toasts);
export const useCurrentScene = () => useAppStore((s) => s.script?.scenes[s.scene]);
export const useIsLoading    = () => useAppStore((s) => s.phase === 'loading');
export const useAudioReady   = () =>
  useAppStore((s) => s.audioBuffers.length > 0 && s.audioBuffers.every(Boolean));
