import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, Building2, Check, FileText, GitCompareArrows, Search, Sparkles, X } from "lucide-react";
import { CompanyCard } from "@/components/company/CompanyCard";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { InteractiveCosmos } from "@/components/InteractiveCosmos";
import { Button } from "@/components/ui/button";
import { normalizeCompanySummary } from "@/lib/companyData";
import { fetchCompanyDirectory } from "@/lib/companyRepository";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { useCompany } from "@/lib/companyContext";
import { useTheme } from "@/components/layout/SidebarContext";

const pathways = [
  { number: "01", label: "Read the market", title: "Company intelligence", copy: "Explore company profiles, compare employers, and understand the skills they value.", icon: Building2, route: "/company/intelligence" },
  { number: "02", label: "Find your fit", title: "Resume ↔ role matching", copy: "See confirmed, possible, and missing skills against a job description—with evidence.", icon: GitCompareArrows, route: "/skill-match" },
  { number: "03", label: "Build what’s next", title: "Talent Check", copy: "Compare your profile with a 12-skill RADIX benchmark, then practise the gaps.", icon: Sparkles, route: "/talent-check" },
];

export function Index() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"name-asc" | "name-desc" | "location">("name-asc");
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const { selectCompany, compareCompanyIds, toggleCompareCompany } = useCompany();
  const { theme } = useTheme();
  const directoryQuery = useQuery({ queryKey: ["company-directory"], queryFn: fetchCompanyDirectory });
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
      return haystack.includes(debouncedQuery) && (categoryFilter === "all" || summary.category === categoryFilter);
    })
    .sort((a, b) => {
      if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
      if (sortOrder === "location") return a.headquarters.localeCompare(b.headquarters) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    }), [companies, debouncedQuery, categoryFilter, sortOrder]);

  const clearFilters = () => { setQuery(""); setCategoryFilter("all"); setSortOrder("name-asc"); };
  const chooseCompany = (company: (typeof companies)[number]) => { selectCompany(company); navigate("/company/intelligence"); };
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : .6, delay: prefersReducedMotion ? 0 : delay, ease: "easeOut" as const },
  });

  return (
    <div className={`portal-home min-h-screen ${theme === "light" ? "theme-light" : ""}`}>
      <header className="brand-hero relative isolate flex min-h-[min(900px,100svh)] flex-col overflow-hidden px-5 pb-8 pt-7 text-center sm:px-8 sm:pt-9">
        <div aria-hidden="true" className="brand-hero-grid pointer-events-none absolute inset-0" />
        <InteractiveCosmos variant="starfield" tone={theme} />
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-end">
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Quick links">
            <a href="#platform">How it works</a>
            <a href="#company-directory">Company directory</a>
            <button type="button" onClick={() => navigate("/resume-profile")} className="brand-nav-cta">Build your profile <ArrowRight className="h-4 w-4" /></button>
          </nav>
          <button type="button" onClick={() => navigate("/resume-profile")} className="brand-nav-cta md:hidden">Get started <ArrowRight className="h-4 w-4" /></button>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center pb-8 pt-6 sm:pt-0">
          <motion.div {...reveal(.05)} className="brand-lockup">
            <h1 className="sr-only">blitzkrieg!</h1>
            <BrandLogo className="brand-wordmark mx-auto h-auto w-[min(82vw,570px)]" />
            <p className="brand-tagline mt-5 text-sm font-medium tracking-[.035em] sm:mt-6 sm:text-base">not your average placement platform</p>
          </motion.div>
          <motion.p {...reveal(.18)} className="brand-hero-copy mx-auto mt-8 max-w-2xl text-base leading-7 sm:mt-9 sm:text-lg sm:leading-8">
            Know the companies. Understand the skills. Make your next move with evidence.
          </motion.p>
          <motion.div {...reveal(.28)} className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => document.getElementById("company-directory")?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" })} className="brand-primary-button min-h-12 rounded-full px-5">
              Explore company intelligence <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/talent-check")} className="brand-secondary-button min-h-12 rounded-full px-5">
              Try Talent Check <Sparkles className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div {...reveal(.4)} className="brand-proofline mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs sm:mt-12 sm:text-sm">
            <span><strong>118</strong> company profiles</span><i aria-hidden="true" /><span><strong>12 skills</strong> in the RADIX benchmark</span><i aria-hidden="true" /><span>Evidence-led matching</span>
          </motion.div>
        </div>
        <a href="#platform" className="brand-scroll relative z-10 mx-auto inline-flex items-center gap-2 py-3 text-xs font-semibold uppercase tracking-[.16em]" aria-label="Scroll to discover the platform">
          Scroll to discover <ArrowDown className="h-3.5 w-3.5" />
        </a>
      </header>

      <section id="platform" className="brand-platform-section px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-[1240px]">
          <div className="brand-affiliation mb-12 flex flex-wrap items-center justify-between gap-6 border-b pb-7 sm:mb-16">
            <div>
              <p className="brand-eyebrow">Built for one campus community</p>
              <h2 className="mt-3 max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">Career decisions, with a clearer signal.</h2>
            </div>
            <div className="brand-jss-note flex items-center gap-3 text-sm font-semibold">
              <img src="/jss-university-logo.png" alt="" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
              <span>Exclusive to<br />JSS University, Noida</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pathways.map(({ number, label, title, copy, icon: Icon, route }, index) => (
              <motion.button key={number} type="button" onClick={() => index === 0 ? document.getElementById("company-directory")?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" }) : navigate(route)} className="brand-pathway-card group text-left" {...reveal(index * .08)}>
                <div className="flex items-start justify-between"><span className="brand-pathway-number">{number}</span><Icon className="brand-pathway-icon h-5 w-5" aria-hidden="true" /></div>
                <p className="brand-eyebrow mt-10">{label}</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-.03em]">{title}</h3>
                <p className="brand-pathway-copy mt-3 text-sm leading-6">{copy}</p>
                <span className="brand-pathway-link mt-7 inline-flex items-center gap-2 text-sm font-semibold">Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </motion.button>
            ))}
          </div>

          <div className="brand-workflow-band mt-12 grid gap-8 rounded-3xl p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="brand-eyebrow">A practical path forward</p>
              <h3 className="mt-3 max-w-2xl font-heading text-2xl font-semibold leading-tight tracking-[-.035em] sm:text-3xl">From “what do they want?” to “what should I do next?”</h3>
              <p className="brand-workflow-copy mt-3 max-w-2xl text-sm leading-6">Build a resume profile, compare it with real role requirements, then use company skill benchmarks to focus your practice.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/resume-profile")} className="brand-band-button rounded-full">Build a resume profile <FileText className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => navigate("/jd-analytics")} className="brand-band-button rounded-full">Analyze a job description <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </section>

      <main id="company-directory" className="brand-directory px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="brand-eyebrow">Start with a company</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Company intelligence</h2>
              <p className="brand-directory-copy mt-2 max-w-xl text-sm leading-6">Explore company profiles, compare up to three, and see the skill signals behind your shortlist.</p>
            </div>
            <span className="brand-count-pill" role="status" aria-live="polite">
              {directoryQuery.isPending ? "Loading companies…" : visibleCompanies.length === companies.length ? `${companies.length} ${companies.length === 1 ? "company" : "companies"}` : `${visibleCompanies.length} of ${companies.length} companies`}
            </span>
          </div>

          <div className="brand-directory-controls mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px_170px]">
            <div className="relative">
              <label htmlFor="company-search" className="sr-only">Search by company, industry, or location</label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-current opacity-45" />
              <input id="company-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies, industries, or locations" className="brand-search-input h-12 w-full rounded-xl border pl-11 pr-11 text-sm outline-none transition" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>}
            </div>
            <label className="sr-only" htmlFor="category-filter">Filter by industry</label>
            <select id="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="brand-search-input h-12 w-full rounded-xl border px-3 text-sm outline-none">
              <option value="all">All industries</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <label className="sr-only" htmlFor="company-sort">Sort companies</label>
            <select id="company-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)} className="brand-search-input h-12 w-full rounded-xl border px-3 text-sm outline-none">
              <option value="name-asc">Name: A to Z</option><option value="name-desc">Name: Z to A</option><option value="location">Location</option>
            </select>
          </div>

          {directoryQuery.isPending ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="brand-company-skeleton h-[278px] animate-pulse rounded-2xl border p-5"><div className="h-12 w-12 rounded-xl bg-current opacity-10" /><div className="mt-5 h-4 w-2/3 rounded bg-current opacity-10" /><div className="mt-3 h-3 w-1/3 rounded bg-current opacity-10" /><div className="mt-7 space-y-3"><div className="h-3 w-3/4 rounded bg-current opacity-10" /><div className="h-3 w-2/3 rounded bg-current opacity-10" /><div className="h-3 w-1/2 rounded bg-current opacity-10" /></div></div>)}</div>
          ) : directoryQuery.isError ? (
            <div className="brand-empty-state"><h3>Couldn’t load companies</h3><p>Please try again in a moment.</p><Button className="mt-5" onClick={() => void directoryQuery.refetch()}>Try again <ArrowRight className="h-4 w-4" /></Button></div>
          ) : companies.length === 0 ? (
            <div className="brand-empty-state"><span className="brand-empty-icon"><Building2 className="h-6 w-6" /></span><h3>No company profiles available</h3><p>Company profiles will appear here when they are available.</p></div>
          ) : visibleCompanies.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleCompanies.map((summary) => <CompanyCard key={summary.companyId} company={summary} onOpen={() => chooseCompany(summary)} isCompared={compareCompanyIds.includes(summary.companyId)} onToggleCompare={() => toggleCompareCompany(summary)} compareLimitReached={compareCompanyIds.length >= 3} />)}
            </div>
          ) : (
            <div className="brand-empty-state"><span className="brand-empty-icon"><Building2 className="h-6 w-6" /></span><h3>No matching companies</h3><p>Try a different search or industry, or clear the filters.</p><Button variant="soft" className="mt-5" onClick={clearFilters}>Clear filters <ArrowRight className="h-4 w-4" /></Button></div>
          )}

          <div className={`brand-footer mt-12 border-t pt-6 text-center text-xs ${compareCompanies.length ? "pb-28 sm:pb-20" : ""}`}>
            <BrandLogo className="mx-auto h-auto w-36 opacity-70" />
            <p className="mt-3">An exclusive career platform for JSS University, Noida</p>
            <p className="mt-2">{isSupabaseConfigured ? "Live company intelligence" : "Demo experience"} · Company benchmarks are preparation signals, not hiring decisions.</p>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {compareCompanies.length > 0 && (
          <motion.aside initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} transition={{ duration: .22, ease: "easeOut" }} className="brand-compare-bar fixed inset-x-3 bottom-3 z-40 mx-auto max-w-5xl rounded-2xl border p-3 shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:bottom-5 sm:p-4" aria-label="Company comparison selection">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold"><GitCompareArrows className="h-4 w-4" /> Comparison shortlist <span className="brand-compare-count rounded-full px-2 py-0.5 text-xs">{compareCompanies.length}/3</span></div>
                <div className="mt-2 flex max-w-full gap-2 overflow-x-auto scrollbar-none">
                  {compareCompanies.map((company) => <span key={company.companyId} className="brand-compare-chip inline-flex max-w-[200px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"><Check className="h-3 w-3" /><span className="truncate">{company.name}</span><button type="button" onClick={() => toggleCompareCompany(company)} aria-label={`Remove ${company.name} from comparison`} className="rounded-full p-0.5 opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button></span>)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2"><span className="hidden text-xs opacity-60 sm:block">{compareCompanies.length < 2 ? "Select one more company" : "Ready when you are"}</span><Button disabled={compareCompanies.length < 2} onClick={() => navigate("/company/compare")} className="min-h-10 flex-1 sm:flex-none">Compare companies <ArrowRight className="h-4 w-4" /></Button></div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
