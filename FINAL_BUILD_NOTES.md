# RADIX Talent Match integration notes

The repository contains the JSS Student Career Hub frontend and one shared FastAPI backend. The JD and resume features use separate routes and handoff schemas, so both are served by the same process.

## Data handoffs

- JD Analytics returns JDResult with categorized skills and source evidence.
- Resume Parsing returns CandidateProfile for the Profile Builder.
- Company role requirements live in data/talent_check_company_skillsets.json and are validated by schemas/talent_check_company_skillsets.schema.json.
- Supabase remains read-only from the frontend. Parsed resume profiles are not written to Supabase.

## Local verification

- python scripts/verify_resume_samples.py parses all bundled PDF and DOCX resume samples offline and checks that a sample JD is rejected by the resume parser.
- python -m app.cli <jd.pdf|jd.docx> runs the JD extraction CLI from backend/.
- python -m app.resume_cli <resume.pdf|resume.docx> runs the resume parser from backend/.
- py temprunner.py starts the frontend and shared API for the local demo.

## Provider and privacy behavior

Resume parsing defaults to offline heuristic extraction when no provider key is configured. When an OpenRouter or OpenAI provider is enabled, extracted resume text is sent to that provider. The resume API keeps uploads in a temporary directory during processing and removes it afterward. The service has no authentication or rate limiting, so keep it local for the hackathon demo.
