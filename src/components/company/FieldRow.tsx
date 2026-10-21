import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { splitItems, asString } from "@/lib/companyData";

function isNullish(value: string) {
  return !value || /^(na|n\/a|none|null|undefined|-)$/i.test(value.trim());
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function renderValue(value: unknown, label: string) {
  const text = asString(value);
  if (isNullish(text)) return <Badge variant="outline" className="text-slate-400">Not Available</Badge>;
  if (isUrl(text)) {
    const isVideo = /video|youtube/i.test(label) || /youtube|youtu\.be|vimeo/i.test(text);
    return <a className="inline-flex items-center gap-1 break-all font-medium text-[#246b5d] hover:underline" href={text} target="_blank" rel="noreferrer">{isVideo ? "Watch video" : text}<ExternalLink className="h-3.5 w-3.5 shrink-0" /></a>;
  }
  if (/rating|score/i.test(label) && text.length < 80) return <Badge variant="amber">{text}</Badge>;
  const items = splitItems(text);
  if (items.length > 1 && text.length < 900) {
    return <div className="flex flex-wrap gap-2">{items.map((item, index) => <Badge key={`${item}-${index}`} variant="outline" className="font-normal">{item}</Badge>)}</div>;
  }
  return <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-700">{text}</p>;
}

export function FieldRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid gap-1 border-b border-[#f0eadd] py-3 last:border-0 sm:grid-cols-3 sm:gap-5">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 sm:col-span-2">{renderValue(value, label)}</dd>
    </div>
  );
}
