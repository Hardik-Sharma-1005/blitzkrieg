import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, FileSearch, GitCompareArrows, GraduationCap, Moon, PanelLeftClose, PanelLeftOpen, Sparkles, Sun, X } from "lucide-react";
import { useSidebar, useTheme } from "@/components/layout/SidebarContext";

const links = [
  { to: "/company/intelligence", label: "Company Intelligence", icon: Building2 },
  { to: "/company/skills", label: "Skill Intelligence", icon: GraduationCap },
  { to: "/company/compare", label: "Compare Companies", icon: GitCompareArrows },
  { to: "/jd-analytics", label: "Analyze a JD", icon: FileSearch },
  { to: "/skill-match", label: "Match resume to a job", icon: GitCompareArrows },
  { to: "/talent-check", label: "Talent Check", icon: Sparkles },
];

export function AppSidebar({ homeOverlay = false }: { homeOverlay?: boolean }) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <>
      {mobileOpen && (!homeOverlay ? <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setMobileOpen(false)} /> : <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />)}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[#e5e9e5] bg-[#f2f5f1] transition-all duration-200 ${homeOverlay ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : (mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")} ${collapsed ? "lg:w-[76px]" : "lg:w-[260px]"}`}>
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e5e9e5] px-3">
          <button type="button" onClick={() => navigate("/")} className={`flex min-w-0 items-center gap-3 overflow-hidden text-left ${collapsed ? "lg:justify-center" : ""}`} aria-label="blitzkrieg! home">
            <img src="/jss-university-logo.png" alt="" className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1" />
            <span className={collapsed ? "lg:hidden" : ""}>
              <span className="block font-heading text-sm font-semibold text-slate-900">blitzkrieg!</span>
              <span className="block text-xs text-slate-500">JSS University, Noida</span>
            </span>
          </button>
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></button>
          <button type="button" className="hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:block" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
          <p className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 ${collapsed ? "lg:hidden" : ""}`}>Explore</p>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? "lg:justify-center lg:px-2" : ""} ${isActive ? "bg-white text-[#176d55] shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`}>
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto shrink-0 border-t border-[#e6dfd2] p-3">
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={collapsed ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : undefined} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900 ${collapsed ? "lg:justify-center lg:px-2" : ""}`}>
            {theme === "dark" ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}<span className={collapsed ? "lg:hidden" : ""}>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <button type="button" onClick={() => navigate("/")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900 ${collapsed ? "lg:justify-center lg:px-2" : ""}`} title={collapsed ? "All Companies" : undefined}>
            <ArrowLeft className="h-[18px] w-[18px] shrink-0" /><span className={collapsed ? "lg:hidden" : ""}>All Companies</span>
          </button>
        </div>
      </aside>
    </>
  );
}
