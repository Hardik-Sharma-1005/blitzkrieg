import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LockKeyhole, RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { DataProvenance } from "@/components/company/DataProvenance";
import { getSkillTopics } from "@/data/skillTopics";
import { fetchCompanyRecord } from "@/lib/companyRepository";
import { normalizeCompanyProfile, normalizeDashboardSkills } from "@/lib/companyData";
import { useCompany } from "@/lib/companyContext";

const SKILL_RATINGS_KEY = "student-skill-ratings";

function readSkillRatings(): Record<string, number> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SKILL_RATINGS_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value)
      .filter(([, rating]) => Number.isInteger(rating) && Number(rating) >= 1 && Number(rating) <= 10)
      .map(([name, rating]) => [name, Number(rating)]));
  } catch {
    return {};
  }
}

const bloom = [
  { code: "CU", label: "Remember", className: "border-[#c9e6ef] bg-[#e8f5f8] text-[#276377]" },
  { code: "AP", label: "Understand", className: "border-[#cde6d5] bg-[#e8f4eb] text-[#286b53]" },
  { code: "AS", label: "Apply", className: "border-[#f0dfb2] bg-[#faf1d8] text-[#87631d]" },
  { code: "EV", label: "Analyze", className: "border-[#f0cfc4] bg-[#fcebe5] text-[#a14834]" },
  { code: "CR", label: "Create", className: "border-[#ddd3ef] bg-[#f1ecfa] text-[#64518c]" },
];

function bloomFor(score: number) {
  if (score <= 2) return bloom[0];
  if (score <= 4) return bloom[1];
  if (score <= 6) return bloom[2];
  if (score <= 8) return bloom[3];
  return bloom[4];
}

function criticalityFor(score: number) {
  if (score >= 7) return { label: "Critical", className: "bg-[#fcebe5] text-[#a14834]" };
  if (score >= 5) return { label: "Important", className: "bg-[#faf1d8] text-[#87631d]" };
  return { label: "Baseline", className: "bg-[#f1ece2] text-slate-600" };
}

export function SkillIntelligence() {
  const { selectedCompany } = useCompany();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [skillRatings, setSkillRatings] = useState<Record<string, number>>(readSkillRatings);
  const companyQuery = useQuery({
    queryKey: ["company-record", selectedCompany?.companyId],
    queryFn: () => fetchCompanyRecord(selectedCompany!.companyId),
    enabled: Boolean(selectedCompany?.companyId),
  });
  const company = companyQuery.data;
  const profile = useMemo(
    () => company ? normalizeCompanyProfile(company.full_json, company.short_json) : null,
    [company],
  );
  const skills = useMemo(() => normalizeDashboardSkills(company?.skill_levels ?? []), [company]);
  const ratedSkills = skills.filter((skill) => skillRatings[skill.name] !== undefined);
  const readySkills = ratedSkills.filter((skill) => skillRatings[skill.name] >= skill.requiredLevel);
  const biggestGaps = ratedSkills
    .map((skill) => ({ name: skill.name, gap: Math.max(0, skill.requiredLevel - skillRatings[skill.name]) }))
    .filter((skill) => skill.gap > 0)
    .sort((a, b) => b.gap - a.gap || a.name.localeCompare(b.name))
    .slice(0, 3);

  const updateSkillRating = (skillName: string, value: number | null) => {
    setSkillRatings((current) => {
      const next = { ...current };
      if (value === null) delete next[skillName];
      else next[skillName] = value;
      try {
        if (Object.keys(next).length) localStorage.setItem(SKILL_RATINGS_KEY, JSON.stringify(next));
        else localStorage.removeItem(SKILL_RATINGS_KEY);
      } catch {
        // The current page remains usable when browser storage is unavailable.
      }
      return next;
    });
  };

  const clearSkillRatings = () => {
    try { localStorage.removeItem(SKILL_RATINGS_KEY); } catch { /* State still resets for this visit. */ }
    setSkillRatings({});
  };
  if (companyQuery.isPending) return <div className="mx-auto max-w-xl p-10 text-center text-sm text-slate-500">Loading skill intelligence…</div>;
  if (companyQuery.isError || !company || !profile) return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
      <h2 className="font-heading text-xl font-semibold text-slate-900">Couldn’t load this company’s skills</h2>
      <p className="mt-2 text-sm text-slate-500">Please try again in a moment.</p>
      <button type="button" className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => void companyQuery.refetch()}>Try again</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbf8f1]">
      <div className="mx-auto max-w-[1180px] px-5 py-7 sm:px-8 sm:py-9">
        <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-[#e8dfd1] bg-gradient-to-br from-[#fff4d7] via-[#fffdf8] to-[#e4f2e9] p-5 sm:p-7">
          <div aria-hidden="true" className="ambient-drift-delayed pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[#b8ade3]/35 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <CompanyLogo name={profile.name} logoUrl={profile.logoUrl} websiteUrl={profile.websiteUrl} size="md" />
            <div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#246b5d]">Skill intelligence</p><h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-[#26354b] sm:text-3xl">{profile.shortName} Skill Intelligence</h1><p className="mt-1 text-sm text-slate-600">Required skills and target learning levels</p></div>
          </div>
          <div className="relative mt-4"><DataProvenance raw={profile.raw} origin={company.dataOrigin} compact /></div>
        </div>

        {company.skillDataWarnings.length > 0 && <div role="status" className="mt-4 rounded-xl border border-[#f0dfb2] bg-[#fff9e9] px-4 py-3 text-sm leading-6 text-[#76591d]">
          {company.skillDataWarnings.join(" ")}
        </div>}

        <div className="mt-7 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Bloom level</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {bloom.map((item) => <div key={item.code} className={`rounded-lg border px-2 py-2 text-center ${item.className}`}><div className="text-xs font-bold">{item.code}</div><div className="mt-0.5 hidden text-[11px] sm:block">{item.label}</div></div>)}
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Skill criticality</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[{label:"Critical", cls:"bg-[#fcebe5] text-[#a14834]"},{label:"Important", cls:"bg-[#faf1d8] text-[#87631d]"},{label:"Baseline", cls:"bg-[#f1ece2] text-slate-600"}].map((item) => <div key={item.label} className={`rounded-xl px-2 py-3 text-center text-xs font-semibold ${item.cls}`}>{item.label}</div>)}
            </div>
          </Card>
        </div>

        <Card className="mt-4 border-[#dce9de] bg-gradient-to-br from-[#f2f8f0] to-[#fffdf8] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#246b5d]"><Sparkles className="h-3.5 w-3.5" /> Your skill match</p>
              <h2 className="mt-1 font-heading text-lg font-semibold text-[#26354b]">
                {ratedSkills.length ? `${readySkills.length} of ${ratedSkills.length} rated skills meet the target` : "Build your personal readiness snapshot"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Rate yourself from 1–10 below. Your ratings stay in this browser and are never sent to the company database.</p>
            </div>
            {ratedSkills.length > 0 && <button type="button" onClick={clearSkillRatings} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white hover:text-slate-800"><RotateCcw className="h-3.5 w-3.5" /> Reset ratings</button>}
          </div>
          {biggestGaps.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2" aria-live="polite">
            <span className="text-xs font-semibold text-slate-600">Largest gaps</span>
            {biggestGaps.map((item) => <span key={item.name} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#76591d] shadow-sm">{item.name} · +{item.gap} levels to target</span>)}
          </div>}
        </Card>

        <div className="mb-4 mt-8 flex items-end justify-between gap-3"><div><h2 className="font-heading text-xl font-semibold text-[#26354b]">Required capabilities</h2><p className="mt-1 text-sm text-slate-500">{skills.length} skills ranked by target proficiency.</p></div><Badge variant="outline">10-level roadmap</Badge></div>
        {skills.length === 0 && <Card className="p-6 text-sm leading-6 text-slate-500">No company skill requirements are available yet. The company profile remains available while skill data is added.</Card>}
        <div className="space-y-3">
            {skills.map((skill) => {
            const bloomLevel = bloomFor(skill.requiredLevel);
            const criticality = criticalityFor(skill.requiredLevel);
            const topics = getSkillTopics(skill.name, company.topicsBySkillId[skill.id]);
            const isOpen = expanded === skill.id;
            return (
              <motion.div key={`${skill.id}-${skill.name}`} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.3 }}>
              <Card className="overflow-hidden border-[#e9e1d5] shadow-[0_8px_24px_rgba(69,54,28,0.035)]">
                <button type="button" onClick={() => setExpanded(isOpen ? null : skill.id)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5" aria-expanded={isOpen}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 font-heading text-sm font-bold text-slate-700">{String(skill.id).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-heading text-base font-semibold text-slate-900">{skill.name}</span><Badge className={bloomLevel.className}>{bloomLevel.code}</Badge></span><span className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-slate-500">Target proficiency</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${criticality.className}`}>{criticality.label}</span></span></span>
                  <span className="hidden min-w-[112px] text-right sm:block"><span className="block text-lg font-semibold tabular-nums text-slate-900">{skill.requiredLevel}<span className="text-sm text-slate-400">/10</span></span><span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#eee8dc]"><span className="block h-full rounded-full bg-[#399173]" style={{ width: `${skill.requiredLevel * 10}%` }} /></span></span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div className="flex flex-col gap-2 border-t border-[#f0eadd] bg-[#fffdf8] px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                  <label htmlFor={`self-rating-${skill.id}`} className="shrink-0 text-xs font-semibold text-slate-600">Your current level</label>
                  <select
                    id={`self-rating-${skill.id}`}
                    value={skillRatings[skill.name] ?? ""}
                    onChange={(event) => updateSkillRating(skill.name, event.target.value ? Number(event.target.value) : null)}
                    className="min-h-10 rounded-xl border border-[#e4dbca] bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]"
                  >
                    <option value="">Not rated</option>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => <option key={level} value={level}>Level {level}</option>)}
                  </select>
                  <span className="text-xs text-slate-500">
                    {skillRatings[skill.name] === undefined
                      ? `Target: ${skill.requiredLevel}/10`
                      : skillRatings[skill.name] >= skill.requiredLevel
                        ? `At target · ${skill.requiredLevel}/10 required`
                        : `${skill.requiredLevel - skillRatings[skill.name]} levels to target`}
                  </span>
                </div>
                <AnimatePresence initial={false}>
                {isOpen && <motion.div key="roadmap" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.24, ease: "easeOut" }} className="overflow-hidden">
                <CardContent className="border-t border-[#eee8dc] bg-[#faf7f0] px-4 pt-4 sm:px-5">
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Learning roadmap</p><p className="text-xs text-slate-400">Levels above {skill.requiredLevel} are beyond scope</p></div>
                  <div className="space-y-2 pb-1">
                    {topics.map((topic, index) => {
                      if (!topic.trim()) return null;
                      const level = index + 1;
                      const locked = level > skill.requiredLevel;
                      return <div key={`${skill.name}-${level}`} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${locked ? "border-[#ece6db] bg-[#fffdf8]/70 text-slate-400" : "border-[#e5ddcf] bg-[#fffdf8] text-slate-700"}`}><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${locked ? "bg-[#f1ece2] text-slate-400" : "bg-[#e4f2e9] text-[#246b5d]"}`}>{locked ? <LockKeyhole className="h-3 w-3" /> : level}</span><span className="min-w-0 flex-1 text-sm leading-5">{topic}{locked && <span className="ml-2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide">Beyond scope</span>}</span><span className="text-[10px] font-semibold text-slate-400">L{level}</span></div>;
                    })}
                    {topics.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">Roadmap topics will be added in the next data update.</p>}
                  </div>
                </CardContent>
                </motion.div>}
                </AnimatePresence>
              </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
