import { Suspense, lazy, useState } from "react";
import { Menu } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { CompanyProvider } from "@/lib/companyContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, ThemeProvider, useSidebar, useTheme } from "@/components/layout/SidebarContext";
import { InteractiveCosmos } from "@/components/InteractiveCosmos";

const Index = lazy(() => import("@/pages/Index").then(({ Index }) => ({ default: Index })));
const CompanyDirectory = lazy(() => import("@/pages/CompanyDirectory").then(({ CompanyDirectory }) => ({ default: CompanyDirectory })));
const CompanyIntelligence = lazy(() => import("@/pages/CompanyIntelligence").then(({ CompanyIntelligence }) => ({ default: CompanyIntelligence })));
const SkillIntelligence = lazy(() => import("@/pages/SkillIntelligence").then(({ SkillIntelligence }) => ({ default: SkillIntelligence })));
const CompanyComparison = lazy(() => import("@/pages/CompanyComparison").then(({ CompanyComparison }) => ({ default: CompanyComparison })));
const NotFound = lazy(() => import("@/pages/NotFound").then(({ NotFound }) => ({ default: NotFound })));
const JDAnalytics = lazy(() => import("@/pages/JDAnalytics").then(({ JDAnalytics }) => ({ default: JDAnalytics })));
const ResumeProfile = lazy(() => import("@/pages/ResumeProfile").then(({ ResumeProfile }) => ({ default: ResumeProfile })));
const SkillMatch = lazy(() => import("@/pages/SkillMatch").then(({ SkillMatch }) => ({ default: SkillMatch })));

function AppShell() {
  const { theme } = useTheme();
  const { setMobileOpen, collapsed } = useSidebar();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  return <div className={`app-shell relative isolate min-h-screen lg:flex ${theme === "light" ? "theme-light" : ""}`}>
    {!isHome && !pathname.startsWith("/company") && <InteractiveCosmos variant="starfield" tone={theme} particlesOnly className="z-0" />}
    <AppSidebar homeOverlay={isHome} />
    {isHome ? <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className={`fixed left-4 top-4 z-40 rounded-xl border p-3 shadow-lg backdrop-blur-md ${theme === "light" ? "border-black/10 bg-white/85 text-black" : "border-white/20 bg-slate-950/75 text-white"}`}><Menu className="h-5 w-5" /></button>
      : <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className={`fixed bottom-4 left-4 z-30 rounded-full border px-4 py-3 text-sm font-semibold shadow-lg lg:hidden ${theme === "light" ? "border-black/10 bg-white text-black" : "border-slate-500/30 bg-slate-900 text-white"}`}><Menu className="mr-2 inline h-4 w-4" />Menu</button>}
    <div className={`app-route-content relative z-10 min-w-0 flex-1 ${isHome ? "" : collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"}`}>
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading portal…</div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/companies" element={<CompanyDirectory />} />
          <Route path="/jd-analytics" element={<JDAnalytics />} />
          <Route path="/resume-profile" element={<ResumeProfile />} />
          <Route path="/talent-check" element={<ResumeProfile />} />
          <Route path="/skill-match" element={<SkillMatch />} />
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
  </div>;
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 1, refetchOnWindowFocus: false } },
  }));
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider><SonnerToaster position="top-right" richColors />
      <CompanyProvider><BrowserRouter><ThemeProvider><SidebarProvider><AppShell /></SidebarProvider></ThemeProvider></BrowserRouter></CompanyProvider>
    </TooltipProvider>
  </QueryClientProvider>;
}
