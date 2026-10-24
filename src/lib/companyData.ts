export type JsonRecord = Record<string, unknown>;

export interface CompanySummary {
  companyId: number;
  name: string;
  shortName: string;
  logoUrl: string;
  category: string;
  headquarters: string;
  employeeSize: string;
  growthRate: string;
  websiteUrl: string;
  raw: JsonRecord;
}

export interface CompanyProfile {
  companyId: number;
  name: string;
  shortName: string;
  logoUrl: string;
  category: string;
  websiteUrl: string;
  linkedinUrl: string;
  raw: JsonRecord;
}

export interface DashboardSkill {
  id: number;
  name: string;
  requiredLevel: number;
  requiredProficiency: string;
}

export interface CompanyDataProvenance {
  sourceLabel: string;
  sourceUrl: string;
  freshnessLabel: string;
  isIllustrative: boolean;
}

export function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

export function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(asString).filter(Boolean).join("; ");
  return "";
}

export function splitItems(value: unknown): string[] {
  const text = asString(value);
  if (!text) return [];
  return text
    .split(/[\n;•·]+|\s+\|\s+/g)
    .map((item) => item.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
}

export function titleCaseFromCode(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function scoreToDifficulty(score: number): "EXPERT" | "ADVANCED" | "PRO" | "BEGINNER" {
  if (score >= 8) return "EXPERT";
  if (score >= 6) return "ADVANCED";
  if (score >= 4) return "PRO";
  return "BEGINNER";
}

export function normalizeCompanySummary(shortJson: unknown): CompanySummary {
  const raw = asRecord(shortJson);
  return {
    companyId: Number(raw.company_id ?? 0),
    name: asString(raw.name) || "Company",
    shortName: asString(raw.short_name) || asString(raw.name) || "Company",
    logoUrl: asString(raw.logo_url),
    category: asString(raw.category),
    headquarters: asString(raw.headquarters_address),
    employeeSize: asString(raw.employee_size),
    growthRate: asString(raw.yoy_growth_rate),
    websiteUrl: asString(raw.website_url),
    raw,
  };
}

export function normalizeCompanyProfile(
  fullJson: unknown,
  shortJson: unknown,
): CompanyProfile {
  const short = asRecord(shortJson);
  const full = asRecord(fullJson);
  const raw = { ...short, ...full };
  return {
    companyId: Number(raw.company_id ?? short.company_id ?? 0),
    name: asString(raw.name) || "Company",
    shortName: asString(raw.short_name) || asString(raw.name) || "Company",
    logoUrl: asString(raw.logo_url),
    category: asString(raw.category),
    websiteUrl: asString(raw.website_url),
    linkedinUrl: asString(raw.linkedin_url),
    raw,
  };
}

export function normalizeDashboardSkills(skillLevels: unknown[]): DashboardSkill[] {
  return skillLevels
    .map((item) => asRecord(item))
    .map((skill) => ({
      id: Number(skill.skill_set_id ?? skill.id ?? 0),
      name: asString(skill.skill_set_name ?? skill.name) || "Skill",
      requiredLevel: Math.min(10, Math.max(1, Number(skill.required_level ?? 1))),
      requiredProficiency: asString(skill.required_proficiency ?? skill.proficiency_name),
    }))
    .sort((a, b) => b.requiredLevel - a.requiredLevel || a.name.localeCompare(b.name));
}

export function getCompanyDataProvenance(
  rawValue: unknown,
  origin: "demo" | "supabase",
): CompanyDataProvenance {
  const raw = asRecord(rawValue);
  const status = asString(raw.data_status).toLowerCase();
  const isIllustrative = status === "illustrative";
  const sourceLabel = asString(raw.data_source_label ?? raw.source_name ?? raw.data_source)
    || (origin === "demo" ? "Bundled sample profile" : "Source not supplied");
  const sourceCandidate = asString(raw.data_source_url ?? raw.source_url ?? raw.source_link);
  const sourceUrl = /^https?:\/\//i.test(sourceCandidate) ? sourceCandidate : "";
  const freshnessLabel = asString(
    raw.data_as_of ?? raw.last_verified_at ?? raw.data_updated_at ?? raw.last_updated_at ?? raw.updated_at,
  ) || (origin === "demo" ? "Not verified" : "Date not supplied");

  return { sourceLabel, sourceUrl, freshnessLabel, isIllustrative };
}
