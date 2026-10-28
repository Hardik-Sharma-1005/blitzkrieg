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
    : <span className="truncate text-slate-700 dark:text-slate-300">{value}</span>;
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
      <Card className="group flex h-full min-h-[278px] flex-col overflow-hidden border-[#e5dcd1] bg-[#fffdf8] p-5 shadow-[0_12px_34px_rgba(0,0,0,0.06)] transition-all duration-200 hover:border-[#9A5A82] hover:shadow-[0_18px_45px_rgba(154,90,130,0.15)] dark:border-[#29313b] dark:bg-[#10151d] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] dark:hover:border-[#D99CC5] dark:hover:shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
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
            <h2 className="font-heading text-lg font-semibold tracking-tight text-slate-900 group-hover:text-[#9A5A82] dark:text-[#edf1f7] dark:group-hover:text-white">{company.name}</h2>
          </button>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{company.shortName}</p>
        </div>

        <div className="mt-4 flex-1 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-slate-400 dark:text-[#b8c0cd]" /><DisplayValue value={company.headquarters} /></div>
          <div className="flex min-w-0 items-center gap-2"><Users className="h-4 w-4 shrink-0 text-slate-400 dark:text-[#b8c0cd]" /><DisplayValue value={company.employeeSize} /></div>
          <div className="flex items-center gap-2">
            {negativeGrowth ? <TrendingDown className="h-4 w-4 shrink-0 text-rose-500 dark:text-[#d79393]" /> : <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-[#aebbd0]" />}
            <span className={negativeGrowth ? "text-rose-600 dark:text-[#e3a0a0]" : "text-slate-700 dark:text-[#d4deeb]"}><DisplayValue value={company.growthRate} /></span>
            {!isNullish(company.growthRate) && <span className="text-xs text-slate-400 dark:text-[#8995a7]">profile growth</span>}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#e8dfd1] pt-3 dark:border-[#29313b]">
          <button
            type="button"
            onClick={onToggleCompare}
            disabled={compareDisabled}
            aria-pressed={isCompared}
            aria-label={isCompared ? `Remove ${company.name} from comparison` : `Add ${company.name} to comparison`}
            title={compareDisabled ? "You can compare up to three companies" : undefined}
            className={`company-compare-btn inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${
              isCompared
                ? "bg-[#9A5A82] text-white border border-[#9A5A82] hover:bg-[#87496E] dark:bg-[#D99CC5] dark:text-[#0b0e17] dark:border-[#D99CC5] dark:hover:bg-[#e4b2d4]"
                : "bg-[#faf2f7] text-[#9A5A82] border border-[#ebd8e6] hover:bg-[#f3e5ef] hover:border-[#9A5A82] dark:bg-[#202630] dark:text-[#D99CC5] dark:border-[#2f3847] dark:hover:bg-[#2b3441] dark:hover:border-[#D99CC5]"
            }`}
          >
            <span
              className={`grid h-4 w-4 place-items-center rounded-full transition-colors ${
                isCompared
                  ? "bg-white/25 text-white dark:bg-black/20 dark:text-[#0b0e17]"
                  : "bg-[#f0dceb] text-[#9A5A82] dark:bg-[#342330] dark:text-[#D99CC5]"
              }`}
            >
              {isCompared ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </span>
            <span className="font-semibold">{isCompared ? "Selected" : "Compare"}</span>
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="company-view-profile-btn inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-[#faf2f7] hover:text-[#9A5A82] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 dark:text-[#cbd7e8] dark:hover:bg-[#202630] dark:hover:text-white"
          >
            View profile <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </Card>
    </motion.article>
  );
});
