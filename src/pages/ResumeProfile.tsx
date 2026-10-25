import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, LoaderCircle, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Skill = {
  skill_name: string;
  category_code: string;
  evidence: string;
  confidence: "high" | "medium" | "low";
};

type ProfileEntry = string | Record<string, unknown>;

type CandidateProfile = {
  source_type: "resume";
  source_file: string;
  cv_file: string;
  name: string;
  email: string;
  education: ProfileEntry[];
  projects: ProfileEntry[];
  hackathons: ProfileEntry[];
  internships: ProfileEntry[];
  certifications: string[];
  achievements: string[];
  preferred_roles: string[];
  skills: Skill[];
  extraction_mode: "llm_live" | "offline_heuristic" | "offline_heuristic_fallback";
};

const apiBase = (import.meta.env.VITE_JD_ANALYTICS_API_URL || "http://127.0.0.1:8000").trim().replace(/\/$/, "");
const maxUploadBytes = 12 * 1024 * 1024;
const categories: Record<string, string> = {
  COD: "Coding", DSA: "Data Structures & Algorithms", OOD: "Object-Oriented Design",
  APTI: "Aptitude", COMM: "Communication", AI: "AI / ML", CLOUD: "Cloud",
  SQL: "SQL & Databases", SWE: "Software Engineering", SYSD: "System Design",
  NETW: "Networking", OS: "Operating Systems", OTHER: "Other",
};

function displayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(", ");
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).map(displayValue).filter(Boolean).join(" · ");
  return "";
}

function ProfileSection({ title, items }: { title: string; items: Array<string | ProfileEntry> }) {
  return (
    <section className="rounded-2xl border border-[#e9e1d5] bg-white p-5">
      <h3 className="font-heading text-base font-semibold text-[#26354b]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No {title.toLowerCase()} found in this resume.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded-xl bg-[#faf7f0] px-3.5 py-3 text-sm leading-6 text-slate-700">
              {typeof item === "string" ? item : displayValue(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ResumeProfile() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const chooseFile = (candidate: File | undefined) => {
    if (loading) return;
    setError("");
    setProfile(null);
    if (!candidate) return;
    const extension = candidate.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      setFile(null);
      setError("Choose a PDF or DOCX resume.");
      return;
    }
    if (candidate.size > maxUploadBytes) {
      setFile(null);
      setError("This file is over 12 MB. Choose a smaller resume.");
      return;
    }
    setFile(candidate);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const parseResume = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setProfile(null);
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch(`${apiBase}/api/parse-resume`, { method: "POST", body });
      const payload = await response.json().catch(() => null) as CandidateProfile | { detail?: string } | null;
      if (!response.ok) {
        const detail = payload && "detail" in payload && typeof payload.detail === "string" ? payload.detail : "We could not process this resume. Please try again.";
        throw new Error(detail);
      }
      if (!payload || !("skills" in payload) || !Array.isArray(payload.skills) || !("name" in payload)) {
        throw new Error("The profile service returned an unexpected result. Please try again.");
      }
      setProfile(payload as CandidateProfile);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "We could not process this resume.";
      setError(message.toLowerCase().includes("failed to fetch")
        ? "We could not connect to the resume service. Make sure the local analysis service is running, then try again."
        : message);
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setFile(null);
    setProfile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#fbf8f1]">
      <header className="border-b border-[#e9e1d5] bg-[#fffdf8]">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#216b5c]"><ArrowLeft className="h-4 w-4" /> Back to company directory</Link>
          <div className="flex items-center gap-2"><img src="/jss-university-logo.png" alt="" className="h-9 w-9 rounded-lg object-contain" /><span className="hidden text-sm font-semibold text-[#26354b] sm:inline">JSS Student Career Hub</span></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]"><Sparkles className="h-3.5 w-3.5" /> STUDENT PROFILE</p>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">Turn your resume into a career profile.</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Review the experience, education, and evidence-backed skills the parser finds in your resume.</p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <Card className="p-5 sm:p-7">
            <form onSubmit={parseResume} className="space-y-5">
              <div>
                <label htmlFor="resume-file" className="mb-2 block text-sm font-semibold text-slate-800">Your resume</label>
                <label
                  htmlFor="resume-file"
                  onDragOver={(event) => { event.preventDefault(); if (!loading) setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition ${dragging ? "border-[#216b5c] bg-[#eaf4ec]" : "border-[#d9d2c5] bg-[#faf7f0] hover:border-[#80b7a4] hover:bg-[#f3f8f1]"} ${loading ? "cursor-wait opacity-70" : ""}`}
                >
                  <input ref={inputRef} id="resume-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange} disabled={loading} className="sr-only" />
                  {file ? <FileText className="h-8 w-8 text-[#246b5d]" /> : <Upload className="h-8 w-8 text-[#679586]" />}
                  <span className="mt-3 max-w-full truncate text-sm font-semibold text-slate-800">{file?.name ?? "Choose a resume or drop it here"}</span>
                  <span className="mt-1 text-xs text-slate-500">PDF or DOCX · up to 12 MB</span>
                  {file && <span className="mt-2 text-xs text-[#246b5d]">{(file.size / 1024).toFixed(0)} KB · ready to review</span>}
                </label>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] px-4 py-3 text-sm leading-6 text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#246b5d]" />
                <p>Your resume is processed temporarily and is not saved to your account or the portal. When live skill extraction is enabled, relevant resume text may be sent to the configured AI provider.</p>
              </div>

              {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</div>}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={!file || loading} className="min-h-11 flex-1">
                  {loading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Reading your resume…</> : <><Sparkles className="h-4 w-4" /> Build my profile</>}
                </Button>
                {(profile || file) && <Button type="button" variant="outline" onClick={startOver} disabled={loading} className="min-h-11">Choose another resume</Button>}
              </div>
            </form>
          </Card>

          <Card className="p-5 sm:p-7">
            <h2 className="font-heading text-lg font-semibold text-[#26354b]">Your resume stays yours</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">The portal sends the selected file to its resume service for parsing. The file is held in temporary processing storage and removed when processing finishes. When live skill extraction is enabled, relevant skill, project, experience, and achievement text may be sent to the configured AI provider. Nothing is written to your student account.</p>
            <div className="mt-5 rounded-xl border border-[#f0dfb2] bg-[#fff9e9] px-4 py-3 text-sm leading-6 text-[#76591d]">The profile is a starting point for your review. Check the extracted details and skill evidence for accuracy.</div>
          </Card>
        </div>

        {profile && (
          <Card className="mt-6 overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e9e1d5] p-5 sm:p-6">
              <div className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e4f2e9] text-[#246b5d]"><CheckCircle2 className="h-5 w-5" /></span>
                <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]">Profile ready to review</p><h2 className="mt-1 font-heading text-xl font-semibold text-[#26354b]">{profile.name}</h2><p className="mt-1 text-sm text-slate-500">{profile.email || "No email found"} · {profile.source_file}</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{profile.skills.length} {profile.skills.length === 1 ? "skill" : "skills"}</Badge>
                <Badge variant="outline">{profile.preferred_roles.length} {profile.preferred_roles.length === 1 ? "preferred role" : "preferred roles"}</Badge>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <ProfileSection title="Education" items={profile.education} />
              <ProfileSection title="Projects" items={profile.projects} />
              <ProfileSection title="Internships" items={profile.internships} />
              <ProfileSection title="Hackathons" items={profile.hackathons} />
              <ProfileSection title="Certifications" items={profile.certifications} />
              <ProfileSection title="Achievements" items={profile.achievements} />
            </div>

            <section className="border-t border-[#e9e1d5] p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><h3 className="font-heading text-lg font-semibold text-[#26354b]">Skills and resume evidence</h3><p className="mt-1 text-sm text-slate-500">Each skill includes text the parser found in your document.</p></div>
                {profile.preferred_roles.length > 0 && <p className="text-sm text-slate-600"><span className="font-medium">Preferred roles:</span> {profile.preferred_roles.join(" · ")}</p>}
              </div>
              {profile.skills.length === 0 ? (
                <p className="mt-4 rounded-xl bg-[#faf7f0] p-4 text-sm text-slate-600">No supported skills were found. Try a resume with a clearly labeled skills or project section.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {profile.skills.map((skill, index) => <article key={`${skill.skill_name}-${index}`} className="rounded-xl border border-[#e9e1d5] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h4 className="font-semibold text-slate-900">{skill.skill_name}</h4><Badge variant="outline">{skill.category_code}</Badge></div><p className="mt-1 text-xs font-medium text-slate-500">{categories[skill.category_code] ?? "Other"} · {skill.confidence} confidence</p><blockquote className="mt-3 border-l-2 border-[#80b7a4] pl-3 text-sm leading-6 text-slate-600">{skill.evidence}</blockquote></article>)}
                </div>
              )}
            </section>
          </Card>
        )}
      </main>
    </div>
  );
}
