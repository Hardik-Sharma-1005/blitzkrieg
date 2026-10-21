# JSS University Companies Research & Placement Analytics Portal

The portal is public and has no login or profile-based access. With Supabase settings absent, it uses a bundled Accenture seed record. With Supabase settings present, it loads live records through public, read-only queries and keeps the same UI.

The college name used in the interface is **JSS University, Noida**, with the short tag **JSS**. The data normalizers accept the `short_json`, `full_json`, and `skill_levels` shapes used by the supplied database design. The SQL & Design 10-level roadmap remains app-local because that skill has no database topics yet.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Run `npm run dev` and open the local address shown in the terminal.

Run `npm run build` to create a production build.

Company logos are read from the public company profile data. If a profile has no usable logo URL, the portal shows the company's initial.

## Connect Supabase

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Older projects can use `VITE_SUPABASE_ANON_KEY` instead.
3. Restart the dev server.

The client reads `company_json`, `company_skill_levels`, `skill_set_master`, `proficiency_levels`, and `skill_set_topics`. It does not write to Supabase. If settings are missing, the Accenture seed stays available. If a live query fails, the page shows a retry message rather than silently switching to demo data.

Before enabling anonymous reads, review the `short_json` and `full_json` fields for anything that should not be public. Configure the database grants and row-level security so unauthenticated visitors can only perform the intended `SELECT` operations on public company data. Do not put a service-role or secret key in this frontend.

## Routes

- `/` — company search and selection
- `/company/intelligence` — 22 company profile sections
- `/company/skills` — required skills and 10-level topic ladders
- `/company/compare` — side-by-side comparison of up to three companies

Selected company and comparison shortlist state are stored in browser local storage so direct refreshes on company routes continue to work.
