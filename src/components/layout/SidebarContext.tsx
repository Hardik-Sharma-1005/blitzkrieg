import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light";
interface ThemeValue { theme: ThemeMode; setTheme: (value: ThemeMode) => void; }
const ThemeContext = createContext<ThemeValue | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => { try { return window.localStorage.getItem("blitzkrieg-theme") === "light" ? "light" : "dark"; } catch { return "dark"; } });
  useEffect(() => { document.documentElement.dataset.theme = theme; try { window.localStorage.setItem("blitzkrieg-theme", theme); } catch { /* Storage may be unavailable. */ } }, [theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error("useTheme must be used inside ThemeProvider"); return value; }

interface SidebarValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const value = useMemo(() => ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }), [collapsed, mobileOpen]);
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const value = useContext(SidebarContext);
  if (!value) throw new Error("useSidebar must be used inside SidebarProvider");
  return value;
}
