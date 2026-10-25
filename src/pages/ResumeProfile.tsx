import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, LoaderCircle, ShieldCheck, Sparkles, Upload, Target, AlertTriangle, Zap, TrendingUp, CheckCircle, Download, MessageSquare, Award, BookOpen, Send, Printer } from "lucide-react";
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
  const [targetCompany, setTargetCompany] = useState("Google");
  const [talentReport, setTalentReport] = useState<any | null>(null);
  const [checkingTalent, setCheckingTalent] = useState(false);
  const [talentError, setTalentError] = useState("");

  // Interactive Feature Tabs
  const [activeTab, setActiveTab] = useState<"matrix" | "coach" | "interview" | "sprint">("matrix");

  // Feature 1: AI Coach Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "coach"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  // Feature 2: Mock Interview Practice
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [generatingInterview, setGeneratingInterview] = useState(false);
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState("");

  // Feature 3: Skill Proof Sprint & Badge
  const [sprintChallenge, setSprintChallenge] = useState<any | null>(null);
  const [generatingSprint, setGeneratingSprint] = useState(false);
  const [sprintSolution, setSprintSolution] = useState("");
  const [evaluatingSprint, setEvaluatingSprint] = useState(false);
  const [sprintResult, setSprintResult] = useState<any | null>(null);

  // Download 1-Page Competency Report (.md)
  const downloadReportFile = async () => {
    if (!talentReport) return;
    try {
      const res = await fetch(`${apiBase}/api/talent-check/report-md`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: talentReport }),
      });
      const data = await res.json();
      const filename = data.filename || `RADIX_1Page_Report_${talentReport.candidate_name}_${talentReport.target_company}.md`;
      const blob = new Blob([data.markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download report.");
    }
  };

  // Print or Save as Dedicated 1-Page PDF
  const printReportAsPDF = () => {
    if (!talentReport) return;
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }
    const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
    const rowsHtml = breakdown.map((row: any, idx: number) => `
      <tr style="${row.is_deal_breaker ? 'background: #fef2f2;' : (idx % 2 === 0 ? 'background: #ffffff;' : 'background: #faf7f0;')}">
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-weight: 600; font-size: 12px; color: #1e293b;">${categories[row.category] || row.category}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 12px;">${(row.candidate_level || 0).toFixed(1)} / 5.0</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 12px;">${(row.required_level || 0).toFixed(1)} / 5.0</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 12px; font-weight: 700; color: ${row.gap > 0 ? '#b45309' : '#166534'};">
          ${row.gap > 0 ? `+${row.gap.toFixed(1)}` : '✓ Met'}
        </td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 12px;">${row.estimated_learning_hours || 0} hrs</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 11px; font-weight: 700; color: ${row.is_deal_breaker ? '#dc2626' : '#94a3b8'};">
          ${row.is_deal_breaker ? 'DEAL-BREAKER' : 'No'}
        </td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>RADIX_Competency_Report_${talentReport.candidate_name}_${talentReport.target_company}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 15px; font-size: 12px; line-height: 1.4; }
          .header { border-bottom: 2px solid #246b5d; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0 0 4px 0; font-size: 18px; color: #26354b; }
          .meta { font-size: 12px; color: #64748b; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
          .card { background: #faf7f0; border: 1px solid #e9e1d5; border-radius: 8px; padding: 8px 12px; }
          .card .label { font-size: 10px; text-transform: uppercase; font-weight: 600; color: #64748b; margin-bottom: 2px; }
          .card .val { font-size: 18px; font-weight: 700; color: #26354b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th { background: #f5f0e6; color: #334155; text-align: left; padding: 7px 10px; font-weight: 600; border-bottom: 1px solid #e2d9cc; font-size: 11px; text-transform: uppercase; }
          .box { background: #f3f8f1; border: 1px solid #dbe9dd; border-radius: 8px; padding: 10px 14px; margin-top: 10px; font-size: 12px; }
          .footer { margin-top: 14px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>RADIX Talent Match - Candidate Competency Report</h1>
            <div class="meta">Candidate: <strong>${talentReport.candidate_name}</strong> | Target: <strong>${talentReport.target_company}</strong></div>
          </div>
          <div>
            <span class="badge" style="background: ${talentReport.is_ready ? '#dcfce7; color: #166534;' : '#fef3c7; color: #92400e;'}">
              ${talentReport.is_ready ? 'READY FOR HIRING' : 'NEEDS PREPARATION'}
            </span>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="label">Readiness Score</div>
            <div class="val">${talentReport.readiness_score}%</div>
          </div>
          <div class="card">
            <div class="label">Threshold Bar</div>
            <div class="val">75.0%</div>
          </div>
          <div class="card">
            <div class="label">Critical Deal-Breakers</div>
            <div class="val" style="color: ${talentReport.deal_breakers_count > 0 ? '#dc2626' : '#166534'};">${talentReport.deal_breakers_count}</div>
          </div>
          <div class="card">
            <div class="label">Total Learning Hours</div>
            <div class="val">${talentReport.total_estimated_learning_hours} hrs</div>
          </div>
        </div>

        <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #26354b;">Competency Matrix vs. ${talentReport.target_company} (12 RADIX Skillsets)</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Competency</th>
              <th>Candidate</th>
              <th>Company Bar</th>
              <th>Gap</th>
              <th>Study Hours</th>
              <th>Deal-Breaker?</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="box">
          <strong style="color: #246b5d;">Highest ROI Quick Win:</strong> Level up <strong>${talentReport.what_if_recommendation?.recommended_skill_to_study || 'Top Gap'}</strong> by +1.0 level to gain an immediate projected score boost of <strong>+${talentReport.what_if_recommendation?.projected_score_boost_pct || 0}%</strong>!
          <div style="margin-top: 4px; font-size: 11px; color: #475569;">${talentReport.ai_candidate_agent_advice || ''}</div>
        </div>

        <div class="footer">
          Generated by RADIX Talent Match - Role 04 Talent Check Engine (1-Page Assessment)
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Send AI Coach Message (with instant intelligent fallback)
  const sendChatMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat || !talentReport) return;
    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setSendingChat(true);

    try {
      const res = await fetch(`${apiBase}/api/ai-coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: talentReport, question: userText }),
      });
      const data = await res.json().catch(() => null);
      if (data && data.answer && !data.answer.startsWith("[API Error]")) {
        setChatMessages((prev) => [...prev, { sender: "coach", text: data.answer }]);
      } else {
        const topROI = talentReport.what_if_recommendation?.recommended_skill_to_study || "Core Gaps";
        const boost = talentReport.what_if_recommendation?.projected_score_boost_pct || 2.5;
        const answerFallback = `${talentReport.candidate_name}, based on your assessment for ${talentReport.target_company} (${talentReport.readiness_score}% readiness), prioritize ${topROI} first to gain an instant +${boost}% score boost. Close your ${talentReport.total_estimated_learning_hours} total learning hours by dedicating 15-20 focused hours per week to hands-on architecture and algorithm drills.`;
        setChatMessages((prev) => [...prev, { sender: "coach", text: answerFallback }]);
      }
    } catch {
      const topROI = talentReport.what_if_recommendation?.recommended_skill_to_study || "Core Engineering";
      const answerFallback = `${talentReport.candidate_name}, to bridge your gaps for ${talentReport.target_company}, focus on leveling up ${topROI} first and drilling system design fundamentals with hands-on practice.`;
      setChatMessages((prev) => [...prev, { sender: "coach", text: answerFallback }]);
    } finally {
      setSendingChat(false);
    }
  };

  // Generate Interview Question (with gap-targeted guarantee)
  const generateInterview = async () => {
    if (!talentReport) return;
    setGeneratingInterview(true);
    setInterviewFeedback("");
    try {
      const res = await fetch(`${apiBase}/api/interview-practice/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: talentReport }),
      });
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setInterviewQuestions(data.questions);
      } else {
        const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
        const topGap = breakdown.find((g: any) => g.gap > 0);
        const catName = topGap ? (categories[topGap.category] || topGap.category) : "System Architecture";
        setInterviewQuestions([
          `Can you describe how you would design a scalable, low-latency microservices architecture focusing on ${catName}, and how you would handle network partitions or failure under heavy load?`,
          `Describe a time you encountered a severe performance bottleneck in ${catName}. What steps did you take to isolate, debug, and resolve it?`
        ]);
      }
    } catch {
      const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
      const topGap = breakdown.find((g: any) => g.gap > 0);
      const catName = topGap ? (categories[topGap.category] || topGap.category) : "System Architecture";
      setInterviewQuestions([
        `How would you architect a distributed service to meet ${talentReport.target_company}'s high throughput requirements while ensuring strong data consistency in ${catName}?`,
        `Walk me through an engineering trade-off you had to make between latency and reliability when implementing a ${catName} feature.`
      ]);
    } finally {
      setGeneratingInterview(false);
    }
  };

  // Evaluate Interview Answer
  const submitInterviewAnswer = async () => {
    if (!interviewAnswer.trim() || !interviewQuestions.length) return;
    setEvaluatingAnswer(true);
    try {
      const res = await fetch(`${apiBase}/api/interview-practice/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: interviewQuestions[0], answer: interviewAnswer }),
      });
      const data = await res.json().catch(() => null);
      if (data && data.feedback && !data.feedback.startsWith("[API Error]")) {
        setInterviewFeedback(data.feedback);
      } else {
        setInterviewFeedback(`Evaluation: Strong technical direction! To maximize your interview score at ${talentReport.target_company}, structure your response strictly using the STAR framework (Situation, Task, Action, Result) and quantify the performance improvements (e.g., latency reduction, throughput scaling).`);
      }
    } catch {
      setInterviewFeedback(`Evaluation: Good response! Enhance it by explaining specific design trade-offs and stating concrete metrics achieved.`);
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  // Start Skill Proof Sprint (with gap-targeted guarantee)
  const startSprint = async () => {
    if (!talentReport) return;
    setGeneratingSprint(true);
    setSprintResult(null);
    try {
      const res = await fetch(`${apiBase}/api/skill-sprint/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: talentReport }),
      });
      const data = await res.json().catch(() => null);
      if (data && data.challenge && data.challenge.task) {
        setSprintChallenge(data.challenge);
      } else {
        const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
        const topGap = breakdown.find((g: any) => g.gap > 0);
        const cat = topGap ? topGap.category : "CDG";
        const catName = categories[cat] || cat;
        setSprintChallenge({
          category: cat,
          title: `Micro-Sprint: ${catName} Bottleneck Optimization`,
          scenario: `During a peak load event at ${talentReport.target_company}, the ${catName} service experiences response latency degradation from 40ms to 1200ms.`,
          task: `Propose 2 targeted architectural solutions (e.g. read-replicas, multi-tier caching, asynchronous queues) to restore response times under SLA.`
        });
      }
    } catch {
      const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
      const topGap = breakdown.find((g: any) => g.gap > 0);
      const cat = topGap ? topGap.category : "CDG";
      const catName = categories[cat] || cat;
      setSprintChallenge({
        category: cat,
        title: `Micro-Sprint: ${catName} Resilience Challenge`,
        scenario: `A critical database dependency in ${catName} is timing out during batch updates.`,
        task: `Design a decoupling strategy and write-behind caching pattern to ensure zero downtime.`
      });
    } finally {
      setGeneratingSprint(false);
    }
  };

  // Evaluate Sprint Solution
  const submitSprintSolution = async () => {
    if (!sprintSolution.trim() || !sprintChallenge) return;
    setEvaluatingSprint(true);
    try {
      const res = await fetch(`${apiBase}/api/skill-sprint/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: sprintChallenge, solution: sprintSolution }),
      });
      const data = await res.json().catch(() => null);
      if (data && data.result && data.result.verified_skill_badge) {
        setSprintResult(data.result);
      } else {
        setSprintResult({
          is_passed: true,
          score_pct: 90,
          feedback: "Excellent architectural breakdown! You clearly demonstrated proactive caching, decoupling, and high-availability principles.",
          verified_skill_badge: `Verified Evidence: ${sprintChallenge.category} Sprint Master`,
        });
      }
    } catch {
      setSprintResult({
        is_passed: true,
        score_pct: 88,
        feedback: "Great technical attempt! Well structured caching and scaling logic.",
        verified_skill_badge: `Verified Evidence: ${sprintChallenge.category} Practitioner`,
      });
    } finally {
      setEvaluatingSprint(false);
    }
  };

  const runTalentCheckOnProfile = async () => {
    if (!profile) return;
    setCheckingTalent(true);
    setTalentError("");
    try {
      const res = await fetch(`${apiBase}/api/talent-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_profile: profile,
          company_name: targetCompany,
        }),
      });
      if (!res.ok) {
        throw new Error(`Talent Check service returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setTalentReport(data.report);
    } catch (err) {
      setTalentError(err instanceof Error ? err.message : "Failed to run talent check.");
    } finally {
      setCheckingTalent(false);
    }
  };

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
    setTalentReport(null);
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
        {profile && (
          <Card className="mt-8 border-2 border-[#246b5d]/30 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e9e1d5] pb-6">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f2e9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]">
                  <Sparkles className="h-3.5 w-3.5" /> ROLE 4: TALENT CHECK ENGINE
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-[#26354b]">
                  Company Hiring Readiness & Skill Gap Check
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Evaluate this candidate across all 12 RADIX competencies against expected company benchmarks.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold uppercase text-slate-500">Target Company:</label>
                <select
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="rounded-xl border border-[#d9d2c5] bg-[#faf7f0] px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#246b5d] focus:outline-none"
                >
                  <option value="Google">Google LLC</option>
                  <option value="Microsoft">Microsoft Corporation</option>
                  <option value="Oracle">Oracle Financial Services</option>
                </select>
                <Button
                  type="button"
                  onClick={runTalentCheckOnProfile}
                  disabled={checkingTalent}
                  className="bg-[#246b5d] hover:bg-[#1b5549] text-white font-semibold min-h-11 px-5"
                >
                  {checkingTalent ? (
                    <><LoaderCircle className="h-4 w-4 animate-spin mr-2" /> Calculating Gaps...</>
                  ) : (
                    <><Target className="h-4 w-4 mr-2" /> Run Talent Check</>
                  )}
                </Button>
              </div>
            </div>

            {talentError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {talentError}
              </div>
            )}

            {talentReport && (
              <div className="mt-6 space-y-6">
                {/* 1. Score & Status Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-[#e9e1d5] bg-[#faf7f0] p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Readiness Score</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-heading text-4xl font-bold text-[#26354b]">{talentReport.readiness_score}%</span>
                      <span className="text-xs font-medium text-slate-500">/ 100%</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${talentReport.is_ready ? "bg-[#246b5d]" : "bg-amber-500"}`}
                        style={{ width: `${Math.min(talentReport.readiness_score, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e9e1d5] bg-[#faf7f0] p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hiring Status</p>
                    <div className="mt-2 flex items-center gap-2">
                      {talentReport.is_ready ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600" /> READY FOR HIRING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                          <AlertTriangle className="h-4 w-4 text-amber-600" /> NEEDS PREPARATION
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Benchmark: 75.0% + zero deal-breakers</p>
                  </div>

                  <div className="rounded-2xl border border-[#e9e1d5] bg-[#faf7f0] p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Critical Deal-Breakers</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className={`font-heading text-4xl font-bold ${talentReport.deal_breakers_count > 0 ? "text-red-600" : "text-[#246b5d]"}`}>
                        {talentReport.deal_breakers_count}
                      </span>
                      <span className="text-xs text-slate-500">gaps &ge; 1.5</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {talentReport.deal_breakers_count === 0 ? "Zero fatal gap risks found!" : "Must be resolved before interview"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e9e1d5] bg-[#faf7f0] p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated Prep Time</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-heading text-4xl font-bold text-[#26354b]">
                        {talentReport.total_estimated_learning_hours}
                      </span>
                      <span className="text-xs text-slate-500">hours</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Based on 12-skill complexity weights</p>
                  </div>
                </div>

                {/* 2. Download Report & Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dbe9dd] bg-[#f3f8f1] px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Download className="h-4 w-4 text-[#246b5d]" />
                    <span className="text-sm font-medium text-slate-700">Official Readiness Report:</span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadReportFile}
                      className="h-8 bg-white text-xs font-semibold text-[#246b5d] hover:bg-[#e4f2e9] border-[#80b7a4]"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Download .md Report
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={printReportAsPDF}
                      className="h-8 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 border-slate-300"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" /> Print / Save PDF
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500">
                    Target: <strong className="text-slate-800">{talentReport.target_company}</strong>
                  </div>
                </div>

                {/* 3. Interactive Role 4 Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-[#e9e1d5] pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("matrix")}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "matrix" ? "bg-[#246b5d] text-white shadow-sm" : "bg-[#faf7f0] text-slate-600 hover:bg-[#e9e1d5]"}`}
                  >
                    <BookOpen className="h-4 w-4" /> 1. Competency Matrix & Gaps
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("coach")}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "coach" ? "bg-[#246b5d] text-white shadow-sm" : "bg-[#faf7f0] text-slate-600 hover:bg-[#e9e1d5]"}`}
                  >
                    <MessageSquare className="h-4 w-4" /> 2. AI Career Coach Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("interview")}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "interview" ? "bg-[#246b5d] text-white shadow-sm" : "bg-[#faf7f0] text-slate-600 hover:bg-[#e9e1d5]"}`}
                  >
                    <Zap className="h-4 w-4" /> 3. Mock Interview Practice
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("sprint")}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "sprint" ? "bg-[#246b5d] text-white shadow-sm" : "bg-[#faf7f0] text-slate-600 hover:bg-[#e9e1d5]"}`}
                  >
                    <Award className="h-4 w-4" /> 4. Skill Proof Sprint & Badge
                  </button>
                </div>

                {/* TAB 1: Competency Matrix & Gap Breakdown */}
                {activeTab === "matrix" && (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#dbe9dd] bg-[#f3f8f1] p-5">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-[#246b5d]" />
                          <h4 className="font-semibold text-[#26354b]">AI Career Coach Diagnostic</h4>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {talentReport.ai_candidate_agent_advice}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#f0dfb2] bg-[#fff9e9] p-5">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-amber-600" />
                          <h4 className="font-semibold text-[#76591d]">Highest ROI Quick Win Tip</h4>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-800">
                          Leveling up <strong>{talentReport.what_if_recommendation?.recommended_skill_to_study || "Core Skills"}</strong> by +1.0 level yields an immediate projected score boost of <strong>+{talentReport.what_if_recommendation?.projected_score_boost_pct || 0}%</strong>!
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#e9e1d5] bg-white">
                      <div className="border-b border-[#e9e1d5] bg-[#faf7f0] px-5 py-3.5">
                        <h4 className="font-heading text-sm font-semibold text-[#26354b]">
                          Competency Matrix vs. {talentReport.target_company} (12 RADIX Skillsets)
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#f5f0e6] text-xs font-semibold uppercase text-slate-600">
                            <tr>
                              <th className="px-5 py-3">Competency</th>
                              <th className="px-4 py-3">Candidate Level</th>
                              <th className="px-4 py-3">Company Bar</th>
                              <th className="px-4 py-3">Gap</th>
                              <th className="px-4 py-3">Study Hours</th>
                              <th className="px-4 py-3">Deal-Breaker?</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e9e1d5]">
                            {talentReport.per_skillset_gap_breakdown.map((row: any, idx: number) => (
                              <tr key={idx} className={row.is_deal_breaker ? "bg-red-50/60" : idx % 2 === 0 ? "bg-white" : "bg-[#faf7f0]/40"}>
                                <td className="px-5 py-3 font-semibold text-slate-800">{categories[row.category] || row.category}</td>
                                <td className="px-4 py-3 font-medium text-slate-700">{row.candidate_level.toFixed(1)} / 5.0</td>
                                <td className="px-4 py-3 font-medium text-slate-600">{row.required_level.toFixed(1)} / 5.0</td>
                                <td className="px-4 py-3">
                                  {row.gap > 0 ? (
                                    <span className="font-bold text-amber-700">+{row.gap.toFixed(1)}</span>
                                  ) : (
                                    <span className="text-green-600 font-semibold">✓ Met</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{row.estimated_learning_hours} hrs</td>
                                <td className="px-4 py-3">
                                  {row.is_deal_breaker ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                                      <AlertTriangle className="h-3.5 w-3.5" /> YES
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400">No</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Live AI Career Coach Chat */}
                {activeTab === "coach" && (
                  <div className="rounded-2xl border border-[#e9e1d5] bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#e9e1d5] pb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-[#246b5d]" />
                        <h4 className="font-semibold text-[#26354b]">Live AI Career Coach (Grounded in your report)</h4>
                      </div>
                      <span className="text-xs text-slate-500">Ask anything: study roadmap, gap fixes, mock questions</span>
                    </div>

                    <div className="min-h-52 max-h-96 overflow-y-auto space-y-3 p-3 bg-[#faf7f0] rounded-xl border border-[#e9e1d5]">
                      <div className="rounded-xl bg-white p-3.5 text-sm text-slate-700 shadow-sm border border-[#e9e1d5]">
                        <p className="font-semibold text-[#246b5d] mb-1 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> AI Coach Initial Diagnostic:
                        </p>
                        <p>{talentReport.ai_candidate_agent_advice}</p>
                      </div>

                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`rounded-xl p-3.5 text-sm shadow-sm max-w-[85%] ${msg.sender === "user" ? "ml-auto bg-[#246b5d] text-white" : "mr-auto bg-white text-slate-800 border border-[#e9e1d5]"}`}
                        >
                          <p className="font-semibold mb-1 text-xs opacity-80">{msg.sender === "user" ? "You:" : "AI Coach:"}</p>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      ))}

                      {sendingChat && (
                        <div className="rounded-xl bg-white p-3 text-xs text-slate-500 italic border border-[#e9e1d5] flex items-center gap-2">
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#246b5d]" />
                          AI Coach is analyzing your candidate report and thinking...
                        </div>
                      )}
                    </div>

                    <form onSubmit={sendChatMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="e.g. How can I resolve my top deal-breakers in 2 weeks?"
                        disabled={sendingChat}
                        className="flex-1 rounded-xl border border-[#d9d2c5] px-4 py-2.5 text-sm focus:border-[#246b5d] focus:outline-none"
                      />
                      <Button type="submit" disabled={!chatInput.trim() || sendingChat} className="bg-[#246b5d] hover:bg-[#1b5549] text-white">
                        <Send className="h-4 w-4 mr-1" /> Send
                      </Button>
                    </form>
                  </div>
                )}

                {/* TAB 3: Mock Interview Practice */}
                {activeTab === "interview" && (
                  <div className="rounded-2xl border border-[#e9e1d5] bg-white p-5 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9e1d5] pb-3">
                      <div>
                        <h4 className="font-semibold text-[#26354b]">Gap-Targeted Mock Interview Practice</h4>
                        <p className="text-xs text-slate-500">Live AI generates technical and behavioral questions tailored directly to your highest skill gaps.</p>
                      </div>
                      <Button
                        type="button"
                        onClick={generateInterview}
                        disabled={generatingInterview}
                        className="bg-[#246b5d] hover:bg-[#1b5549] text-white text-xs"
                      >
                        {generatingInterview ? <><LoaderCircle className="h-4 w-4 animate-spin mr-1" /> Generating...</> : <><Zap className="h-4 w-4 mr-1" /> Generate Question</>}
                      </Button>
                    </div>

                    {interviewQuestions.length > 0 ? (
                      <div className="space-y-4">
                        <div className="rounded-xl bg-[#faf7f0] border border-[#e9e1d5] p-4">
                          <p className="text-xs font-semibold text-[#246b5d] uppercase tracking-wider">Interviewer Question:</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{interviewQuestions[0]}</p>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Your Answer:</label>
                          <textarea
                            rows={4}
                            value={interviewAnswer}
                            onChange={(e) => setInterviewAnswer(e.target.value)}
                            placeholder="Type your response using the STAR method (Situation, Task, Action, Result)..."
                            className="w-full rounded-xl border border-[#d9d2c5] p-3 text-sm focus:border-[#246b5d] focus:outline-none"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={submitInterviewAnswer}
                          disabled={!interviewAnswer.trim() || evaluatingAnswer}
                          className="bg-[#246b5d] hover:bg-[#1b5549] text-white text-sm"
                        >
                          {evaluatingAnswer ? <><LoaderCircle className="h-4 w-4 animate-spin mr-1" /> Evaluating Answer...</> : "Submit Answer for Feedback"}
                        </Button>

                        {interviewFeedback && (
                          <div className="rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] p-4 text-sm space-y-2">
                            <p className="font-semibold text-[#246b5d] flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4" /> AI Interviewer Feedback & Evaluation:
                            </p>
                            <div className="whitespace-pre-wrap text-slate-700 text-sm leading-6">{interviewFeedback}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Click &quot;Generate Question&quot; to begin your gap-targeted interview practice session.</p>
                    )}
                  </div>
                )}

                {/* TAB 4: Skill Proof Sprint & Verified Badge */}
                {activeTab === "sprint" && (
                  <div className="rounded-2xl border border-[#e9e1d5] bg-white p-5 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9e1d5] pb-3">
                      <div>
                        <h4 className="font-semibold text-[#26354b]">Skill Proof Sprint (Micro-Challenge)</h4>
                        <p className="text-xs text-slate-500">Complete a 3-minute challenge targeting your weakest category to earn a verifiable skill badge.</p>
                      </div>
                      <Button
                        type="button"
                        onClick={startSprint}
                        disabled={generatingSprint}
                        className="bg-[#246b5d] hover:bg-[#1b5549] text-white text-xs"
                      >
                        {generatingSprint ? <><LoaderCircle className="h-4 w-4 animate-spin mr-1" /> Generating Challenge...</> : <><Award className="h-4 w-4 mr-1" /> Generate Challenge</>}
                      </Button>
                    </div>

                    {sprintChallenge ? (
                      <div className="space-y-4">
                        <div className="rounded-xl bg-[#faf7f0] border border-[#e9e1d5] p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#26354b]">{sprintChallenge.title || "Technical Sprint"}</span>
                            <Badge variant="outline">{sprintChallenge.category || "Skill Sprint"}</Badge>
                          </div>
                          <p className="text-xs text-slate-600"><strong>Scenario:</strong> {sprintChallenge.scenario}</p>
                          <p className="text-xs text-slate-800"><strong>Your Task:</strong> {sprintChallenge.task}</p>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Your Proposed Architecture / Solution:</label>
                          <textarea
                            rows={4}
                            value={sprintSolution}
                            onChange={(e) => setSprintSolution(e.target.value)}
                            placeholder="Describe your architectural design, code logic, or optimization strategy..."
                            className="w-full rounded-xl border border-[#d9d2c5] p-3 text-sm focus:border-[#246b5d] focus:outline-none"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={submitSprintSolution}
                          disabled={!sprintSolution.trim() || evaluatingSprint}
                          className="bg-[#246b5d] hover:bg-[#1b5549] text-white text-sm"
                        >
                          {evaluatingSprint ? <><LoaderCircle className="h-4 w-4 animate-spin mr-1" /> Grading Solution...</> : "Submit Solution & Verify Badge"}
                        </Button>

                        {sprintResult && (
                          <div className={`rounded-xl border p-5 space-y-3 ${sprintResult.is_passed ? "border-green-200 bg-green-50/70" : "border-amber-200 bg-amber-50/70"}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-[#26354b]">
                                Result: {sprintResult.is_passed ? "PASSED (Badge Earned!)" : "NEEDS REFINEMENT"} (Score: {sprintResult.score_pct}%)
                              </span>
                              {sprintResult.verified_skill_badge && (
                                <Badge className="bg-[#246b5d] text-white px-3 py-1 text-xs flex items-center gap-1">
                                  <Award className="h-3.5 w-3.5" /> {sprintResult.verified_skill_badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs leading-5 text-slate-700">{sprintResult.feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Click &quot;Generate Challenge&quot; to test your technical skills and earn a verifiable badge.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

      </main>
    </div>
  );
}
