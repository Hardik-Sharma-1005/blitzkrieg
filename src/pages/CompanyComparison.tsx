import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, GitCompareArrows, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { fetchCompanyRecord } from "@/lib/companyRepository";
import { asString, normalizeCompanyProfile, normalizeCompanySummary, normalizeDashboardSkills, splitItems, type CompanyProfile, type CompanySummary, type DashboardSkill, type JsonRecord } from "@/lib/companyData";
import { useCompany } from "@/lib/companyContext";

interface ComparisonCompany {
  summary: CompanySummary;
  profile: CompanyProfile;
  skills: DashboardSkill[];
  raw: JsonRecord;
  skillDataWarnings: string[];
}

const comparisonGroups = [
  {
    title: "Hiring and skill expectations",
    intro: "Listed skill targets and technology signals from each company profile.",
    fields: [
      ["technology_stack", "Technology stack"],
      ["ai_ml_adoption_level", "AI and ML adoption"],
      ["tech_adoption_rating", "Technology adoption"],
      ["focus_sectors", "Focus sectors"],
    ] as Array<[string, string]>,
    skills: true,
  },
  {
    title: "Workplace and professional development",
    intro: "Published details about learning, support, work culture, and ways of working.",
    fields: [
      ["work_culture_summary", "Work culture"],
      ["training_spend", "Training investment"],
      ["onboarding_quality", "Onboarding"],
      ["learning_culture", "Learning culture"],
      ["mentorship_availability", "Mentorship"],
      ["internal_mobility", "Internal mobility"],
      ["promotion_clarity", "Promotion clarity"],
      ["remote_policy_details", "Remote work policy"],
    ] as Array<[string, string]>,
  },
  {
    title: "Career outlook, growth, strategy, and risks",
    intro: "Company-reported growth, direction, and selected risk signals in the available profile.",
    fields: [
      ["yoy_growth_rate", "Year-over-year growth"],
      ["future_projections", "Future projections"],
      ["strategic_priorities", "Strategic priorities"],
      ["recent_news", "Recent news"],
      ["weaknesses_gaps", "Listed gaps and limitations"],
      ["customer_concentration_risk", "Customer concentration risk"],
      ["macro_risks", "Macroeconomic risks"],
      ["geopolitical_risks", "Geopolitical risks"],
    ] as Array<[string, string]>,
  },
];

function isMissing(value: string) {
  return !value || /^(na|n\/a|none|null|undefined|-)$/i.test(value.trim());
}

function profileValue(raw: JsonRecord, key: string) {
  return asString(raw[key]);
}

function getComparisonLoadHelp(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("row-level security") || message.includes("permission denied") || message.includes("42501") || message.includes("schema cache") || message.includes("does not exist") || message.includes("column") || message.includes("fetch failed") || message.includes("network") || message.includes("failed to fetch")) {
    return "Company profiles couldn’t be loaded. Check your connection and try again.";
  }
  return "We couldn’t load this company comparison. Please try again.";
}

function StudentTakeaway({ company }: { company: ComparisonCompany }) {
  const topSkill = company.skills[0];
  const growth = profileValue(company.raw, "yoy_growth_rate");
  const learning = profileValue(company.raw, "learning_culture") || profileValue(company.raw, "mentorship_availability");
  const parts = [
    topSkill ? `${company.skills.length} skill targets are listed; the highest is ${topSkill.name} at level ${topSkill.requiredLevel}/10.` : "No skill requirements are listed in the available profile.",
    !isMissing(growth) ? `Reported growth: ${growth}.` : !isMissing(learning) ? `Student development detail: ${learning}.` : "The profile has limited published student-facing detail.",
  ];

  return <p className="text-sm leading-6 text-[#455467]">{parts.join(" ")}</p>;
}

function ValueContent({ value }: { value: unknown }) {
  const text = asString(value);
  if (isMissing(text)) return <span className="text-sm italic text-slate-400">Not publicly available</span>;
  const items = splitItems(text);
  if (items.length > 1) {
    return <div className="flex flex-wrap gap-1.5">
      {items.slice(0, 4).map((item, index) => <span key={`${item}-${index}`} className="max-w-full break-words rounded-full bg-[#f3eee4] px-2.5 py-1 text-xs text-slate-700">{item}</span>)}
      {items.length > 4 && <span className="rounded-full bg-[#e8f5f8] px-2.5 py-1 text-xs font-semibold text-[#276377]">+{items.length - 4}</span>}
    </div>;
  }
  if (text.length > 220) {
    return <details className="text-sm leading-6 text-slate-700">
      <summary className="cursor-pointer font-medium text-[#246b5d]">Read profile detail</summary>
      <p className="mt-2 whitespace-pre-line break-words">{text}</p>
    </details>;
  }
  return <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-700">{text}</p>;
}

function CompanyOverview({ company, index }: { company: ComparisonCompany; index: number }) {
  const swatches = ["bg-[#e8f4eb]", "bg-[#faf1d8]", "bg-[#f1ecfa]"];
  const raw = company.raw;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.36, delay: index * 0.08 }}>
      <Card className="h-full overflow-hidden border-[#e8dfd1] shadow-[0_10px_30px_rgba(69,54,28,0.05)]">
        <div className={`h-2 ${index === 0 ? "bg-[#83c4a4]" : index === 1 ? "bg-[#e4bc63]" : "bg-[#bcade5]"}`} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CompanyLogo name={company.profile.name} logoUrl={company.profile.logoUrl} websiteUrl={company.profile.websiteUrl} size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-heading text-lg font-semibold text-[#26354b]">{company.profile.name}</h3>
              <Badge variant={index === 1 ? "amber" : index === 2 ? "purple" : "green"} className="mt-1">{company.profile.category || "Company"}</Badge>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["Location", profileValue(raw, "headquarters_address")],
              ["Team size", profileValue(raw, "employee_size")],
              ["Reported growth", profileValue(raw, "yoy_growth_rate")],
              ["Listed skills", company.skills.length ? String(company.skills.length) : "Not listed"],
            ].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-[#f7f3eb] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-slate-700">{isMissing(value) ? <span className="italic text-slate-400">Not listed</span> : value}</dd>
            </div>)}
          </dl>
          <div className={`mt-4 rounded-2xl ${swatches[index % swatches.length]} p-4`}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#354b54]"><Sparkles className="h-3.5 w-3.5" /> What this means for students</p>
            <StudentTakeaway company={company} />
          </div>
          {company.skillDataWarnings.length > 0 && <p role="status" className="mt-3 rounded-xl border border-[#f0dfb2] bg-[#fff9e9] px-3 py-2 text-xs leading-5 text-[#76591d]">{company.skillDataWarnings.join(" ")}</p>}
        </div>
      </Card>
    </motion.div>
  );
}

export function CompanyComparison() {
  const { compareCompanyIds, clearComparison } = useCompany();
  const records = useQueries({ queries: compareCompanyIds.map((companyId) => ({
    queryKey: ["company-record", companyId],
    queryFn: () => fetchCompanyRecord(companyId),
  })) });

  const companies = useMemo(() => compareCompanyIds.flatMap((_, index) => {
    const record = records[index]?.data;
    if (!record) return [];
    const summary = normalizeCompanySummary(record.short_json, record.full_json);
    const profile = normalizeCompanyProfile(record.full_json, record.short_json);
    return [{ summary, profile, skills: normalizeDashboardSkills(record.skill_levels), raw: profile.raw, skillDataWarnings: record.skillDataWarnings }];
  }), [compareCompanyIds, records]);
  const loading = records.some((record) => record.isPending);
  const failedRecords = records.filter((record) => record.isError);
  const failed = failedRecords.length > 0;
  const unavailable = !loading && !failed && companies.length !== compareCompanyIds.length;
  const retryFailedRecords = () => void Promise.all(failedRecords.map((record) => record.refetch()));

  if (compareCompanyIds.length < 2) {
    return <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <Card className="p-7 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f2e9] text-[#246b5d]"><GitCompareArrows className="h-6 w-6" /></span>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-[#26354b]">Choose at least two companies</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Add companies from the directory cards. Your shortlist stays on this device while you explore.</p>
        <Button asChild className="mt-6"><Link to="/">Back to the directory <ArrowRight className="h-4 w-4" /></Link></Button>
      </Card>
    </main>;
  }

  if (loading) return <main aria-busy="true" className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12">
    <p role="status" className="mb-4 text-sm font-medium text-slate-500">Loading your selected company profiles…</p>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{compareCompanyIds.map((id) => <div key={id} className="h-72 animate-pulse rounded-2xl bg-[#eee8dc]" />)}</div>
  </main>;

  if ((failed && companies.length < 2) || unavailable) return <main className="mx-auto max-w-xl px-5 py-12 text-center sm:py-16">
    <Card className="p-7">
      <h1 className="font-heading text-xl font-semibold text-[#26354b]">{unavailable ? "A saved company is unavailable" : "Couldn’t load enough company profiles"}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {unavailable
          ? "A saved company is no longer available. Clear the shortlist, then choose companies again from the directory."
          : `${getComparisonLoadHelp(failedRecords[0]?.error)} ${companies.length ? `${companies.length} profile${companies.length === 1 ? " is" : "s are"} available; at least two are needed to compare.` : "Retry after the data service is available."}`}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {failed && <Button variant="outline" onClick={retryFailedRecords}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>}
        <Button variant="ghost" onClick={clearComparison}>Clear shortlist</Button>
        <Button asChild variant="outline"><Link to="/">Back to directory</Link></Button>
      </div>
    </Card>
  </main>;

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-[#e8dfd1] bg-gradient-to-br from-[#fff4d7] via-[#fffdf8] to-[#e4f2e9] p-6 sm:p-9">
        <div aria-hidden="true" className="ambient-drift pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#efb5a0]/40 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#246b5d]"><GitCompareArrows className="h-3.5 w-3.5" /> Your research shortlist</p>
            <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight tracking-tight text-[#26354b] sm:text-4xl">Compare companies, side by side.</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">Compare the available company and skill data. Sample profiles are labeled, and missing details stay visible.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link to="/"><ArrowLeft className="h-4 w-4" /> Add companies</Link></Button>
            <Button variant="ghost" onClick={clearComparison}>Clear shortlist</Button>
          </div>
        </div>
      </header>

      {failed && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f0dfb2] bg-[#fff9e9] px-4 py-3 text-sm leading-6 text-[#76591d]">
        <p>{companies.length} of {compareCompanyIds.length} selected profiles loaded. {getComparisonLoadHelp(failedRecords[0]?.error)}</p>
        <Button variant="outline" size="sm" onClick={retryFailedRecords}><RefreshCw className="h-4 w-4" /> Retry failed profiles</Button>
      </div>}

      <section aria-labelledby="at-a-glance-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#a47d32]">At a glance</p><h2 id="at-a-glance-heading" className="mt-1 font-heading text-2xl font-semibold text-[#26354b]">Your selected companies</h2></div>
          <span className="rounded-full border border-[#e9e1d5] bg-[#fffdf8] px-3 py-1.5 text-xs font-semibold text-slate-500">{companies.length} of {compareCompanyIds.length} selected profiles loaded</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company, index) => <CompanyOverview key={company.summary.companyId} company={company} index={index} />)}
        </div>
      </section>

      {comparisonGroups.map((group, groupIndex) => (
        <section key={group.title} className="mt-10 scroll-mt-28" aria-labelledby={`comparison-group-${groupIndex}`}>
          <div className="mb-4 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#a47d32]">Comparison {String(groupIndex + 1).padStart(2, "0")}</p>
            <h2 id={`comparison-group-${groupIndex}`} className="mt-1 font-heading text-2xl font-semibold text-[#26354b]">{group.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{group.intro}</p>
          </div>
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company, companyIndex) => (
              <motion.div key={company.summary.companyId} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }} transition={{ duration: 0.32, delay: companyIndex * 0.06 }}>
                <Card className="h-full p-5 sm:p-6">
                  <div className="flex items-center gap-3 border-b border-[#f0eadd] pb-4">
                    <CompanyLogo name={company.profile.name} logoUrl={company.profile.logoUrl} websiteUrl={company.profile.websiteUrl} size="sm" />
                    <h3 className="min-w-0 flex-1 break-words font-heading text-base font-semibold text-[#26354b]">{company.profile.name}</h3>
                  </div>
                  {group.skills && <div className="py-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Required skill targets</p>
                    {company.skills.length ? <div className="flex flex-wrap gap-1.5">{company.skills.slice(0, 8).map((skill) => <span key={`${skill.id}-${skill.name}`} className="rounded-full bg-[#e9f4ed] px-2.5 py-1 text-xs text-[#286b53]">{skill.name} · {skill.requiredLevel}/10</span>)}{company.skills.length > 8 && <span className="rounded-full bg-[#e8f5f8] px-2.5 py-1 text-xs font-semibold text-[#276377]">+{company.skills.length - 8} skills</span>}</div> : <p className="text-sm italic text-slate-400">Not publicly available</p>}
                  </div>}
                  <dl className="divide-y divide-[#f0eadd]">
                    {group.fields.map(([key, label]) => <div key={key} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] sm:gap-3">
                      <dt className="text-xs font-medium text-slate-500">{label}</dt>
                      <dd className="min-w-0"><ValueContent value={key === "technology_stack" ? company.raw.technology_stack ?? company.raw.tech_stack : company.raw[key]} /></dd>
                    </div>)}
                  </dl>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      <p className="mt-8 rounded-2xl border border-[#e9e1d5] bg-[#f7f3eb] p-4 text-xs leading-5 text-slate-500">This view reflects the company profiles and skill requirements currently available to the portal. Missing fields are shown as unavailable; no overall ranking is calculated.</p>
    </main>
  );
}
