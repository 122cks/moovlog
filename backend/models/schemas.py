"""
Pydantic v2 모델 — Zod 스키마(프론트)와 1:1 대응

JSON 직렬화 규칙:
  · model_config = ConfigDict(populate_by_name=True) — alias 필드 허용
  · float 필드는 모두 gt=0 또는 ge=0 제약
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ── 공용 ─────────────────────────────────────────────────────────
class FocusCoords(BaseModel):
    x: float = Field(default=0.5, ge=0.0, le=1.0)
    y: float = Field(default=0.5, ge=0.0, le=1.0)


# ── Vision 분석 ──────────────────────────────────────────────────
class PerImageAnalysis(BaseModel):
    idx: int
    type: Literal["hook", "hero", "detail", "ambiance", "process", "wide"]
    best_effect: Literal[
        "zoom-in", "zoom-out", "pan-left", "pan-right", "zoom-in-slow", "float-up"
    ]
    emotional_score: int = Field(ge=1, le=10)
    suggested_duration: float = Field(ge=2.0, le=6.0)
    focus: str
    focus_coords: FocusCoords = Field(default_factory=FocusCoords)


TemplateKey = Literal[
    "cinematic", "viral", "aesthetic", "mukbang", "vlog", "review", "story", "info"
]
HookKey = Literal["question", "shock", "challenge", "secret", "ranking", "pov"]


class VisionAnalysisResult(BaseModel):
    keywords: list[str] = Field(min_length=1, max_length=10)
    mood: str
    menu: list[str] = Field(default_factory=list)
    visual_hook: str
    recommended_order: list[int]
    recommended_template: TemplateKey = "aesthetic"
    recommended_hook: HookKey = "question"
    per_image: list[PerImageAnalysis]


# ── 스크립트 씬 ──────────────────────────────────────────────────
EffectType = Literal[
    "zoom-in", "zoom-out", "pan-left", "pan-right",
    "zoom-in-slow", "drift", "float-up"
]
SubtitleStyle = Literal[
    "hook", "detail", "hero", "cta", "neon",
    "split", "typewriter", "glitch", "bold_drop", "pill"
]
SubtitlePosition = Literal["upper", "center", "lower"]
TransitionType = Literal["fade", "wipe", "zoom", "cut"]


class SceneData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    idx: int
    media_idx: int = Field(alias="mediaIdx", default=0)
    caption1: str = Field(max_length=20)
    caption2: str = Field(default="", max_length=20)
    narration: str
    duration: float = Field(ge=0.5, default=3.0)
    effect: EffectType = "zoom-in"
    subtitle_style: SubtitleStyle = "hook"
    subtitle_position: SubtitlePosition = "lower"
    transition: TransitionType = "fade"
    focus_coords: FocusCoords = Field(default_factory=FocusCoords)


class VideoScript(BaseModel):
    restaurant_name: str = Field(alias="restaurantName")
    hook_line: str = Field(alias="hookLine")
    template: TemplateKey
    sns_tags: dict[str, list[str]] = Field(alias="snsTags", default_factory=dict)
    scenes: list[SceneData]

    model_config = ConfigDict(populate_by_name=True)


# ── TTS 요청/응답 ────────────────────────────────────────────────
class TTSRequest(BaseModel):
    scene_idx: int
    text: str = Field(min_length=1, max_length=500)
    provider: Literal["typecast", "gemini"] = "typecast"
    # Typecast 전용
    actor_id: str = Field(default="typecast-fenrir-ko")
    tempo: float = Field(default=1.25, ge=0.5, le=2.0)


class TTSResponse(BaseModel):
    scene_idx: int
    audio_b64: str  # base64-encoded WAV/MP3
    duration_seconds: float


# ── Vision 프록시 요청 ────────────────────────────────────────────
class VisionProxyRequest(BaseModel):
    restaurant_name: str
    # 이미지들은 multipart/form-data로 별도 전송
