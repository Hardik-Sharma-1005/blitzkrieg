import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, Globe2, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { IntelligenceSectionCard } from "@/components/company/IntelligenceSectionCard";
import { buildIntelligenceSections } from "@/data/intelligenceData";
import { fetchCompanyRecord } from "@/lib/companyRepository";
import { normalizeCompanyProfile } from "@/lib/companyData";
import { asString } from "@/lib/companyData";
import { useCompany } from "@/lib/companyContext";

export function CompanyIntelligence() {
  const { selectedCompany } = useCompany();
  const companyQuery = useQuery({
    queryKey: ["company-record", selectedCompany?.companyId],
    queryFn: () => fetchCompanyRecord(selectedCompany!.companyId),
    enabled: Boolean(selectedCompany?.companyId),
  });
  const companyRecord = companyQuery.data;
  const profile = useMemo(
    () => companyRecord ? normalizeCompanyProfile(companyRecord.full_json, companyRecord.short_json) : null,
    [companyRecord],
  );
  const sections = useMemo(() => buildIntelligenceSections(profile?.raw), [profile]);
  const contactEmail = profile ? asString(profile.raw.primary_contact_email) || asString(profile.raw.contact_person_email) : "";
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionElements = useRef<Array<HTMLElement | null>>([]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<number | undefined>(undefined);

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

  if (companyQuery.isPending) return <div className="mx-auto max-w-xl p-10 text-center text-sm text-slate-500">Loading company profile…</div>;
  if (companyQuery.isError || !companyRecord || !profile) return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
      <h2 className="font-heading text-xl font-semibold text-slate-900">Couldn’t load this company</h2>
      <p className="mt-2 text-sm text-slate-500">Please try again in a moment.</p>
      <Button className="mt-5" variant="outline" onClick={() => void companyQuery.refetch()}>Try again</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbf8f1]">
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
            {contactEmail && <Button asChild variant="outline" size="sm"><a href={`mailto:${contactEmail}`}><Mail className="h-4 w-4" /><span className="hidden sm:inline">Email</span></a></Button>}
          </div>
        </div>
      </div>

      <div className="sticky top-[147px] z-10 border-b border-[#e8e0d2] bg-[#fffdf8]">
        <nav className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-5 py-2.5 scrollbar-none sm:px-8 lg:px-12" aria-label="Company profile sections">
          {sections.map((section, index) => <button key={section.id} ref={(element) => { tabRefs.current[index] = element; }} type="button" onClick={() => scrollToSection(index)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${activeIndex === index ? "bg-[#e4f2e9] text-[#246b5d]" : "text-slate-500 hover:bg-[#f7f3eb] hover:text-slate-800"}`}>{section.title}</button>)}
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
