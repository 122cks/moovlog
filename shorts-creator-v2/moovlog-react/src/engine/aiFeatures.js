// src/engine/aiFeatures.js  v2.73
// AI 자동 편집 기능 — Gemini API 활용 (#51-65)
// · 씬 자동 매칭, 자막 생성, 비트 감지, 해시태그 생성, 자동 숏폼 분할

/** Gemini API 기본 URL */
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-1.5-flash';

function getGeminiKey() {
  return import.meta.env?.VITE_GEMINI_API_KEY || '';
}

async function geminiGenerate(prompt, options = {}) {
  const key = getGeminiKey();
  if (!key) throw new Error('VITE_GEMINI_API_KEY 환경변수가 없습니다');

  const res = await fetch(`${GEMINI_URL}/${GEMINI_MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1024,
        responseMimeType: options.json ? 'application/json' : 'text/plain',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Gemini API 오류 ${res.status}: ${err.slice(0, 120)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// #51  블로그 → 씬 자동 매칭
// ═══════════════════════════════════════════════════════════════════════════
/**
 * 블로그 텍스트를 분석해 씬 순서와 키워드를 자동으로 할당
 * @param {string} blogText - 블로그 본문
 * @param {number} sceneCount - 총 씬 수
 * @returns {Promise<Array<{index:number, keyword:string, duration:number, description:string}>>}
 */
export async function autoMatchScenes(blogText, sceneCount = 6) {
  const prompt = `
당신은 맛집 숏폼 영상 편집 AI입니다.
아래 블로그 글을 분석해서, ${sceneCount}개의 영상 씬에 어울리는 키워드와 추천 시간(초)을 JSON으로 반환하세요.

블로그:
"""
${blogText.slice(0, 1500)}
"""

출력 형식 (JSON 배열, 다른 텍스트 없이):
[
  {"index": 0, "keyword": "훅", "duration": 3, "description": "첫 3초 임팩트 씬"},
  {"index": 1, "keyword": "메뉴 소개", "duration": 4, "description": "대표 메뉴"},
  ...
]
`.trim();

  try {
    const raw = await geminiGenerate(prompt, { json: true, temperature: 0.5 });
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[aiFeatures] autoMatchScenes 실패:', e.message);
    return Array.from({ length: sceneCount }, (_, i) => ({
      index: i,
      keyword: ['훅', '메뉴', '분위기', '클로즈업', '맛', '아웃트로'][i] || `씬${i + 1}`,
      duration: i === 0 ? 3 : 4,
      description: `씬 ${i + 1}`,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// #52  자동 자막 생성 (Web Speech API 기반 스텁)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * 오디오 버퍼에서 자막 생성 (브라우저 Web Speech API 스텁)
 * 실제 배포 시 Whisper API / Google STT 연동으로 교체 권장
 * @param {AudioBuffer|null} audioBuffer
 * @param {number} startTime - 씬 시작 시간(초)
 * @param {string} [hintText] - STT 힌트 문자열
 * @returns {Promise<string>}
 */
export async function generateSubtitle(audioBuffer, startTime, hintText = '') {
  // Electron 환경: main process STT IPC 호출
  if (typeof window !== 'undefined' && window.electronAPI?.generateSubtitle) {
    return window.electronAPI.generateSubtitle(startTime, hintText);
  }

  // 웹 환경: Gemini로 스크립트 기반 자막 추론
  if (hintText?.length > 10) {
    const prompt = `
아래 스크립트에서 ${startTime}초 부근의 씬에 적합한 자막을 한 문장(20자 이내)으로 추출하세요.
스크립트: "${hintText.slice(0, 400)}"
자막만 출력 (따옴표 없이):
`.trim();
    try {
      return await geminiGenerate(prompt, { temperature: 0.4, maxTokens: 64 });
    } catch { /* fallback */ }
  }
  return '';
}

// ═══════════════════════════════════════════════════════════════════════════
// #53  비트 드롭 감지 (Web Audio API — 주파수 분석)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * AudioBuffer에서 세기가 급증하는 비트 드롭 타임스탬프 검출
 * @param {AudioBuffer} buffer
 * @param {number} threshold - 감지 임계값 (0~1, 기본 0.7)
 * @returns {number[]} 비트 드롭 타임스탬프(초) 배열
 */
export function detectBeatDrops(buffer, threshold = 0.7) {
  if (!buffer) return [];
  const data        = buffer.getChannelData(0);
  const SR          = buffer.sampleRate;
  const windowSize  = Math.floor(SR * 0.05);  // 50ms 윈도우
  const beats       = [];
  let lastBeat      = -1;

  for (let i = 0; i + windowSize < data.length; i += Math.floor(windowSize / 2)) {
    let rms = 0;
    for (let j = i; j < i + windowSize; j++) rms += data[j] * data[j];
    rms = Math.sqrt(rms / windowSize);

    if (rms > threshold && i / SR - lastBeat > 0.3) {
      beats.push(+(i / SR).toFixed(2));
      lastBeat = i / SR;
    }
  }
  return beats;
}

// ═══════════════════════════════════════════════════════════════════════════
// #54  감성 기반 LUT 추천
// ═══════════════════════════════════════════════════════════════════════════
/**
 * 블로그 텍스트의 감성(분위기)을 분석해 LUT 테마 추천
 * @param {string} text
 * @returns {Promise<string>} LUT 테마 ID
 */
export async function suggestLUT(text) {
  const themes = ['hansik', 'cinema', 'vivid', 'retro', 'bw', 'warm', 'cool', 'food', 'night', 'spring'];
  const prompt = `
아래 맛집 설명을 보고 영상 색감 테마를 하나만 선택하세요.
선택지: ${themes.join(', ')}
설명: "${text.slice(0, 300)}"
테마 이름만 출력:
`.trim();

  try {
    const result = await geminiGenerate(prompt, { temperature: 0.3, maxTokens: 16 });
    const found  = themes.find(t => result.toLowerCase().includes(t));
    return found || 'food';
  } catch {
    return 'food';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// #55  해시태그 자동 생성 (#82 소셜 마케팅 연동)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * 식당 정보를 입력받아 플랫폼별 해시태그 생성
 * @param {string} restaurantName
 * @param {string} [script] - 영상 스크립트 요약
 * @param {'instagram'|'tiktok'|'naver'|'all'} [platform]
 * @returns {Promise<{instagram:string, tiktok:string, naver:string}>}
 */
export async function suggestHashtags(restaurantName, script = '', platform = 'all') {
  const prompt = `
당신은 맛집 SNS 마케터입니다.
식당명: ${restaurantName}
내용: ${script.slice(0, 300)}

아래 JSON 형식으로 플랫폼별 해시태그를 생성하세요:
{
  "instagram": "#해시태그1 #해시태그2 ... (20개)",
  "tiktok": "#해시태그1 #해시태그2 ... (15개)",
  "naver": "#해시태그1 #해시태그2 ... (10개)"
}
JSON만 출력:
`.trim();

  try {
    const raw = await geminiGenerate(prompt, { json: true, temperature: 0.7 });
    return JSON.parse(raw);
  } catch {
    const base = `#맛집 #${restaurantName.replace(/\s/g, '')} #맛스타그램 #먹스타그램 #foodie`;
    return { instagram: base, tiktok: base, naver: base };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// #56  자동 숏폼 분할 (씬 → 15/30/60초 클립)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * 씬 배열을 목표 시간에 맞게 자동 분할
 * @param {Array<{duration:number}>} scenes
 * @param {number} targetDuration - 목표 클립 길이(초, 기본 30)
 * @returns {Array<{clips: number[], totalDuration: number}>}
 */
export function autoSplitToShorts(scenes, targetDuration = 30) {
  const clips = [];
  let current = [];
  let total   = 0;

  scenes.forEach((sc, idx) => {
    const dur = sc.duration || 3;
    if (total + dur > targetDuration && current.length > 0) {
      clips.push({ clips: [...current], totalDuration: total });
      current = [];
      total   = 0;
    }
    current.push(idx);
    total += dur;
  });

  if (current.length > 0) clips.push({ clips: current, totalDuration: total });
  return clips;
}

// ═══════════════════════════════════════════════════════════════════════════
// #57  Ken Burns 효과 파라미터 자동 생성
// ═══════════════════════════════════════════════════════════════════════════
/**
 * 씬 정보를 바탕으로 Ken Burns(줌인/아웃/팬) 효과 파라미터 생성
 * @param {number} sceneIndex
 * @param {number} duration
 * @returns {{ zoompan: string }} FFmpeg zoompan 필터 문자열
 */
export function getKenBurnsFilter(sceneIndex, duration) {
  const effects = [
    // 줌인 (중앙→확대)
    `zoompan=z='min(zoom+0.0015,1.5)':d=${Math.floor(duration * 25)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920`,
    // 줌아웃 (확대→중앙)
    `zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=${Math.floor(duration * 25)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920`,
    // 좌→우 팬
    `zoompan=z=1.3:d=${Math.floor(duration * 25)}:x='if(between(on,1,${Math.floor(duration * 25)}),iw/2-(iw/zoom/2)+((iw-(iw/zoom))*on/${Math.floor(duration * 25)}),iw/2-(iw/zoom/2))':y='ih/2-(ih/zoom/2)':s=1080x1920`,
    // 우→좌 팬
    `zoompan=z=1.3:d=${Math.floor(duration * 25)}:x='if(between(on,1,${Math.floor(duration * 25)}),(iw-(iw/zoom))-(iw/2-(iw/zoom/2))*on/${Math.floor(duration * 25)},0)':y='ih/2-(ih/zoom/2)':s=1080x1920`,
  ];
  return { zoompan: effects[sceneIndex % effects.length] };
}
