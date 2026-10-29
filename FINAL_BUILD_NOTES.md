# RADIX Talent Match integration notes

The repository contains the blitzkrieg! frontend and one shared FastAPI backend. The JD and resume features use separate routes and handoff schemas, so both are served by the same process.

## Data handoffs

- JD Analytics returns JDResult with categorized skills and source evidence. If AI providers fail, a labeled local fallback scans readable text for explicit skill/tool names; it does not interpret indirect requirements or OCR image-only pages.
- Resume Parsing returns CandidateProfile for the Profile Builder.
- Talent Check, Resume Profile, and JD Analytics attempt configured AI providers with bounded requests. Resume extraction uses a labeled local heuristic fallback when providers fail. JD Analytics uses a labeled local skill-name fallback when providers fail; it can miss indirect requirements and image-only text. Configure both `OPENROUTER_API_KEY` and `OPENAI_API_KEY` to enable provider failover.
- When OpenRouter is configured with its free router, the integration selects the `:nitro` throughput variant and uses a shorter resume-extraction prompt. This improves the chance of a quick result but does not provide a latency guarantee from free model providers.
- Talent Check follows Vansh's flow: parsed resume, one of 118 company profiles, 12-skill RADIX readiness report, AI Career Coach, interview practice, and Skill Proof Sprint. 113 company benchmarks come from the configured company skill table; five use a clearly labeled RADIX-wide median because they have no company-specific skill rows.
- Company role requirements live in data/talent_check_company_skillsets.json and are validated by schemas/talent_check_company_skillsets.schema.json.
- Supabase remains read-only from the frontend. Parsed resume profiles are not written to Supabase.

`GET /api/talent-check/companies` returns all 118 company options. `POST /api/talent-check` accepts a CandidateProfile and company ID, applies the 12 RADIX categories, and returns a report plus chart data. The database uses a 1–10 skill scale, converted to 1–5 in the report. Talent Check AI modules try Gemini first, then configured OpenRouter/OpenAI providers, with a 30-second timeout per provider. Provider keys remain local in ignored environment files.

## Local verification

- python scripts/verify_resume_samples.py parses all bundled PDF and DOCX resume samples offline and checks that a sample JD is rejected by the resume parser.
- python -m app.jd_cli <jd.pdf|jd.docx> runs the JD extraction CLI from backend/. The legacy `app.cli` command remains available.
- python -m app.resume_cli <resume.pdf|resume.docx> runs the resume parser from backend/.
- py temprunner.py starts the frontend and shared API for the local demo.
- `python -m unittest discover -s backend/tests -v` checks synthetic DOCX resume parsing into a 12-skill report, the 118-company list, benchmark source labels, report generation, provider failover, and safe behavior when AI evaluation is unavailable.
- `python -X utf8 scripts/verify_role4_integration.py` scores a synthetic profile against all 118 company records and checks API route wiring without sending candidate documents to an AI provider.

## Provider and privacy behavior

Resume parsing defaults to offline heuristic extraction when no provider key is configured. When an OpenRouter or OpenAI provider is enabled, extracted resume text is sent to that provider. The resume API keeps uploads in a temporary directory during processing and removes it afterward. The service has no authentication or rate limiting, so keep it local for the hackathon demo.
