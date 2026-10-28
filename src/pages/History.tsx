import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock3, FileText, History as HistoryIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatActivityTime, getRecentActivities, recentActivityEventName, type RecentActivity } from "@/lib/recentActivity";

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
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#216b5c]"><ArrowLeft className="h-4 w-4" /> Back</button>
        <BrandLogo className="h-auto w-32" />
      </div>
    </header>

    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]"><HistoryIcon className="h-3.5 w-3.5" /> RECENT ACTIVITY</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">Your recent work.</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Jump back into a recent profile, job analysis, or comparison. Your five latest processed items are kept for this browser session.</p>
      </div>

      {activities.length === 0 ? <Card className="mt-8 flex flex-col items-center px-6 py-12 text-center sm:py-16">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f2e9] text-[#246b5d]"><Clock3 className="h-7 w-7" /></span>
        <h2 className="mt-5 font-heading text-xl font-semibold text-[#26354b]">No recent activity yet</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Once you process a resume or job description, it will appear here so you can return to the result.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("/resume-profile")} className="min-h-11">Build a resume profile <ArrowRight className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => navigate("/jd-analytics")} className="min-h-11">Analyze a job description <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </Card> : <section className="mt-8 space-y-3" aria-label="Recent processed items">
        {activities.map((activity, index) => <Card key={activity.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f3f8f1] text-[#246b5d]"><FileText className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{activity.title}</p>
              <p className="mt-1 text-sm text-slate-600">{activity.action}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{formatActivityTime(activity.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:shrink-0">
            <span className="text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
            <Button type="button" variant="outline" onClick={() => openActivity(activity)} className="min-h-10">Open result <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </Card>)}
      </section>}
    </main>
  </div>;
}
