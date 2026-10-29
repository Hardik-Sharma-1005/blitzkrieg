import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, FileText, LoaderCircle, MessageCircle, Sparkles, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FormattedAIMessage } from "@/components/FormattedAIMessage";

type Skill = { skill_name: string; category_code: string; confidence?: "high" | "medium" | "low" };
type CandidateProfile = { name: string; source_file: string; skills: Skill[]; extraction_mode: "llm_live" | "offline_heuristic" | "offline_heuristic_fallback" };
type Gap = { category: string; required_level: number; candidate_level: number; gap: number; estimated_learning_hours: number; is_deal_breaker: boolean; weight: number };
type TalentReport = { error: boolean; company_id: number; target_company: string; benchmark_source: "company_skill_levels" | "radix_median_fallback"; candidate_name: string; readiness_score: number; is_ready: boolean; readiness_threshold: number; total_estimated_learning_hours: number; deal_breakers_count: number; deal_breakers_list: Array<{ category: string; current: number; required: number; gap: number }>; what_if_recommendation: { recommended_skill_to_study: string | null; projected_score_boost_pct: number }; ai_candidate_agent_advice: string; benchmark_notice: string; per_skillset_gap_breakdown: Gap[] };
type CompanyOption = { company_id: number; name: string; benchmark_source: "company_skill_levels" | "radix_median_fallback"; benchmark_note: string };
type ChatTurn = { question: string; answer: string };
type Challenge = { category: string; title: string; scenario: string; task: string };
type ApiError = { detail?: string };

const apiBase = (import.meta.env.VITE_JD_ANALYTICS_API_URL || "http://127.0.0.1:8000").trim().replace(/\/$/, "");
const maxUploadBytes = 12 * 1024 * 1024;
const categoryNames: Record<string, string> = { COD: "Coding", CDG: "Coding", DSA: "Data Structures & Algorithms", OOD: "Object-Oriented Design", APTI: "Aptitude", COMM: "Communication", AI: "AI / Machine Learning", CLOUD: "Cloud", SQL: "SQL & Databases", SWE: "Software Engineering", SYSD: "System Design", NETW: "Networking", OS: "Operating Systems", OTHER: "Other" };

async function payload<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as T | ApiError | null;
  if (!response.ok) {
    const detail = body && typeof body === "object" && "detail" in body && typeof body.detail === "string" ? body.detail : "The service could not complete this step. Please try again.";
    throw new Error(detail);
  }
  if (!body) throw new Error("The service returned an empty response. Please try again.");
  return body as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return payload<T>(await fetch(apiBase + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
}

export function TalentCheck() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyId, setCompanyId] = useState<number | "">("");
  const [companyListBusy, setCompanyListBusy] = useState(true);
  const [report, setReport] = useState<TalentReport | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [coachQuestion, setCoachQuestion] = useState("");
  const [coachTurns, setCoachTurns] = useState<ChatTurn[]>([]);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [sprintSolution, setSprintSolution] = useState("");
  const [sprintResult, setSprintResult] = useState<{ is_passed: boolean; score_pct: number; feedback: string; verified_skill_badge: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadCompanies = async () => {
      setCompanyListBusy(true);
      try {
        const result = await payload<{ companies: CompanyOption[] }>(await fetch(apiBase + "/api/talent-check/companies"));
        if (!cancelled) {
          setCompanies(result.companies);
          setCompanyId(result.companies[0]?.company_id ?? "");
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "The company directory could not be loaded.");
      } finally {
        if (!cancelled) setCompanyListBusy(false);
      }
    };
    void loadCompanies();
    return () => { cancelled = true; };
  }, []);

  const selectResume = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError("");
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") { setError("Choose a PDF or DOCX resume."); event.target.value = ""; return; }
    if (file.size > maxUploadBytes) { setError("This file is over 12 MB. Choose a smaller resume."); event.target.value = ""; return; }
    setResumeFile(file); setProfile(null); setReport(null); setCoachTurns([]); setInterviewQuestions([]); setChallenge(null);
  };

  const parseResume = async () => {
    if (!resumeFile || busy) return;
    setBusy("resume"); setError(""); setProfile(null); setReport(null);
    const form = new FormData(); form.set("file", resumeFile);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 120_000);
    try {
      const parsed = await payload<CandidateProfile>(await fetch(apiBase + "/api/parse-resume", { method: "POST", body: form, signal: controller.signal }));
      if (!parsed.name || !Array.isArray(parsed.skills)) throw new Error("The resume service returned an unexpected profile.");
      setProfile(parsed);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "We could not read this resume.";
      setError(cause instanceof DOMException && cause.name === "AbortError" ? "Resume analysis did not finish within 2 minutes. Please retry." : message.toLowerCase().includes("failed to fetch") ? "Could not connect to the resume service. Check that the local API is running." : message);
    } finally { window.clearTimeout(timer); setBusy(""); }
  };

  const runTalentCheck = async () => {
    if (!profile || !companyId || busy) return;
    setBusy("score"); setError(""); setReport(null);
    try {
      const result = await post<{ report: TalentReport }>("/api/talent-check", { candidate_profile: profile, company_id: companyId });
      setReport(result.report);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Talent Check could not be completed."); }
    finally { setBusy(""); }
  };

  const downloadReport = async () => {
    if (!report || busy) return;
    setBusy("report"); setError("");
    try {
      const response = await fetch(apiBase + "/api/talent-check/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ report }) });
      if (!response.ok) throw new Error("The report could not be downloaded.");
      const fileUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = fileUrl; link.download = `RADIX_Talent_Check_${report.candidate_name.replace(/[^a-z0-9_-]+/gi, "_")}.md`; link.click(); URL.revokeObjectURL(fileUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The report could not be downloaded."); }
    finally { setBusy(""); }
  };

  const askCoach = async () => {
    if (!report || !coachQuestion.trim() || busy) return;
    const question = coachQuestion.trim(); setBusy("coach"); setError("");
    try {
      const result = await post<{ answer: string }>("/api/talent-check/coach", { report, question });
      setCoachTurns((turns) => [...turns, { question, answer: result.answer }]); setCoachQuestion("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "BlitzyAI could not answer."); }
    finally { setBusy(""); }
  };

  const makeInterviewQuestions = async () => {
    if (!report || busy) return;
    setBusy("interview-questions"); setError(""); setInterviewFeedback("");
    try {
      const result = await post<{ questions: string[] }>("/api/talent-check/interview/questions", { report });
      setInterviewQuestions(result.questions); setSelectedQuestion(result.questions[0] ?? "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Interview questions could not be generated."); }
    finally { setBusy(""); }
  };

  const evaluateInterview = async () => {
    if (!selectedQuestion || !interviewAnswer.trim() || busy) return;
    setBusy("interview-evaluate"); setError("");
    try {
      const result = await post<{ feedback: string }>("/api/talent-check/interview/evaluate", { question: selectedQuestion, candidate_answer: interviewAnswer.trim() });
      setInterviewFeedback(result.feedback);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The interview answer could not be evaluated."); }
    finally { setBusy(""); }
  };

  const makeChallenge = async () => {
    if (!report || busy) return;
    setBusy("sprint-challenge"); setError(""); setSprintResult(null);
    try { setChallenge(await post<Challenge>("/api/talent-check/sprint/challenge", { report })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "A Skill Proof Sprint could not be created."); }
    finally { setBusy(""); }
  };

  const evaluateSprint = async () => {
    if (!challenge || !sprintSolution.trim() || busy) return;
    setBusy("sprint-evaluate"); setError("");
    try { setSprintResult(await post("/api/talent-check/sprint/evaluate", { challenge, solution: sprintSolution.trim() })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Your Skill Proof Sprint could not be evaluated."); }
    finally { setBusy(""); }
  };

  const startOver = () => {
    setResumeFile(null); setProfile(null); setReport(null); setCoachTurns([]); setCoachQuestion(""); setInterviewQuestions([]); setSelectedQuestion(""); setInterviewAnswer(""); setInterviewFeedback(""); setChallenge(null); setSprintSolution(""); setSprintResult(null); setError("");
  };

  const levelWidth = (level: number) => `${Math.max(0, Math.min(100, (level / 5) * 100))}%`;

  return <div className="space-theme min-h-screen bg-[#fbf8f1]">
    <header className="border-b border-[#e9e1d5] bg-[#fffdf8]"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
      <Link to="/companies" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#216b5d]"><ArrowLeft className="h-4 w-4" /> Back to company directory</Link>
      <BrandLogo className="h-auto w-32" />
    </div></header>
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="max-w-3xl"><p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]"><Sparkles className="h-3.5 w-3.5" /> RADIX TALENT MATCH</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">Your Talent Check journey.</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Review your resume profile against a company benchmark, then use the coach, interview practice, and skill sprint to prepare.</p>
      </div>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <Card className="p-5 sm:p-7"><div className="space-y-6">
          <section><div className="mb-3 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e4f2e9] text-sm font-bold text-[#246b5d]">1</span><div><h2 className="font-heading text-lg font-semibold text-[#26354b]">Upload your resume</h2><p className="text-sm text-slate-500">The profile is extracted with AI when available and processed temporarily.</p></div></div>
            {!profile ? <div className="space-y-4"><label htmlFor="talent-resume" className="mb-2 block text-sm font-semibold text-slate-800">PDF or DOCX resume</label><label htmlFor="talent-resume" className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9d2c5] bg-[#faf7f0] px-5 py-6 text-center hover:border-[#80b7a4]"><input id="talent-resume" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={selectResume} disabled={busy !== ""} className="sr-only" /><Upload className="h-7 w-7 text-[#679586]" /><span className="mt-3 text-sm font-semibold text-slate-800">{resumeFile ? resumeFile.name : "Choose a resume file"}</span><span className="mt-1 text-xs text-slate-500">Up to 12 MB</span></label><Button type="button" onClick={() => void parseResume()} disabled={!resumeFile || busy !== ""} className="min-h-11 w-full">{busy === "resume" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Reading your resume…</> : <><Sparkles className="h-4 w-4" /> Analyze resume</>}</Button></div>
              : <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] p-4"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-[#246b5d]" /><div><p className="font-semibold text-slate-800">{profile.name}</p><p className="text-xs text-slate-500">{profile.skills.length} skills · {profile.source_file}</p><p className="mt-1 text-xs font-medium text-[#246b5d]">Resume analyzed</p></div></div><Badge variant="outline">Resume reviewed</Badge><Button type="button" variant="outline" onClick={() => { setProfile(null); setReport(null); setResumeFile(null); }} disabled={busy !== ""}>Choose another</Button></div>}
          </section>

          {profile && <section className="space-y-4 border-t border-[#e9e1d5] pt-5"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e4f2e9] text-sm font-bold text-[#246b5d]">2</span><div><h2 className="font-heading text-lg font-semibold text-[#26354b]">Choose a company benchmark</h2><p className="text-sm text-slate-500">Select from all {companies.length || 118} companies in the placement portal.</p></div></div><div><label htmlFor="talent-company" className="mb-2 block text-sm font-medium text-slate-700">Company</label><select id="talent-company" value={companyId} onChange={(event) => { setCompanyId(Number(event.target.value)); setReport(null); }} disabled={busy !== "" || companyListBusy || companies.length === 0} className="h-11 w-full rounded-xl border border-[#ded7ca] bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]"><option value="" disabled>{companyListBusy ? "Loading companies…" : "Choose a company"}</option>{companies.map((entry) => <option key={entry.company_id} value={entry.company_id}>{entry.name}{entry.benchmark_source === "radix_median_fallback" ? " — RADIX-wide reference" : ""}</option>)}</select></div>{companyId !== "" && companies.find((entry) => entry.company_id === companyId)?.benchmark_source === "radix_median_fallback" && <p className="rounded-xl border border-[#f0dfb2] bg-[#fff9e9] px-4 py-3 text-sm leading-6 text-[#76591d]">{companies.find((entry) => entry.company_id === companyId)?.benchmark_note}</p>}<Button type="button" onClick={() => void runTalentCheck()} disabled={busy !== "" || companyListBusy || !companyId} className="min-h-11 w-full">{busy === "score" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Building your report…</> : <><Sparkles className="h-4 w-4" /> Run Talent Check</>}</Button></section>}
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</div>}
          {profile && <Button type="button" variant="outline" onClick={startOver} disabled={busy !== ""} className="w-full">Start over</Button>}
        </div></Card>

        <Card className="p-5 sm:p-7"><h2 className="font-heading text-lg font-semibold text-[#26354b]">What happens in this workflow</h2><ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li><strong className="text-slate-800">Talent Check:</strong> compares your resume against the selected company’s 12-skill RADIX profile.</li><li><strong className="text-slate-800">BlitzyAI:</strong> answers questions using your report.</li><li><strong className="text-slate-800">Interview Practice:</strong> generates and evaluates targeted questions.</li><li><strong className="text-slate-800">Skill Proof Sprint:</strong> creates a small challenge and reviews your solution.</li></ol><p className="mt-5 rounded-xl border border-[#f0dfb2] bg-[#fff9e9] px-4 py-3 text-sm leading-6 text-[#76591d]">Company skill profiles are from the placement portal. They are preparation benchmarks, not live job requirements or hiring decisions. Five companies without their own profile use a clearly labeled RADIX-wide median.</p><Link to="/resume-profile" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#246b5d] hover:text-[#185546]"><FileText className="h-4 w-4" /> Open full resume profile</Link></Card>
      </div>

      {report && <>
        <Card className="mt-6 overflow-hidden"><div className="flex flex-col gap-4 border-b border-[#e9e1d5] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-start gap-3"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e4f2e9] text-[#246b5d]"><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]">Talent Check complete</p><h2 className="mt-1 font-heading text-xl font-semibold text-[#26354b]">{report.candidate_name} · {report.target_company}</h2><p className="mt-1 text-sm text-slate-500">{report.benchmark_source === "radix_median_fallback" ? "RADIX-wide reference · no company-specific data" : report.is_ready ? "Ready against the company profile" : "Preparation recommended"}</p></div></div><div className="flex flex-wrap items-center gap-3"><div className="rounded-2xl bg-[#f3f8f1] px-6 py-4 text-center"><p className="text-3xl font-semibold text-[#246b5d]">{report.readiness_score}%</p><p className="mt-1 text-xs font-medium text-slate-600">readiness score</p></div><Button type="button" variant="outline" onClick={() => void downloadReport()} disabled={busy !== ""}><Download className="h-4 w-4" /> Download report</Button></div></div>
          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6"><div className="rounded-xl border border-[#e9e1d5] bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Deal-breaker gaps</p><p className="mt-1 text-2xl font-semibold text-[#26354b]">{report.deal_breakers_count}</p></div><div className="rounded-xl border border-[#e9e1d5] bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Estimated preparation</p><p className="mt-1 text-2xl font-semibold text-[#26354b]">{report.total_estimated_learning_hours} <span className="text-sm font-medium">hours</span></p></div><div className="rounded-xl border border-[#e9e1d5] bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Top focus</p><p className="mt-1 text-lg font-semibold text-[#26354b]">{report.what_if_recommendation.recommended_skill_to_study ? categoryNames[report.what_if_recommendation.recommended_skill_to_study] ?? report.what_if_recommendation.recommended_skill_to_study : "Maintain your strengths"}</p></div></div>
          <div className="grid gap-5 border-t border-[#e9e1d5] p-5 lg:grid-cols-2 sm:p-6"><section><h3 className="font-heading text-lg font-semibold text-[#26354b]">Skill gap breakdown</h3><div className="mt-3 space-y-3">{report.per_skillset_gap_breakdown.map((gap) => <div key={gap.category} className="rounded-xl border border-[#e9e1d5] bg-white p-3"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-800">{categoryNames[gap.category] ?? gap.category}</span><span className="text-xs text-slate-500">You {gap.candidate_level}/5 · Goal {gap.required_level}/5</span></div><div className="flex h-2 overflow-hidden rounded-full bg-[#eee8dc]"><div className="rounded-full bg-[#246b5d]" style={{ width: levelWidth(gap.candidate_level) }} /><div className="-ml-0.5 h-2 border-l-2 border-[#d29335]" style={{ marginLeft: `calc(${levelWidth(gap.required_level)} - 2px)` }} /></div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{gap.gap > 0 ? `${gap.gap} level gap · ~${gap.estimated_learning_hours} study hours` : "Benchmark met"}</span>{gap.is_deal_breaker && <span className="font-semibold text-[#a44c37]">Priority gap</span>}</div></div>)}</div></section><section><h3 className="font-heading text-lg font-semibold text-[#26354b]">Report summary</h3><p className="mt-3 rounded-xl bg-[#faf7f0] p-4 text-sm leading-6 text-slate-700">{report.ai_candidate_agent_advice}</p>{report.deal_breakers_list.length > 0 && <><h4 className="mt-5 text-sm font-semibold text-slate-800">Priority gaps</h4><ul className="mt-2 space-y-2 text-sm text-slate-600">{report.deal_breakers_list.map((gap) => <li key={gap.category}>{categoryNames[gap.category] ?? gap.category}: {gap.current}/5 now, {gap.required}/5 benchmark.</li>)}</ul></>}<p className="mt-5 rounded-xl border border-[#f0dfb2] bg-[#fff9e9] px-4 py-3 text-xs leading-5 text-[#76591d]">{report.benchmark_notice}</p></section></div>
        </Card>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
          <Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-[#246b5d]" /><div><h2 className="font-heading text-lg font-semibold text-[#26354b]">3. BlitzyAI</h2><p className="text-sm text-slate-500">Ask about your report and preparation priorities.</p></div></div><div className="mt-4 space-y-3">{coachTurns.map((turn, index) => <div key={index} className="space-y-2"><p className="rounded-xl bg-[#f3f8f1] p-3 text-sm font-medium text-slate-800">You: {turn.question}</p><div className="rounded-xl bg-[#faf7f0] p-3 text-sm text-slate-700"><p className="mb-1 font-semibold">BlitzyAI</p><FormattedAIMessage text={turn.answer} /></div></div>)}</div><label htmlFor="coach-question" className="mb-2 mt-4 block text-sm font-medium text-slate-700">Your question</label><textarea id="coach-question" value={coachQuestion} onChange={(event) => setCoachQuestion(event.target.value)} rows={3} maxLength={2000} placeholder="What should I focus on first?" className="w-full resize-y rounded-xl border border-[#ded7ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]" /><Button className="mt-3 w-full" onClick={() => void askCoach()} disabled={!coachQuestion.trim() || busy !== ""}>{busy === "coach" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Thinking…</> : "Ask BlitzyAI"}</Button></Card>

          <Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-[#246b5d]" /><div><h2 className="font-heading text-lg font-semibold text-[#26354b]">4. Interview Practice</h2><p className="text-sm text-slate-500">Practice questions based on the report’s largest gaps.</p></div></div><Button type="button" variant="outline" className="mt-4 w-full" onClick={() => void makeInterviewQuestions()} disabled={busy !== ""}>{busy === "interview-questions" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Generating questions…</> : "Generate interview questions"}</Button>{interviewQuestions.length > 0 && <div className="mt-4 space-y-3"><label htmlFor="interview-question" className="block text-sm font-medium text-slate-700">Choose a question</label><select id="interview-question" value={selectedQuestion} onChange={(event) => setSelectedQuestion(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#ded7ca] bg-white px-3 py-2 text-sm">{interviewQuestions.map((question, index) => <option key={index} value={question}>{question}</option>)}</select><label htmlFor="interview-answer" className="block text-sm font-medium text-slate-700">Your answer</label><textarea id="interview-answer" value={interviewAnswer} onChange={(event) => setInterviewAnswer(event.target.value)} rows={4} maxLength={12000} className="w-full resize-y rounded-xl border border-[#ded7ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]" /><Button type="button" className="w-full" onClick={() => void evaluateInterview()} disabled={!interviewAnswer.trim() || busy !== ""}>{busy === "interview-evaluate" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Reviewing answer…</> : "Get feedback"}</Button>{interviewFeedback && <p className="whitespace-pre-wrap rounded-xl bg-[#faf7f0] p-4 text-sm leading-6 text-slate-700">{interviewFeedback}</p>}</div>}</Card>

          <Card className="p-5 sm:col-span-2 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-lg font-semibold text-[#26354b]">5. Skill Proof Sprint</h2><p className="text-sm text-slate-500">Complete a short challenge for your highest-priority gap.</p></div><Button type="button" variant="outline" onClick={() => void makeChallenge()} disabled={busy !== ""}>{busy === "sprint-challenge" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Creating challenge…</> : "Create a sprint challenge"}</Button></div>{challenge && <div className="mt-4 grid gap-5 md:grid-cols-2"><div className="rounded-xl bg-[#faf7f0] p-4"><Badge variant="outline">{categoryNames[challenge.category] ?? challenge.category}</Badge><h3 className="mt-3 font-semibold text-[#26354b]">{challenge.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{challenge.scenario}</p><p className="mt-3 text-sm font-medium leading-6 text-slate-800">Task: {challenge.task}</p></div><div><label htmlFor="sprint-solution" className="mb-2 block text-sm font-medium text-slate-700">Your solution</label><textarea id="sprint-solution" value={sprintSolution} onChange={(event) => setSprintSolution(event.target.value)} rows={6} maxLength={12000} className="w-full resize-y rounded-xl border border-[#ded7ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]" /><Button type="button" className="mt-3 w-full" onClick={() => void evaluateSprint()} disabled={!sprintSolution.trim() || busy !== ""}>{busy === "sprint-evaluate" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Evaluating…</> : "Submit for feedback"}</Button>{sprintResult && <div className="mt-3 rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] p-4"><p className="font-semibold text-[#246b5d]">{sprintResult.is_passed ? "Sprint passed" : "Keep practicing"} · {sprintResult.score_pct}%</p><p className="mt-2 text-sm leading-6 text-slate-700">{sprintResult.feedback}</p><p className="mt-2 text-xs font-medium text-slate-500">{sprintResult.verified_skill_badge}</p></div>}</div></div>}</Card>
        </div>
      </>}
    </main>
  </div>;
}
