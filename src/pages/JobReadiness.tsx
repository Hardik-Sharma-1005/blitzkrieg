import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, FileSearch, LoaderCircle, Target, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCandidateProfile } from "@/lib/candidateProfile";
import { ALL_118_COMPANIES } from "@/data/allCompaniesList";
import { formatActivityFilename, readRecentSnapshot, recordRecentActivity } from "@/lib/recentActivity";

const apiBase = (import.meta.env.VITE_JD_ANALYTICS_API_URL || "http://127.0.0.1:8000").trim().replace(/\/$/, "");
const maxUploadBytes = 12 * 1024 * 1024;
type Skill = { skill_name: string; category_code: string; evidence: string; confidence: string };
type Job = { source_type: "jd"; source_file: string; company: string; role: string; skills: Skill[]; extraction_mode: string; extraction_note: string };
type MatchRow = { skill_name: string; category_code: string; job_evidence: string; resume_evidence?: string; similarity?: number; job_confidence?: string };
type MatchReport = { company: string; role: string; match_score: number; matched_count: number; possible_count: number; missing_count: number; matched_skills: MatchRow[]; possible_matches: MatchRow[]; missing_skills: MatchRow[]; score_note?: string };
type BenchmarkReport = { target_company: string; benchmark_notice?: string; per_skillset_gap_breakdown?: Array<{ category: string; candidate_level: number; required_level: number; gap: number; estimated_learning_hours?: number }>; skillset_gap?: Array<{ category: string; candidate_level: number; required_level: number; gap: number; estimated_learning_hours?: number }> };

const labels: Record<string, string> = { COD: "Coding", DSA: "Data Structures & Algorithms", OOD: "Object-Oriented Design", APTI: "Aptitude", COMM: "Communication", AI: "AI / ML", CLOUD: "Cloud", SQL: "SQL & Databases", SWE: "Software Engineering", SYSD: "System Design", NETW: "Networking", OS: "Operating Systems", OTHER: "Other" };

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T | { detail?: string } | null;
  if (!response.ok) throw new Error(payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string" ? payload.detail : "The readiness check could not be completed.");
  if (!payload) throw new Error("The analysis service returned an empty response.");
  return payload as T;
}

function isExplicitlyRequired(evidence: string): boolean {
  const text = evidence.toLowerCase();
  if (/\bnot\s+(?:a\s+)?(?:required|mandatory|essential)\b/.test(text) || /\boptional\b/.test(text)) return false;
  return /\b(?:must(?:\s+have)?|required|mandatory|essential|minimum qualifications?|need to have)\b/.test(text);
}

function MatchSection({ title, items, kind }: { title: string; items: MatchRow[]; kind: "matched" | "possible" | "missing" }) {
  const style = kind === "matched" ? "border-[#dbe9dd] bg-[#f3f8f1]" : kind === "possible" ? "border-[#f0dfb2] bg-[#fff9e9]" : "border-[#e9e1d5] bg-white";
  return <section><div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-heading text-lg font-semibold text-[#26354b]">{title}</h3><Badge variant="outline">{items.length}</Badge></div>{items.length === 0 ? <p className="rounded-xl border border-dashed border-[#e9e1d5] p-4 text-sm text-slate-500">No skills in this group.</p> : <div className="space-y-3">{items.map((item, index) => { const required = kind === "missing" && isExplicitlyRequired(item.job_evidence); return <article key={`${item.skill_name}-${index}`} className={`rounded-xl border p-4 ${style}`}><div className="flex flex-wrap items-start justify-between gap-2"><h4 className="font-semibold text-slate-900">{item.skill_name}</h4><div className="flex flex-wrap gap-1.5"><Badge variant="outline">{labels[item.category_code] ?? item.category_code}</Badge>{required && <Badge className="border border-red-300 bg-red-50 text-red-800">Explicitly required · potential deal-breaker</Badge>}</div></div><p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Job description evidence</p><blockquote className="mt-1 border-l-2 border-[#d6cbb8] pl-3 text-sm leading-5 text-slate-700">{item.job_evidence}</blockquote>{item.resume_evidence && <><p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Resume evidence</p><blockquote className="mt-1 border-l-2 border-[#80b7a4] pl-3 text-sm leading-5 text-slate-700">{item.resume_evidence}</blockquote></>}</article>; })}</div>}</section>;
}

export function JobReadiness() {
  const location = useLocation();
  const { profile: activeProfile, markReadinessChecked } = useCandidateProfile();
  const [historicalProfile, setHistoricalProfile] = useState<typeof activeProfile>(null);
  const [historyActivity, setHistoryActivity] = useState(false);
  const profile = historicalProfile ?? activeProfile;
  const [mode, setMode] = useState<"job" | "company">("job");
  const [file, setFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState(String(ALL_118_COMPANIES[0]?.company_id ?? ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [matchReport, setMatchReport] = useState<MatchReport | null>(null);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);

  useEffect(() => {
    const id = (location.state as { recentActivityId?: unknown } | null)?.recentActivityId;
    const saved = readRecentSnapshot<{ kind: "job-readiness"; profile: NonNullable<typeof activeProfile>; mode: "job" | "company"; job?: Job | null; matchReport?: MatchReport | null; benchmarkReport?: BenchmarkReport | null; companyId?: string }>(id);
    if (!saved || saved.kind !== "job-readiness") { setHistoryActivity(false); setHistoricalProfile(null); return; }
    setHistoryActivity(true);
    setHistoricalProfile(saved.profile);
    setMode(saved.mode);
    setJob(saved.job ?? null);
    setMatchReport(saved.matchReport ?? null);
    setBenchmarkReport(saved.benchmarkReport ?? null);
    if (saved.companyId) setCompanyId(saved.companyId);
  }, [location.key, location.state]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    event.target.value = ""; setError(""); setJob(null); setMatchReport(null);
    if (!next) return;
    const extension = next.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") { setError("Choose a PDF or DOCX job description."); return; }
    if (next.size > maxUploadBytes) { setError("This file is over 12 MB. Choose a smaller job description."); return; }
    setFile(next);
  };

  const checkUploadedJob = async () => {
    if (!profile || !file) return;
    setBusy(true); setError(""); setMatchReport(null); setBenchmarkReport(null); setJob(null);
    try {
      const form = new FormData(); form.set("file", file);
      const parsed = await readJson<Job>(await fetch(`${apiBase}/api/analyze`, { method: "POST", body: form, signal: AbortSignal.timeout(120_000) }));
      setJob(parsed);
      recordRecentActivity({ feature: "job-description", title: formatActivityFilename(parsed.source_file || file.name), action: "Parsed job description for readiness", path: "/jd-analytics" }, { kind: "jd-analysis", result: parsed });
      const response = await readJson<{ report: MatchReport }>(await fetch(`${apiBase}/api/skill-match`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        candidate_profile: { source_type: "resume", source_file: profile.source_file, name: profile.name, skills: profile.skills },
        job_description: parsed,
      }), signal: AbortSignal.timeout(60_000) }));
      setMatchReport(response.report); markReadinessChecked();
      recordRecentActivity({ feature: "readiness", title: `${response.report.role || "Job readiness"}${response.report.company ? ` · ${response.report.company}` : ""}`, action: `Checked resume evidence against ${parsed.source_file}`, path: "/job-readiness" }, { kind: "job-readiness", profile, mode: "job", job: parsed, matchReport: response.report });
    } catch (cause) { setError(cause instanceof Error && cause.name === "TimeoutError" ? "The analysis took too long. Please try again." : cause instanceof Error ? cause.message : "Could not compare this job description."); }
    finally { setBusy(false); }
  };

  const checkCompany = async () => {
    if (!profile || !companyId) return;
    setBusy(true); setError(""); setMatchReport(null); setJob(null); setBenchmarkReport(null);
    try {
      const response = await readJson<{ report: BenchmarkReport }>(await fetch(`${apiBase}/api/talent-check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidate_profile: profile, company_id: Number(companyId) }), signal: AbortSignal.timeout(60_000) }));
      setBenchmarkReport(response.report); markReadinessChecked();
      const companyName = ALL_118_COMPANIES.find((company) => String(company.company_id) === companyId)?.name ?? response.report.target_company;
      recordRecentActivity({ feature: "readiness", title: companyName || "Company benchmark", action: "Checked profile against a company benchmark", path: "/job-readiness" }, { kind: "job-readiness", profile, mode: "company", benchmarkReport: response.report, companyId });
    } catch (cause) { setError(cause instanceof Error && cause.name === "TimeoutError" ? "The benchmark check took too long. Please try again." : cause instanceof Error ? cause.message : "Could not compare this company benchmark."); }
    finally { setBusy(false); }
  };

  if (!profile) return <main className="space-theme mx-auto max-w-3xl px-5 py-12 sm:px-8"><Card className="p-8 text-center"><Target className="mx-auto h-8 w-8 text-[#246b5d]" /><h1 className="mt-4 font-heading text-2xl font-semibold text-[#26354b]">Build your profile first</h1><p className="mt-2 text-sm leading-6 text-slate-600">Readiness results compare a job or company against your resume evidence.</p><Button asChild className="mt-5"><Link to="/resume-profile">Parse a resume</Link></Button></Card></main>;

  const benchmarkRows = benchmarkReport?.per_skillset_gap_breakdown ?? benchmarkReport?.skillset_gap ?? [];
  return <main className="space-theme mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
    <Link to="/check-where-you-stand" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#216b5c]"><ArrowLeft className="h-4 w-4" /> Back to checklist</Link>
    {historyActivity && <p role="status" className="rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] px-4 py-3 text-sm text-slate-700">You’re viewing a saved readiness result. Start a new check from your current profile to update it.</p>}
    <header><p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#246b5d]"><Target className="h-3.5 w-3.5" /> Optional job check</p><h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#26354b]">Check where you stand</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Compare evidence from your resume with a specific job or an available company benchmark. This is a guidance snapshot, not a hiring decision.</p></header>
    <div className="grid gap-3 sm:grid-cols-2"><button type="button" disabled={historyActivity} onClick={() => { setMode("job"); setMatchReport(null); setBenchmarkReport(null); }} aria-pressed={mode === "job"} className={`rounded-2xl border p-4 text-left ${mode === "job" ? "border-[#80b7a4] bg-[#f3f8f1] ring-2 ring-[#246b5d]/10" : "border-[#e9e1d5] bg-white"}`}><span className="font-semibold text-[#26354b]">Use a job description</span><span className="mt-1 block text-sm text-slate-600">Upload a real PDF or DOCX job post.</span></button><button type="button" disabled={historyActivity} onClick={() => { setMode("company"); setMatchReport(null); setBenchmarkReport(null); }} aria-pressed={mode === "company"} className={`rounded-2xl border p-4 text-left ${mode === "company" ? "border-[#80b7a4] bg-[#f3f8f1] ring-2 ring-[#246b5d]/10" : "border-[#e9e1d5] bg-white"}`}><span className="font-semibold text-[#26354b]">Use a company benchmark</span><span className="mt-1 block text-sm text-slate-600">Compare with a company profile available in the platform.</span></button></div>
    <Card className="space-y-4 p-5 sm:p-7">
      {mode === "job" ? <><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9d2c5] bg-[#faf7f0] px-5 py-6 text-center hover:border-[#80b7a4]"><input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={chooseFile} className="sr-only" disabled={busy || historyActivity} /><Upload className="h-7 w-7 text-[#679586]" /><span className="mt-3 text-sm font-semibold text-slate-800">{file?.name ?? job?.source_file ?? "Choose a job description"}</span><span className="mt-1 text-xs text-slate-500">PDF or DOCX · up to 12 MB</span></label>{!historyActivity && <Button type="button" onClick={() => void checkUploadedJob()} disabled={!file || busy} className="min-h-11 w-full">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Analyzing and matching…</> : <><FileSearch className="h-4 w-4" /> Analyze and compare</>}</Button>}</> : <><label className="block text-sm font-semibold text-slate-800">Company<select value={companyId} onChange={(event) => setCompanyId(event.target.value)} disabled={busy || historyActivity} className="mt-2 min-h-11 w-full rounded-xl border border-[#d9d2c5] bg-white px-3 text-sm font-normal">{ALL_118_COMPANIES.map((company) => <option key={company.company_id} value={company.company_id}>{company.name}</option>)}</select></label>{!historyActivity && <Button type="button" onClick={() => void checkCompany()} disabled={!companyId || busy} className="min-h-11 w-full">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Comparing evidence…</> : <><Target className="h-4 w-4" /> Compare with benchmark</>}</Button>}</>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    </Card>

    {matchReport && <section className="space-y-5"><Card className="border-[#dbe9dd] bg-[#f3f8f1] p-5 sm:p-6"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#246b5d]" /><div><h2 className="font-heading text-xl font-semibold text-[#26354b]">Evidence comparison{matchReport.role ? ` · ${matchReport.role}` : ""}{matchReport.company ? ` at ${matchReport.company}` : ""}</h2><p className="mt-1 text-sm text-slate-600">{job?.source_file} · {matchReport.match_score}% text match estimate</p><p className="mt-2 text-sm leading-6 text-slate-600">This score compares extracted skill terms and resume evidence; it does not measure proficiency or predict hiring.</p></div></div><div className="mt-4 grid grid-cols-3 gap-3 text-center">{[["Supported", matchReport.matched_count], ["Possible", matchReport.possible_count], ["No resume evidence", matchReport.missing_count]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-[#dbe9dd] bg-white p-3"><p className="text-xl font-semibold text-[#26354b]">{String(value)}</p><p className="text-xs text-slate-600">{String(label)}</p></div>)}</div></Card><MatchSection title="Resume evidence found" items={matchReport.matched_skills ?? []} kind="matched" /><MatchSection title="Possible matches to review" items={matchReport.possible_matches ?? []} kind="possible" /><MatchSection title="No matching resume evidence" items={matchReport.missing_skills ?? []} kind="missing" /><p className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/70 p-4 text-sm leading-6 text-slate-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />Only missing skills whose job-description evidence explicitly says “must,” “required,” or similar are marked as potential deal-breakers. Review the source wording before treating them as mandatory.</p></section>}

    {benchmarkReport && <section className="space-y-4"><Card className="border-[#dbe9dd] bg-[#f3f8f1] p-5 sm:p-6"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#246b5d]" /><div><h2 className="font-heading text-xl font-semibold text-[#26354b]">Company benchmark overview · {benchmarkReport.target_company}</h2><p className="mt-1 text-sm leading-6 text-slate-600">This benchmark reflects the platform’s available company data. It isn’t a job-specific list of mandatory requirements.</p>{benchmarkReport.benchmark_notice && <p className="mt-2 text-xs leading-5 text-slate-500">{benchmarkReport.benchmark_notice}</p>}</div></div></Card><div className="grid gap-3 sm:grid-cols-2">{benchmarkRows.map((row, index) => { const hasEvidence = profile.skills.some((skill) => skill.category_code === row.category); return <article key={`${row.category}-${index}`} className={`rounded-xl border p-4 ${hasEvidence ? "border-[#dbe9dd] bg-[#f3f8f1]" : "border-[#e9e1d5] bg-white"}`}><div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-[#26354b]">{labels[row.category] ?? row.category}</h3><Badge variant="outline">{hasEvidence ? "Resume evidence found" : "No resume evidence"}</Badge></div><p className="mt-2 text-sm text-slate-600">Platform benchmark target: {Number(row.required_level).toFixed(1)} / 5</p>{hasEvidence && <p className="mt-1 text-xs text-slate-500">Skill level has not been independently assessed from the resume.</p>}</article>; })}</div><p className="rounded-xl border border-[#e9e1d5] bg-white p-4 text-sm leading-6 text-slate-600">Company benchmark differences are shown as priority areas only. The benchmark data does not label any skill as a deal-breaker.</p></section>}
    <p className="text-center text-xs text-slate-500">Resume and job analysis is temporary to this session. Review extracted skills and evidence before using the comparison.</p>
  </main>;
}
