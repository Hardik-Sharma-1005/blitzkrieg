import { Link } from "react-router-dom";
import { ArrowRight, Award, CheckCircle2, FileText, ShieldCheck, Sparkles, Target, UserRound, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCandidateProfile } from "@/lib/candidateProfile";

const steps = [
  { key: "resume", title: "Build your candidate profile", description: "Parse a resume and apply it to your temporary profile.", to: "/resume-profile", icon: FileText, required: true },
      { key: "profile", title: "Review your profile", description: "Check your resume details and update your basic information.", to: "/candidate-profile", icon: UserRound, required: true },
  { key: "interview", title: "Practice a mock interview", description: "Choose a recommended skill, answer a generated question, and get structured feedback.", to: "/candidate-assessments?kind=mock_interview", icon: Sparkles },
  { key: "sprint", title: "Try a Skill Proof Sprint", description: "Solve a short skill challenge and earn a badge by passing.", to: "/candidate-assessments?kind=skill_proof_sprint", icon: Award },
  { key: "readiness", title: "Check readiness for a job", description: "Optionally compare your profile with a job description or company benchmark.", to: "/job-readiness", icon: Target },
];

export function CheckWhereYouStand() {
  const { profile, badges, profileReviewed, interviewCompleted, readinessChecked, skippedSteps, setStepSkipped } = useCandidateProfile();
  const completed = {
    resume: Boolean(profile),
    profile: profileReviewed,
    interview: interviewCompleted,
    sprint: badges.some((badge) => badge.assessments.includes("skill_proof_sprint")),
    readiness: readinessChecked,
  };
  const completedCount = Object.values(completed).filter(Boolean).length;
  const skippedCount = skippedSteps.filter((key) => key in completed && !completed[key as keyof typeof completed]).length;
  const processedCount = completedCount + skippedCount;

  return <main className="mx-auto max-w-5xl space-y-7 px-5 py-8 sm:px-8 sm:py-10">
    <header>
      <p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#246b5d]"><Zap className="h-3.5 w-3.5" /> Guided profile builder</p>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">Check where you stand</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Build a clear candidate profile, add assessment-earned skill badges, and optionally check how you match a job. Skip any step that isn’t useful right now.</p>
    </header>

    <Card className="flex flex-wrap items-center justify-between gap-4 border-[#dbe9dd] bg-[#f3f8f1] p-5">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#246b5d]"><CheckCircle2 className="h-5 w-5" /></span><div><p className="font-semibold text-[#26354b]">Your progress</p><p className="text-sm text-slate-600">{completedCount} complete{skippedCount ? ` · ${skippedCount} skipped` : ""}{profile ? " · profile ready for this session" : " · start by parsing your resume"}</p></div></div>
      <div className="h-2 min-w-36 flex-1 overflow-hidden rounded-full bg-white sm:max-w-52"><div className="h-full rounded-full bg-[#246b5d] transition-all" style={{ width: `${processedCount / steps.length * 100}%` }} /></div>
    </Card>

    <section aria-label="Profile building checklist" className="space-y-3">
      {steps.map(({ key, title, description, to, icon: Icon, required }) => {
        const done = completed[key as keyof typeof completed];
        const locked = !profile && key !== "resume";
        const skipped = !done && skippedSteps.includes(key);
        return <Card key={key} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6 ${locked ? "opacity-75" : ""}`}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${done ? "bg-[#e4f2e9] text-[#246b5d]" : "bg-[#faf7f0] text-[#679586]"}`}>{done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-heading text-lg font-semibold text-[#26354b]">{title}</h2>{required && <Badge variant="outline">Profile setup</Badge>}{done && <Badge className="bg-[#246b5d] text-white">Complete</Badge>}{skipped && <Badge variant="outline">Skipped</Badge>}{!done && !required && !skipped && <Badge variant="outline">Optional</Badge>}</div><p className="mt-1 text-sm leading-5 text-slate-600">{description}</p></div>
          {locked ? <span className="text-sm text-slate-500">Build your profile first</span> : <div className="flex shrink-0 items-center gap-1.5"><Button asChild variant={done || skipped ? "outline" : "default"} className="min-h-10"><Link to={to} state={key === "profile" ? { fromGuidedWorkflow: true } : undefined} onClick={() => skipped && setStepSkipped(key, false)}>{done ? "Open" : skipped ? "Do this step" : "Start"}<ArrowRight className="h-4 w-4" /></Link></Button>{!required && !done && !skipped && <Button type="button" variant="ghost" onClick={() => setStepSkipped(key, true)} className="min-h-10 px-3 text-slate-600">Skip</Button>}</div>}
        </Card>;
      })}
    </section>

    <p className="flex items-start gap-2 rounded-xl border border-[#e9e1d5] bg-white/80 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#246b5d]" />Your profile and badges stay in this tab session. Closing the tab clears them. Job-specific gaps appear only in the results for that job.</p>
  </main>;
}
