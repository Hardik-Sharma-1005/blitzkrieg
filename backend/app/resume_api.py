"""Resume parsing routes mounted by the shared RADIX API."""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from .resume_pipeline import ResumePipeline
from .schemas import CandidateProfile

logger = logging.getLogger(__name__)
MAX_UPLOAD_BYTES = 12 * 1024 * 1024
resume_router = APIRouter(prefix="/api", tags=["Resume parsing"])
_pipeline = ResumePipeline()


@resume_router.post(
    "/parse-resume",
    response_model=CandidateProfile,
    summary="Parse a candidate resume",
    description=(
        "Accepts a PDF or DOCX, extracts evidence-backed skills and profile details, "
        "and returns the shared candidate-profile shape for the Profile Builder."
    ),
)
async def upload_and_parse_resume(file: UploadFile = File(...)) -> CandidateProfile:
    raw_filename = (file.filename or "").replace("\\", "/").rsplit("/", 1)[-1].strip()
    if not raw_filename or raw_filename in {".", ".."}:
        raise HTTPException(status_code=400, detail="Choose a resume file to upload.")

    suffix = Path(raw_filename).suffix.lower()
    if suffix not in {".pdf", ".docx"}:
        raise HTTPException(status_code=415, detail="Upload a PDF or DOCX resume.")

    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="The resume is over 12 MB. Choose a smaller file.")
    if suffix == ".pdf" and not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="The uploaded file does not appear to be a valid PDF.")
    if suffix == ".docx" and not data.startswith(b"PK"):
        raise HTTPException(status_code=400, detail="The uploaded file does not appear to be a valid DOCX.")

    try:
        with tempfile.TemporaryDirectory(prefix="radix-resume-") as temp_dir:
            temp_path = Path(temp_dir) / f"upload{suffix}"
            temp_path.write_bytes(data)
            profile = await run_in_threadpool(
                _pipeline.process_resume,
                str(temp_path),
                source_filename=raw_filename,
                validate_type=True,
            )
        return CandidateProfile.model_validate(profile)
    except ValueError as exc:
        if "Document mismatch guardrail" in str(exc):
            raise HTTPException(
                status_code=400,
                detail="This file looks like a job description. Upload it in JD Analytics instead.",
            ) from exc
        raise HTTPException(
            status_code=422,
            detail="We could not find the expected resume sections. Check the file and try again.",
        ) from exc
    except OSError as exc:
        logger.exception("Temporary resume processing failed.")
        raise HTTPException(status_code=500, detail="We could not process this resume. Please try again.") from exc
    except Exception as exc:
        logger.exception("Resume parsing failed.")
        raise HTTPException(status_code=500, detail="We could not process this resume. Please try again.") from exc
