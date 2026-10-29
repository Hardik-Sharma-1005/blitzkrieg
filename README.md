# ⚡ Blitzkrieg
### Career intelligence that turns placement preparation into a plan.

Blitzkrieg is a career and placement intelligence platform built for students, recruiters, and placement teams at **JSS University, Noida**. It connects company research, job-description analysis, resume parsing, candidate profiles, skill matching, and company-benchmark readiness into one workflow.

> **Understand the role. Understand your evidence. Find the gaps. Prepare with purpose.**

<p align="center">
  <a href="https://jss-placement-intelligence-portal.vercel.app/"><strong>🚀 Open the live demo</strong></a>
  ·
  <a href="https://github.com/Hardik-Sharma-1005/blitzkrieg"><strong>💻 Explore the source</strong></a>
</p>

---

## 🧭 The problem we're solving

Placement preparation can feel scattered: job requirements sit in long descriptions, candidate information lives in resumes, and students often struggle to decide which skills deserve their attention first.

Blitzkrieg brings these pieces together. Instead of treating a resume, a job description, and a company profile as separate documents, it helps users inspect them as connected sources of career intelligence.

## ✨ Explore the platform

| Module | What it helps you do |
| --- | --- |
| 🏢 **Company Intelligence** | Explore company profiles, skill expectations, and learning signals. |
| 📊 **Company Comparison** | Compare up to three companies and review how their skill expectations differ. |
| 🎯 **Skill Intelligence** | Rate your skills and identify gaps against a selected company's targets. |
| 📄 **JD Analytics** | Upload a PDF or DOCX job description and extract categorized skills with supporting evidence and confidence labels. |
| 🧾 **Resume Parsing** | Turn a resume into structured candidate information and skill evidence. |
| 🪪 **Profile Builder** | Review and edit candidate details carried forward from resume parsing. |
| 🧩 **Skill Matching** | Compare resume skills with job requirements, separating matched, possible, and missing skills. |
| 🚦 **Talent Check** | Compare a candidate profile with a company benchmark and inspect an overall readiness score and skill-level gaps. |
| 🤖 **Career Coach & practice tools** | In the Talent Check workflow, explore report-based coaching, interview practice, and Skill Proof Sprint activities where configured. |

## 🔄 One connected workflow

```text
Company / role research
        ↓
Job Description (JD) Analytics ──→ Structured job requirements
        ↓
Resume Parsing ──────────────────→ Structured candidate profile
        ↓
Profile Builder ─────────────────→ Review and correct details
        ↓
   ┌────┴────────────┐
   ↓                 ↓
Talent Check     Skill Matching
   ↓                 ↓
Company-benchmark   Resume ↔ job
readiness gaps      requirement comparison
   └────────┬────────┘
            ↓
     A clearer preparation plan
```

The modules are designed to complement one another: JD Analytics focuses on what a role asks for; Skill Matching compares that requirement set with a candidate's resume evidence; Talent Check compares the candidate with a company skill benchmark.

## 🧠 How the AI and extraction flows work

- **Structured outputs:** JD Analytics returns categorized skills with evidence and confidence labels.
- **Evidence-aware matching:** Exact skill names and recognized aliases count as confirmed matches; fuzzy similarities are reported separately as possible matches.
- **Fallback behavior:** If a configured AI extraction request is unavailable or its output fails validation, the relevant extraction flow can use a labeled local heuristic fallback. Heuristics scan readable document text for explicit skill/tool names and can miss indirect or context-dependent skills.
- **Document support:** JD Analytics and resume parsing accept PDF and DOCX files up to 12 MB. Image-based PDF pages may use a vision extraction path when configured; image-only content is not guaranteed to be understood in every fallback mode.
- **Candidate control:** Extracted details should be reviewed. Finding a skill in a document is not the same as independently verifying proficiency.

### Talent Check benchmarks: read the score in context

Talent Check uses a **12-skill RADIX benchmark**. The repository's benchmark snapshot covers 118 company options: 113 have company-specific skill profiles, while five use a RADIX-wide median fallback based on the complete profiles. The interface/report identifies the fallback rather than presenting it as company-specific data. Source skill levels use a 1–10 scale and are converted to a 1–5 scale for the report.

A readiness score is a **preparation signal against the selected benchmark**, not a hiring prediction, employer endorsement, or guarantee of selection. Company benchmarks are not the same as live job requirements.

## 🛠️ Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| UI & interaction | Tailwind CSS, Radix UI, Framer Motion, Lucide, Recharts |
| Routing & data state | React Router, TanStack Query |
| Company data | Supabase |
| API | Python, FastAPI, Uvicorn |
| Document processing | pypdf, pdfplumber, python-docx, pypdfium2, Pillow |
| AI integrations | Configurable Gemini, OpenRouter, and OpenAI provider flows, depending on the feature and local configuration |

## 🏗️ Architecture at a glance

- **Frontend:** `src/` contains the React application, pages, shared UI, and candidate/company state.
- **Backend:** `backend/app/main.py` exposes the shared FastAPI service and wires in JD analysis, resume parsing, Talent Check, and skill matching.
- **Company benchmarks:** bundled benchmark data supports the Talent Check workflow; company intelligence can use Supabase when configured.
- **Local launcher:** `temprunner.py` starts the frontend and API for local development.

### Useful frontend routes

| Route | Purpose |
| --- | --- |
| `/` | Home / company discovery |
| `/companies` | Company directory |
| `/company/intelligence` | Company intelligence |
| `/company/skills` | Skill expectations and roadmaps |
| `/company/compare` | Compare companies |
| `/jd-analytics` | Analyze a job description |
| `/resume-profile` | Resume parsing and integrated Talent Match workflow |
| `/candidate-profile` | Review candidate profile |
| `/skill-match` | Compare a resume with a job description |
| `/talent-check` | Talent Check workflow |
| `/check-where-you-stand` | Candidate readiness experience |
| `/candidate-assessments` | Candidate assessment tools |
| `/job-readiness` | Job readiness |
| `/history` | Recent activity |

## 🚀 Run locally

### Prerequisites

- Node.js **20.19+ or 22.12+**
- Python **3.12+**
- npm
- Optional: Supabase project credentials and AI-provider API keys for live integrations

### 1. Install frontend dependencies

From the repository root:

```bash
npm install
```

### 2. Configure the frontend

Copy `.env.example` to `.env.local` in the project root:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_JD_ANALYTICS_API_URL=http://127.0.0.1:8000
```

Add your Supabase URL and publishable key if you want to use live company data. Without Supabase settings, the app uses its bundled demo profiles. Never put a Supabase service-role key in frontend environment variables.

### 3. Install backend dependencies

From the repository root:

**Windows PowerShell**
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
cd ..
```

**macOS / Linux**
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
cd ..
```

### 4. Configure AI providers (optional)

Edit `backend/.env` and add only the provider keys you have. The example file documents these settings:

```env
LLM_PROVIDER=auto
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=
OPENAI_MODEL_NAME=gpt-4o-mini
CORS_ORIGINS=
```

JD Analytics requires a configured OpenRouter provider for live AI extraction. Resume parsing can use local fallback extraction without a provider key. Some Talent Check AI features may also use Gemini configuration from `Talent Check/.env`; check the relevant feature's setup before relying on those features. Keep all real keys private and never commit local environment files.

### 5. Start the app

From the repository root:

```bash
python temprunner.py
```

The launcher starts the frontend and API, checks backend readiness, and opens the local frontend. The default frontend port is **5174** and the API port is **8000**; the launcher may choose an available frontend port if needed.

You can also start the frontend separately:

```bash
npm run dev
```

The FastAPI interactive docs are available at:

- API docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

If the frontend cannot reach the API, confirm the backend is running and that `VITE_JD_ANALYTICS_API_URL` points to its base URL.

## 🔌 API overview

The shared FastAPI service includes the following key endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | API health and provider configuration status |
| `POST /api/analyze` | Analyze a PDF/DOCX job description |
| `POST /api/parse-resume` | Parse a PDF/DOCX resume into structured candidate data |
| `POST /api/skill-match` | Compare resume skill evidence with JD requirements |
| `GET /api/talent-check/companies` | List company options and benchmark metadata |
| `POST /api/talent-check` | Generate a company-benchmark readiness report |
| `POST /api/talent-check/coach` | Ask a question about a Talent Check report |
| `POST /api/talent-check/interview/questions` and `/evaluate` | Generate and evaluate interview practice |
| `POST /api/talent-check/sprint/challenge` and `/evaluate` | Generate and evaluate a Skill Proof Sprint |
| `POST /api/talent-check/report` | Return a downloadable Markdown report |

Additional compatibility routes support the integrated Talent Match workflow. For the authoritative request/response schemas, run the API and inspect `/docs`.

## 🧪 Development and verification

Build the frontend:

```bash
npm run build
```

Verify the bundled resume samples using the offline extraction check:

```bash
python scripts/verify_resume_samples.py
```

The sample verification script does not write files by default. Use its `--write-output` option only if you intentionally want to refresh local JSON outputs under `output/resumes/`.

## 🔐 Privacy, security, and known limitations

- Uploaded resumes may contain personal information. Use synthetic/sample documents for demos and obtain consent before processing real resumes.
- AI-provider requests send extracted document text—and, for supported image-based JD pages, rendered page images—to the configured provider.
- Resume uploads are limited to 12 MB, processed through temporary files, and are not stored in Supabase by the resume endpoint.
- JD analysis JSON may be written to the ignored local `output/` directory.
- Student self-ratings are stored in browser local storage, not sent to Supabase.
- The integrated API currently has **no login/API authentication or rate limiting**. Keep it local or behind appropriate access controls; do not expose it as an unrestricted public service.
- Heuristic fallbacks can miss implicit requirements, and benchmark scores should not be interpreted as verified employer criteria or hiring outcomes.
- Review database contents and row-level security policies before enabling anonymous Supabase reads. Never expose service-role keys in the browser.

## 👥 Team

| Role | Team member | Focus in the demo |
| --- | --- | --- |
| Scrum Master / Role 3 | **Hardik** | Project flow and Profile Builder |
| Role 1 | **Ishu** | JD Analytics |
| Role 2 | **Daksh** | Resume Parsing |
| Role 4 | **Vansh** | Talent Check |
| Role 5 | **Yash** | Skill Matching |

## 🗺️ What's next

- Evaluate extraction precision and recall on a manually labelled set of job descriptions and resumes.
- Improve extraction of indirect or context-dependent skills and make evidence review easier.
- Expand benchmark transparency and freshness checks.
- Add authentication, rate limiting, and deployment hardening before public API exposure.
- Keep improving the connected journey from job requirements to a practical preparation plan.

---

<p align="center">
  <strong>Blitzkrieg — less guesswork, more intentional preparation. ⚡</strong>
</p>
