import { NavLink, useNavigate } from "react-router-dom";
import { Building2, FileSearch, GitCompareArrows, GraduationCap, History, Moon, PanelLeftClose, PanelLeftOpen, Sparkles, Sun, UserRound, X, Zap } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useSidebar, useTheme } from "@/components/layout/SidebarContext";

const links = [
  { to: "/candidate-profile", label: "Candidate Profile", icon: UserRound },
  { to: "/check-where-you-stand", label: "Check where you stand", icon: Zap },
  { to: "/companies", label: "Company Directory", icon: Building2 },
  { to: "/company/intelligence", label: "Company Intelligence", icon: Building2 },
  { to: "/company/skills", label: "Skill Intelligence", icon: GraduationCap },
  { to: "/company/compare", label: "Compare Companies", icon: GitCompareArrows },
  { to: "/jd-analytics", label: "Analyze a JD", icon: FileSearch },
  { to: "/talent-check", label: "Talent Check", icon: Sparkles },
  { to: "/skill-match", label: "Match resume to a job", icon: GitCompareArrows },
  { to: "/history", label: "History", icon: History },
];

export function AppSidebar({ homeOverlay = false }: { homeOverlay?: boolean }) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <>
      {mobileOpen && (!homeOverlay ? <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setMobileOpen(false)} /> : <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />)}
      <aside className={`brand-sidebar fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[#e5e9e5] bg-[#f2f5f1] ${homeOverlay ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : (mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")} ${collapsed ? "lg:w-[76px]" : "lg:w-[260px]"}`}>
        <div className="brand-sidebar-header flex h-[72px] shrink-0 items-center justify-between border-b border-[#e5e9e5] px-3" data-collapsed={collapsed}>
          <button type="button" onClick={() => navigate("/")} className="brand-sidebar-home flex min-w-0 flex-1 flex-col items-start overflow-hidden text-left" aria-label="blitzkrieg home" data-collapsed={collapsed}>
            <span className="brand-sidebar-logo" data-collapsed={collapsed}>
              <BrandLogo className="brand-sidebar-wordmark" />
              <BrandLogo markOnly className="brand-sidebar-bolt" />
            </span>
            <span className="brand-sidebar-caption mt-1 block text-xs font-semibold tracking-[0.04em] text-[#9A5A82] dark:text-[#D99CC5]" data-collapsed={collapsed}>Career Intelligence</span>
          </button>
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></button>
          <button type="button" className={`brand-sidebar-toggle hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:block ${collapsed ? "is-collapsed" : ""}`} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
          <p className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 ${collapsed ? "lg:hidden" : ""}`}>Explore</p>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${label === "Check where you stand" ? "check-stand-link" : ""} ${collapsed ? "lg:justify-center lg:px-2" : ""} ${isActive ? "bg-white text-[#176d55] shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`}>
              <span className={label === "Check where you stand" ? "check-stand-bolt" : "inline-flex shrink-0"}><Icon className="h-[18px] w-[18px] shrink-0" /></span>
              <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto shrink-0 border-t border-[#e6dfd2] p-3">
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={collapsed ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : undefined} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900 ${collapsed ? "lg:justify-center lg:px-2" : ""}`}>
            {theme === "dark" ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}<span className={collapsed ? "lg:hidden" : ""}>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
