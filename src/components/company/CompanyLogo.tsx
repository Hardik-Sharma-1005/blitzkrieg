import { useState } from "react";

export function CompanyLogo({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const imageUrl = logoUrl;
  const dimension = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-12 w-12";

  return imageUrl && !failed ? (
    <img
      src={imageUrl}
      alt={`${name} logo`}
      className={`${dimension} rounded-xl border border-slate-100 bg-white object-contain p-1.5`}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={`${dimension} grid place-items-center rounded-xl bg-blue-50 font-heading text-lg font-bold text-blue-700`} aria-label={`${name} initial mark`}>
      {name.trim().charAt(0).toUpperCase() || "C"}
    </div>
  );
}
