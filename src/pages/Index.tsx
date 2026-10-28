import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, Building2, FileText, GitCompareArrows, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { InteractiveCosmos } from "@/components/InteractiveCosmos";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/layout/SidebarContext";

const pathways = [
  { number: "01", label: "Read the market", title: "Company intelligence", copy: "Explore company profiles, compare employers, and understand the skills they value.", icon: Building2, route: "/companies" },
  { number: "02", label: "Find your fit", title: "Resume ↔ role matching", copy: "See confirmed, possible, and missing skills against a job description—with evidence.", icon: GitCompareArrows, route: "/skill-match" },
  { number: "03", label: "Build what’s next", title: "Talent Check", copy: "Compare your profile with a 12-skill RADIX benchmark, then practise the gaps.", icon: Sparkles, route: "/talent-check" },
];

export function Index() {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : .6, delay: prefersReducedMotion ? 0 : delay, ease: "easeOut" as const },
  });

  return (
    <div className={`portal-home relative isolate min-h-screen ${theme === "light" ? "theme-light" : ""}`}>
      <InteractiveCosmos variant="starfield" tone={theme} introBolt className="z-0" />
      <header className="brand-hero relative z-10 isolate flex min-h-[min(900px,100svh)] flex-col overflow-hidden px-5 pb-8 pt-7 text-center sm:px-8 sm:pt-9">
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-end">
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Quick links">
            <a href="#platform">How it works</a>
            <button type="button" onClick={() => navigate("/companies")}>Company directory</button>
            <button type="button" onClick={() => navigate("/resume-profile")} className="brand-nav-cta">Build your profile <ArrowRight className="h-4 w-4" /></button>
          </nav>
          <button type="button" onClick={() => navigate("/companies")} className="brand-nav-cta md:hidden">Company directory <ArrowRight className="h-4 w-4" /></button>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center pb-8 pt-6 sm:pt-0">
          <motion.div {...reveal(.05)} className="brand-lockup">
            <h1 className="sr-only">blitzkrieg</h1>
            <BrandLogo className="brand-wordmark mx-auto h-auto w-[min(82vw,570px)]" />
            <p
              className="brand-tagline mt-5 text-sm font-semibold tracking-[.035em] sm:mt-6 sm:text-base"
              style={{ color: theme === "light" ? "#823863" : "#D99CC5" }}
            >
              not your average placement platform
            </p>
          </motion.div>
          <motion.p {...reveal(.18)} className="brand-hero-copy mx-auto mt-8 max-w-2xl text-base leading-7 sm:mt-9 sm:text-lg sm:leading-8">
            Know the companies. Understand the skills. Make your next move with evidence.
          </motion.p>
          <motion.div {...reveal(.28)} className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => navigate("/companies")}
              style={{
                backgroundColor: theme === "light" ? "#9A5A82" : "#D99CC5",
                color: theme === "light" ? "#ffffff" : "#0b0e17",
                boxShadow: "none",
              }}
              className="brand-primary-button min-h-12 rounded-full px-5"
            >
              Explore company intelligence <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/talent-check")} className="brand-secondary-button min-h-12 rounded-full px-5">
              Try Talent Check <Sparkles className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div {...reveal(.4)} className="brand-proofline mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs sm:mt-12 sm:text-sm">
            <span><strong>118</strong> company profiles</span><i aria-hidden="true" /><span><strong>12 skills</strong> in the RADIX benchmark</span><i aria-hidden="true" /><span>Evidence-led matching</span>
          </motion.div>
        </div>
        <a href="#platform" className="brand-scroll relative z-10 mx-auto inline-flex items-center gap-2 py-3 text-xs font-semibold uppercase tracking-[.16em]" aria-label="Scroll to discover the platform">
          Scroll to discover <ArrowDown className="h-3.5 w-3.5" />
        </a>
      </header>

      <section id="platform" className="brand-platform-section relative z-10 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-[1240px]">
          <div className="brand-affiliation mb-12 flex flex-wrap items-center justify-between gap-6 border-b pb-7 sm:mb-16">
            <div>
              <p className="brand-eyebrow">Built for one campus community</p>
              <h2 className="mt-3 max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">Career decisions, with a clearer signal.</h2>
            </div>
            <div className="brand-jss-note flex items-center gap-3 text-sm font-semibold">
              <img src="/jss-university-logo.png" alt="" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
              <span>Exclusive to<br />JSS University, Noida</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pathways.map(({ number, label, title, copy, icon: Icon, route }, index) => (
              <motion.button key={number} type="button" onClick={() => navigate(route)} className="brand-pathway-card group text-left" {...reveal(index * .08)}>
                <div className="flex items-start justify-between"><span className="brand-pathway-number">{number}</span><Icon className="brand-pathway-icon h-5 w-5" aria-hidden="true" /></div>
                <p className="brand-eyebrow mt-10">{label}</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-.03em]">{title}</h3>
                <p className="brand-pathway-copy mt-3 text-sm leading-6">{copy}</p>
                <span className="brand-pathway-link mt-7 inline-flex items-center gap-2 text-sm font-semibold">Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </motion.button>
            ))}
          </div>

          <div className="brand-workflow-band mt-12 grid gap-8 rounded-3xl p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="brand-eyebrow">A practical path forward</p>
              <h3 className="mt-3 max-w-2xl font-heading text-2xl font-semibold leading-tight tracking-[-.035em] sm:text-3xl">From “what do they want?” to “what should I do next?”</h3>
              <p className="brand-workflow-copy mt-3 max-w-2xl text-sm leading-6">Build a resume profile, compare it with real role requirements, then use company skill benchmarks to focus your practice.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/companies")} className="brand-band-button rounded-full">Browse companies <Building2 className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => navigate("/resume-profile")} className="brand-band-button rounded-full">Build a resume profile <FileText className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => navigate("/jd-analytics")} className="brand-band-button rounded-full">Analyze a job description <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
