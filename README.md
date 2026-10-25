# JSS University, Noida — Student Career Hub

A student-facing placement research portal with company intelligence, skill roadmaps, company comparison, job-description analytics, and resume parsing.

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
2. Compare two or three companies and review their sources, freshness, skill expectations, and learning signals.
3. Open Skill Intelligence, rate a few skills, and review the largest gaps to the selected company's targets.
4. Analyze a supplied job description from Analyze a JD and inspect the extracted skills and supporting evidence.
5. Send a supplied resume to the resume parsing endpoint and review the structured candidate profile.

## Frontend and Supabase

The frontend reads company_json, company_skill_levels, skill_set_master, proficiency_levels, and skill_set_topics. It supports the supplied short_json, full_json, and skill_levels shapes. Company profiles need public read access to company_json; supporting skill-table queries need their own SELECT access and policies.

With Supabase configured, the app uses live company data and reports query failures with a retry state. It does not silently replace a failed live query with demo records. Without Supabase settings, it uses bundled demo profiles; the Accenture sample has not been independently verified, while Northstar Digital Lab and Meridian Cloud Services are fictional scenarios labeled in the UI.

Company source and freshness labels come from optional JSON metadata keys: data_source_label (or source_name / data_source), data_source_url (or source_url / source_link), and data_as_of (or last_verified_at, data_updated_at, last_updated_at, or updated_at). When those fields are absent, the UI says the information is unavailable rather than implying the data is current.

The SQL & Design 10-level roadmap remains app-local because that skill has no database topics yet. Student self-ratings are stored only in browser local storage; they are not sent to Supabase.

Before enabling anonymous reads, review short_json and full_json for private or unapproved fields. Grant the anon role only the intended SELECT access and use matching row-level security policies. Never put a service-role or other secret key in the frontend.

## Job-description analytics and resume parsing

The shared FastAPI app exposes:

- GET /api/health — status for the JD and resume services, plus configured providers.
- POST /api/analyze — accepts a PDF or DOCX JD and returns a categorized skill list with evidence.
- POST /api/parse-resume — accepts a PDF or DOCX resume and returns the CandidateProfile handoff for Profile Builder.

JD Analytics uses OpenRouter when OPENROUTER_API_KEY is configured. Resume parsing can use OpenRouter or OpenAI, selected by LLM_PROVIDER=auto|openrouter|openai|off. With no resume-provider key, it uses local heuristic extraction. The resume sample verification command always forces offline mode and never sends candidate documents to an external provider.

The resume endpoint enforces a 12 MB limit, uses a temporary file that is removed after processing, rejects unsupported files and likely JDs, and returns a structured response. It does not store uploaded resumes in Supabase or write them to the repository's output folder. JD analysis JSON is written to the ignored local output/ folder when available.

AI-provider requests send extracted document text, and for image-based JDs may send rendered page images, to the configured provider. The project has no login or API authentication/rate limiting. Keep the integrated API local for the hackathon demo; add access controls before exposing it as a public service. Do not upload real candidate resumes without their consent.

To verify the bundled PDF and Word resume samples locally, run python scripts/verify_resume_samples.py. This uses offline extraction and does not write files by default. Add --write-output only when you want to refresh local JSON output files under output/resumes/.

## Routes

- / — company search and selection
- /company/intelligence — company profile sections
- /company/skills — skill expectations and topic roadmaps
- /company/compare — comparison of up to three companies
- /jd-analytics — job-description skill extraction
