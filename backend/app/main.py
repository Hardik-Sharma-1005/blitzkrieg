"""
RADIX Talent Match Hackathon - Role 2 (Resume Parsing) FastAPI Service.

Provides REST API endpoints for candidate resume upload, text extraction,
RADIX taxonomy mapping, and pre-structured JSON output for Role 3 (Profile Builder).

Run directly with:
    cd backend && python -m uvicorn app.main:app --reload --port 8000
"""

import os
import shutil
import tempfile
from fastapi import APIRouter, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.resume_pipeline import ResumePipeline
    from app.schemas import CandidateProfile, HealthCheckResponse
except ImportError:
    from backend.app.resume_pipeline import ResumePipeline
    from backend.app.schemas import CandidateProfile, HealthCheckResponse

# ---------------------------------------------------------------------------
# 1. FastAPI Router for Role 2
# ---------------------------------------------------------------------------

resume_router = APIRouter(prefix="/api", tags=["Role 2 - Resume Parsing"])
_pipeline = ResumePipeline()


@resume_router.post(
    "/parse-resume",
    response_model=CandidateProfile,
    summary="Upload & Parse Candidate Resume (PDF or DOCX)",
    description=(
        "Ingests candidate resume, enforces document guardrails, cleans text, "
        "separates hackathons & internships, extracts skills into 12 RADIX categories, "
        "and returns structured profile ready for Role 3 Profile Builder."
    ),
)
async def upload_and_parse_resume(
    file: UploadFile = File(..., description="Candidate resume file (.pdf or .docx)"),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload.",
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only .pdf and .docx files are accepted.",
        )

    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = _pipeline.process_resume(temp_file_path, validate_type=True)
        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse resume: {str(e)}",
        )
    finally:
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                os.rmdir(temp_dir)
            except Exception:
                pass


@resume_router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health check for Resume Parsing Service",
)
def health_check():
    parsers = []
    try:
        import pdfplumber
        parsers.append("pdfplumber")
    except ImportError:
        pass
    try:
        import pypdf
        parsers.append("pypdf")
    except ImportError:
        pass

    return {
        "ok": True,
        "role": "Role 2 - Resume Parsing",
        "parsers": parsers,
    }


# ---------------------------------------------------------------------------
# 2. Main FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="RADIX Talent Match - Resume Parsing API (Role 2)",
    description=(
        "Microservice endpoint for parsing candidate resumes and producing "
        "standardized profile data for the RADIX Talent Match Platform."
    ),
    version="0.1.0",
)

configured_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        *configured_origins,
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):517\d+",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(resume_router)


@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "RADIX Talent Match - Role 2 (Resume Parsing) API is running.",
        "docs_url": "/docs",
    }
