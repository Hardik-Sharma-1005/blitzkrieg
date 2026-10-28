import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/components/layout/SidebarContext";
import { useCompany } from "@/lib/companyContext";

function LayoutContent() {
  const { selectedCompany } = useCompany();
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const isComparePage = pathname === "/company/compare";
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
        <main className="min-w-0">{!selectedCompany && !isComparePage ? (
          <section className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-5 py-12 sm:px-8">
            <Card className="w-full p-7 text-center sm:p-10">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f2e9] text-[#246b5d]"><Building2 className="h-6 w-6" /></span>
              <h1 className="mt-5 font-heading text-2xl font-semibold text-[#26354b]">Choose a company first</h1>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Company Intelligence and Skill Intelligence show one employer at a time. Choose a company from the directory and you’ll return to this page.</p>
              <Button asChild className="mt-6 min-h-11"><Link to="/companies" state={{ returnTo: pathname }}>Open Company Directory</Link></Button>
            </Card>
          </section>
        ) : <Outlet />}</main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return <LayoutContent />;
}
