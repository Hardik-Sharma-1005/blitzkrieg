import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Check, FileText, GitCompareArrows, Search, Sparkles, X } from "lucide-react";
import { CompanyCard } from "@/components/company/CompanyCard";
import { InteractiveCosmos } from "@/components/InteractiveCosmos";
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
    () => (directoryQuery.data ?? []).map(({ short_json }) => normalizeCompanySummary(short_json)),
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
    <div className="portal-home min-h-screen overflow-hidden bg-[#f8f8f5] pb-8">
      <header onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - bounds.left) / bounds.width; const y = (event.clientY - bounds.top) / bounds.height; event.currentTarget.style.setProperty("--pointer-x", `${x * 100}%`); event.currentTarget.style.setProperty("--pointer-y", `${y * 100}%`); event.currentTarget.style.setProperty("--parallax-x", `${(0.5 - x) * 12}px`); event.currentTarget.style.setProperty("--parallax-y", `${(0.5 - y) * 9}px`); event.currentTarget.style.setProperty("--tilt-x", `${(x - 0.5) * 1.2}deg`); event.currentTarget.style.setProperty("--tilt-y", `${(0.5 - y) * 1.2}deg`); }} onPointerLeave={(event) => { event.currentTarget.style.setProperty("--parallax-x", "0px"); event.currentTarget.style.setProperty("--parallax-y", "0px"); event.currentTarget.style.setProperty("--tilt-x", "0deg"); event.currentTarget.style.setProperty("--tilt-y", "0deg"); }} className="portal-hero relative isolate overflow-hidden border-b border-white/10 bg-[#071311] text-white">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />
        <InteractiveCosmos variant="constellation" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-5 pb-12 pt-7 sm:px-8 sm:pb-16 sm:pt-9 lg:px-12 lg:pb-20">
          <div className="flex items-center gap-3">
            <img src="/jss-university-logo.png" alt="JSS University, Noida" className="h-11 w-11 rounded-xl bg-white object-contain p-1 shadow-sm" />
            <div>
              <p className="font-heading text-sm font-semibold text-white">JSS University, Noida</p>
              <p className="text-xs text-white/55">Student Career Hub</p>
            </div>
          </div>

          <div className="mt-12 max-w-3xl sm:mt-20">
            <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#dce4ef] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#d4dbe8]" /> Placement intelligence
            </div>
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold text-white/65 backdrop-blur">
              {isSupabaseConfigured ? "Supabase configured" : "Demo dataset · 2 fictional profiles"}
            </div>
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-5xl font-medium leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-[5.25rem]">
              Make your next move <span className="text-[#dce5f2]">with clarity.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              Explore company profiles, skill expectations, and career signals before campus placements.
            </p>
            <div className="mt-7 flex max-w-3xl flex-wrap items-center gap-2.5">
              <Button onClick={() => navigate("/skill-match")} className="min-h-11 rounded-full bg-[#f1f4f8] px-5 text-[#11151b] shadow-[0_8px_30px_rgba(210,222,240,.12)] hover:bg-white"><GitCompareArrows className="h-4 w-4" /> Match resume to a job <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => navigate("/jd-analytics")} className="min-h-11 rounded-full border-white/20 bg-white/[0.06] px-4 text-white hover:bg-white/15 hover:text-white">Analyze a job description</Button>
              <Button variant="outline" onClick={() => navigate("/resume-profile")} className="min-h-11 rounded-full border-white/20 bg-white/[0.06] px-4 text-white hover:bg-white/15 hover:text-white"><FileText className="h-4 w-4" /> Resume profile</Button>
              <Button variant="outline" onClick={() => navigate("/talent-check")} className="min-h-11 rounded-full border-white/20 bg-white/[0.06] px-4 text-white hover:bg-white/15 hover:text-white"><Sparkles className="h-4 w-4" /> Talent Check</Button>
            </div>
          </div>

          <div className="mt-10 grid max-w-5xl gap-3 sm:grid-cols-[minmax(0,1fr)_220px_190px]">
            <div className="relative">
              <label htmlFor="company-search" className="sr-only">Search by company, industry, or location</label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aab4c2]" />
              <input id="company-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies, industries, or locations" className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.08] pl-12 pr-12 text-sm text-white shadow-lg outline-none placeholder:text-white/40 focus:border-white/50 focus:ring-4 focus:ring-white/10" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>}
            </div>
            <label className="sr-only" htmlFor="category-filter">Filter by industry</label>
            <select id="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-12 w-full rounded-xl border border-white/15 bg-[#151a22] px-3 text-sm text-white shadow-sm outline-none focus:border-white/50 focus:ring-4 focus:ring-white/10">
              <option value="all">All industries</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <label className="sr-only" htmlFor="company-sort">Sort companies</label>
            <select id="company-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)} className="h-12 w-full rounded-xl border border-white/15 bg-[#151a22] px-3 text-sm text-white shadow-sm outline-none focus:border-white/50 focus:ring-4 focus:ring-white/10">
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="location">Location</option>
            </select>
          </div>
        </div>
      </header>

      <main onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`); event.currentTarget.style.setProperty("--pointer-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`); }} className="portal-cosmos relative isolate overflow-hidden bg-[#070d17] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <InteractiveCosmos variant="starfield" />
        <div className="relative z-10 mx-auto max-w-[1440px]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b5c0d0]">Start exploring</p>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[278px] animate-pulse rounded-2xl border border-[#29313b] bg-[#10151d] p-5"><div className="h-12 w-12 rounded-xl bg-[#202630]" /><div className="mt-5 h-4 w-2/3 rounded bg-[#202630]" /><div className="mt-3 h-3 w-1/3 rounded bg-[#202630]" /><div className="mt-7 space-y-3"><div className="h-3 w-3/4 rounded bg-[#202630]" /><div className="h-3 w-2/3 rounded bg-[#202630]" /><div className="h-3 w-1/2 rounded bg-[#202630]" /></div></div>)}</div>
        ) : directoryQuery.isError ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
            <h3 className="font-heading text-xl font-semibold text-slate-900">Couldn’t load companies</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Please try again in a moment.</p>
            <Button variant="soft" className="mt-5" onClick={() => void directoryQuery.refetch()}>Try again <ArrowRight className="h-4 w-4" /></Button>
          </div>
        ) : companies.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#202630] text-[#b9c4d4]"><Building2 className="h-6 w-6" /></span>
            <h3 className="mt-5 font-heading text-xl font-semibold text-slate-900">No company profiles available</h3>
            <p className="mt-2 text-sm text-slate-500">Company profiles will appear here when they are available.</p>
          </div>
        ) : visibleCompanies.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleCompanies.map((summary) => <CompanyCard key={summary.companyId} company={summary} onOpen={() => chooseCompany(summary)} isCompared={compareCompanyIds.includes(summary.companyId)} onToggleCompare={() => toggleCompareCompany(summary)} compareLimitReached={compareCompanyIds.length >= 3} />)}
          </div>
        ) : (
          <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#202630] text-[#b9c4d4]"><Building2 className="h-6 w-6" /></span>
            <h3 className="mt-5 font-heading text-xl font-semibold text-slate-900">No matching companies</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Try a different search or industry, or clear the filters.</p>
            <Button variant="soft" className="mt-5" onClick={clearFilters}>Clear filters <ArrowRight className="h-4 w-4" /></Button>
          </div>
        )}
        <div className={`mt-8 border-t border-[#242a34] pt-5 text-center text-xs text-slate-400 ${compareCompanies.length ? "pb-28 sm:pb-20" : ""}`}>JSS University, Noida · Student Career Hub</div>
        </div>
      </main>

      <AnimatePresence>
        {compareCompanies.length > 0 && (
          <motion.aside initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.24, ease: "easeOut" }} className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-5xl rounded-2xl border border-[#343d4a] bg-[#11161e]/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:inset-x-6 sm:bottom-5 sm:p-4" aria-label="Company comparison selection">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#e5eaf2]"><GitCompareArrows className="h-4 w-4 text-[#bdc9da]" /> Comparison shortlist <span className="rounded-full bg-[#27303c] px-2 py-0.5 text-xs text-[#e1e7f0]">{compareCompanies.length}/3</span></div>
                <div className="mt-2 flex max-w-full gap-2 overflow-x-auto scrollbar-none">
                  {compareCompanies.map((company) => <span key={company.companyId} className="inline-flex max-w-[200px] shrink-0 items-center gap-1.5 rounded-full border border-[#343d4a] bg-[#1a202a] px-2.5 py-1 text-xs font-medium text-[#d4dbe6]">
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
