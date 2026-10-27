import { useEffect, useMemo, useState } from "react";

function websiteFavicon(websiteUrl?: string) {
  const value = websiteUrl?.trim();
  if (!value) return "";
  try {
    const url = new URL(value.startsWith("//") ? `https:${value}` : value.includes("://") ? value : `https://${value}`);
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url.origin)}&sz=256`;
  } catch {
    return "";
  }
}

function officialSiteIcon(websiteUrl?: string) {
  const value = websiteUrl?.trim();
  if (!value) return "";
  try {
    const url = new URL(value.startsWith("//") ? `https:${value}` : value.includes("://") ? value : `https://${value}`);
    return new URL("/favicon.ico", url.origin).href;
  } catch {
    return "";
  }
}

function normalizeLogoUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (!trimmed.includes("://")) return `https://${trimmed}`;
  return trimmed.replace(/^http:\/\//i, "https://");
}

export function CompanyLogo({
  name,
  logoUrl,
  websiteUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const directLogoUrl = normalizeLogoUrl(logoUrl);
  const siteIconUrl = officialSiteIcon(websiteUrl);
  const faviconUrl = websiteFavicon(websiteUrl);
  const imageCandidates = useMemo(
    () => [...new Set([directLogoUrl, siteIconUrl, faviconUrl].filter(Boolean))],
    [directLogoUrl, siteIconUrl, faviconUrl],
  );
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  useEffect(() => setFailedUrls([]), [imageCandidates]);
  const imageUrl = imageCandidates.find((url) => !failedUrls.includes(url));
  const dimension = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const initials = name.trim().split(/[\s&.-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C";

  return imageUrl ? (
    <img
      src={imageUrl}
      alt={`${name} logo`}
      className={`${dimension} rounded-xl border border-slate-100 bg-white object-contain p-1.5`}
      onError={() => setFailedUrls((failed) => failed.includes(imageUrl) ? failed : [...failed, imageUrl])}
    />
  ) : (
    <div className={`${dimension} grid place-items-center rounded-xl border border-[#d7e8dc] bg-[#e4f2e9] font-heading text-sm font-bold tracking-wide text-[#216b5c]`} aria-label={`${name} logo mark`}>
      {initials}
    </div>
  );
}
