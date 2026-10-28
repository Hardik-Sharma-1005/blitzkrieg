import { Suspense, lazy, useState } from "react";
import { Menu } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { CompanyProvider } from "@/lib/companyContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, ThemeProvider, useSidebar, useTheme } from "@/components/layout/SidebarContext";
import { InteractiveCosmos } from "@/components/InteractiveCosmos";
import { CandidateProfileProvider } from "@/lib/candidateProfile";

const Index = lazy(() => import("@/pages/Index").then(({ Index }) => ({ default: Index })));
const CompanyDirectory = lazy(() => import("@/pages/CompanyDirectory").then(({ CompanyDirectory }) => ({ default: CompanyDirectory })));
const CompanyIntelligence = lazy(() => import("@/pages/CompanyIntelligence").then(({ CompanyIntelligence }) => ({ default: CompanyIntelligence })));
const SkillIntelligence = lazy(() => import("@/pages/SkillIntelligence").then(({ SkillIntelligence }) => ({ default: SkillIntelligence })));
const CompanyComparison = lazy(() => import("@/pages/CompanyComparison").then(({ CompanyComparison }) => ({ default: CompanyComparison })));
const NotFound = lazy(() => import("@/pages/NotFound").then(({ NotFound }) => ({ default: NotFound })));
const JDAnalytics = lazy(() => import("@/pages/JDAnalytics").then(({ JDAnalytics }) => ({ default: JDAnalytics })));
const ResumeProfile = lazy(() => import("@/pages/ResumeProfile").then(({ ResumeProfile }) => ({ default: ResumeProfile })));
const SkillMatch = lazy(() => import("@/pages/SkillMatch").then(({ SkillMatch }) => ({ default: SkillMatch })));
const CandidateProfile = lazy(() => import("@/pages/CandidateProfile").then(({ CandidateProfile }) => ({ default: CandidateProfile })));
const CheckWhereYouStand = lazy(() => import("@/pages/CheckWhereYouStand").then(({ CheckWhereYouStand }) => ({ default: CheckWhereYouStand })));
const CandidateAssessments = lazy(() => import("@/pages/CandidateAssessments").then(({ CandidateAssessments }) => ({ default: CandidateAssessments })));
const JobReadiness = lazy(() => import("@/pages/JobReadiness").then(({ JobReadiness }) => ({ default: JobReadiness })));
const History = lazy(() => import("@/pages/History").then(({ History }) => ({ default: History })));

function AppShell() {
  const { theme } = useTheme();
  const { setMobileOpen, collapsed } = useSidebar();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  return <div className={`app-shell relative isolate min-h-screen lg:flex ${theme === "light" ? "theme-light" : ""}`}>
    {!isHome && <InteractiveCosmos variant="starfield" tone={theme} particlesOnly className="fixed inset-0 pointer-events-none z-0" />}
    <AppSidebar homeOverlay={isHome} />
    {isHome ? <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className={`fixed left-4 top-4 z-40 rounded-xl border p-3 shadow-lg backdrop-blur-md ${theme === "light" ? "border-black/10 bg-white/85 text-black" : "border-white/20 bg-slate-950/75 text-white"}`}><Menu className="h-5 w-5" /></button>
      : <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className={`fixed bottom-4 left-4 z-30 rounded-full border px-4 py-3 text-sm font-semibold shadow-lg lg:hidden ${theme === "light" ? "border-black/10 bg-white text-black" : "border-slate-500/30 bg-slate-900 text-white"}`}><Menu className="mr-2 inline h-4 w-4" />Menu</button>}
    <div className={`app-route-content relative z-10 flex min-h-screen min-w-0 flex-1 flex-col ${isHome ? "" : collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"}`}>
      <div className="flex-1">
        <Suspense fallback={
          <div className="grid min-h-[70vh] place-items-center p-8">
            <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl border border-[#e9e1d5] bg-white/95 p-8 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#246b5d] border-t-transparent" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Loading portal…</span>
              <span className="text-xs text-slate-500">Preparing career intelligence workspace…</span>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/companies" element={<CompanyDirectory />} />
            <Route path="/jd-analytics" element={<JDAnalytics />} />
            <Route path="/resume-profile" element={<ResumeProfile />} />
            <Route path="/talent-check" element={<ResumeProfile />} />
            <Route path="/skill-match" element={<SkillMatch />} />
            <Route path="/candidate-profile" element={<CandidateProfile />} />
            <Route path="/check-where-you-stand" element={<CheckWhereYouStand />} />
            <Route path="/candidate-assessments" element={<CandidateAssessments />} />
            <Route path="/job-readiness" element={<JobReadiness />} />
            <Route path="/history" element={<History />} />
            <Route path="/company" element={<AppLayout />}>
              <Route index element={<Navigate to="intelligence" replace />} />
              <Route path="intelligence" element={<CompanyIntelligence />} />
              <Route path="skills" element={<SkillIntelligence />} />
              <Route path="compare" element={<CompanyComparison />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      <AppFooter />
    </div>
  </div>;
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 1, refetchOnWindowFocus: false } },
  }));
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider><SonnerToaster position="top-right" richColors />
      <CompanyProvider><CandidateProfileProvider><BrowserRouter><ThemeProvider><SidebarProvider><AppShell /></SidebarProvider></ThemeProvider></BrowserRouter></CandidateProfileProvider></CompanyProvider>
    </TooltipProvider>
  </QueryClientProvider>;
}
