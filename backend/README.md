# 무브먼트 Shorts Creator — FastAPI 백엔드

FastAPI + uv 기반 서버. 브라우저에서 처리하기 힘든 작업을 분담합니다.

## 역할

| 엔드포인트 | 설명 |
|---|---|
| `POST /api/vision` | Gemini Vision 프록시 (CORS 우회, 대용량 처리) |
| `POST /api/tts` | Typecast/Gemini TTS 프록시 (API 키 서버 격리) |
| `POST /api/video/export` | FFmpeg 서버사이드 인코딩 (오디오 더킹, 4K MP4) |
| `GET  /api/video/ffmpeg-status` | FFmpeg 설치 여부 확인 |
| `GET  /health` | 헬스체크 |

## 실행

```bash
# uv 설치 (최초 1회)
pip install uv

# 의존성 설치 + 서버 실행
cd backend
uv run uvicorn main:app --reload --port 8000
```

## 환경변수

`backend/.env` 파일 생성:

```env
GEMINI_KEY=your_gemini_api_key
TYPECAST_API_KEY=your_typecast_key_1
TYPECAST_API_KEY_2=your_typecast_key_2
TYPECAST_API_KEY_3=your_typecast_key_3
TYPECAST_API_KEY_4=your_typecast_key_4
TYPECAST_API_KEY_5=your_typecast_key_5
TYPECAST_API_KEY_6=your_typecast_key_6
TYPECAST_API_KEY_7=your_typecast_key_7
```

## FFmpeg 설치 (선택)

서버사이드 인코딩(`/api/video/export`)은 FFmpeg이 필요합니다.  
설치하지 않아도 나머지 엔드포인트는 정상 동작합니다.

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows (Scoop)
scoop install ffmpeg
```

## 개발 테스트

```bash
# pytest 실행
uv run pytest tests/ -v
```
