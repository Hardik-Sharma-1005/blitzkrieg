import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/layout/SidebarContext";
import { useCompany } from "@/lib/companyContext";

function LayoutContent() {
  const { selectedCompany } = useCompany();
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const isComparePage = pathname === "/company/compare";
  if (!selectedCompany && !isComparePage) return <Navigate to="/companies" replace />;
  return (
    <div className={`space-theme space-theme-shell relative isolate min-h-screen bg-transparent ${theme === "light" ? "theme-light" : ""}`}>
      <div className="relative z-10">
        <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-[#e5e9e5] bg-white/95 px-4 backdrop-blur sm:px-6">
          <Link
            to="/companies"
            className="brand-accent-control inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:text-sm"
            aria-label="Return to company directory"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Company Directory</span>
          </Link>
        </header>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return <LayoutContent />;
}
