import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CompanySummary } from "@/lib/companyData";

const STORAGE_KEY = "selected-company";
const COMPARISON_STORAGE_KEY = "company-comparison";
const MAX_COMPARISON_COMPANIES = 3;

export interface SelectedCompany {
  companyId: number;
  companyName: string;
  logoUrl: string;
}

interface CompanyContextValue {
  selectedCompany: SelectedCompany | null;
  compareCompanyIds: number[];
  selectCompany: (company: CompanySummary) => void;
  toggleCompareCompany: (company: CompanySummary) => void;
  clearComparison: () => void;
  clearCompany: () => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

function readStoredSelection(): SelectedCompany | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SelectedCompany>;
    const companyId = Number(parsed.companyId);
    if (!Number.isFinite(companyId)) return null;
    return {
      companyId,
      companyName: typeof parsed.companyName === "string" ? parsed.companyName : "Company",
      logoUrl: typeof parsed.logoUrl === "string" ? parsed.logoUrl : "",
    };
  } catch {
    return null;
  }
}

function readStoredComparison(): number[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(COMPARISON_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map(Number).filter((id) => Number.isFinite(id) && id > 0))].slice(0, MAX_COMPARISON_COMPANIES);
  } catch {
    return [];
  }
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<SelectedCompany | null>(readStoredSelection);
  const [compareCompanyIds, setCompareCompanyIds] = useState<number[]>(readStoredComparison);
  const selectCompany = useCallback((summary: CompanySummary) => {
    const selection = {
      companyId: summary.companyId,
      companyName: summary.name,
      logoUrl: summary.logoUrl,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch {
      // The current page still works if browser storage is unavailable.
    }
    setSelectedCompany(selection);
  }, []);

  const clearCompany = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Clearing selection in memory is still useful if storage is unavailable.
    }
    setSelectedCompany(null);
  }, []);

  const toggleCompareCompany = useCallback((company: CompanySummary) => {
    setCompareCompanyIds((current) => {
      const next = current.includes(company.companyId)
        ? current.filter((id) => id !== company.companyId)
        : current.length < MAX_COMPARISON_COMPANIES
          ? [...current, company.companyId]
          : current;
      try {
        localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The current page still works if browser storage is unavailable.
      }
      return next;
    });
  }, []);

  const clearComparison = useCallback(() => {
    try {
      localStorage.removeItem(COMPARISON_STORAGE_KEY);
    } catch {
      // Clearing selection in memory is still useful if browser storage is unavailable.
    }
    setCompareCompanyIds([]);
  }, []);

  const value = useMemo(
    () => ({ selectedCompany, compareCompanyIds, selectCompany, toggleCompareCompany, clearComparison, clearCompany }),
    [selectedCompany, compareCompanyIds, selectCompany, toggleCompareCompany, clearComparison, clearCompany],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const value = useContext(CompanyContext);
  if (!value) throw new Error("useCompany must be used inside CompanyProvider");
  return value;
}
