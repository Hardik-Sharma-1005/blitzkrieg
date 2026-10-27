import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { InteractiveCosmos } from "@/components/InteractiveCosmos";
import { useTheme } from "@/components/layout/SidebarContext";
import { useCompany } from "@/lib/companyContext";

function LayoutContent() {
  const { selectedCompany } = useCompany();
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const isComparePage = pathname === "/company/compare";
  if (!selectedCompany && !isComparePage) return <Navigate to="/" replace />;
  return (
    <div className={`space-theme space-theme-shell relative isolate min-h-screen bg-[#f8f8f5] ${theme === "light" ? "theme-light" : ""}`}>
      <InteractiveCosmos variant="starfield" tone={theme} particlesOnly className="z-0" />
      <div className="relative z-10">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-[#e5e9e5] bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <BrandLogo className="mb-1 h-auto w-[118px]" />
            <p className="truncate text-sm font-semibold text-slate-800">{isComparePage ? "Company comparison" : selectedCompany?.companyName}</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
            <Link to="/companies" className="brand-accent-control inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-3 sm:text-sm" aria-label="Return to company directory">
              <ArrowLeft className="h-4 w-4" />
              <span>Company directory</span>
            </Link>
          </div>
        </header>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return <LayoutContent />;
}
