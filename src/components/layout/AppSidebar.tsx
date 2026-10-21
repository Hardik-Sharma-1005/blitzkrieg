import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, GitCompareArrows, GraduationCap, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarContext";

const links = [
  { to: "/company/intelligence", label: "Company Intelligence", icon: Building2 },
  { to: "/company/skills", label: "Skill Intelligence", icon: GraduationCap },
  { to: "/company/compare", label: "Compare Companies", icon: GitCompareArrows },
];

export function AppSidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const navigate = useNavigate();

  return (
    <>
      {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[#e6dfd2] bg-[#f5f0e6] transition-all duration-200 lg:static lg:z-auto ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${collapsed ? "lg:w-[76px]" : "lg:w-[260px]"}`}>
        <div className="flex h-[72px] items-center justify-between border-b border-[#e6dfd2] px-4">
          <button type="button" onClick={() => navigate("/")} className={`flex items-center gap-3 overflow-hidden text-left ${collapsed ? "lg:justify-center" : ""}`}>
            <img src="/jss-university-logo.png" alt="JSS University, Noida" className="h-11 w-11 shrink-0 rounded-xl object-contain" />
            <span className={`${collapsed ? "lg:hidden" : ""}`}><span className="block font-heading text-sm font-semibold text-slate-900">JSS University</span><span className="block text-xs text-slate-500">Student Career Hub</span></span>
          </button>
          <button type="button" className="hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:block" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Main navigation">
          <p className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 ${collapsed ? "lg:hidden" : ""}`}>Explore</p>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? "lg:justify-center lg:px-2" : ""} ${isActive ? "bg-white text-[#246b5d] shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`}>
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#e6dfd2] p-3">
          <button type="button" onClick={() => navigate("/")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900 ${collapsed ? "lg:justify-center lg:px-2" : ""}`} title={collapsed ? "All Companies" : undefined}>
            <ArrowLeft className="h-[18px] w-[18px] shrink-0" /><span className={collapsed ? "lg:hidden" : ""}>All Companies</span>
          </button>
        </div>
      </aside>
    </>
  );
}
