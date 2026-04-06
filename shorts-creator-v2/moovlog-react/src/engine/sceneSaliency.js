// src/engine/sceneSaliency.js
// ② Scene & Saliency Detection — 프레임 차이(Frame Difference) 기반 씬 컷 감지
// ③ Timeline Sync — Web Audio API 비트 감지 + EDL(Edit Decision List) 생성
// 브라우저 전용 (Canvas API + Web Audio API), 서버 불필요

// ─── 씬 감지 상수 ───────────────────────────────────────
const SAMPLE_FPS = 2;          // 초당 샘플링 프레임 수 (장면당 평균 4~6 샘플)
const SCENE_THRESHOLD = 0.18;  // 컷 판단 임계값 (0~1, 낮을수록 민감)
const PROC_W = 160;            // 분석용 다운스케일 가로 (빠른 픽셀 비교)
const PROC_H = 90;             // 분석용 다운스케일 세로

// ─── 비트 감지 상수 ───────────────────────────────────────
const HOP_SIZE    = 512;       // spectral flux hop (샘플)
const WINDOW_SIZE = 1024;      // 에너지 윈도우 크기 (샘플)
const MIN_BEAT_GAP = 0.25;     // 최소 비트 간격(초) — 240 BPM 상한

// ───────────────────────────────────────────────────────────
// 내부 유틸
// ───────────────────────────────────────────────────────────

/** video 요소를 timeS 시점으로 이동하여 canvas에 렌더링, RGBA 픽셀 반환 */
async function extractFrame(video, timeS, canvas, ctx) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(null), 3000);
    video.onseeked = () => {
      clearTimeout(timer);
      video.onseeked = null;
      try {
        ctx.clearRect(0, 0, PROC_W, PROC_H);
        ctx.drawImage(video, 0, 0, PROC_W, PROC_H);
        resolve(ctx.getImageData(0, 0, PROC_W, PROC_H).data);
      } catch {
        resolve(null);
      }
    };
    video.currentTime = timeS;
  });
}

/**
 * 두 RGBA 프레임의 평균 절대 차이 반환 (0 = 동일, 1 = 완전 다름)
 * 서브샘플링(매 2픽셀)으로 속도 2배 향상
 */
function frameDiff(a, b) {
  if (!a || !b || a.length !== b.length) return 1.0;
  let sum = 0, count = 0;
  for (let i = 0; i < a.length; i += 8) { // step=2px → 4bytes*2
    sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    count += 3;
  }
  return count > 0 ? sum / (count * 255) : 1.0;
}

/**
 * 클립 내 움직임 점수 (프레임 차이 배열 → saliency 0~1)
 * 적당한 움직임(0.04~0.20)이 최고 점수, 너무 정적이거나 너무 흔들리면 낮음
 */
function calcSaliency(diffs) {
  if (!diffs.length) return 0.5;
  const mean = diffs.reduce((s, d) => s + d, 0) / diffs.length;
  // 목표 범위: 0.06 ± 0.12 (매우 부드러운 움직임이나 적당한 역동성)
  const optimal = 0.06;
  const range   = 0.14;
  const score   = Math.max(0, 1 - Math.abs(mean - optimal) / range);
  return Math.round(score * 100) / 100;
}

// ───────────────────────────────────────────────────────────
// ② 씬 컷 감지 (Scene Change Detection via Frame Difference)
// ───────────────────────────────────────────────────────────

/**
 * 동영상에서 씬 전환점(컷)을 자동 감지합니다.
 * 원리: 연속 프레임 간 픽셀 평균 차이 > threshold → 씬 컷으로 판단
 *
 * @param {File|Blob} videoFile
 * @param {Object}  [opts]
 * @param {number}  [opts.sampleFps=2]    초당 샘플링 프레임 수
 * @param {number}  [opts.threshold=0.18] 컷 판단 임계값 (0~1)
 * @param {number}  [opts.maxDuration=90] 최대 분석 구간(초)
 * @param {Function}[opts.onProgress]      (msg:string) => void
 * @returns {Promise<Array<{
 *   start:number, end:number, duration:number,
 *   saliencyScore:number, best_start_pct:number,
 *   avg_diff:number
 * }>>}
 */
export async function detectSceneCuts(videoFile, {
  sampleFps = SAMPLE_FPS,
  threshold = SCENE_THRESHOLD,
  maxDuration = 90,
  onProgress,
} = {}) {
  return new Promise(resolve => {
    const video = Object.assign(document.createElement('video'), {
      muted: true, playsInline: true, preload: 'metadata',
    });
    const canvas = Object.assign(document.createElement('canvas'), { width: PROC_W, height: PROC_H });
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const url = URL.createObjectURL(videoFile);

    // 30초 글로벌 타임아웃 — 폴백으로 단일 세그먼트 반환
    const fallback = (dur) => {
      cleanup();
      resolve([{ start: 0, end: dur, duration: dur, saliencyScore: 0.5, best_start_pct: 0, avg_diff: 0 }]);
    };
    const globalTimer = setTimeout(() => fallback(10), 30_000);

    const cleanup = () => {
      clearTimeout(globalTimer);
      URL.revokeObjectURL(url);
      video.src = '';
      video.load();
    };

    video.onerror = () => { cleanup(); resolve([]); };

    const metaTimer = setTimeout(() => { video.onloadedmetadata = null; fallback(10); }, 8000);

    video.onloadedmetadata = async () => {
      clearTimeout(metaTimer);
      const totalDur = Math.min(isFinite(video.duration) ? video.duration : 10, maxDuration);
      if (totalDur < 0.5) { fallback(totalDur); return; }

      const step  = 1 / sampleFps;
      const times = [];
      for (let t = 0; t < totalDur - 0.05; t += step) {
        times.push(parseFloat(Math.min(t, totalDur - 0.05).toFixed(3)));
      }

      // 프레임 순차 추출 (seek → draw)
      const frames = [];
      for (let i = 0; i < times.length; i++) {
        if (i % 6 === 0) onProgress?.(`씬 분석 ${Math.round((i / times.length) * 100)}%`);
        const pixels = await extractFrame(video, times[i], canvas, ctx);
        frames.push({ time: times[i], pixels });
      }

      // 프레임 간 차이 계산
      const diffs = [];
      for (let i = 1; i < frames.length; i++) {
        diffs.push(frameDiff(frames[i - 1].pixels, frames[i].pixels));
      }

      // 씬 컷 포인트 탐지 (임계값 초과 시 컷)
      const cutTimes = [0];
      for (let i = 0; i < diffs.length; i++) {
        if (diffs[i] >= threshold) cutTimes.push(times[i + 1]);
      }
      cutTimes.push(totalDur);

      // 세그먼트 빌드
      const segments = [];
      for (let i = 0; i < cutTimes.length - 1; i++) {
        const start = cutTimes[i];
        const end   = cutTimes[i + 1];
        const dur   = end - start;
        if (dur < 0.3) continue; // 너무 짧은 세그먼트 제거

        const segDiffs = diffs.filter((_, di) => {
          const t = times[di + 1];
          return t >= start && t < end;
        });
        const saliency = calcSaliency(segDiffs);
        const avgDiff  = segDiffs.length
          ? segDiffs.reduce((s, d) => s + d, 0) / segDiffs.length
          : 0;

        segments.push({
          start:          Math.round(start * 1000) / 1000,
          end:            Math.round(end   * 1000) / 1000,
          duration:       Math.round(dur   * 1000) / 1000,
          saliencyScore: saliency,
          best_start_pct: parseFloat((start / totalDur).toFixed(4)),
          avg_diff:       Math.round(avgDiff * 10000) / 10000,
        });
      }

      cleanup();
      if (segments.length === 0) {
        resolve([{ start: 0, end: totalDur, duration: totalDur, saliencyScore: 0.5, best_start_pct: 0, avg_diff: 0 }]);
      } else {
        resolve(segments);
      }
    };

    video.src = url;
    video.load();
  });
}

// ───────────────────────────────────────────────────────────
// ③ 비트 감지 (Beat Detection via Web Audio API Spectral Flux)
// ───────────────────────────────────────────────────────────

/**
 * 오디오 파일에서 비트(박자) 타이밍을 감지합니다.
 * 원리: PCM → RMS 에너지 → Spectral Flux → 적응형 임계값 → 피크 선별
 *
 * @param {File|Blob} audioFile
 * @returns {Promise<number[]>} 비트 타임스탬프 배열 (초 단위)
 */
export async function detectBeatTimings(audioFile) {
  try {
    const arrayBuffer = await audioFile.arrayBuffer();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let audioBuffer;
    try {
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } finally {
      ctx.close().catch(() => {});
    }

    const sampleRate = audioBuffer.sampleRate;
    // 다채널 → 모노 믹스다운
    const samples = audioBuffer.numberOfChannels === 1
      ? audioBuffer.getChannelData(0)
      : (() => {
          const L = audioBuffer.getChannelData(0);
          const R = audioBuffer.getChannelData(1);
          const mono = new Float32Array(L.length);
          for (let i = 0; i < L.length; i++) mono[i] = (L[i] + R[i]) * 0.5;
          return mono;
        })();

    // RMS 에너지 계산 (HOP_SIZE 간격)
    const energies = [];
    for (let i = 0; i + WINDOW_SIZE <= samples.length; i += HOP_SIZE) {
      let sum = 0;
      for (let j = i; j < i + WINDOW_SIZE; j++) sum += samples[j] * samples[j];
      energies.push(Math.sqrt(sum / WINDOW_SIZE));
    }

    // Spectral flux: 에너지 양의 증가분 (onset 지표)
    const flux = [0];
    for (let i = 1; i < energies.length; i++) {
      flux.push(Math.max(0, energies[i] - energies[i - 1]));
    }

    // 적응형 임계값: 로컬 평균 × 1.8 (±1초 윈도우)
    const localWin = Math.round(sampleRate / HOP_SIZE);
    const thresholds = flux.map((_, i) => {
      const lo = Math.max(0, i - localWin);
      const hi = Math.min(flux.length - 1, i + localWin);
      let localMean = 0;
      for (let k = lo; k <= hi; k++) localMean += flux[k];
      localMean /= (hi - lo + 1);
      return localMean * 1.8;
    });

    // 피크 선별 (로컬 최대 + 임계값 초과 + 최소 간격)
    const minHopGap = Math.round(MIN_BEAT_GAP * sampleRate / HOP_SIZE);
    const beats = [];
    let lastBeatHop = -minHopGap;
    for (let i = 1; i < flux.length - 1; i++) {
      if (
        flux[i] > thresholds[i] &&
        flux[i] >= flux[i - 1] &&
        flux[i] >= flux[i + 1] &&
        i - lastBeatHop >= minHopGap
      ) {
        beats.push(Math.round(((i * HOP_SIZE) / sampleRate) * 1000) / 1000);
        lastBeatHop = i;
      }
    }

    console.log(`[SceneSaliency] 비트 감지 완료: ${beats.length}개 (${audioBuffer.duration.toFixed(1)}초)`);
    return beats;
  } catch (e) {
    console.warn('[SceneSaliency] 비트 감지 실패:', e.message);
    return [];
  }
}

// ───────────────────────────────────────────────────────────
// ③ EDL 생성 (Edit Decision List — 비트 동기화 타임라인)
// ───────────────────────────────────────────────────────────

/**
 * 씬 컷 클립들을 비트 타이밍에 맞춰 EDL을 생성합니다.
 * 각 씬 클립을 가장 가까운 비트 경계에 스냅하여 음악과 영상의 동기화를 실현합니다.
 *
 * @param {Array}  sceneCuts      detectSceneCuts() 반환값
 * @param {number[]} beatTimings  detectBeatTimings() 반환값
 * @param {number} targetDuration 목표 총 영상 길이 (초)
 * @returns {Array<{
 *   sceneIdx:number, clipStart:number, clipEnd:number,
 *   duration:number, best_start_pct:number, saliencyScore:number
 * }>}
 */
export function buildBeatAlignedEDL(sceneCuts, beatTimings, targetDuration = 30) {
  if (!sceneCuts.length) return [];

  // 비트 없이 → Saliency 정렬 후 targetDuration만큼 채우기
  if (!beatTimings.length) {
    let cum = 0;
    return sceneCuts
      .slice()
      .sort((a, b) => b.saliencyScore - a.saliencyScore)
      .filter(sc => { if (cum >= targetDuration) return false; cum += sc.duration; return true; })
      .map((sc, i) => ({
        sceneIdx: i,
        clipStart: sc.start,
        clipEnd:   sc.end,
        duration:  sc.duration,
        best_start_pct: sc.best_start_pct,
        saliencyScore:  sc.saliencyScore,
      }));
  }

  // 비트 기반 EDL: 씬마다 다음 비트에 duration 스냅
  const beats = beatTimings.filter(t => t <= targetDuration);
  const result = [];
  let timePos  = 0;
  let beatIdx  = 0;

  for (let i = 0; i < sceneCuts.length && timePos < targetDuration; i++) {
    const sc = sceneCuts[i];

    // 현재 시각 + 최소 0.5초 이후의 첫 비트 탐색
    while (beatIdx < beats.length && beats[beatIdx] <= timePos + 0.5) beatIdx++;

    // 다음 비트 시각 (없으면 씬 자체 duration 사용)
    const beatEnd  = beatIdx < beats.length
      ? beats[beatIdx]
      : Math.min(timePos + Math.max(sc.duration, 1.0), targetDuration);
    const snapDur  = Math.max(0.5, Math.min(beatEnd - timePos, targetDuration - timePos));

    result.push({
      sceneIdx:       i,
      clipStart:      sc.start,
      clipEnd:        sc.end,
      duration:       Math.round(snapDur * 1000) / 1000,
      best_start_pct: sc.best_start_pct,
      saliencyScore:  sc.saliencyScore,
    });

    timePos += snapDur;
    beatIdx++;
  }

  return result;
}

// ───────────────────────────────────────────────────────────
// Pipeline 통합: visionAnalysis 결과에 씬 데이터 병합
// ───────────────────────────────────────────────────────────

/**
 * visionAnalysis의 per_image 데이터에 씬 컷 분석 결과를 병합합니다.
 * - 영상 파일만 대상으로 분석
 * - best_start_pct를 실제 saliency 최고 구간으로 갱신
 * - scene_cuts 배열 추가 (VideoRenderer의 -ss 인수 정밀화에 활용)
 *
 * @param {Array}    files    videoStore.files [{file, url, type}]
 * @param {Object}   analysis visionAnalysis() 반환값
 * @param {Function} [onProgress]
 * @returns {Promise<Object>} 보강된 analysis
 */
export async function enrichAnalysisWithSceneData(files, analysis, onProgress) {
  if (!analysis?.per_image?.length) return analysis;

  // 영상 파일만 필터
  const videoEntries = analysis.per_image.filter(p => files[p.idx]?.type === 'video');
  if (!videoEntries.length) return analysis;

  onProgress?.('영상 씬 자동 분석 중 (Scene Detection)...');
  console.log(`[SceneSaliency] ${videoEntries.length}개 영상 처리 시작`);

  // 깊은 복사 (원본 analysis 불변)
  const enriched = {
    ...analysis,
    per_image: analysis.per_image.map(p => ({ ...p })),
  };

  for (const entry of enriched.per_image.filter(p => files[p.idx]?.type === 'video')) {
    const fileItem = files[entry.idx];
    if (!fileItem) continue;

    try {
      // File 객체 가져오기 (src가 blob URL이면 File이 있을 것)
      const videoBlob = fileItem.file instanceof File
        ? fileItem.file
        : fileItem.url
          ? await fetch(fileItem.url).then(r => r.blob()).catch(() => null)
          : null;
      if (!videoBlob) continue;

      const cuts = await detectSceneCuts(videoBlob, {
        sampleFps: SAMPLE_FPS,
        threshold: SCENE_THRESHOLD,
        onProgress: (msg) => onProgress?.(`영상 ${entry.idx + 1}: ${msg}`),
      });

      if (cuts.length > 0) {
        // Saliency 점수 최대인 세그먼트를 best_start_pct로
        const bestCut = cuts.reduce((a, b) => b.saliencyScore > a.saliencyScore ? b : a);

        // Gemini가 지정한 best_start_pct가 없거나, 우리가 찾은 게 훨씬 나을 때만 덮어씀
        if (!entry.best_start_pct || entry.best_start_pct === 0 || bestCut.saliencyScore > 0.35) {
          entry.best_start_pct = bestCut.best_start_pct;
        }
        entry.scene_cuts   = cuts;
        entry.scene_count  = cuts.length;
        entry.top_saliency = bestCut.saliencyScore;

        console.log(
          `[SceneSaliency] 영상 ${entry.idx}: ${cuts.length}개 컷, ` +
          `best_start=${bestCut.best_start_pct.toFixed(3)}, saliency=${bestCut.saliencyScore}`
        );
      }
    } catch (e) {
      console.warn(`[SceneSaliency] 영상 ${entry.idx} 분석 실패:`, e.message);
    }
  }

  return enriched;
}
