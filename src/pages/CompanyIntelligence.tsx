import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, Globe2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { IntelligenceSectionCard } from "@/components/company/IntelligenceSectionCard";
import { buildIntelligenceSections } from "@/data/intelligenceData";
import { fetchCompanyRecord, type CompanyRecord } from "@/lib/companyRepository";
import { normalizeCompanyProfile } from "@/lib/companyData";
import { asString } from "@/lib/companyData";
import { useCompany } from "@/lib/companyContext";
import { readRecentSnapshot, recordRecentActivity } from "@/lib/recentActivity";

const CATEGORY_GROUPS = [
  { id: "all", label: "All 21 Sections", indices: null },
  { id: "org", label: "🏛️ Organization", indices: [0, 1, 2, 4] },
  { id: "market", label: "💰 Financials & Market", indices: [3, 7, 8, 9, 13] },
  { id: "tech", label: "💻 Tech, ESG & Risk", indices: [5, 6, 10, 11, 14] },
  { id: "career", label: "📈 Career & Workplace", indices: [12, 15, 16, 17, 18, 19, 20] },
];

export function CompanyIntelligence() {
  const location = useLocation();
  const { selectedCompany } = useCompany();
  const [historySelection, setHistorySelection] = useState<typeof selectedCompany>(null);
  const [historyRecord, setHistoryRecord] = useState<CompanyRecord | null>(null);
  const activityId = (location.state as { recentActivityId?: unknown } | null)?.recentActivityId;
  const companySelection = historySelection ?? selectedCompany;
  const [activeCategory, setActiveCategory] = useState("all");
  const companyQuery = useQuery({
    queryKey: ["company-record", companySelection?.companyId],
    queryFn: () => fetchCompanyRecord(companySelection!.companyId),
    enabled: Boolean(companySelection?.companyId),
  });
  const companyRecord = historyRecord ?? companyQuery.data;
  const profile = useMemo(
    () => companyRecord ? normalizeCompanyProfile(companyRecord.full_json, companyRecord.short_json) : null,
    [companyRecord],
  );
  const sections = useMemo(() => buildIntelligenceSections(profile?.raw), [profile]);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionElements = useRef<Array<HTMLElement | null>>([]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const saved = readRecentSnapshot<{ kind: "company-intelligence"; company: NonNullable<typeof selectedCompany>; record: CompanyRecord }>(activityId);
    setHistorySelection(saved?.kind === "company-intelligence" ? saved.company : null);
    setHistoryRecord(saved?.kind === "company-intelligence" ? saved.record : null);
    setActiveCategory("all");
    setActiveIndex(0);
  }, [location.key, activityId]);

  const recordedCompany = useRef<number | null>(null);
  useEffect(() => {
    if (activityId || !companySelection || !companyRecord || recordedCompany.current === companySelection.companyId) return;
    recordedCompany.current = companySelection.companyId;
    recordRecentActivity({ feature: "company-intelligence", title: companySelection.companyName, action: "Viewed company intelligence profile", path: "/company/intelligence" }, { kind: "company-intelligence", company: companySelection, record: companyRecord });
  }, [activityId, companyRecord, companySelection]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return;
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      const index = sections.findIndex((section) => section.id === visible.target.id);
      if (index >= 0) setActiveIndex(index);
    }, { rootMargin: "-175px 0px -65% 0px", threshold: 0.01 });
    sectionElements.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    tabRefs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  useEffect(() => () => window.clearTimeout(scrollTimerRef.current), []);

  const scrollToSection = useCallback((index: number) => {
    setActiveIndex(index);
    isScrollingRef.current = true;
    sectionElements.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => { isScrollingRef.current = false; }, 900);
  }, []);

  if (!historyRecord && companyQuery.isPending) return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center p-6">
      <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl border border-[#e9e1d5] bg-white/95 p-8 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246b5d] border-t-transparent" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Loading company profile…</p>
        <p className="text-xs text-slate-500">Retrieving signals and 21 intelligence sections…</p>
      </div>
    </div>
  );
  if ((!historyRecord && companyQuery.isError) || !companyRecord || !profile) return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
      <h2 className="font-heading text-xl font-semibold text-slate-900">Couldn’t load this company</h2>
      <p className="mt-2 text-sm text-slate-500">Please try again in a moment.</p>
      <Button className="mt-5" variant="outline" onClick={() => void companyQuery.refetch()}>Try again</Button>
    </div>
  );

  return (
    <div className="space-theme min-h-screen bg-transparent">
      {historySelection && <p role="status" className="mx-auto mt-4 max-w-[1440px] rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] px-4 py-3 text-sm text-slate-700">You’re viewing this company profile from recent activity.</p>}
      <div className="sticky top-[72px] z-20 border-b border-[#e8e0d2] bg-[#fffdf8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <CompanyLogo name={profile.name} logoUrl={profile.logoUrl} websiteUrl={profile.websiteUrl} size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-lg font-semibold text-slate-900">{profile.name}</h1>
            <div className="mt-1"><Badge variant="blue">{profile.category || "Company"}</Badge></div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {profile.websiteUrl && <Button asChild variant="outline" size="sm"><a href={profile.websiteUrl} target="_blank" rel="noreferrer"><Globe2 className="h-4 w-4" /><span className="hidden sm:inline">Website</span><ExternalLink className="h-3 w-3" /></a></Button>}
            {profile.linkedinUrl && <Button asChild variant="outline" size="sm"><a href={profile.linkedinUrl} target="_blank" rel="noreferrer"><span className="font-bold text-blue-700">in</span><span className="hidden sm:inline">LinkedIn</span><ExternalLink className="h-3 w-3" /></a></Button>}
          </div>
        </div>
      </div>

      <div className="sticky top-[147px] z-10 border-b border-[#e8e0d2] bg-[#fffdf8] shadow-xs">
        <div className="border-b border-[#f0e9dc] bg-[#faf7f0]/70 px-5 py-1.5 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1440px] items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2 shrink-0 hidden sm:inline">Clusters:</span>
            {CATEGORY_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveCategory(group.id)}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeCategory === group.id
                    ? "bg-[#246b5d] text-white shadow-xs"
                    : "text-slate-600 hover:bg-[#ede7da] hover:text-slate-900"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-5 py-2 scrollbar-none sm:px-8 lg:px-12" aria-label="Company profile sections">
          {sections.map((section, index) => {
            const currentGroup = CATEGORY_GROUPS.find((g) => g.id === activeCategory);
            const isVisible = !currentGroup?.indices || currentGroup.indices.includes(index);
            if (!isVisible) return null;
            return (
              <button
                key={section.id}
                ref={(element) => { tabRefs.current[index] = element; }}
                type="button"
                onClick={() => scrollToSection(index)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeIndex === index
                    ? "bg-[#e4f2e9] text-[#246b5d] font-semibold"
                    : "text-slate-500 hover:bg-[#f7f3eb] hover:text-slate-800"
                }`}
              >
                {section.title}
              </button>
            );
          })}
        </nav>
      </div>

      <main className="mx-auto grid max-w-[1060px] gap-4 px-5 py-6 sm:px-8 sm:py-8">
        <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-[#e8dfd1] bg-gradient-to-br from-[#fff4d7] via-[#fffdf8] to-[#e4f2e9] p-5 sm:p-7">
          <div aria-hidden="true" className="ambient-drift pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-[#efb5a0]/35 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#a47d32]"><Sparkles className="h-3.5 w-3.5" /> Company snapshot</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-[#26354b]">A closer look at {profile.shortName}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Review the company’s profile details, then explore the skills listed for its roles.</p>
            </div>
            <Button asChild variant="outline"><Link to="/company/skills">Explore skill expectations <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <dl className="relative mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Industry", profile.category],
              ["Reported growth", asString(profile.raw.yoy_growth_rate)],
              ["Headquarters", asString(profile.raw.headquarters_address)],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/70 bg-white/65 p-3.5 backdrop-blur">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</dt>
              <dd className="mt-1 break-words text-sm font-semibold text-[#31445a]">{value || <span className="font-normal italic text-slate-400">Not publicly available</span>}</dd>
            </div>)}
          </dl>
          {companyRecord.skillDataWarnings.length > 0 && <div role="status" className="relative mt-3 rounded-xl border border-[#f0dfb2] bg-[#fff9e9] px-3 py-2 text-xs leading-5 text-[#76591d]">
            {companyRecord.skillDataWarnings.join(" ")}
          </div>}
        </section>
        {sections.map((section, index) => <IntelligenceSectionCard key={section.id} section={section} sectionRef={(element) => { sectionElements.current[index] = element; }} />)}
      </main>
    </div>
  );
}
