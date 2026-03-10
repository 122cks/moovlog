"""
POST /api/vision
  · 업로드된 이미지들을 Gemini Vision API로 분석 (브라우저 CORS 우회)
  · 대용량 영상 파일도 서버 메모리 내에서 처리 가능
"""

from __future__ import annotations

import base64
import json
import os
import re

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from models.schemas import VisionAnalysisResult

router = APIRouter(tags=["vision"])

# ── Gemini 엔드포인트 ─────────────────────────────────────────────
_GEMINI_PRO   = "gemini-2.5-pro"
_GEMINI_FLASH = "gemini-2.5-flash"
_BASE_URL     = "https://generativelanguage.googleapis.com/v1beta/models"

VISION_PROMPT = """당신은 인스타그램 Reels 전문 비주얼 디렉터입니다.
음식점: "{restaurant_name}" / 미디어 {media_count}개 (순서대로 미디어0, 미디어1...)

각 이미지를 순서대로 정밀 분석하세요.

[분석 기준]
- type: "hook"(시선강탈), "hero"(대표메뉴 클로즈업), "detail"(식재료/질감), "ambiance"(분위기/공간), "process"(조리과정), "wide"(전경)
- best_effect: "zoom-in"|"zoom-out"|"pan-left"|"pan-right"|"zoom-in-slow"|"float-up"
- emotional_score: 1~10 (인스타 바이럴 잠재력)
- suggested_duration: 2~5초
- focus: 이 이미지 핵심 포인트 1문장
- focus_coords: {{"x":0.5,"y":0.5}} 형태

전체:
- keywords: 핵심 키워드 5개
- mood: 감성 키워드
- menu: 발견된 메뉴명
- visual_hook: 식욕/호기심 자극 1문장
- recommended_order: emotional_score+스토리흐름 기준 정렬된 인덱스 배열
- recommended_template: "cinematic"|"viral"|"aesthetic"|"mukbang"|"vlog"|"review"|"story"|"info"
- recommended_hook: "question"|"shock"|"challenge"|"secret"|"ranking"|"pov"

JSON만 반환:
{{"keywords":["k1","k2","k3","k4","k5"],"mood":"감성","menu":["메뉴"],"visual_hook":"훅","recommended_order":[0,1,2],"recommended_template":"aesthetic","recommended_hook":"question","per_image":[{{"idx":0,"type":"hook","best_effect":"zoom-out","emotional_score":9,"suggested_duration":3,"focus":"설명","focus_coords":{{"x":0.5,"y":0.45}}}}]}}"""


def _gemini_url(model: str, api_key: str) -> str:
    return f"{_BASE_URL}/{model}:generateContent?key={api_key}"


def _strip_markdown(text: str) -> str:
    """AI 응답에서 ```json ... ``` 코드펜스 제거"""
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


async def _call_gemini(api_key: str, body: dict) -> dict:
    """Pro → Flash 폴백"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        for model in (_GEMINI_PRO, _GEMINI_FLASH):
            resp = await client.post(_gemini_url(model, api_key), json=body)
            if resp.status_code == 200:
                return resp.json()
            if model == _GEMINI_FLASH:
                resp.raise_for_status()
    raise RuntimeError("Gemini 호출 실패")


@router.post("/vision", response_class=JSONResponse)
async def vision_analysis(
    restaurant_name: str = Form(...),
    files: list[UploadFile] = File(..., description="최대 8개 이미지/영상"),
) -> JSONResponse:
    api_key = os.getenv("GEMINI_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_KEY 환경변수가 설정되지 않았습니다")

    # 파일을 base64 인라인 이미지 파트로 변환
    parts: list[dict] = []
    for f in files[:8]:
        raw = await f.read()
        b64 = base64.b64encode(raw).decode()
        mime = f.content_type or "image/jpeg"
        parts.append({"inlineData": {"mimeType": mime, "data": b64}})

    if not parts:
        raise HTTPException(status_code=400, detail="이미지를 최소 1개 이상 첨부해주세요")

    prompt = VISION_PROMPT.format(
        restaurant_name=restaurant_name,
        media_count=len(parts),
    )
    parts.append({"text": prompt})

    body = {
        "contents": [{"parts": parts}],
        "generationConfig": {"temperature": 0.6, "responseMimeType": "application/json"},
    }

    data = await _call_gemini(api_key, body)
    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
    cleaned = _strip_markdown(raw_text)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Gemini 응답 파싱 실패: {exc}") from exc

    # Pydantic 검증
    try:
        validated = VisionAnalysisResult.model_validate(parsed)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini 응답 스키마 오류: {exc}") from exc

    return JSONResponse(content=validated.model_dump())
