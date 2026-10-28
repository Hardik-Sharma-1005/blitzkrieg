import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight, Award, BriefcaseBusiness, Building2, FileText, GitCompareArrows, History as HistoryIcon, Trash2, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearRecentActivities, formatActivityTime, getRecentActivities, recentActivityEventName, removeRecentActivity, type ActivityFeature, type RecentActivity } from "@/lib/recentActivity";

const featureDetails: Record<ActivityFeature, { label: string; icon: typeof Activity }> = {
  resume: { label: "Resume", icon: FileText },
  profile: { label: "Candidate profile", icon: UserRound },
  "job-description": { label: "Job description", icon: FileText },
  "job-match": { label: "Resume to job", icon: GitCompareArrows },
  "talent-check": { label: "Talent Check", icon: BriefcaseBusiness },
  assessment: { label: "Assessment", icon: Award },
  readiness: { label: "Job readiness", icon: Activity },
  "company-comparison": { label: "Company comparison", icon: GitCompareArrows },
  "company-intelligence": { label: "Company intelligence", icon: Building2 },
  "skill-intelligence": { label: "Skill intelligence", icon: Award },
};

export function History() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<RecentActivity[]>(getRecentActivities);

  useEffect(() => {
    const refresh = () => setActivities(getRecentActivities());
    window.addEventListener(recentActivityEventName(), refresh);
    return () => window.removeEventListener(recentActivityEventName(), refresh);
  }, []);

  const openActivity = (activity: RecentActivity) => {
    navigate(activity.path, { state: { recentActivityId: activity.id } });
  };

  return <div className="space-theme min-h-screen bg-transparent">
    <header className="border-b border-[#e9e1d5] bg-[#fffdf8]">
      <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-5 sm:px-8">
        <button type="button" onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#216b5c]"><ArrowLeft className="h-4 w-4" /> Back to blitzkrieg</button>
        <BrandLogo className="h-auto w-32" />
      </div>
    </header>

    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]"><HistoryIcon className="h-3.5 w-3.5" /> Recent activity</p>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">Your recent work.</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Feature actions appear here as you use the platform. This activity is kept only for this tab session and clears when you close the tab.</p>
        </div>
        {activities.length > 0 && <Button type="button" variant="outline" onClick={() => { if (window.confirm("Clear all recent activity from this tab session?")) clearRecentActivities(); }} className="min-h-10"><Trash2 className="h-4 w-4" /> Clear history</Button>}
      </div>

      {activities.length === 0 ? <Card className="mt-8 flex flex-col items-center px-6 py-12 text-center sm:py-16">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f2e9] text-[#246b5d]"><Activity className="h-7 w-7" /></span>
        <h2 className="mt-5 font-heading text-xl font-semibold text-[#26354b]">No recent activity yet</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Company research, parsing, profile building, ratings, assessments, matching, and comparisons will appear here when you use them.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("/check-where-you-stand")} className="min-h-11">Build your profile <ArrowRight className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => navigate("/jd-analytics")} className="min-h-11">Analyze a job description <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </Card> : <section className="mt-8 space-y-3" aria-label="Recent platform activity">
        {activities.map((activity, index) => {
          const details = featureDetails[activity.feature];
          const Icon = details.icon;
          return <Card key={activity.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f3f8f1] text-[#246b5d]"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="truncate font-semibold text-slate-900">{activity.title}</p><span className="rounded-full bg-[#faf7f0] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{details.label}</span></div>
                <p className="mt-1 text-sm text-slate-600">{activity.action}</p>
                <p className="mt-2 text-xs text-slate-500">{formatActivityTime(activity.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              <span className="mr-1 text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
              <Button type="button" variant="outline" onClick={() => openActivity(activity)} className="min-h-10">{activity.hasSnapshot ? "Open activity" : "Open feature"}<ArrowRight className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" onClick={() => removeRecentActivity(activity.id)} aria-label={`Remove ${activity.title} from history`} title="Remove from history" className="min-h-10 min-w-10 px-2"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>;
        })}
      </section>}
    </main>
  </div>;
}
