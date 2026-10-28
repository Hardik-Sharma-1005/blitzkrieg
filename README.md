# blitzkrieg!

An exclusive career and placement intelligence platform for students, recruiters, and the placement team at JSS University, Noida. It brings together company intelligence, skill roadmaps, company comparison, job-description analytics, resume parsing, and Talent Check.

## Run the local demo

1. Install Node.js 20.19+ or 22.12+ and Python 3.12+.
2. Run npm install from the project root.
3. From backend/, create a virtual environment and install requirements.txt.
4. Copy the root .env.example to .env.local and set the Supabase URL and publishable key if you want live company data.
5. Copy backend/.env.example to backend/.env. Add an AI provider key only if you want live extraction.
6. Run py temprunner.py from the project root. It starts the frontend and shared API at http://127.0.0.1:5173 and http://127.0.0.1:8000.

You can also run only the frontend with npm run dev. The API's interactive documentation is at http://127.0.0.1:8000/docs.

## Demo path

1. Search the company directory and open a company profile.
2. Compare two or three companies and review their profiles, skill expectations, and learning signals.
3. Open Skill Intelligence, rate a few skills, and review the largest gaps to the selected company's targets.
4. Analyze a supplied job description from Analyze a JD and inspect the extracted skills and supporting evidence.
5. Open Build your resume profile, upload a supplied resume, and review the structured candidate profile.
6. Open Match resume to a job, parse a resume and JD, and inspect confirmed, possible, and missing skill matches with source evidence.
7. Open Talent Check, upload a resume, select a company benchmark, and continue through the Talent Check report, Gemini Coach, Interview Practice, and Skill Proof Sprint.

## Frontend and Supabase

The frontend reads company_json, company_skill_levels, skill_set_master, proficiency_levels, and skill_set_topics. It supports the supplied short_json, full_json, and skill_levels shapes. Company profiles need public read access to company_json; supporting skill-table queries need their own SELECT access and policies.

With Supabase configured, the app uses live company data and reports query failures with a retry state. It does not silently replace a failed live query with demo records. Without Supabase settings, it uses bundled demo profiles; the Accenture sample has not been independently verified, while Northstar Digital Lab and Meridian Cloud Services are fictional scenarios labeled in the UI.


The SQL & Design 10-level roadmap remains app-local because that skill has no database topics yet. Student self-ratings are stored only in browser local storage; they are not sent to Supabase.

Before enabling anonymous reads, review short_json and full_json for private or unapproved fields. Grant the anon role only the intended SELECT access and use matching row-level security policies. Never put a service-role or other secret key in the frontend.

## Job-description analytics and resume parsing

The shared FastAPI app exposes:

- GET /api/health — status for the JD and resume services, plus configured providers.
- POST /api/analyze — accepts a PDF or DOCX JD and returns a categorized skill list with evidence.
- POST /api/parse-resume — accepts a PDF or DOCX resume and returns the CandidateProfile handoff for Profile Builder. AI extraction is attempted first; local heuristic extraction is a labeled fallback if no provider is configured or the AI result fails validation.
- POST /api/skill-match — compares the parsed resume skills and evidence with the parsed JD requirements. Exact names and known aliases count toward confirmed coverage; fuzzy text similarities are returned separately as possible matches.
- GET /api/talent-check/companies — returns the 118 companies available to Talent Check and identifies the five that use a RADIX-wide fallback.
- POST /api/talent-check — scores the parsed resume against the selected company’s RADIX-12 profile and returns the report and radar-chart data.
- POST /api/talent-check/coach — sends a report question to the AI Career Coach, trying Gemini and then the configured OpenRouter/OpenAI providers.
- POST /api/talent-check/interview/questions and `/evaluate` — generates gap-based practice questions and evaluates an answer.
- POST /api/talent-check/sprint/challenge and `/evaluate` — creates a Skill Proof Sprint and evaluates a submitted solution.
- POST /api/talent-check/report — returns the downloadable Markdown report.
- Vansh's integrated Talent Match page also uses `/api/ai-coach`, `/api/interview-practice/generate|evaluate`, `/api/skill-sprint/generate|evaluate`, and `/api/talent-check/report-md` compatibility routes.

Talent Check follows Vansh’s resume → company → 12-skill RADIX report workflow, with his Career Coach, Interview Practice, and Skill Proof Sprint. `data/radix_company_benchmarks.json` is a snapshot of the project’s 118-company Supabase directory and its `company_skill_levels` table. 113 companies have company-specific skill profiles. The other five use the RADIX-wide median across the 113 complete profiles; the UI and report identify this clearly instead of implying those values are employer-specific. Company profiles are preparation benchmarks, not live job-description requirements or hiring decisions. The source database uses a 1–10 scale; Talent Check converts it to the report’s 1–5 scale.

JD Analytics and resume parsing try configured providers with bounded requests. If JD AI extraction fails, local fallback scans readable document text for explicit skill and tool names, returns source evidence, and labels the result as a local fallback. It can miss skills expressed indirectly and cannot extract text from image-only pages. Resume parsing uses its own labeled local heuristic fallback. Talent Check AI features try Gemini for 30 seconds, then the configured OpenRouter/OpenAI providers, each with a 30-second limit and no hidden SDK retries. These AI fallbacks receive the report details or answer text needed for the requested feature. Set `LLM_PROVIDER`, `OPENROUTER_API_KEY`, and/or `OPENAI_API_KEY` in `backend/.env`; set `GEMINI_API_KEY` in `role4_standalone/.env`. Keep both environment files local and untracked.

Live resume skills are kept only when their evidence is a verbatim excerpt from the extracted resume text. If the model returns no grounded evidence, the parser falls back to local heuristic extraction.

The resume endpoint enforces a 12 MB limit, uses a temporary file that is removed after processing, rejects unsupported files and likely JDs, and returns a structured response. It does not store uploaded resumes in Supabase or write them to the repository's output folder. JD analysis JSON is written to the ignored local output/ folder when available.

AI-provider requests send extracted document text, and for image-based JDs may send rendered page images, to the configured provider. The project has no login or API authentication/rate limiting. Keep the integrated API local for the hackathon demo; add access controls before exposing it as a public service. Do not upload real candidate resumes without their consent.

To verify the bundled PDF and Word resume samples locally, run python scripts/verify_resume_samples.py. This uses offline extraction and does not write files by default. Add --write-output only when you want to refresh local JSON output files under output/resumes/.

## Routes

- / — company search and selection
- /company/intelligence — company profile sections
- /company/skills — skill expectations and topic roadmaps
- /company/compare — comparison of up to three companies
- /jd-analytics — job-description skill extraction
- /resume-profile — upload and review a parsed resume, then run Vansh's integrated Talent Match workflow
- /talent-check — opens the same integrated workflow
- /skill-match — parse a resume and job description, then compare their extracted skills and evidence
- /talent-check — run the Role 4 company-benchmark preparation workflow
