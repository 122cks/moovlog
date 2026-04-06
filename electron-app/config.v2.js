/**
 * config.v2.js — 무브먼트 Shorts Creator 통합 설정
 *
 * 보안 원칙:
 *  - API 키 / 시크릿은 이 파일에 직접 작성하지 않습니다.
 *  - 환경 변수(.env 또는 OS 환경 변수)에서 읽습니다.
 *  - 이 파일은 Git에 커밋해도 안전합니다.
 *
 * 사용 방법:
 *  const cfg = require('./config.v2');
 *  cfg.firebase.apiKey  // 환경 변수 FIREBASE_API_KEY 값
 */

'use strict';

// ── 환경 변수 로더 (electron-app 환경 + 웹앱 환경 모두 지원) ─────────────
function env(key, fallback = null) {
  // Node.js (Electron main process)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  // Vite 번들 (import.meta.env.VITE_*)
  if (typeof import_meta_env !== 'undefined') {
    return import_meta_env[`VITE_${key}`] ?? fallback;
  }
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────
// §1  앱 메타 정보
// ─────────────────────────────────────────────────────────────────────────
const APP = {
  name: '무브먼트 Shorts Creator',
  version: '2.75',
  buildDate: '2026-04-06',
  githubOwner: '122cks',
  githubRepo: 'moovlog',
  webUrl: 'https://122cks.github.io/moovlog/shorts-creator/',
};

// ─────────────────────────────────────────────────────────────────────────
// §2  Firebase 설정
//     실제 값은 환경 변수에서 로드 (절대 하드코딩 금지)
// ─────────────────────────────────────────────────────────────────────────
const FIREBASE = {
  apiKey: env('FIREBASE_API_KEY'),
  authDomain: env('FIREBASE_AUTH_DOMAIN'),
  projectId: env('FIREBASE_PROJECT_ID'),
  storageBucket: env('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('FIREBASE_APP_ID'),
  measurementId: env('FIREBASE_MEASUREMENT_ID'),
};

// ─────────────────────────────────────────────────────────────────────────
// §3  Google / Gemini AI 설정
// ─────────────────────────────────────────────────────────────────────────
const AI = {
  geminiApiKey: env('GEMINI_API_KEY'),
  geminiModel: env('GEMINI_MODEL', 'gemini-1.5-pro'),
  // saliency 점수 임계값 (이 이상인 씬만 포함)
  saliencyThreshold: 0.65,
  // 자동 편집 시 기본 클립 길이 (초)
  defaultClipDuration: 3,
};

// ─────────────────────────────────────────────────────────────────────────
// §4  렌더링 기본값
// ─────────────────────────────────────────────────────────────────────────
const RENDER = {
  default: {
    width: 720,
    height: 1280,
    fps: 30,
    crf: 22,
    preset: 'fast',
    theme: 'hansik',
    crossfade: 0,
    autoReframe: true,
    normalizeAudio: false,
    autoOpenFolder: true,
    autoPlayAfter: false,
  },
  // 브랜드 워터마크 기본 위치
  watermarkPosition: 'bottomright',
  watermarkScale: 0.1,
  // BGM 기본 볼륨 (0~1)
  bgmVolume: 0.15,
  // 최대 동시 렌더링 작업
  maxJobs: 1,
  // CPU 스레드 비율 (0~1)
  threadRatio: 0.75,
};

// ─────────────────────────────────────────────────────────────────────────
// §5  경로 설정
// ─────────────────────────────────────────────────────────────────────────
const PATHS = {
  // FFmpeg 탐색 우선순위 디렉터리 (상대 경로는 electron-app/ 기준)
  ffmpegSearchDirs: [
    '../ffmpeg-2026-04-06-git-7fd2be97b9-full_build/ffmpeg-2026-04-06-git-7fd2be97b9-full_build/bin',
    '../../bin',
    '../bin',
  ],
  // 출력 파일 기본 이름 패턴 (YYYY-MM-DD_HHmm 형식으로 치환)
  outputPattern: 'moovlog_{date}.mp4',
};

// ─────────────────────────────────────────────────────────────────────────
// §6  Android 설정
// ─────────────────────────────────────────────────────────────────────────
const ANDROID = {
  webUrl: 'https://122cks.github.io/moovlog/shorts-creator/',
  versionName: '2.75',
  versionCode: 3,
  minSdk: 24,
  targetSdk: 34,
  // AdMob (Optional — 환경 변수에서 로드)
  admobAppId: env('ADMOB_APP_ID'),
  admobBannerId: env('ADMOB_BANNER_ID'),
};

// ─────────────────────────────────────────────────────────────────────────
// §7  기능 플래그 (Feature Flags)
// ─────────────────────────────────────────────────────────────────────────
const FEATURES = {
  // 구독 사용자 전용 기능 (워터마크 제거 등)
  premiumEnabled: false,
  // Firebase 동기화 활성화
  syncEnabled: false,
  // AI 자동 편집 활성화
  aiEditEnabled: false,
  // 에러 리포트 전송 (버그 제보)
  errorReportEnabled: true,
};

// ─────────────────────────────────────────────────────────────────────────
// §8  유효성 검사 — 필수 환경 변수 누락 경고 (개발 환경에서만)
// ─────────────────────────────────────────────────────────────────────────
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  const REQUIRED_FOR_FIREBASE = ['FIREBASE_API_KEY', 'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID'];
  REQUIRED_FOR_FIREBASE.forEach((key) => {
    if (!env(key)) {
      console.warn(
        `[config.v2] ⚠️  환경 변수 ${key}가 설정되지 않았습니다.\n` +
          '  Firebase 기능을 사용하려면 .env 파일에 추가하세요.',
      );
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 내보내기
// ─────────────────────────────────────────────────────────────────────────
module.exports = {
  APP,
  FIREBASE,
  AI,
  RENDER,
  PATHS,
  ANDROID,
  FEATURES,

  // 편의 접근자
  isProduction: () => typeof process !== 'undefined' && process.env?.NODE_ENV !== 'development',
  isDevelopment: () => typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
};
