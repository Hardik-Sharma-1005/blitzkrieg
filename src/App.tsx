import { Suspense, lazy, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { CompanyProvider } from "@/lib/companyContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";

const Index = lazy(() => import("@/pages/Index").then(({ Index }) => ({ default: Index })));
const CompanyIntelligence = lazy(() => import("@/pages/CompanyIntelligence").then(({ CompanyIntelligence }) => ({ default: CompanyIntelligence })));
const SkillIntelligence = lazy(() => import("@/pages/SkillIntelligence").then(({ SkillIntelligence }) => ({ default: SkillIntelligence })));
const CompanyComparison = lazy(() => import("@/pages/CompanyComparison").then(({ CompanyComparison }) => ({ default: CompanyComparison })));
const NotFound = lazy(() => import("@/pages/NotFound").then(({ NotFound }) => ({ default: NotFound })));
const JDAnalytics = lazy(() => import("@/pages/JDAnalytics").then(({ JDAnalytics }) => ({ default: JDAnalytics })));

export default function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 1, refetchOnWindowFocus: false },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SonnerToaster position="top-right" richColors />
        <CompanyProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading portal…</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/jd-analytics" element={<JDAnalytics />} />
                <Route path="/company" element={<AppLayout />}>
                  <Route index element={<Navigate to="intelligence" replace />} />
                  <Route path="intelligence" element={<CompanyIntelligence />} />
                  <Route path="skills" element={<SkillIntelligence />} />
                  <Route path="compare" element={<CompanyComparison />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CompanyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
