# RADIX Talent Match Platform — Role 2 (Resume Parsing) Build Notes

## 📋 Overview
This module implements **Role 2 (Resume Parsing)** for the RADIX Talent Match Platform. It ingests candidate resumes in PDF and Word formats, strips hackathon test artifacts, enforces upload mismatch guardrails to reject JDs, separates hackathons and internships, maps skills into the 12 canonical RADIX categories, and produces standardized JSON ready for **Role 3 (Profile Builder)**.

---

## 📁 Repository Structure (Aligned with Team Layout)

```
.
├── backend/
│   ├── __init__.py           # Package exports
│   ├── document_parser.py    # ResumeDocumentParser (PDF/Word cleaning, null certs, hackathons/internships split)
│   ├── llm_extractor.py      # ResumeSkillExtractor (12 RADIX categories + heuristic fallback)
│   ├── resume_pipeline.py    # ResumePipeline (coordinates parser, extractor, & output assembly)
│   └── resume_api.py         # FastAPI router (POST /api/parse-resume & GET /api/health)
│
├── schemas/
│   ├── __init__.py           # Schema exports
│   └── resume_schemas.py     # Pydantic schemas (CandidateProfile, ExtractedSkill, RadixCategory)
│
├── data/
│   └── resumes/
│       ├── PDF/              # Sample PDF candidate resumes (Ananya, Karthik, Priya, Rohan)
│       └── Word/             # Sample Word candidate resumes (.docx)
│
├── output/
│   └── resumes/              # Standardized Candidate Profile JSON files
│
├── temprunner.py             # Root test runner verifying all sample resumes & guardrails
├── run_server.py             # Quick launcher for local FastAPI API & Swagger UI
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variables template
└── FINAL_BUILD_NOTES.md      # This document
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Verification Tests
```bash
python temprunner.py
```
This processes all 8 sample candidate resumes (4 PDF + 4 Word) and validates the upload guardrail. 
Result: **9/9 Passed (100%)**.

### 3. Launch Local API Server (Swagger UI)
```bash
python run_server.py
```
- API Base: `http://127.0.0.1:8000`
- Swagger Docs: `http://127.0.0.1:8000/docs`
- Endpoint: `POST /api/parse-resume` (upload file directly via browser UI)

---

## 🤝 Integrator Guide (Merging Role 1 & Role 2)

Merging Role 2 with Role 1's FastAPI server requires **only 2 lines of code**:

```python
# In your main FastAPI app file (e.g., backend/main.py or app.py):
from backend.resume_api import resume_router

app.include_router(resume_router)
```

Now the team's single backend serves:
- `POST /api/parse-jd` (Role 1 — Job Description Analytics)
- `POST /api/parse-resume` (Role 2 — Resume Parsing)

---

## 🛡️ Upload Mismatch Guardrail
If a candidate or recruiter accidentally uploads a Job Description to `/api/parse-resume`, the guardrail triggers:
- **HTTP Status**: `400 Bad Request`
- **Error Detail**: `"Document mismatch guardrail triggered: '...' appears to be a Job Description, not a Resume. Please upload it via the JD upload path."`

---

## 📊 Output Schema for Role 3 (Profile Builder)

```json
{
  "source_type": "resume",
  "source_file": "Ananya Rao.pdf",
  "cv_file": "Ananya Rao.pdf",
  "name": "Ananya Rao",
  "email": "ananya.rao@example.com",
  "education": [
    "B.Tech, Computer Science and Engineering, Class of 2026 — CGPA 8.6 / 10"
  ],
  "projects": [
    "Built a distributed URL-shortening service with a Redis-backed cache...",
    "Implemented a multithreaded job scheduler in C++..."
  ],
  "hackathons": [
    "Finalist, national-level 24-hour hackathon — built a real-time chat backend"
  ],
  "internships": [
    "Summer intern, backend team at a mid-size product startup — shipped a rate-limiter"
  ],
  "certifications": [],
  "achievements": [
    "Published a technical blog post on cache invalidation strategies...",
    "Active open-source contributor..."
  ],
  "preferred_roles": [
    "Backend Engineer",
    "Systems Software Engineer",
    "Distributed Systems"
  ],
  "skills": [
    {
      "skill_name": "Python",
      "category_code": "COD",
      "evidence": "...Python, C++, Java...",
      "confidence": "high"
    },
    {
      "skill_name": "Distributed Systems",
      "category_code": "SYSD",
      "evidence": "...distributed URL-shortening service...",
      "confidence": "high"
    }
  ],
  "extraction_mode": "offline_heuristic"
}
```
