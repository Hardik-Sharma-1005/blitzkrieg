import { memo } from "react";
import { ArrowRight, Check, MapPin, Plus, TrendingDown, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import type { CompanySummary } from "@/lib/companyData";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function isNullish(value: string) {
  return !value || /^(na|n\/a|none|null|undefined|-)$/i.test(value.trim());
}

function DisplayValue({ value }: { value: string }) {
  return isNullish(value)
    ? <span className="text-sm italic text-slate-400">Not listed</span>
    : <span className="truncate">{value}</span>;
}

export const CompanyCard = memo(function CompanyCard({
  company,
  onOpen,
  isCompared,
  onToggleCompare,
  compareLimitReached,
}: {
  company: CompanySummary;
  onOpen: () => void;
  isCompared: boolean;
  onToggleCompare: () => void;
  compareLimitReached: boolean;
}) {
  const negativeGrowth = company.growthRate.trim().startsWith("-");
  const compareDisabled = compareLimitReached && !isCompared;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="group flex h-full min-h-[278px] flex-col overflow-hidden border-[#e9e1d5] bg-[#fffdf8] p-5 shadow-[0_8px_25px_rgba(69,54,28,0.035)] transition-shadow hover:shadow-[0_16px_36px_rgba(69,54,28,0.10)]">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onOpen} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2" aria-label={`Open ${company.name} profile`}>
            <CompanyLogo name={company.name} logoUrl={company.logoUrl} websiteUrl={company.websiteUrl} />
          </button>
          <div className="flex max-w-[58%] flex-col items-end gap-1">
            <Badge variant="amber" className="max-w-full truncate">{company.category || "Company"}</Badge>
            {company.raw.data_status === "illustrative" && <Badge variant="purple">Fictional demo</Badge>}
            {company.raw.data_status === "demo" && <Badge variant="outline">Sample profile</Badge>}
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <button type="button" onClick={onOpen} className="text-left focus-visible:outline-none focus-visible:underline focus-visible:decoration-coral focus-visible:decoration-2 focus-visible:underline-offset-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-[#24334a] group-hover:text-[#216b5c]">{company.name}</h2>
          </button>
          <p className="mt-0.5 text-sm text-slate-500">{company.shortName}</p>
        </div>

        <div className="mt-4 flex-1 space-y-2.5 text-sm text-slate-600">
          <div className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#b58c37]" /><DisplayValue value={company.headquarters} /></div>
          <div className="flex min-w-0 items-center gap-2"><Users className="h-4 w-4 shrink-0 text-[#69a993]" /><DisplayValue value={company.employeeSize} /></div>
          <div className="flex items-center gap-2">
            {negativeGrowth ? <TrendingDown className="h-4 w-4 shrink-0 text-coral" /> : <TrendingUp className="h-4 w-4 shrink-0 text-[#348c6d]" />}
            <span className={negativeGrowth ? "text-[#c2513b]" : "text-[#286b53]"}><DisplayValue value={company.growthRate} /></span>
            {!isNullish(company.growthRate) && <span className="text-xs text-slate-400">profile growth</span>}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f0eadd] pt-3">
          <button
            type="button"
            onClick={onToggleCompare}
            disabled={compareDisabled}
            aria-pressed={isCompared}
            aria-label={isCompared ? `Remove ${company.name} from comparison` : `Add ${company.name} to comparison`}
            title={compareDisabled ? "You can compare up to three companies" : undefined}
            className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${isCompared ? "bg-[#e4f2e9] text-[#246b5d]" : "bg-[#f5f0e6] text-slate-600 hover:bg-[#eee5d6]"}`}
          >
            <span className={`grid h-4 w-4 place-items-center rounded-full ${isCompared ? "bg-[#216b5c] text-white" : "bg-white text-[#8f7d59]"}`}>{isCompared ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}</span>
            {isCompared ? "Selected" : "Compare"}
          </button>
          <button type="button" onClick={onOpen} className="inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-[#216b5c] transition-colors hover:bg-[#eaf3eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2">
            View profile <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </Card>
    </motion.article>
  );
});
