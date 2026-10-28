import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Check, GitCompareArrows, Search, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CompanyCard } from "@/components/company/CompanyCard";
import { Button } from "@/components/ui/button";
import { normalizeCompanySummary } from "@/lib/companyData";
import { fetchCompanyDirectory } from "@/lib/companyRepository";
import { useCompany } from "@/lib/companyContext";
import { useTheme } from "@/components/layout/SidebarContext";

export function CompanyDirectory() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"name-asc" | "name-desc" | "location">("name-asc");
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { selectCompany, compareCompanyIds, toggleCompareCompany } = useCompany();
  const directoryQuery = useQuery({ queryKey: ["company-directory"], queryFn: fetchCompanyDirectory });
  const companies = useMemo(() => (directoryQuery.data ?? []).map((record) => normalizeCompanySummary({
    ...record.short_json,
    company_id: record.company_id,
    logo_url: record.logo_url || record.short_json.logo_url,
    website_url: record.website_url || record.short_json.website_url,
    headquarters_address: record.headquarters_address || record.short_json.headquarters_address,
  })), [directoryQuery.data]);
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
    .filter((company) => {
      const haystack = [company.name, company.shortName, company.category, company.headquarters].join(" ").toLowerCase();
      return haystack.includes(debouncedQuery) && (categoryFilter === "all" || company.category === categoryFilter);
    })
    .sort((a, b) => {
      if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
      if (sortOrder === "location") return a.headquarters.localeCompare(b.headquarters) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    }), [companies, debouncedQuery, categoryFilter, sortOrder]);

  const clearFilters = () => { setQuery(""); setCategoryFilter("all"); setSortOrder("name-asc"); };
  const chooseCompany = (company: (typeof companies)[number]) => { selectCompany(company); navigate("/company/intelligence"); };

  return (
    <div className={`portal-home min-h-screen bg-transparent ${theme === "light" ? "theme-light" : ""}`}>
      <header className="brand-directory-top px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4">
          <Link to="/" className="brand-nav-cta"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
          <BrandLogo className="h-auto w-32" />
        </div>
      </header>

      <main className="brand-directory px-5 pb-16 pt-8 sm:px-8 sm:pb-20 lg:px-12">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="brand-eyebrow">Company intelligence</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Explore the company directory</h1>
              <p className="brand-directory-copy mt-2 max-w-2xl text-sm leading-6">Search company profiles, compare up to three employers, and see the skill signals behind your shortlist.</p>
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
            <div className="brand-empty-state"><h2>Couldn’t load companies</h2><p>Please try again in a moment.</p><Button className="mt-5" onClick={() => void directoryQuery.refetch()}>Try again <ArrowRight className="h-4 w-4" /></Button></div>
          ) : companies.length === 0 ? (
            <div className="brand-empty-state"><span className="brand-empty-icon"><Building2 className="h-6 w-6" /></span><h2>No company profiles available</h2><p>Company profiles will appear here when they are available.</p></div>
          ) : visibleCompanies.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleCompanies.map((company) => <CompanyCard key={company.companyId} company={company} onOpen={() => chooseCompany(company)} isCompared={compareCompanyIds.includes(company.companyId)} onToggleCompare={() => toggleCompareCompany(company)} compareLimitReached={compareCompanyIds.length >= 3} />)}
            </div>
          ) : (
            <div className="brand-empty-state"><span className="brand-empty-icon"><Building2 className="h-6 w-6" /></span><h2>No matching companies</h2><p>Try a different search or industry, or clear the filters.</p><Button variant="soft" className="mt-5" onClick={clearFilters}>Clear filters <ArrowRight className="h-4 w-4" /></Button></div>
          )}
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
