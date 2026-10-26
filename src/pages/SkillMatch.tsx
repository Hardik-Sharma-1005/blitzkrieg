import { useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Skill = { skill_name: string; category_code: string; evidence: string; confidence: "high" | "medium" | "low" };
type ResumeProfile = { source_type: "resume"; source_file: string; name: string; skills: Skill[]; extraction_mode?: string };
type JobDescription = { source_type: "jd"; source_file: string; company: string; role: string; skills: Skill[]; extraction_mode: "llm_live" | "offline_heuristic" | "offline_heuristic_fallback"; extraction_note: string };
type MatchRow = { skill_name: string; category_code: string; job_evidence: string; job_confidence: string; resume_skill_name?: string; resume_evidence?: string; resume_confidence?: string; similarity?: number };
type MatchReport = {
  candidate_name: string; resume_source_file: string; company: string; role: string; job_source_file: string;
  job_extraction_mode: string; job_extraction_note: string;
  match_score: number; matched_count: number; possible_count: number; missing_count: number; total_requirements: number;
  matched_skills: MatchRow[]; possible_matches: MatchRow[]; missing_skills: MatchRow[]; score_note: string;
};

const apiBase = (import.meta.env.VITE_JD_ANALYTICS_API_URL || "http://127.0.0.1:8000").trim().replace(/\/$/, "");
const maxUploadBytes = 12 * 1024 * 1024;
const categories: Record<string, string> = {
  COD: "Coding", DSA: "Data Structures & Algorithms", OOD: "Object-Oriented Design", APTI: "Aptitude",
  COMM: "Communication", AI: "AI / ML", CLOUD: "Cloud", SQL: "SQL & Databases", SWE: "Software Engineering",
  SYSD: "System Design", NETW: "Networking", OS: "Operating Systems", OTHER: "Other",
};

async function readPayload<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T | { detail?: string } | null;
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
      ? payload.detail : "The request could not be completed. Please try again.";
    throw new Error(detail);
  }
  if (!payload) throw new Error("The analysis service returned an empty response.");
  return payload as T;
}

function UploadStep({ title, subtitle, file, busy, onChoose, onAnalyze, parsedLabel, parsedCount, disabled }: {
  title: string; subtitle: string; file: File | null; busy: boolean; onChoose: (event: ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void; parsedLabel?: string; parsedCount?: number; disabled?: boolean;
}) {
  return <Card className="p-5 sm:p-6">
    <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e4f2e9] text-[#246b5d]"><FileText className="h-4 w-4" /></span><div><h2 className="font-heading text-lg font-semibold text-[#26354b]">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p></div></div>
    <label className="mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9d2c5] bg-[#faf7f0] px-4 py-5 text-center transition hover:border-[#80b7a4]">
      <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onChoose} className="sr-only" disabled={busy || disabled} />
      <Upload className="h-6 w-6 text-[#679586]" /><span className="mt-2 max-w-full truncate text-sm font-semibold text-slate-800">{file?.name ?? "Choose a PDF or DOCX"}</span><span className="mt-1 text-xs text-slate-500">Up to 12 MB</span>
    </label>
    {parsedLabel && <p className="mt-3 rounded-lg bg-[#f3f8f1] px-3 py-2 text-sm text-[#246b5d]"><CheckCircle2 className="mr-1.5 inline h-4 w-4" />{parsedLabel}{typeof parsedCount === "number" ? ` · ${parsedCount} skills found` : ""}</p>}
    <Button type="button" onClick={onAnalyze} disabled={!file || busy || disabled} className="mt-4 min-h-11 w-full">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Reading document…</> : parsedLabel ? "Analyze again" : "Analyze document"}</Button>
  </Card>;
}

function EvidenceList({ title, items, status }: { title: string; items: MatchRow[]; status: "matched" | "possible" | "missing" }) {
  const accents = {
    matched: "border-[#dbe9dd] bg-[#f3f8f1]",
    possible: "border-[#f0dfb2] bg-[#fff9e9]",
    missing: "border-[#f0d8d2] bg-[#fff8f6]",
  };
  return <section>
    <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-heading text-lg font-semibold text-[#26354b]">{title}</h3><Badge variant="outline">{items.length}</Badge></div>
    {items.length === 0 ? <p className="rounded-xl border border-dashed border-[#e9e1d5] p-4 text-sm text-slate-500">None found in this category.</p> : <div className="space-y-3">{items.map((item, index) => <article key={`${item.skill_name}-${index}`} className={`rounded-xl border p-4 ${accents[status]}`}>
      <div className="flex flex-wrap items-start justify-between gap-2"><h4 className="font-semibold text-slate-900">{item.skill_name}</h4><span className="text-xs text-slate-500">{categories[item.category_code] ?? item.category_code}</span></div>
      {item.resume_skill_name && item.resume_skill_name !== item.skill_name && <p className="mt-1 text-xs font-medium text-slate-600">Resume wording: {item.resume_skill_name}{item.similarity ? ` · ${Math.round(item.similarity * 100)}% text similarity` : ""}</p>}
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Job requirement · {item.job_confidence} confidence</p><blockquote className="mt-1 border-l-2 border-[#d6cbb8] pl-3 text-sm leading-5 text-slate-700">{item.job_evidence}</blockquote>
      {item.resume_evidence && <><p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Resume evidence · {item.resume_confidence} confidence</p><blockquote className="mt-1 border-l-2 border-[#80b7a4] pl-3 text-sm leading-5 text-slate-700">{item.resume_evidence}</blockquote></>}
    </article>)}</div>}
  </section>;
}

export function SkillMatch() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resume, setResume] = useState<ResumeProfile | null>(null);
  const [job, setJob] = useState<JobDescription | null>(null);
  const [report, setReport] = useState<MatchReport | null>(null);
  const [busy, setBusy] = useState<"resume" | "jd" | "match" | "">("");
  const [error, setError] = useState("");

  const selectFile = (event: ChangeEvent<HTMLInputElement>, kind: "resume" | "jd") => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setError("");
    setReport(null);
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") { setError("Choose a PDF or DOCX file."); return; }
    if (file.size > maxUploadBytes) { setError("This file is over 12 MB. Choose a smaller file."); return; }
    if (kind === "resume") { setResumeFile(file); setResume(null); }
    else { setJdFile(file); setJob(null); }
  };

  const analyzeResume = async () => {
    if (!resumeFile || busy) return;
    setBusy("resume"); setError(""); setReport(null);
    try {
      const body = new FormData(); body.set("file", resumeFile);
      const response = await fetch(`${apiBase}/api/parse-resume`, { method: "POST", body, signal: AbortSignal.timeout(120_000) });
      const parsed = await readPayload<ResumeProfile>(response);
      if (!parsed.name || !Array.isArray(parsed.skills)) throw new Error("The resume service returned an unexpected profile.");
      setResume(parsed);
    } catch (cause) {
      setError(cause instanceof Error && cause.name === "TimeoutError" ? "Resume analysis did not finish within 2 minutes. Please retry." : cause instanceof Error ? cause.message : "We could not read this resume.");
    } finally { setBusy(""); }
  };

  const analyzeJob = async () => {
    if (!jdFile || busy) return;
    setBusy("jd"); setError(""); setReport(null);
    try {
      const body = new FormData(); body.set("file", jdFile);
      const parsed = await readPayload<JobDescription>(await fetch(`${apiBase}/api/analyze`, { method: "POST", body, signal: AbortSignal.timeout(120_000) }));
      if (!Array.isArray(parsed.skills)) throw new Error("The JD service returned an unexpected result.");
      setJob(parsed);
    } catch (cause) {
      setError(cause instanceof Error && cause.name === "TimeoutError" ? "Job description analysis did not finish within 2 minutes. Please retry." : cause instanceof Error ? cause.message : "We could not read this job description.");
    } finally { setBusy(""); }
  };

  const compare = async () => {
    if (!resume || !job || busy) return;
    setBusy("match"); setError(""); setReport(null);
    try {
      const response = await fetch(`${apiBase}/api/skill-match`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_profile: { source_type: resume.source_type, source_file: resume.source_file, name: resume.name, skills: resume.skills },
          job_description: { source_type: job.source_type, source_file: job.source_file, company: job.company, role: job.role, skills: job.skills, extraction_mode: job.extraction_mode, extraction_note: job.extraction_note },
        }),
      });
      const payload = await readPayload<{ report: MatchReport }>(response);
      if (!payload.report || !Array.isArray(payload.report.matched_skills)) throw new Error("The matcher returned an unexpected report.");
      setReport(payload.report);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not compare the documents.");
    } finally { setBusy(""); }
  };

  const startOver = () => { setResumeFile(null); setJdFile(null); setResume(null); setJob(null); setReport(null); setError(""); };

  return <div className="min-h-screen bg-[#fbf8f1]">
    <header className="border-b border-[#e9e1d5] bg-[#fffdf8]"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#216b5c]"><ArrowLeft className="h-4 w-4" /> Back to company directory</Link><div className="flex items-center gap-2"><img src="/jss-university-logo.png" alt="" className="h-9 w-9 rounded-lg object-contain" /><span className="hidden text-sm font-semibold text-[#26354b] sm:inline">JSS Student Career Hub</span></div></div></header>
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="max-w-3xl"><p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]"><Sparkles className="h-3.5 w-3.5" /> ROLE SKILL MATCH</p><h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">See how your resume lines up with a job.</h1><p className="mt-3 text-base leading-7 text-slate-600">Upload your resume and a job description. We’ll extract both with AI, then show the job requirements supported by evidence in your resume.</p></div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <UploadStep title="1. Your resume" subtitle="We’ll build an evidence-backed skill profile from your PDF or DOCX." file={resumeFile} busy={busy === "resume"} onChoose={(event) => selectFile(event, "resume")} onAnalyze={() => void analyzeResume()} parsedLabel={resume ? `${resume.name} · ${resume.source_file}` : undefined} parsedCount={resume?.skills.length} disabled={busy !== "" && busy !== "resume"} />
        <UploadStep title="2. The job description" subtitle={job?.extraction_note || "We’ll extract the skills and expectations stated in this role."} file={jdFile} busy={busy === "jd"} onChoose={(event) => selectFile(event, "jd")} onAnalyze={() => void analyzeJob()} parsedLabel={job ? `${job.role || "Job description"}${job.company ? ` · ${job.company}` : ""} · ${job.extraction_mode === "llm_live" ? "AI" : "local fallback"}` : undefined} parsedCount={job?.skills.length} disabled={busy !== "" && busy !== "jd"} />
      </div>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</div>}
      <div className="mt-5 flex flex-wrap gap-3"><Button type="button" onClick={() => void compare()} disabled={!resume || !job || busy !== ""} className="min-h-11">{busy === "match" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Comparing skills…</> : <><Sparkles className="h-4 w-4" /> Compare my resume with this job</>}</Button><Button type="button" variant="outline" onClick={startOver} disabled={busy !== ""}>Start over</Button><Link to="/talent-check" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#246b5d] hover:underline">Compare against a company benchmark instead</Link></div>
      {report && <div className="mt-8 space-y-5">
        <Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e9e1d5] p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]">Resume-to-job comparison</p><h2 className="mt-1 font-heading text-xl font-semibold text-[#26354b]">{report.role || "Job match"}{report.company ? ` · ${report.company}` : ""}</h2><p className="mt-1 text-sm text-slate-500">{report.candidate_name} · {report.resume_source_file} · {report.job_source_file}</p></div><div className="min-w-32 rounded-2xl bg-[#e4f2e9] px-5 py-3 text-center"><p className="text-3xl font-bold text-[#246b5d]">{report.match_score}%</p><p className="text-xs font-medium text-[#246b5d]">confirmed coverage</p></div></div>
          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6"><div className="rounded-xl bg-[#f3f8f1] p-4"><p className="text-2xl font-bold text-[#246b5d]">{report.matched_count}</p><p className="text-sm text-slate-600">Supported by resume evidence</p></div><div className="rounded-xl bg-[#fff9e9] p-4"><p className="text-2xl font-bold text-[#8a641e]">{report.possible_count}</p><p className="text-sm text-slate-600">Possible wording matches</p></div><div className="rounded-xl bg-[#fff8f6] p-4"><p className="text-2xl font-bold text-[#a44c37]">{report.missing_count}</p><p className="text-sm text-slate-600">Not found in parsed resume</p></div></div>
          <p className="border-t border-[#e9e1d5] px-5 py-4 text-xs leading-5 text-slate-500 sm:px-6">{report.score_note} {report.job_extraction_note} This is a document comparison, not a judgment of your actual proficiency or a hiring decision.</p>
        </Card>
        <div className="grid gap-5 xl:grid-cols-3"><Card className="p-5"><EvidenceList title="Resume evidence found" items={report.matched_skills} status="matched" /></Card><Card className="p-5"><EvidenceList title="Possible matches to review" items={report.possible_matches} status="possible" /></Card><Card className="p-5"><EvidenceList title="Not found in resume" items={report.missing_skills} status="missing" /></Card></div>
      </div>}
      <Card className="mt-8 p-5 sm:p-6"><h2 className="font-heading text-base font-semibold text-[#26354b]">How to read this comparison</h2><p className="mt-2 text-sm leading-6 text-slate-600">The resume and job description use the platform’s AI extraction workflow when available, with a labeled local fallback if a provider fails. Confirmed coverage means a requirement has a matching skill name or recognized alias in the parsed resume. A possible match uses similar wording and is shown for you to review. “Not found” means the parser did not find supporting skill text; it does not prove you lack that ability.</p><p className="mt-3 text-xs leading-5 text-slate-500">Documents are processed temporarily by the resume and job analysis services. Extracted profile data stays in this browser session for comparison and is not saved to a student account.</p></Card>
    </main>
  </div>;
}
