import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/SidebarContext";
import { useCompany } from "@/lib/companyContext";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

function LayoutContent() {
  const { selectedCompany } = useCompany();
  const { setMobileOpen } = useSidebar();
  const { pathname } = useLocation();
  const isComparePage = pathname === "/company/compare";
  if (!selectedCompany && !isComparePage) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-[#fbf8f1] lg:flex">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-[#e8e0d2] bg-[#fffdf8]/95 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">blitzkrieg!</p>
            <p className="truncate text-sm font-semibold text-slate-800">{isComparePage ? "Company comparison" : selectedCompany?.companyName}</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
            <Link to="/" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:px-3 sm:text-sm" aria-label="Return to all companies">
              <ArrowLeft className="h-4 w-4" />
              <span className="sm:hidden">Companies</span>
              <span className="hidden sm:inline">All companies</span>
            </Link>
            <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
              <span className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-400"}`} />
              {isSupabaseConfigured ? "Supabase configured" : "Demo dataset"}
            </div>
          </div>
        </header>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return <SidebarProvider><LayoutContent /></SidebarProvider>;
}
