import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Mail, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const exploreLinks = [
  { to: "/companies", label: "Company Directory" },
  { to: "/company/intelligence", label: "Company Intelligence" },
  { to: "/company/skills", label: "Skill Intelligence" },
  { to: "/company/compare", label: "Compare Companies" },
];

const careerToolLinks = [
  { to: "/resume-profile", label: "Build your profile" },
  { to: "/check-where-you-stand", label: "Check where you stand" },
  { to: "/jd-analytics", label: "Analyze a job description" },
  { to: "/skill-match", label: "Match resume to a job" },
  { to: "/talent-check", label: "Talent Check" },
];

function FooterLinkList({ links }: { links: typeof exploreLinks }) {
  return (
    <ul className="mt-4 space-y-1.5 text-sm">
      {links.map(({ to, label }) => (
        <li key={to}>
          <Link to={to} className="group flex min-h-9 items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-slate-600 transition-colors hover:text-[#9A5A82] dark:text-slate-400 dark:hover:text-[#D99CC5]">
            <span>{label}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-45 transition-opacity group-hover:opacity-100" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AppFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-[#e8dfd1] bg-[#fffdf8] text-slate-700 transition-colors dark:border-slate-800 dark:bg-[#0b0e14] dark:text-slate-300">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="inline-block" aria-label="blitzkrieg home">
              <BrandLogo className="h-auto w-36" />
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#823863] dark:text-[#D99CC5]">
              Career Intelligence
            </p>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              Evidence-based placement insights, 12-skill RADIX benchmarks, and role matching built for the campus community.
            </p>
          </div>

          <nav aria-label="Explore">
            <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-[#26354b] dark:text-slate-100">
              <Building2 className="h-4 w-4 text-[#9A5A82] dark:text-[#D99CC5]" /> Explore
            </h3>
            <FooterLinkList links={exploreLinks} />
          </nav>

          <nav aria-label="Career tools">
            <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-[#26354b] dark:text-slate-100">
              <Sparkles className="h-4 w-4 text-[#9A5A82] dark:text-[#D99CC5]" /> Career Tools
            </h3>
            <FooterLinkList links={careerToolLinks} />
          </nav>

          <div>
            <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-[#26354b] dark:text-slate-100">
              <Mail className="h-4 w-4 text-[#9A5A82] dark:text-[#D99CC5]" /> Get in Touch
            </h3>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Have suggestions, feedback, or company data updates? Reach out to our campus team:
            </p>
            <div className="mt-3">
              <a
                href="mailto:blitzkrieg.jss@gmail.com"
                className="group inline-flex items-center gap-2.5 rounded-xl border border-[#ded5c5] bg-[#faf7f0] px-3.5 py-2.5 text-xs font-semibold text-[#9A5A82] transition-colors hover:text-[#87496E] dark:border-slate-700 dark:bg-slate-900 dark:text-[#D99CC5] dark:hover:text-[#e6b2d5] sm:text-sm"
              >
                <Mail className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="break-all font-mono">blitzkrieg.jss@gmail.com</span>
              </a>
            </div>
            <div className="mt-4 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <img
                src="/jss-university-logo.png"
                alt="JSS University"
                className="h-6 w-6 rounded-md bg-white object-contain p-0.5"
              />
              <span>JSS University, Noida</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
