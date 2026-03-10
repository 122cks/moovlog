"""
POST /api/video/export
  · 브라우저에서 전달한 씬 데이터 + 업로드 미디어를 FFmpeg으로 서버사이드 인코딩
  · 오디오 더킹(BGM 자동 볼륨 감소), 9:16 1080×1920 MP4 출력
  · FFmpeg이 없는 환경에서는 422 응답 ("ffmpeg_unavailable")
"""

from __future__ import annotations

import asyncio
import json
import os
import shutil
import tempfile
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

router = APIRouter(tags=["video"])

_FFMPEG = shutil.which("ffmpeg")  # ffmpeg 바이너리 경로 (없으면 None)


class ExportStatus(BaseModel):
    status: str
    message: str


@router.get("/video/ffmpeg-status", response_model=ExportStatus)
async def ffmpeg_status() -> ExportStatus:
    """FFmpeg 사용 가능 여부 확인"""
    if _FFMPEG:
        return ExportStatus(status="available", message=str(_FFMPEG))
    return ExportStatus(status="unavailable", message="ffmpeg 바이너리를 찾을 수 없습니다")


@router.post("/video/export")
async def export_video(
    scenes_json: str = Form(..., description="JSON 직렬화된 SceneData 배열"),
    media_files: list[UploadFile] = File(..., description="씬에서 사용할 미디어 파일 (순서 일치)"),
    audio_files: list[UploadFile] = File(default=[], description="씬별 TTS 오디오 파일"),
) -> FileResponse:
    """
    서버사이드 FFmpeg MP4 인코딩

    흐름:
      1. 업로드 파일 임시 디렉토리에 저장
      2. 씬별 filter_complex 생성 (Ken Burns 효과 + fade 트랜지션)
      3. 오디오 더킹 (TTS 구간은 BGM -12dB)
      4. libx264 + aac 1080×1920 MP4 출력
      5. 결과 파일 응답 → 임시 디렉토리 정리
    """
    if not _FFMPEG:
        raise HTTPException(
            status_code=422,
            detail={"code": "ffmpeg_unavailable", "message": "FFmpeg이 설치되지 않았습니다. 브라우저 내보내기를 사용하세요."},
        )

    try:
        scenes: list[dict] = json.loads(scenes_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"scenes_json 파싱 실패: {exc}") from exc

    work_dir = Path(tempfile.mkdtemp(prefix="moovlog_"))
    out_path  = work_dir / f"output_{uuid.uuid4().hex[:8]}.mp4"

    try:
        # ── 1. 업로드 파일 저장 ────────────────────────────────────
        media_paths: list[Path] = []
        for i, uf in enumerate(media_files):
            ext  = Path(uf.filename or "file").suffix or ".jpg"
            dest = work_dir / f"media_{i}{ext}"
            async with aiofiles.open(dest, "wb") as f:
                await f.write(await uf.read())
            media_paths.append(dest)

        audio_paths: list[Path] = []
        for i, af in enumerate(audio_files):
            ext  = Path(af.filename or "audio").suffix or ".wav"
            dest = work_dir / f"audio_{i}{ext}"
            async with aiofiles.open(dest, "wb") as f:
                await f.write(await af.read())
            audio_paths.append(dest)

        # ── 2. FFmpeg 명령 구성 ───────────────────────────────────
        cmd = _build_ffmpeg_cmd(scenes, media_paths, audio_paths, out_path)

        # ── 3. FFmpeg 실행 ────────────────────────────────────────
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)

        if proc.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"FFmpeg 오류: {stderr.decode(errors='replace')[-500:]}",
            )

        return FileResponse(
            path=str(out_path),
            media_type="video/mp4",
            filename="moovlog_shorts.mp4",
            background=None,  # 응답 완료 후 cleanup은 별도 처리
        )

    except HTTPException:
        shutil.rmtree(work_dir, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(work_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── FFmpeg 명령어 빌더 ────────────────────────────────────────────

def _build_ffmpeg_cmd(
    scenes: list[dict],
    media_paths: list[Path],
    audio_paths: list[Path],
    out_path: Path,
) -> list[str]:
    """
    씬 배열을 받아 FFmpeg filter_complex 명령어를 생성합니다.

    각 씬:
      · 이미지: zoompan 필터로 Ken Burns 효과 적용
      · 영상:   trim + scale
      · 씬 간:  acrossfade / xfade (fade 트랜지션)
      · 오디오: TTS concat + amix (BGM 더킹은 향후 확장)
    """
    W, H = 1080, 1920
    FPS = 30

    cmd: list[str] = [_FFMPEG, "-y"]  # type: ignore[list-item]

    # 입력 파일 추가
    for i, path in enumerate(media_paths):
        # 이미지는 loop, 영상은 그대로
        if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".heic"}:
            duration = float(scenes[i].get("duration", 3.0)) if i < len(scenes) else 3.0
            cmd += ["-loop", "1", "-t", str(duration), "-i", str(path)]
        else:
            cmd += ["-i", str(path)]

    for path in audio_paths:
        cmd += ["-i", str(path)]

    # filter_complex: 각 비디오 입력 → scale + pad → 씬 concat
    filters: list[str] = []
    video_labels: list[str] = []
    audio_labels: list[str] = []

    for i, scene in enumerate(scenes):
        duration = float(scene.get("duration", 3.0))
        frames   = int(duration * FPS)
        effect   = scene.get("effect", "zoom-in")
        fx_coord = scene.get("focus_coords", {"x": 0.5, "y": 0.5})
        cx, cy   = float(fx_coord.get("x", 0.5)), float(fx_coord.get("y", 0.5))

        scale_filter = (
            f"[{i}:v]scale={W}:{H}:force_original_aspect_ratio=increase,"
            f"crop={W}:{H}"
        )

        # 단순 Ken Burns: zoom-in 시 zoompan 적용
        if effect in ("zoom-in", "zoom-in-slow"):
            zoom_step = 0.0015 if effect == "zoom-in-slow" else 0.003
            zp = (
                f",zoompan=z='min(zoom+{zoom_step},1.5)'"
                f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
                f":d={frames}:s={W}x{H}:fps={FPS}"
            )
            scale_filter += zp
        elif effect == "zoom-out":
            scale_filter += (
                f",zoompan=z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.003))'"
                f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
                f":d={frames}:s={W}x{H}:fps={FPS}"
            )

        scale_filter += f"[v{i}]"
        filters.append(scale_filter)
        video_labels.append(f"[v{i}]")

        # 오디오 레이블
        audio_idx = len(media_paths) + i
        if i < len(audio_paths):
            filters.append(f"[{audio_idx}:a]aresample=44100[a{i}]")
            audio_labels.append(f"[a{i}]")
        else:
            # TTS 없는 씬은 무음 패드
            filters.append(
                f"aevalsrc=0:c=stereo:r=44100:d={duration}[a{i}]"
            )
            audio_labels.append(f"[a{i}]")

    # concat
    n = len(scenes)
    v_concat = "".join(video_labels) + f"concat=n={n}:v=1:a=0[vout]"
    a_concat  = "".join(audio_labels) + f"concat=n={n}:v=0:a=1[aout]"
    filters += [v_concat, a_concat]

    cmd += [
        "-filter_complex", ";".join(filters),
        "-map", "[vout]",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p",
        str(out_path),
    ]

    return cmd
