# JSS University Companies Research & Placement Analytics Portal

The portal is public and has no login or profile-based access. With Supabase settings absent, it uses three bundled demo profiles so the directory, comparison, and skill-match flows work offline. The Accenture sample has not been independently verified; Northstar Digital Lab and Meridian Cloud Services are fictional scenarios and are labeled in the UI. With Supabase settings present, the portal loads records through public, read-only queries.

The college name used in the interface is **JSS University, Noida**, with the short tag **JSS**. The data normalizers accept the `short_json`, `full_json`, and `skill_levels` shapes used by the supplied database design. The SQL & Design 10-level roadmap remains app-local because that skill has no database topics yet.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Run `npm run dev` and open the local address shown in the terminal.

Run `npm run build` to create a production build.

## Quick demo path

1. Open two or three companies from the directory and add them to the comparison shortlist.
2. Compare skill targets, learning signals, and profile details; point out the source and freshness line on each profile.
3. Open Skill Intelligence, rate a few skills, and show the largest gaps to the selected company's targets.

For an offline presentation, temporarily unset both Supabase environment variables before starting Vite. The app deliberately keeps configured live data and demo data separate; it will not replace a failed Supabase request with sample records.

Company logos are read from the public company profile data. If a profile has no usable logo URL, the portal shows the company's initial.

## Connect Supabase

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Older projects can use `VITE_SUPABASE_ANON_KEY` instead.
3. Restart the dev server.

The client reads `company_json`, `company_skill_levels`, `skill_set_master`, `proficiency_levels`, and `skill_set_topics`. Company profiles require public read access to `company_json`; skill requirements, labels, and topics are supporting data. If a supporting skill-table query is denied, profile comparison still works and the app explains which data is unavailable. A company profile query failure shows a retry state with a hint for network, schema, or access-policy checks. The app does not silently switch from a configured live database to demo data.

The source and freshness line reads optional JSON metadata keys: `data_source_label` (or `source_name` / `data_source`), `data_source_url` (or `source_url` / `source_link`), and `data_as_of` (or `last_verified_at`, `data_updated_at`, `last_updated_at`, or `updated_at`). If those fields are absent, the UI says so rather than implying that data is current.

No database schema or row-level security policies are included in this repository, so remote grants and active policies cannot be confirmed from the project files. Before enabling anonymous reads, review `short_json` and `full_json` for private or unapproved fields. Then grant the `anon` role only the intended `SELECT` access and add matching row-level security policies for the approved public company records. The skill tables need their own `SELECT` access if skill targets, proficiency labels, and database roadmaps should be visible. Never put a service-role or secret key in this frontend.

On the Skill Intelligence page, students can optionally rate themselves against the listed 1–10 targets. Ratings are stored only in that browser's local storage; they are not sent to Supabase and there is no login.

## Routes

- `/` — company search and selection
- `/company/intelligence` — 22 company profile sections
- `/company/skills` — required skills and 10-level topic ladders
- `/company/compare` — side-by-side comparison of up to three companies, with partial results if one profile cannot load

Selected company, comparison shortlist, and optional skill self-ratings are stored in browser local storage so direct refreshes on company routes continue to work.
