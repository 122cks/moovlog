"""
무브먼트 Shorts Creator — FastAPI 백엔드
  · Gemini Vision / TTS 프록시 (브라우저 CORS·메모리 한계 우회)
  · FFmpeg 서버사이드 인코딩 (오디오 더킹, 고화질 MP4 합성)

실행:
  uv run uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import tts, video, vision

load_dotenv()  # .env 파일 로드 (GEMINI_KEY, TYPECAST_API_KEY 등)

# ── 허용 오리진 ──────────────────────────────────────────────────
_CORS_ORIGINS: list[str] = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:4173",   # Vite preview
    "https://122cks.github.io",  # GitHub Pages 프로덕션
]

# ── App lifespan ─────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """startup / shutdown 훅 (필요 시 DB 연결 등 추가)"""
    yield


app = FastAPI(
    title="무브먼트 Shorts Creator API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── 라우터 등록 ──────────────────────────────────────────────────
app.include_router(vision.router, prefix="/api")
app.include_router(tts.router,    prefix="/api")
app.include_router(video.router,  prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
