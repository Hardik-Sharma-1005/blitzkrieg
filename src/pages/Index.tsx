import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Building2, Check, GitCompareArrows, Search, Sparkles, X } from "lucide-react";
import { CompanyCard } from "@/components/company/CompanyCard";
import { Button } from "@/components/ui/button";
import { normalizeCompanySummary } from "@/lib/companyData";
import { fetchCompanyDirectory } from "@/lib/companyRepository";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { useCompany } from "@/lib/companyContext";

export function Index() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"name-asc" | "name-desc" | "location">("name-asc");
  const navigate = useNavigate();
  const { selectCompany, compareCompanyIds, toggleCompareCompany } = useCompany();
  const directoryQuery = useQuery({
    queryKey: ["company-directory"],
    queryFn: fetchCompanyDirectory,
  });
  const companies = useMemo(
    () => (directoryQuery.data ?? []).map(({ short_json, headquarters_address, logo_url, website_url }) => normalizeCompanySummary(short_json, { headquarters_address, logo_url, website_url })),
    [directoryQuery.data],
  );
  const categories = useMemo(
    () => [...new Set(companies.map((company) => company.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [companies],
  );
  const compareCompanies = useMemo(
    () => compareCompanyIds.map((id) => companies.find((company) => company.companyId === id)).filter((company): company is (typeof companies)[number] => Boolean(company)),
    [companies, compareCompanyIds],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const visibleCompanies = useMemo(() => companies
    .filter((summary) => {
      const haystack = [summary.name, summary.shortName, summary.category, summary.headquarters].join(" ").toLowerCase();
      const matchesSearch = haystack.includes(debouncedQuery);
      const matchesCategory = categoryFilter === "all" || summary.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
      if (sortOrder === "location") {
        const byLocation = a.headquarters.localeCompare(b.headquarters);
        return byLocation || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    }), [companies, debouncedQuery, categoryFilter, sortOrder]);

  const clearFilters = () => {
    setQuery("");
    setCategoryFilter("all");
    setSortOrder("name-asc");
  };

  const chooseCompany = (company: (typeof companies)[number]) => {
    selectCompany(company);
    navigate("/company/intelligence");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#fbf8f1] pb-8">
      <header className="relative isolate overflow-hidden border-b border-[#e9e1d5] bg-gradient-to-br from-[#fff4d7] via-[#fbf8f1] to-[#e4f2e9]">
        <div aria-hidden="true" className="ambient-drift pointer-events-none absolute -right-14 top-10 h-56 w-56 rounded-full bg-[#efb5a0]/45 blur-2xl" />
        <div aria-hidden="true" className="ambient-drift-delayed pointer-events-none absolute -bottom-24 left-[38%] h-64 w-64 rounded-full bg-[#9fd3c0]/40 blur-3xl" />
        <div className="relative mx-auto max-w-[1440px] px-5 pb-10 pt-9 sm:px-8 sm:pb-14 sm:pt-12 lg:px-12 lg:pb-16">
          <div className="flex items-center gap-3">
            <img src="/jss-university-logo.png" alt="JSS University, Noida" className="h-12 w-12 rounded-xl object-contain shadow-sm" />
            <div>
              <p className="font-heading text-sm font-semibold text-[#25334a]">JSS University, Noida</p>
              <p className="text-xs text-slate-500">Student Career Hub</p>
            </div>
          </div>

          <div className="mt-9 w-full sm:mt-12">
            <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#246b5d] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#d29335]" /> Placement intelligence
            </div>
            <div className="inline-flex items-center rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur">
              {isSupabaseConfigured ? "Supabase configured" : "Demo dataset · 2 fictional profiles"}
            </div>
            </div>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold leading-[1.06] tracking-tight text-[#23334b] sm:text-5xl lg:text-6xl">
              Your next move starts with good research.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Explore company profiles, skill expectations, and career signals before campus placements.
            </p>
            <div className="mt-7 grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
              <button type="button" onClick={() => navigate("/skill-match")} className="group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-3xl border border-[#d7e8dc] bg-[#fffdf8] p-4 text-left shadow-[0_8px_24px_rgba(40,77,60,0.07)] transition duration-200 hover:-translate-y-1 hover:border-[#9fcab5] hover:shadow-[0_16px_32px_rgba(40,77,60,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#246b5d] focus-visible:ring-offset-2 sm:p-5">
                <span aria-hidden="true" className="grid h-28 w-full place-items-center overflow-hidden rounded-2xl bg-[#e8f3eb] sm:h-32">
                  <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
                    <rect x="25" y="15" width="55" height="86" rx="8" fill="#fffdf8" stroke="#9fcab5" strokeWidth="2"/><path d="M37 34h27M37 44h19M37 60h10M51 60h16" stroke="#9cb8a9" strokeWidth="3" strokeLinecap="round"/><rect x="36" y="70" width="32" height="6" rx="3" fill="#d8ece0"/><rect x="36" y="82" width="24" height="6" rx="3" fill="#d8ece0"/>
                    <path d="M84 60h28m-8-8 8 8-8 8" stroke="#267462" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><rect x="120" y="28" width="55" height="69" rx="8" fill="#fffdf8" stroke="#d9c28e" strokeWidth="2"/><path d="M136 28v-7h23v7M135 52h25" stroke="#ae8740" strokeWidth="3" strokeLinecap="round"/><path d="m139 72 7 7 13-15" stroke="#267462" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="mt-4 block pr-6"><span className="block font-heading text-lg font-semibold leading-6 text-[#26354b]">Match resume to a job</span><span className="mt-1.5 block text-sm leading-5 text-slate-600">See how your resume fits a specific job description.</span></span>
                <ArrowUpRight aria-hidden="true" className="absolute bottom-5 right-5 h-5 w-5 text-[#6f9384] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
              <button type="button" onClick={() => navigate("/jd-analytics")} className="group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-3xl border border-[#eadfc8] bg-[#fffdf8] p-4 text-left shadow-[0_8px_24px_rgba(95,73,32,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#d6c49e] hover:shadow-[0_16px_32px_rgba(95,73,32,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#246b5d] focus-visible:ring-offset-2 sm:p-5">
                <span aria-hidden="true" className="grid h-28 w-full place-items-center overflow-hidden rounded-2xl bg-[#fbf1dc] sm:h-32">
                  <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
                    <rect x="27" y="16" width="110" height="87" rx="9" fill="#fffdf8" stroke="#d7bd83" strokeWidth="2"/><path d="M27 31h110" stroke="#e8d9b8" strokeWidth="2"/><circle cx="39" cy="24" r="2" fill="#c09343"/><circle cx="47" cy="24" r="2" fill="#d7bd83"/><path d="M42 46h53M42 57h42M42 70h35" stroke="#c9b98f" strokeWidth="4" strokeLinecap="round"/><rect x="42" y="80" width="49" height="8" rx="4" fill="#f3e5c2"/><circle cx="128" cy="72" r="23" fill="#fff8e8" stroke="#b48634" strokeWidth="5"/><path d="m145 89 18 18" stroke="#b48634" strokeWidth="7" strokeLinecap="round"/><path d="m119 72 6 6 12-14" stroke="#267462" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="mt-4 block pr-6"><span className="block font-heading text-lg font-semibold leading-6 text-[#26354b]">Analyze a job description</span><span className="mt-1.5 block text-sm leading-5 text-slate-600">Find the skills and experience a posting asks for.</span></span>
                <ArrowUpRight aria-hidden="true" className="absolute bottom-5 right-5 h-5 w-5 text-[#a99978] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
              <button type="button" onClick={() => navigate("/resume-profile")} className="group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-3xl border border-[#d7e8dc] bg-[#fffdf8] p-4 text-left shadow-[0_8px_24px_rgba(40,77,60,0.07)] transition duration-200 hover:-translate-y-1 hover:border-[#9fcab5] hover:shadow-[0_16px_32px_rgba(40,77,60,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#246b5d] focus-visible:ring-offset-2 sm:p-5">
                <span aria-hidden="true" className="grid h-28 w-full place-items-center overflow-hidden rounded-2xl bg-[#e8f3eb] sm:h-32">
                  <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
                    <rect x="57" y="10" width="86" height="101" rx="9" fill="#fffdf8" stroke="#9fcab5" strokeWidth="2"/><circle cx="83" cy="39" r="14" fill="#cfe7d9"/><path d="M63 70c2-12 10-18 20-18s18 6 20 18" fill="#d9eee1"/><path d="M111 34h20M111 43h16" stroke="#8fb49e" strokeWidth="3" strokeLinecap="round"/><path d="M69 82h62" stroke="#d7e8dc" strokeWidth="2"/><path d="M70 93h22" stroke="#267462" strokeWidth="4" strokeLinecap="round"/><path d="M99 93h31" stroke="#d7e8dc" strokeWidth="5" strokeLinecap="round"/><path d="M70 102h16" stroke="#c89848" strokeWidth="4" strokeLinecap="round"/><path d="M93 102h37" stroke="#d7e8dc" strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                </span>
                <span className="mt-4 block pr-6"><span className="block font-heading text-lg font-semibold leading-6 text-[#26354b]">Create your resume profile</span><span className="mt-1.5 block text-sm leading-5 text-slate-600">Turn your resume into a structured skills profile.</span></span>
                <ArrowUpRight aria-hidden="true" className="absolute bottom-5 right-5 h-5 w-5 text-[#6f9384] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
              <button type="button" onClick={() => navigate("/talent-check")} className="group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-3xl border border-[#eadfc8] bg-[#fffdf8] p-4 text-left shadow-[0_8px_24px_rgba(95,73,32,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#d6c49e] hover:shadow-[0_16px_32px_rgba(95,73,32,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#246b5d] focus-visible:ring-offset-2 sm:p-5">
                <span aria-hidden="true" className="grid h-28 w-full place-items-center overflow-hidden rounded-2xl bg-[#fbf1dc] sm:h-32">
                  <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
                    <path d="M27 103V37l30-17 30 17v66" fill="#fffdf8" stroke="#d7bd83" strokeWidth="2" strokeLinejoin="round"/><path d="M38 48h9v9h-9zM55 48h9v9h-9zM38 65h9v9h-9zM55 65h9v9h-9z" fill="#f1e4c7"/><path d="M49 103V84h16v19M27 103h60" stroke="#b88e47" strokeWidth="3" strokeLinejoin="round"/><path d="M100 93h13M100 76h24M100 59h38" stroke="#d6c49e" strokeWidth="7" strokeLinecap="round"/><path d="M100 93h27" stroke="#267462" strokeWidth="7" strokeLinecap="round"/><circle cx="158" cy="43" r="22" fill="#fffdf8" stroke="#267462" strokeWidth="3"/><circle cx="158" cy="43" r="12" stroke="#9fcab5" strokeWidth="3"/><circle cx="158" cy="43" r="3" fill="#c18a36"/><path d="m158 43 12-11" stroke="#c18a36" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
                <span className="mt-4 block pr-6"><span className="block font-heading text-lg font-semibold leading-6 text-[#26354b]">Check skills against a company</span><span className="mt-1.5 block text-sm leading-5 text-slate-600">Compare your profile with one of 118 company benchmarks.</span></span>
                <ArrowUpRight aria-hidden="true" className="absolute bottom-5 right-5 h-5 w-5 text-[#a99978] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="mt-8 grid max-w-5xl gap-3 sm:grid-cols-[minmax(0,1fr)_220px_190px]">
            <div className="relative">
              <label htmlFor="company-search" className="sr-only">Search by company, industry, or location</label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#92866e]" />
              <input id="company-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies, industries, or locations" className="h-12 w-full rounded-2xl border border-[#e4dbca] bg-[#fffdf8] pl-12 pr-12 text-sm text-slate-900 shadow-[0_8px_24px_rgba(70,53,24,0.06)] outline-none placeholder:text-slate-400 focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-[#f3eee5] hover:text-slate-700"><X className="h-4 w-4" /></button>}
            </div>
            <label className="sr-only" htmlFor="category-filter">Filter by industry</label>
            <select id="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-12 w-full rounded-2xl border border-[#e4dbca] bg-[#fffdf8] px-3 text-sm text-slate-700 shadow-sm outline-none focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]">
              <option value="all">All industries</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <label className="sr-only" htmlFor="company-sort">Sort companies</label>
            <select id="company-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)} className="h-12 w-full rounded-2xl border border-[#e4dbca] bg-[#fffdf8] px-3 text-sm text-slate-700 shadow-sm outline-none focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]">
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="location">Location</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a47d32]">Start exploring</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-[#26354b] sm:text-3xl">Company directory</h2>
            <p className="mt-1 text-sm text-slate-500">Compare up to three companies as you build your shortlist.</p>
          </div>
          <span className="rounded-full border border-[#e9e1d5] bg-[#fffdf8] px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm" role="status" aria-live="polite">
            {directoryQuery.isPending
              ? "Loading companies…"
              : visibleCompanies.length === companies.length
                ? `${companies.length} ${companies.length === 1 ? "company" : "companies"}`
                : `${visibleCompanies.length} of ${companies.length} companies`}
          </span>
        </div>

        {directoryQuery.isPending ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[278px] animate-pulse rounded-2xl border border-[#e9e1d5] bg-[#fffdf8] p-5"><div className="h-12 w-12 rounded-xl bg-[#eee8dc]" /><div className="mt-5 h-4 w-2/3 rounded bg-[#eee8dc]" /><div className="mt-3 h-3 w-1/3 rounded bg-[#eee8dc]" /><div className="mt-7 space-y-3"><div className="h-3 w-3/4 rounded bg-[#eee8dc]" /><div className="h-3 w-2/3 rounded bg-[#eee8dc]" /><div className="h-3 w-1/2 rounded bg-[#eee8dc]" /></div></div>)}</div>
        ) : directoryQuery.isError ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
            <h3 className="font-heading text-xl font-semibold text-slate-900">Couldn’t load companies</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Please try again in a moment.</p>
            <Button variant="soft" className="mt-5" onClick={() => void directoryQuery.refetch()}>Try again <ArrowRight className="h-4 w-4" /></Button>
          </div>
        ) : companies.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f1ece2] text-[#8c7f62]"><Building2 className="h-6 w-6" /></span>
            <h3 className="mt-5 font-heading text-xl font-semibold text-slate-900">No company profiles available</h3>
            <p className="mt-2 text-sm text-slate-500">Company profiles will appear here when they are available.</p>
          </div>
        ) : visibleCompanies.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleCompanies.map((summary) => <CompanyCard key={summary.companyId} company={summary} onOpen={() => chooseCompany(summary)} isCompared={compareCompanyIds.includes(summary.companyId)} onToggleCompare={() => toggleCompareCompany(summary)} compareLimitReached={compareCompanyIds.length >= 3} />)}
          </div>
        ) : (
          <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f1ece2] text-[#8c7f62]"><Building2 className="h-6 w-6" /></span>
            <h3 className="mt-5 font-heading text-xl font-semibold text-slate-900">No matching companies</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Try a different search or industry, or clear the filters.</p>
            <Button variant="soft" className="mt-5" onClick={clearFilters}>Clear filters <ArrowRight className="h-4 w-4" /></Button>
          </div>
        )}
        <div className={`mt-8 border-t border-[#e9e1d5] pt-5 text-center text-xs text-slate-400 ${compareCompanies.length ? "pb-28 sm:pb-20" : ""}`}>JSS University, Noida · Student Career Hub</div>
      </main>

      <AnimatePresence>
        {compareCompanies.length > 0 && (
          <motion.aside initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.24, ease: "easeOut" }} className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-5xl rounded-2xl border border-[#dcd2c1] bg-[#fffdf8]/95 p-3 shadow-[0_18px_50px_rgba(39,48,42,0.18)] backdrop-blur-xl sm:inset-x-6 sm:bottom-5 sm:p-4" aria-label="Company comparison selection">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#26354b]"><GitCompareArrows className="h-4 w-4 text-[#216b5c]" /> Comparison shortlist <span className="rounded-full bg-[#e4f2e9] px-2 py-0.5 text-xs text-[#246b5d]">{compareCompanies.length}/3</span></div>
                <div className="mt-2 flex max-w-full gap-2 overflow-x-auto scrollbar-none">
                  {compareCompanies.map((company) => <span key={company.companyId} className="inline-flex max-w-[200px] shrink-0 items-center gap-1.5 rounded-full border border-[#e9e1d5] bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                    <Check className="h-3 w-3 text-[#348c6d]" /><span className="truncate">{company.name}</span>
                    <button type="button" onClick={() => toggleCompareCompany(company)} aria-label={`Remove ${company.name} from comparison`} className="rounded-full p-0.5 text-slate-400 hover:bg-[#f3eee5] hover:text-slate-700"><X className="h-3 w-3" /></button>
                  </span>)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden text-xs text-slate-500 sm:block">{compareCompanies.length < 2 ? "Select one more company" : "Ready when you are"}</span>
                <Button disabled={compareCompanies.length < 2} onClick={() => navigate("/company/compare")} className="min-h-10 flex-1 sm:flex-none">
                  Compare <span className="hidden sm:inline">companies</span><ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
