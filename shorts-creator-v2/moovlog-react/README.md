# MOOVLOG Shorts Creator v2 — React + Vite

기존 바닐라 JS 버전(v32.x)을 **React 18 + Zustand + Vite**로 완전 재작성한 버전입니다.

## 🏗️ 프로젝트 구조

```
moovlog-react/
├── src/
│   ├── engine/
│   │   ├── gemini.js      ← Gemini API (Vision + Script 생성)
│   │   ├── tts.js         ← TTS 시스템 (Typecast + Gemini 폴백)
│   │   ├── pipeline.js    ← startMake() 메인 파이프라인
│   │   ├── firebase.js    ← Firebase Storage/Firestore
│   │   └── utils.js       ← splitCaptions, downloadBlob 등
│   ├── store/
│   │   └── videoStore.js  ← Zustand 상태 관리 (기존 S 객체 대체)
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── UploadSection.jsx
│   │   ├── LoadingOverlay.jsx
│   │   ├── VideoPlayer.jsx    ← Canvas rAF 루프 (React ref 격리)
│   │   ├── SceneList.jsx
│   │   ├── SceneEditor.jsx    ← 씬 편집 모달
│   │   ├── ExportPanel.jsx    ← WebCodecs 내보내기
│   │   ├── ResultScreen.jsx
│   │   ├── SNSTags.jsx
│   │   └── ToastContainer.jsx
│   ├── styles/
│   │   └── app.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .github/workflows/deploy.yml
├── vite.config.js
└── package.json
```

## ⚡ 로컬 개발 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 API 키 입력

# 3. 개발 서버 실행
npm run dev
# → http://localhost:5173
```

## 🔑 API 키 설정

`.env.local` 파일에 키를 넣거나, 앱 실행 후 이름 입력란 옆 🔑 아이콘을 클릭해도 됩니다.

| 환경변수 | 설명 |
|---------|------|
| `VITE_GEMINI_KEY` | Google AI Studio에서 발급 (무료) |
| `VITE_TYPECAST_KEY` | app.typecast.ai API 키 (선택) |
| `VITE_FIREBASE_API_KEY` | Firebase 콘솔 → 웹앱 설정 (선택) |

## 🚀 GitHub Pages 배포

```bash
# 방법 1: GitHub Actions 자동 배포 (권장)
# → main 브랜치에 push하면 자동으로 배포됩니다
# → GitHub 저장소 Settings → Secrets에 API 키 등록 필요

# 방법 2: 수동 배포
npm run build
npm run deploy
```

### GitHub Secrets 등록 방법
`Settings → Secrets and variables → Actions → New repository secret`에서 아래 키들을 등록:
- `VITE_GEMINI_KEY`
- `VITE_TYPECAST_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_APP_ID`

배포 URL: `https://122cks.github.io/moovlog/shorts-creator/`

## 🔄 기존 v32.x와 차이점

| 항목 | v32.x (바닐라) | v2.0 (React) |
|------|---------------|--------------|
| 상태 관리 | 전역 `S` 객체 | Zustand store |
| UI 업데이트 | DOM 직접 조작 | React 상태 변경 |
| Canvas 렌더 | `requestAnimationFrame` 직접 | `useRef` + `useEffect` 격리 |
| 빌드 | 없음 (단일 파일) | Vite (코드 스플리팅) |
| 타입 안전 | 없음 | JSDoc 주석 |
| 배포 | 파일 직접 업로드 | GitHub Actions 자동 |

## ⚠️ 마이그레이션 주의사항

- Canvas 렌더링(`rAF`, `drawMedia`, `drawSubtitle`)은 React 외부에서 실행됨 (성능 유지)
- `AudioContext`는 싱글턴으로 유지 (iOS 제한 대응)
- `VideoEncoder` / `AudioEncoder` (WebCodecs)는 Chrome 94+ 필요
