import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Award, ArrowLeft, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCandidateProfile, type AssessmentKind, type CandidateSkill } from "@/lib/candidateProfile";
import { readRecentSnapshot, recordRecentActivity } from "@/lib/recentActivity";

const apiBase = (import.meta.env.VITE_JD_ANALYTICS_API_URL || "http://127.0.0.1:8000").trim().replace(/\/$/, "");
const categoryNames: Record<string, string> = { COD: "Coding", DSA: "Data Structures & Algorithms", OOD: "Object-Oriented Design", APTI: "Aptitude", COMM: "Communication", AI: "AI / ML", CLOUD: "Cloud", SQL: "SQL & Databases", SWE: "Software Engineering", SYSD: "System Design", NETW: "Networking", OS: "Operating Systems", OTHER: "Other" };

type AssessmentResult = { is_passed: boolean; score_pct: number; feedback: string; criteria?: Record<string, number>; evaluation_status?: string };
type SprintChallenge = { title: string; scenario: string; task: string; skill_name: string; category: string; generation_status?: string };
type AssessmentActivitySnapshot = { kind: "candidate-assessment"; assessmentKind: AssessmentKind; skill: CandidateSkill; question?: string; challenge?: SprintChallenge; answer?: string; result?: AssessmentResult | null };

async function readJson<T>(response: Response): Promise<T> {
  const value = await response.json().catch(() => null) as T | { detail?: string } | null;
  if (!response.ok) throw new Error(value && typeof value === "object" && "detail" in value && typeof value.detail === "string" ? value.detail : "The assessment could not be completed. Please try again.");
  if (!value) throw new Error("The assessment service returned an empty response.");
  return value as T;
}

export function CandidateAssessments() {
  const location = useLocation();
  const { profile, badges, awardBadge } = useCandidateProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const kind: AssessmentKind = searchParams.get("kind") === "skill_proof_sprint" ? "skill_proof_sprint" : "mock_interview";
  const [selectedSkillName, setSelectedSkillName] = useState("");
  const [question, setQuestion] = useState("");
  const [challenge, setChallenge] = useState<SprintChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [busy, setBusy] = useState<"generate" | "evaluate" | "">("");
  const [error, setError] = useState("");
  const [historySnapshot, setHistorySnapshot] = useState<AssessmentActivitySnapshot | null>(null);

  useEffect(() => {
    const id = (location.state as { recentActivityId?: unknown } | null)?.recentActivityId;
    const saved = readRecentSnapshot<AssessmentActivitySnapshot>(id);
    if (!saved || saved.kind !== "candidate-assessment") { setHistorySnapshot(null); return; }
    setHistorySnapshot(saved);
    setSelectedSkillName(saved.skill.skill_name);
    setQuestion(saved.question ?? "");
    setChallenge(saved.challenge ?? null);
    setAnswer(saved.answer ?? "");
    setResult(saved.result ?? null);
  }, [location.key, location.state]);

  const recommendedSkills = useMemo(() => {
    if (!profile) return [] as CandidateSkill[];
    const hasBadge = new Set(badges.map((badge) => badge.skill_name.toLowerCase()));
    return [...profile.skills].sort((left, right) => {
      const leftAlreadyVerified = hasBadge.has(left.skill_name.toLowerCase()) ? 1 : 0;
      const rightAlreadyVerified = hasBadge.has(right.skill_name.toLowerCase()) ? 1 : 0;
      const confidence = { high: 0, medium: 1, low: 2 };
      return leftAlreadyVerified - rightAlreadyVerified || confidence[left.confidence] - confidence[right.confidence];
    });
  }, [profile, badges]);

  const selectedSkill = historySnapshot?.skill ?? recommendedSkills.find((skill) => skill.skill_name === selectedSkillName) ?? recommendedSkills[0];
  const existingBadge = !historySnapshot && selectedSkill && badges.find((badge) => badge.skill_name.toLowerCase() === selectedSkill.skill_name.toLowerCase());
  const isSprint = kind === "skill_proof_sprint";

  const changeKind = (next: AssessmentKind) => {
    setSearchParams({ kind: next });
    setQuestion(""); setChallenge(null); setAnswer(""); setResult(null); setError("");
  };

  const generate = async () => {
    if (!selectedSkill) return;
    setBusy("generate"); setError(""); setAnswer(""); setResult(null); setQuestion(""); setChallenge(null);
    const body = JSON.stringify({ skill_name: selectedSkill.skill_name, category_code: selectedSkill.category_code, evidence: selectedSkill.evidence });
    try {
      if (isSprint) {
        const generated = await readJson<SprintChallenge>(await fetch(`${apiBase}/api/profile-assessment/sprint/challenge`, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(60_000) }));
        setChallenge(generated);
        recordRecentActivity({ feature: "assessment", title: selectedSkill.skill_name, action: `Generated a Skill Proof Sprint challenge for ${selectedSkill.skill_name}`, path: "/candidate-assessments?kind=skill_proof_sprint" }, { kind: "candidate-assessment", assessmentKind: "skill_proof_sprint", skill: selectedSkill, challenge: generated });
      } else {
        const generated = await readJson<{ question: string; generation_status?: string }>(await fetch(`${apiBase}/api/profile-assessment/interview/question`, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(60_000) }));
        setQuestion(generated.question);
        recordRecentActivity({ feature: "assessment", title: selectedSkill.skill_name, action: `Generated a Mock Interview question for ${selectedSkill.skill_name}`, path: "/candidate-assessments?kind=mock_interview" }, { kind: "candidate-assessment", assessmentKind: "mock_interview", skill: selectedSkill, question: generated.question });
      }
    } catch (cause) { setError(cause instanceof Error && cause.name === "TimeoutError" ? "Question generation took too long. Please try again." : cause instanceof Error ? cause.message : "Could not generate an assessment."); }
    finally { setBusy(""); }
  };

  const submit = async () => {
    if (!selectedSkill || !answer.trim()) return;
    setBusy("evaluate"); setError(""); setResult(null);
    try {
      let scored: AssessmentResult;
      if (isSprint && challenge) {
        const response = await readJson<{ result: AssessmentResult }>(await fetch(`${apiBase}/api/skill-sprint/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challenge, solution: answer }), signal: AbortSignal.timeout(60_000) }));
        scored = response.result;
      } else {
        scored = await readJson<AssessmentResult>(await fetch(`${apiBase}/api/profile-assessment/interview/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill_name: selectedSkill.skill_name, question, answer }), signal: AbortSignal.timeout(60_000) }));
      }
      setResult(scored);
      const assessmentKind: AssessmentKind = isSprint ? "skill_proof_sprint" : "mock_interview";
      recordRecentActivity({ feature: "assessment", title: selectedSkill.skill_name, action: `Completed ${isSprint ? "Skill Proof Sprint" : "Mock Interview"} assessment · ${scored.evaluation_status === "unavailable" ? "not scored" : scored.is_passed ? "passed" : "keep practicing"}`, path: `/candidate-assessments?kind=${assessmentKind}` }, { kind: "candidate-assessment", assessmentKind, skill: selectedSkill, question: question || undefined, challenge: challenge ?? undefined, answer, result: scored });
      if (scored.is_passed && scored.evaluation_status === "scored") {
        const type: AssessmentKind = isSprint ? "skill_proof_sprint" : "mock_interview";
        const evidence = isSprint ? `Passed challenge: ${challenge?.title ?? selectedSkill.skill_name}` : "Passed one generated Mock Interview question";
        awardBadge(selectedSkill, type, evidence);
        toast.success(existingBadge ? `${selectedSkill.skill_name} badge updated with additional assessment evidence.` : `${selectedSkill.skill_name} badge added to your profile!`);
      }
    } catch (cause) { setError(cause instanceof Error && cause.name === "TimeoutError" ? "Assessment took too long. Please try again." : cause instanceof Error ? cause.message : "Could not score this answer."); }
    finally { setBusy(""); }
  };

  if (!profile && !historySnapshot) return <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8"><Card className="p-8 text-center"><Sparkles className="mx-auto h-8 w-8 text-[#246b5d]" /><h1 className="mt-4 font-heading text-2xl font-semibold text-[#26354b]">Create your profile first</h1><p className="mt-2 text-sm leading-6 text-slate-600">Assessments use skills from your resume to recommend practice topics and add earned badges.</p><Button asChild className="mt-5"><Link to="/resume-profile">Parse a resume</Link></Button></Card></main>;

  return <main className="mx-auto max-w-4xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
    <Link to="/check-where-you-stand" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#216b5c]"><ArrowLeft className="h-4 w-4" /> Back to checklist</Link>
    <header><p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#246b5d]"><Award className="h-3.5 w-3.5" /> Badge assessment</p><h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#26354b]">Practice a skill</h1><p className="mt-2 text-sm leading-6 text-slate-600">Choose a skill from your resume. A badge is added automatically when you pass the selected assessment.</p></header>
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => changeKind("mock_interview")} aria-pressed={!isSprint} disabled={Boolean(historySnapshot)} className={`rounded-2xl border p-4 text-left transition ${!isSprint ? "border-[#80b7a4] bg-[#f3f8f1] ring-2 ring-[#246b5d]/10" : "border-[#e9e1d5] bg-white hover:border-[#c9d9cd]"}`}><span className="font-semibold text-[#26354b]">Mock Interview</span><span className="mt-1 block text-sm text-slate-600">Answer one generated question about a skill.</span></button>
      <button type="button" onClick={() => changeKind("skill_proof_sprint")} aria-pressed={isSprint} disabled={Boolean(historySnapshot)} className={`rounded-2xl border p-4 text-left transition ${isSprint ? "border-[#80b7a4] bg-[#f3f8f1] ring-2 ring-[#246b5d]/10" : "border-[#e9e1d5] bg-white hover:border-[#c9d9cd]"}`}><span className="font-semibold text-[#26354b]">Skill Proof Sprint</span><span className="mt-1 block text-sm text-slate-600">Solve a short practical challenge.</span></button>
    </div>
    {historySnapshot && <p role="status" className="rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] px-4 py-3 text-sm text-slate-700">You’re viewing a saved assessment activity. Start a new assessment from your current profile to practice again.</p>}
    <Card className="space-y-5 p-5 sm:p-7">
      <label className="block text-sm font-semibold text-slate-800">Choose a skill <select value={selectedSkill?.skill_name ?? ""} disabled={Boolean(historySnapshot)} onChange={(event) => { setSelectedSkillName(event.target.value); setQuestion(""); setChallenge(null); setResult(null); setAnswer(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-[#d9d2c5] bg-white px-3 font-normal focus:border-[#246b5d] focus:outline-none">{historySnapshot && selectedSkill ? <option value={selectedSkill.skill_name}>{selectedSkill.skill_name} · {categoryNames[selectedSkill.category_code] ?? selectedSkill.category_code}</option> : recommendedSkills.map((skill, index) => <option key={`${skill.skill_name}-${index}`} value={skill.skill_name}>{skill.skill_name} · {categoryNames[skill.category_code] ?? skill.category_code}{index === 0 ? " · recommended" : ""}</option>)}</select></label>
      {!recommendedSkills.length && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">No skills were extracted from this resume, so there is nothing to assess yet. Apply another resume to refresh the profile.</p>}
      {selectedSkill && <div className="rounded-xl bg-[#faf7f0] p-4"><div className="flex items-center gap-2"><Badge variant="outline">Recommended from your resume</Badge>{existingBadge && <Badge className="bg-[#246b5d] text-white">Badge earned</Badge>}</div><p className="mt-2 text-sm leading-6 text-slate-700">{selectedSkill.evidence}</p></div>}
      {!question && !challenge && <Button type="button" onClick={() => void generate()} disabled={!selectedSkill || busy !== ""} className="min-h-11 w-full">{busy === "generate" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate {isSprint ? "challenge" : "question"}</>}</Button>}
      {question && !isSprint && <section className="space-y-4"><div className="rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#246b5d]">Your question</p><p className="mt-2 text-base leading-7 text-[#26354b]">{question}</p></div><label className="block text-sm font-semibold text-slate-800">Your answer<textarea rows={6} value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={Boolean(historySnapshot)} placeholder="Explain your approach, reasoning, and an example…" className="mt-2 w-full rounded-xl border border-[#d9d2c5] bg-white p-3 text-sm leading-6 focus:border-[#246b5d] focus:outline-none" /></label>{!historySnapshot && <Button type="button" onClick={() => void submit()} disabled={!answer.trim() || busy !== ""} className="min-h-11 w-full">{busy === "evaluate" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Evaluating answer…</> : "Submit answer"}</Button>}</section>}
      {challenge && isSprint && <section className="space-y-4"><div className="rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#246b5d]">{challenge.title}</p><p className="mt-2 text-sm leading-6 text-slate-700"><strong>Scenario:</strong> {challenge.scenario}</p><p className="mt-2 text-sm leading-6 text-[#26354b]"><strong>Your task:</strong> {challenge.task}</p></div><label className="block text-sm font-semibold text-slate-800">Your solution<textarea rows={6} value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={Boolean(historySnapshot)} placeholder="Describe your solution, trade-offs, and how you would validate it…" className="mt-2 w-full rounded-xl border border-[#d9d2c5] bg-white p-3 text-sm leading-6 focus:border-[#246b5d] focus:outline-none" /></label>{!historySnapshot && <Button type="button" onClick={() => void submit()} disabled={!answer.trim() || busy !== ""} className="min-h-11 w-full">{busy === "evaluate" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Evaluating solution…</> : "Submit solution"}</Button>}</section>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {result && <div role="status" className={`rounded-xl border p-4 ${result.is_passed && result.evaluation_status === "scored" ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-[#26354b]">{result.evaluation_status === "unavailable" ? "Assessment not scored" : result.is_passed ? "Passed" : "Keep practicing"}{result.evaluation_status !== "unavailable" ? ` · ${result.score_pct}%` : ""}</p>{result.is_passed && result.evaluation_status === "scored" && <Badge className="bg-[#246b5d] text-white"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />{selectedSkill?.skill_name} badge earned</Badge>}</div><p className="mt-2 text-sm leading-6 text-slate-700">{result.feedback}</p>{result.criteria && Object.keys(result.criteria).length > 0 && <p className="mt-2 text-xs text-slate-600">Rubric: {Object.entries(result.criteria).map(([key, score]) => `${key.replaceAll("_", " ")} ${score}/2`).join(" · ")}</p>}<div className="mt-4 flex flex-wrap gap-2">{!historySnapshot && <Button type="button" variant="outline" onClick={() => { setQuestion(""); setChallenge(null); setAnswer(""); setResult(null); void generate(); }}>Try another question</Button>}<Button asChild variant="outline"><Link to="/candidate-profile">View profile</Link></Button></div></div>}
    </Card>
    <p className="text-center text-xs text-slate-500">Each assessment has its own passing rubric. Unavailable or unscored assessments never award a badge.</p>
  </main>;
}
