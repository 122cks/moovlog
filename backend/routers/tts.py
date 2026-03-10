"""
POST /api/tts
  · Typecast API 프록시 — Authorization 헤더를 서버에서 처리해 키 노출 방지
  · Typecast 실패 시 Gemini TTS 자동 폴백
  · 반환: base64 오디오 + 추정 재생 시간
"""

from __future__ import annotations

import asyncio
import base64
import json
import os

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from models.schemas import TTSRequest, TTSResponse

router = APIRouter(tags=["tts"])

# ── Typecast 설정 ─────────────────────────────────────────────────
_TYPECAST_SPEAK_URL = "https://typecast.ai/api/speak"
_TYPECAST_POLL_MAX  = 30   # 최대 폴링 횟수
_TYPECAST_POLL_INT  = 1.0  # 폴링 간격 (초)

# ── Gemini TTS 설정 ───────────────────────────────────────────────
_GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"
_GEMINI_TTS_URL   = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{_GEMINI_TTS_MODEL}:generateContent"
)


def _load_typecast_keys() -> list[str]:
    """환경변수에서 Typecast 키 풀 로드 (TYPECAST_API_KEY ~ TYPECAST_API_KEY_7)"""
    keys: list[str] = []
    if k := os.getenv("TYPECAST_API_KEY"):
        keys.append(k)
    for i in range(2, 8):
        if k := os.getenv(f"TYPECAST_API_KEY_{i}"):
            keys.append(k)
    return keys


async def _typecast_tts(text: str, actor_id: str, tempo: float) -> bytes:
    """Typecast API 호출 → 폴링 → 오디오 bytes 반환"""
    keys = _load_typecast_keys()
    if not keys:
        raise RuntimeError("Typecast 키가 없습니다")

    last_err: Exception | None = None
    for key in keys:
        try:
            audio = await _typecast_speak(key, text, actor_id, tempo)
            return audio
        except Exception as exc:
            last_err = exc
            continue

    raise RuntimeError(f"모든 Typecast 키 실패: {last_err}")


async def _typecast_speak(api_key: str, text: str, actor_id: str, tempo: float) -> bytes:
    payload = {
        "text": text,
        "lang": "auto",
        "actor_id": actor_id,
        "xapi_id": api_key,
        "xapi_hd": True,
        "model_version": "latest",
        "audio_format": "wav",
        "audio_pitch": 0,
        "audio_tempo": tempo,
        "audio_volume": 100,
        "last_pitch": 0,
        "end_pitch": 0,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(_TYPECAST_SPEAK_URL, json=payload, headers=headers)
        resp.raise_for_status()
        speak_url: str = resp.json()["result"]["speak_v2_url"]

        # 폴링 — 오디오 생성 완료 대기
        for _ in range(_TYPECAST_POLL_MAX):
            await asyncio.sleep(_TYPECAST_POLL_INT)
            poll = await client.get(speak_url, headers=headers)
            poll.raise_for_status()
            data = poll.json()
            status = data.get("result", {}).get("status", "")
            if status == "done":
                audio_url: str = data["result"]["audio_download_url"]
                audio_resp = await client.get(audio_url)
                audio_resp.raise_for_status()
                return audio_resp.content
            if status == "failed":
                raise RuntimeError("Typecast 생성 실패 (status=failed)")

    raise RuntimeError("Typecast 폴링 타임아웃")


async def _gemini_tts(text: str, api_key: str) -> bytes:
    """Gemini TTS 폴백 — WAV bytes 반환"""
    body = {
        "contents": [{"role": "user", "parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": "Fenrir"}
                }
            },
        },
    }
    gemini_key = api_key or os.getenv("GEMINI_KEY", "")
    url = f"{_GEMINI_TTS_URL}?key={gemini_key}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=body)
        resp.raise_for_status()
        data = resp.json()

    b64_audio: str = (
        data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    )
    return base64.b64decode(b64_audio)


def _estimate_duration(audio_bytes: bytes, fmt: str = "wav") -> float:
    """WAV 헤더에서 재생 시간 추정 (정확도: ±0.1s)"""
    if fmt == "wav" and len(audio_bytes) > 44:
        # WAV: 바이트 44~47 = 데이터 청크 크기, 24~27 = 샘플레이트, 34~35 = 비트수
        try:
            import struct
            sample_rate = struct.unpack_from("<I", audio_bytes, 24)[0]
            bits = struct.unpack_from("<H", audio_bytes, 34)[0]
            channels = struct.unpack_from("<H", audio_bytes, 22)[0]
            data_size = struct.unpack_from("<I", audio_bytes, 40)[0]
            if sample_rate and bits and channels:
                return data_size / (sample_rate * channels * (bits // 8))
        except Exception:
            pass
    # 폴백: 192kbps MP3 기준 추정
    return len(audio_bytes) / (192 * 1024 / 8)


@router.post("/tts", response_model=TTSResponse)
async def generate_tts(req: TTSRequest) -> TTSResponse:
    gemini_key = os.getenv("GEMINI_KEY", "")

    audio_bytes: bytes | None = None
    if req.provider == "typecast":
        try:
            audio_bytes = await _typecast_tts(req.text, req.actor_id, req.tempo)
        except Exception as exc:
            # Typecast 실패 → Gemini 폴백
            if not gemini_key:
                raise HTTPException(status_code=502, detail=f"TTS 생성 실패: {exc}") from exc
            audio_bytes = await _gemini_tts(req.text, gemini_key)
    else:
        if not gemini_key:
            raise HTTPException(status_code=500, detail="GEMINI_KEY 환경변수가 없습니다")
        audio_bytes = await _gemini_tts(req.text, gemini_key)

    duration = _estimate_duration(audio_bytes)
    audio_b64 = base64.b64encode(audio_bytes).decode()

    return TTSResponse(
        scene_idx=req.scene_idx,
        audio_b64=audio_b64,
        duration_seconds=duration,
    )
