import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, FileJson2, FileText, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Skill = {
  skill_name: string;
  category_code: string;
  evidence: string;
  confidence: "high" | "medium" | "low";
};
type JDResult = {
  source_type: "jd";
  source_file: string;
  company: string;
  role: string;
  skills: Skill[];
};

const apiBase = (import.meta.env.VITE_JD_ANALYTICS_API_URL || "http://127.0.0.1:8000").trim().replace(/\/$/, "");
const maxUploadBytes = 12 * 1024 * 1024;
const categories: Record<string, string> = {
  COD: "Coding", DSA: "Data Structures & Algorithms", OOD: "Object-Oriented Design",
  APTI: "Aptitude", COMM: "Communication", AI: "AI / ML", CLOUD: "Cloud",
  SQL: "SQL & Databases", SWE: "Software Engineering", SYSD: "System Design",
  NETW: "Networking", OS: "Operating Systems", OTHER: "Other",
};

export function JDAnalytics() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [result, setResult] = useState<JDResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const chooseFile = (candidate: File | undefined) => {
    setError("");
    setResult(null);
    if (!candidate) return;
    const extension = candidate.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      setFile(null);
      setError("Choose a PDF or DOCX job description.");
      return;
    }
    if (candidate.size > maxUploadBytes) {
      setFile(null);
      setError("This file is over 12 MB. Choose a smaller JD file.");
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

  const analyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    const body = new FormData();
    body.set("file", file);
    body.set("company", company);
    body.set("role", role);
    try {
      const response = await fetch(`${apiBase}/api/analyze`, { method: "POST", body });
      const payload = await response.json().catch(() => null) as JDResult | { detail?: string } | null;
      if (!response.ok) {
        const detail = payload && "detail" in payload && typeof payload.detail === "string" ? payload.detail : "The JD could not be analyzed. Please try again.";
        throw new Error(detail || "The JD could not be analyzed. Please try again.");
      }
      if (!payload || !("skills" in payload) || !Array.isArray(payload.skills)) {
        throw new Error("The analyzer returned a response that does not match the Stage 1 handoff format.");
      }
      setResult(payload as JDResult);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The JD could not be analyzed.";
      if (message.toLowerCase().includes("failed to fetch")) {
        setError(`Could not reach the JD Analytics service at ${apiBase}. Start the backend or set VITE_JD_ANALYTICS_API_URL to its address.`);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([`${JSON.stringify(result, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${result.source_file.replace(/\.[^.]+$/, "") || "jd-skill-list"}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
          <p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]"><Sparkles className="h-3.5 w-3.5" /> JD Analytics · Stage 1</p>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">Understand what a job actually asks for.</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Upload a job description to extract its skills and technologies, grouped into the RADIX categories. The result is the JD skill list used by Skill Matching.</p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <Card className="p-5 sm:p-7">
            <form onSubmit={analyze} className="space-y-5">
              <div>
                <label htmlFor="jd-file" className="mb-2 block text-sm font-semibold text-slate-800">Job description</label>
                <label
                  htmlFor="jd-file"
                  onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition ${dragging ? "border-[#216b5c] bg-[#eaf4ec]" : "border-[#d9d2c5] bg-[#faf7f0] hover:border-[#80b7a4] hover:bg-[#f3f8f1]"}`}
                >
                  <input ref={inputRef} id="jd-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange} className="sr-only" />
                  {file ? <FileText className="h-8 w-8 text-[#246b5d]" /> : <Upload className="h-8 w-8 text-[#679586]" />}
                  <span className="mt-3 max-w-full truncate text-sm font-semibold text-slate-800">{file?.name ?? "Choose a JD or drop it here"}</span>
                  <span className="mt-1 text-xs text-slate-500">PDF or DOCX · up to 12 MB</span>
                  {file && <span className="mt-2 text-xs text-[#246b5d]">{(file.size / 1024).toFixed(0)} KB · ready to analyze</span>}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="jd-company" className="mb-1.5 block text-sm font-medium text-slate-700">Company <span className="font-normal text-slate-400">(optional)</span></label><input id="jd-company" value={company} onChange={(event) => setCompany(event.target.value)} maxLength={200} placeholder="e.g. Google LLC" className="h-11 w-full rounded-xl border border-[#ded7ca] bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]" /></div>
                <div><label htmlFor="jd-role" className="mb-1.5 block text-sm font-medium text-slate-700">Role <span className="font-normal text-slate-400">(optional)</span></label><input id="jd-role" value={role} onChange={(event) => setRole(event.target.value)} maxLength={200} placeholder="e.g. Data Scientist" className="h-11 w-full rounded-xl border border-[#ded7ca] bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#80b7a4] focus:ring-4 focus:ring-[#dff0e5]" /></div>
              </div>
              <p className="text-xs text-slate-500">Skill extraction uses OpenRouter. The API key stays on the backend and is never sent to the browser.</p>

              {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</div>}

              <Button type="submit" disabled={!file || loading} className="min-h-11 w-full">
                {loading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Reading the job description…</> : <><Sparkles className="h-4 w-4" /> Extract JD skills</>}
              </Button>
            </form>
          </Card>

          <Card className="p-5 sm:p-7">
            <h2 className="font-heading text-lg font-semibold text-[#26354b]">What this stage returns</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">One structured JD result with company and role context, plus skills that Stage 5 can compare with a candidate profile.</p>
            <div className="mt-5 space-y-3">
              {["Skill or technology name", "One RADIX category code", "Evidence from the JD", "Extraction confidence"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl bg-[#faf7f0] px-3 py-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e4f2e9] text-xs font-semibold text-[#246b5d]">{index + 1}</span><span className="text-sm text-slate-700">{item}</span></div>)}
            </div>
            <div className="mt-5 rounded-xl border border-[#f0dfb2] bg-[#fff9e9] px-4 py-3 text-sm leading-6 text-[#76591d]">The extraction focuses on “Key Responsibilities” and “What We’re Looking For.” Image-only PDF pages are sent to a vision-capable model.</div>
          </Card>
        </div>

        {result && <Card className="mt-6 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e9e1d5] p-5 sm:p-6">
            <div className="flex gap-3"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e4f2e9] text-[#246b5d]"><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]">Analysis complete</p><h2 className="mt-1 font-heading text-xl font-semibold text-[#26354b]">{result.role || "JD skill list"}{result.company ? ` · ${result.company}` : ""}</h2><p className="mt-1 text-sm text-slate-500">{result.source_file} · {result.skills.length} extracted {result.skills.length === 1 ? "skill" : "skills"}</p></div></div>
            <Button type="button" onClick={downloadResult} variant="outline"><Download className="h-4 w-4" /> Download JSON</Button>
          </div>
          {result.skills.length === 0 ? <p className="p-6 text-sm text-slate-600">No supported skills were found in this JD.</p> : <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">{result.skills.map((skill, index) => <div key={`${skill.skill_name}-${index}`} className="rounded-xl border border-[#e9e1d5] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-slate-900">{skill.skill_name}</h3><Badge variant="outline">{skill.category_code}</Badge></div><p className="mt-1 text-xs font-medium text-slate-500">{categories[skill.category_code] ?? "Other"} · {skill.confidence} confidence</p><blockquote className="mt-3 border-l-2 border-[#80b7a4] pl-3 text-sm leading-6 text-slate-600">{skill.evidence}</blockquote></div>)}</div>}
          <div className="flex items-center gap-2 border-t border-[#e9e1d5] bg-[#faf7f0] px-5 py-3 text-xs text-slate-500 sm:px-6"><FileJson2 className="h-4 w-4 shrink-0" /> The saved JSON follows the Stage 1 handoff schema for Skill Matching.</div>
        </Card>}

        <p className="mt-8 text-center text-xs leading-5 text-slate-400">Job descriptions are sent to OpenRouter for analysis. The Stage 1 API saves its JSON response in the backend’s local <code className="rounded bg-white px-1 py-0.5">output/</code> folder; use Download JSON to keep a copy in this browser.</p>
      </main>
    </div>
  );
}
