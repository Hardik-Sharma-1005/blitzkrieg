import { Badge } from "@/components/ui/badge";
import { getCompanyDataProvenance } from "@/lib/companyData";
import { ExternalLink } from "lucide-react";

export function DataProvenance({
  raw,
  origin,
  compact = false,
}: {
  raw: unknown;
  origin: "demo" | "supabase";
  compact?: boolean;
}) {
  const provenance = getCompanyDataProvenance(raw, origin);

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 ${compact ? "" : "rounded-xl border border-[#e9e1d5] bg-[#fffdf8] px-3 py-2.5"}`}>
      <span className="font-semibold text-slate-600">Source</span>
      {provenance.sourceUrl ? (
        <a href={provenance.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-[#246b5d] underline-offset-2 hover:underline">
          {provenance.sourceLabel}<ExternalLink className="h-3 w-3" />
        </a>
      ) : <span>{provenance.sourceLabel}</span>}
      <span className="text-slate-300" aria-hidden="true">•</span>
      <span><span className="font-semibold text-slate-600">Freshness</span> {provenance.freshnessLabel}</span>
      {provenance.isIllustrative && <Badge variant="amber">Fictional demo</Badge>}
    </div>
  );
}
