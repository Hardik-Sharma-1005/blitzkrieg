import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Mail, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function AppFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-[#e8dfd1] bg-[#fffdf8] text-slate-700 transition-colors dark:border-slate-800 dark:bg-[#0b0e14] dark:text-slate-300">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Mission */}
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

          {/* Column 2: Quick Links - Company Intelligence */}
          <div>
            <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-[#26354b] dark:text-slate-100">
              <Building2 className="h-4 w-4 text-[#246b5d] dark:text-[#D99CC5]" /> Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  to="/companies"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#246b5d] dark:text-slate-400 dark:hover:text-[#D99CC5]"
                >
                  Company Directory <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  to="/company/intelligence"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#246b5d] dark:text-slate-400 dark:hover:text-[#D99CC5]"
                >
                  Company Intelligence <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  to="/company/skills"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#246b5d] dark:text-slate-400 dark:hover:text-[#D99CC5]"
                >
                  Skill Intelligence <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  to="/company/compare"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#246b5d] dark:text-slate-400 dark:hover:text-[#D99CC5]"
                >
                  Compare Companies <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links - Career Tools */}
          <div>
            <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-[#26354b] dark:text-slate-100">
              <Sparkles className="h-4 w-4 text-[#246b5d] dark:text-[#D99CC5]" /> Career Tools
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  to="/jd-analytics"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#246b5d] dark:text-slate-400 dark:hover:text-[#D99CC5]"
                >
                  Analyze a JD <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  to="/skill-match"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#246b5d] dark:text-slate-400 dark:hover:text-[#D99CC5]"
                >
                  Match resume to a job <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  to="/talent-check"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#246b5d] dark:text-slate-400 dark:hover:text-[#D99CC5]"
                >
                  Talent Check <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Campus Community */}
          <div>
            <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-[#26354b] dark:text-slate-100">
              <Mail className="h-4 w-4 text-[#246b5d] dark:text-[#D99CC5]" /> Get in Touch
            </h3>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Have suggestions, feedback, or company data updates? Reach out to our campus team:
            </p>
            <div className="mt-3">
              <a
                href="mailto:blitzkrieg.jss@gmail.com"
                className="group inline-flex items-center gap-2.5 rounded-xl border border-[#ded5c5] bg-[#faf7f0] px-3.5 py-2.5 text-xs font-semibold text-[#246b5d] transition hover:border-[#246b5d] hover:bg-[#e4f2e9] dark:border-slate-700 dark:bg-slate-900 dark:text-[#D99CC5] dark:hover:border-[#D99CC5] dark:hover:bg-slate-800 sm:text-sm"
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

        {/* Bottom Bar: Copyright & Disclaimers */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#e8dfd1] pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} blitzkrieg. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Company skill signals and benchmark data are preparation insights, not automated hiring decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
