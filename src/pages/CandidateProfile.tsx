import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Award, BriefcaseBusiness, CodeXml, Link2, MapPin, Mail, Phone, Sparkles, UserRound, GraduationCap, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCandidateProfile, type CandidateSkillBadge, type ParsedCandidateProfile, type ProfileEntry } from "@/lib/candidateProfile";
import { readRecentSnapshot, recordRecentActivity } from "@/lib/recentActivity";

const categoryNames: Record<string, string> = {
  COD: "Coding", DSA: "Data Structures & Algorithms", OOD: "Object-Oriented Design", APTI: "Aptitude",
  COMM: "Communication", AI: "AI / ML", CLOUD: "Cloud", SQL: "SQL & Databases", SWE: "Software Engineering",
  SYSD: "System Design", NETW: "Networking", OS: "Operating Systems", OTHER: "Other",
};

const assessmentNames = { mock_interview: "Mock Interview", skill_proof_sprint: "Skill Proof Sprint" } as const;
type BasicInfo = { name: string; email: string; phone: string; location: string; linkedin: string; github: string };

function getBasicInfoErrors(info: BasicInfo): Partial<Record<keyof BasicInfo, string>> {
  const errors: Partial<Record<keyof BasicInfo, string>> = {};
  const name = info.name.trim();
  if (!name) errors.name = "Enter your name.";
  else if (name.length < 2 || name.length > 80 || !/^[\p{L}\p{M}][\p{L}\p{M}\s.'’\-]{1,79}$/u.test(name)) errors.name = "Use 2–80 letters; spaces, apostrophes, periods, and hyphens are allowed.";

  const email = info.email.trim();
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) errors.email = "Enter a valid email address.";

  const phone = info.phone.trim();
  if (phone && (!/^[0-9\s().-]+$/.test(phone) || phone.replace(/\D/g, "").length !== 10)) errors.phone = "Enter exactly 10 digits; spaces, parentheses, dots, and hyphens are allowed.";

  const location = info.location.trim();
  if (location && (location.length < 2 || location.length > 100 || !/[\p{L}\p{N}]/u.test(location) || !/^[\p{L}\p{M}\p{N}\s.,'’()\-/]+$/u.test(location))) errors.location = "Enter a location using 2–100 letters or numbers.";

  const validProfileUrl = (value: string, host: string) => {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      return (url.hostname === host || url.hostname === `www.${host}`) && url.pathname.split("/").filter(Boolean).length >= 1;
    } catch { return false; }
  };
  const linkedin = info.linkedin.trim();
  if (linkedin && (linkedin.length > 500 || !validProfileUrl(linkedin, "linkedin.com"))) errors.linkedin = "Enter a LinkedIn profile URL, such as linkedin.com/in/your-name.";
  const github = info.github.trim();
  if (github && (github.length > 500 || !validProfileUrl(github, "github.com"))) errors.github = "Enter a GitHub profile URL, such as github.com/your-name.";

  return errors;
}

function displayEntry(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(displayEntry).filter(Boolean).join(" · ");
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).map(displayEntry).filter(Boolean).join(" · ");
  return "";
}

function ProfileSection({ title, items }: { title: string; items: ProfileEntry[] }) {
  return <section className="rounded-2xl border border-[#e9e1d5] bg-white p-5 shadow-sm">
    <h2 className="font-heading text-lg font-semibold text-[#26354b]">{title}</h2>
    {items.length ? <ul className="mt-3 space-y-2">{items.map((item, index) => <li key={`${title}-${index}`} className="rounded-xl bg-[#faf7f0] px-3.5 py-3 text-sm leading-6 text-slate-700">{displayEntry(item)}</li>)}</ul>
      : <p className="mt-3 text-sm text-slate-500">No {title.toLowerCase()} found in this resume.</p>}
  </section>;
}

export function CandidateProfile() {
  const location = useLocation();
  const { profile: activeProfile, badges: activeBadges, updateBasicInfo, markProfileReviewed } = useCandidateProfile();
  const [historySnapshot, setHistorySnapshot] = useState<{ profile: ParsedCandidateProfile; badges: CandidateSkillBadge[] } | null>(null);
  const profile = historySnapshot?.profile ?? activeProfile;
  const badges = historySnapshot?.badges ?? activeBadges;
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({ name: "", email: "", phone: "", location: "", linkedin: "", github: "" });
  const basicInfoErrors = getBasicInfoErrors(basicInfo);
  const basicInfoValid = Object.keys(basicInfoErrors).length === 0;
  const loggedGuidedReview = useRef("");

  useEffect(() => {
    const id = (location.state as { recentActivityId?: unknown } | null)?.recentActivityId;
    const saved = readRecentSnapshot<{ kind: "candidate-profile"; profile: ParsedCandidateProfile; badges?: CandidateSkillBadge[] }>(id);
    const sprintBadges = (saved?.badges ?? []).flatMap((badge) => {
      const assessments = Array.isArray(badge.assessments) ? badge.assessments.filter((assessment) => assessment === "skill_proof_sprint") : [];
      return assessments.length ? [{ ...badge, assessments }] : [];
    });
    setHistorySnapshot(saved?.kind === "candidate-profile" ? { profile: saved.profile, badges: sprintBadges } : null);
  }, [location.key, location.state]);

  useEffect(() => {
    if (!profile) return;
    setBasicInfo({ name: profile.name ?? "", email: profile.email ?? "", phone: profile.phone ?? "", location: profile.location ?? "", linkedin: profile.linkedin ?? "", github: profile.github ?? "" });
  }, [profile]);

  useEffect(() => {
    const recentActivityId = (location.state as { recentActivityId?: unknown } | null)?.recentActivityId;
    if (activeProfile && !historySnapshot && !recentActivityId) markProfileReviewed();
  }, [activeProfile, historySnapshot, location.state, markProfileReviewed]);

  useEffect(() => {
    const state = location.state as { fromGuidedWorkflow?: boolean; recentActivityId?: unknown } | null;
    if (!state?.fromGuidedWorkflow || state.recentActivityId || historySnapshot || !profile || loggedGuidedReview.current === location.key) return;
    loggedGuidedReview.current = location.key;
    recordRecentActivity({ feature: "profile", title: profile.name || "Candidate profile", action: "Reviewed candidate profile in the guided workflow", path: "/candidate-profile" }, { kind: "candidate-profile", profile, badges });
  }, [badges, historySnapshot, location.key, location.state, profile]);

  const saveBasics = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!basicInfoValid) return;
    const normalizedInfo = Object.fromEntries(Object.entries(basicInfo).map(([key, value]) => [key, value.trim()])) as BasicInfo;
    updateBasicInfo(normalizedInfo);
    if (profile) {
      const updated = { ...profile, ...normalizedInfo };
      recordRecentActivity({ feature: "profile", title: updated.name || "Candidate profile", action: "Updated basic profile information", path: "/candidate-profile" }, { kind: "candidate-profile", profile: updated, badges });
    }
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  if (!profile) return <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
    <Card className="p-8 text-center sm:p-12">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f2e9] text-[#246b5d]"><UserRound className="h-7 w-7" /></span>
      <h1 className="mt-5 font-heading text-3xl font-semibold text-[#26354b]">Your Candidate Profile</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">Create a temporary profile from your resume. Your profile stays in this browser tab and clears when the tab closes.</p>
      <Button asChild className="mt-6 min-h-11"><Link to="/resume-profile"><FileText className="h-4 w-4" /> Parse a resume</Link></Button>
    </Card>
  </main>;

  return <main className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#246b5d]"><UserRound className="h-3.5 w-3.5" /> {historySnapshot ? "Profile history" : "Candidate Profile"}</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">{profile.name || "Your profile"}</h1>
        <p className="mt-2 text-sm text-slate-600">Built from <span className="font-medium">{profile.source_file}</span> · {historySnapshot ? "saved in this tab session" : "available for this tab session"}</p></div>
      <div className="flex flex-wrap gap-2">{!historySnapshot && <Button variant="outline" className="candidate-profile-check-link" asChild><Link to="/check-where-you-stand"><Sparkles className="h-4 w-4" /> Check where you stand</Link></Button>}<Button asChild><Link to="/resume-profile"><FileText className="h-4 w-4" /> Apply another resume</Link></Button></div>
    </header>

    {historySnapshot && <div role="status" className="rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] px-4 py-3 text-sm text-slate-700">You’re viewing a saved profile activity. Editing it won’t change the current profile.</div>}

    <Card className="skill-badges-panel overflow-hidden border p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Award className="h-5 w-5 text-[var(--brand-accent)]" /><h2 className="skill-badges-heading font-heading text-xl font-semibold">Skill badges</h2></div><p className="skill-badges-description mt-1 text-sm">Badges are earned by passing an assessment. Resume skills are shown separately as extracted evidence.</p></div><Badge variant="outline" className="skill-badges-count">{badges.length} earned</Badge></div>
      {badges.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{badges.map((badge) => <article key={badge.skill_name} className="skill-badge-item rounded-xl border p-4">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e4f2e9] text-[#246b5d]"><Award className="h-5 w-5" /></span><div><h3 className="font-semibold text-[#26354b]">{badge.skill_name} badge</h3><p className="mt-0.5 text-xs text-slate-500">{categoryNames[badge.category_code] ?? badge.category_code}</p></div></div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Earned through</p><p className="mt-1 text-sm text-slate-700">{badge.assessments.map((assessment) => assessmentNames[assessment]).join(" · ")}</p>
        <p className="mt-1 text-xs text-slate-500">Earned {new Date(badge.awarded_at).toLocaleDateString()}</p>
        {badge.evidence.length > 0 && <p className="mt-2 text-xs leading-5 text-slate-600">{badge.evidence.join(" · ")}</p>}
      </article>)}</div> : <div className="skill-badges-empty mt-5 rounded-xl border border-dashed p-5 text-sm">No badges yet. Pass a Skill Proof Sprint challenge to earn a practical skill badge.</div>}
    </Card>

    <Card className="p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-[#246b5d]" /><h2 className="font-heading text-xl font-semibold text-[#26354b]">Basic information</h2></div><p className="mt-1 text-sm text-slate-600">You can edit these personal details during this session.</p></div>
        {!editing && !historySnapshot && <Button type="button" variant="outline" className="candidate-edit-details" onClick={() => setEditing(true)}>Edit details</Button>}</div>
      {editing ? <form noValidate onSubmit={saveBasics} className="mt-5 grid gap-4 sm:grid-cols-2">
        {([ ["name", "Name", "text", 80], ["email", "Email", "email", 254], ["phone", "Phone", "tel", 30], ["location", "Location", "text", 100], ["linkedin", "LinkedIn link", "url", 500], ["github", "GitHub link", "url", 500] ] as const).map(([key, label, type, maxLength]) => {
          const errorId = `${key}-validation-error`;
          const fieldError = basicInfoErrors[key];
          return <label key={key} className="text-sm font-medium text-slate-700">{label}<input type={type} required={key === "name"} maxLength={maxLength} value={basicInfo[key]} aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? errorId : undefined} onChange={(event) => setBasicInfo((current) => ({ ...current, [key]: event.target.value }))} className={`mt-1.5 min-h-11 w-full rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 ${fieldError ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : "border-[#d9d2c5] focus:border-[#246b5d] focus:ring-[#246b5d]/15"}`} />{fieldError && <span id={errorId} className="field-validation-error mt-1 block text-xs leading-4" role="alert">{fieldError}</span>}</label>;
        })}
        <div className="flex items-center gap-2 sm:col-span-2"><Button type="submit" disabled={!basicInfoValid}>Save details</Button><Button type="button" variant="outline" onClick={() => { setEditing(false); setBasicInfo({ name: profile.name ?? "", email: profile.email ?? "", phone: profile.phone ?? "", location: profile.location ?? "", linkedin: profile.linkedin ?? "", github: profile.github ?? "" }); }}>Cancel</Button></div>
      </form> : <><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {([ ["Name", profile.name, UserRound], ["Email", profile.email, Mail], ["Phone", profile.phone, Phone], ["Location", profile.location, MapPin], ["LinkedIn", profile.linkedin, Link2], ["GitHub", profile.github, CodeXml] ] as const).map(([label, value, Icon]) => <div key={label} className="flex min-h-16 items-center gap-3 rounded-xl bg-[#faf7f0] px-4 py-3"><Icon className="h-4 w-4 shrink-0 text-[#679586]" /><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="truncate text-sm text-slate-800">{value || "Not provided"}</p></div></div>)}
      </div>{saved && <p role="status" className="mt-3 text-sm font-medium text-[#246b5d]">Your details are updated for this session.</p>}</>}
    </Card>

    <div className="grid gap-4 sm:grid-cols-2">
      <ProfileSection title="Education" items={profile.education} /><ProfileSection title="Projects" items={profile.projects} />
      <ProfileSection title="Internships" items={profile.internships} /><ProfileSection title="Hackathons" items={profile.hackathons} />
      <ProfileSection title="Certifications" items={profile.certifications} /><ProfileSection title="Achievements" items={profile.achievements} />
    </div>

    <Card className="p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-[#246b5d]" /><h2 className="font-heading text-xl font-semibold text-[#26354b]">Resume skills</h2></div><p className="mt-1 text-sm text-slate-600">These skills were extracted from your resume and are shown with their source evidence. They are not badges.</p></div><div className="flex gap-2"><Badge variant="outline">{profile.skills.length} found</Badge>{profile.preferred_roles.length > 0 && <Badge variant="outline">{profile.preferred_roles.length} role interests</Badge>}</div></div>
      {profile.preferred_roles.length > 0 && <p className="mt-4 rounded-xl bg-[#faf7f0] p-3 text-sm text-slate-700"><span className="font-semibold">Preferred roles:</span> {profile.preferred_roles.join(" · ")}</p>}
      {profile.skills.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{profile.skills.map((skill, index) => <article key={`${skill.skill_name}-${index}`} className="rounded-xl border border-[#e9e1d5] bg-white p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold text-slate-900">{skill.skill_name}</h3><Badge variant="outline">{categoryNames[skill.category_code] ?? skill.category_code}</Badge></div><p className="mt-1 text-xs text-slate-500">Resume evidence · {skill.confidence} extraction confidence</p><blockquote className="mt-3 border-l-2 border-[#80b7a4] pl-3 text-sm leading-5 text-slate-700">“{skill.evidence}”</blockquote></article>)}</div> : <p className="mt-4 rounded-xl bg-[#faf7f0] p-4 text-sm text-slate-600">No supported skills were found in this resume.</p>}
    </Card>
    <p className="text-center text-xs text-slate-500"><GraduationCap className="mr-1 inline h-4 w-4" /> Company or job gaps appear only in their readiness results, not on this profile.</p>
  </main>;
}
