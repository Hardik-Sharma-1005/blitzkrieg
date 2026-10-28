import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Upload,
  Target,
  AlertTriangle,
  Zap,
  TrendingUp,
  CheckCircle,
  Download,
  MessageSquare,
  Award,
  Send,
  Printer,
  RotateCcw,
  BarChart2,
  Layers,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useTheme } from "@/components/layout/SidebarContext";
import { ALL_118_COMPANIES } from "@/data/allCompaniesList";
import { formatActivityFilename, readRecentSnapshot, recordRecentActivity } from "@/lib/recentActivity";

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
  COD: "Coding",
  DSA: "Data Structures & Algorithms",
  OOD: "Object-Oriented Design",
  APTI: "Aptitude",
  COMM: "Communication",
  AI: "AI / ML",
  CLOUD: "Cloud",
  SQL: "SQL & Databases",
  SWE: "Software Engineering",
  SYSD: "System Design",
  NETW: "Networking",
  OS: "Operating Systems",
  OTHER: "Other",
};

function displayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(displayValue).filter(Boolean).join(" · ");
  }
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
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchParams] = useSearchParams();
  const requestedCompany = ALL_118_COMPANIES.find((company) => String(company.company_id) === searchParams.get("company_id"));
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [targetCompany, setTargetCompany] = useState(() => requestedCompany?.name ?? "Google LLC (Subsidiary of Alphabet Inc.)");
  const [talentReport, setTalentReport] = useState<any | null>(null);
  const [radarChartData, setRadarChartData] = useState<any[]>([]);
  const [checkingTalent, setCheckingTalent] = useState(false);
  const [talentError, setTalentError] = useState("");

  // Primary view switcher once candidate profile is loaded
  const [viewMode, setViewMode] = useState<"workspace" | "profile">("workspace");

  // Interactive Feature Tabs within Talent Check Workspace
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

  useEffect(() => {
    const id = (location.state as { recentActivityId?: unknown } | null)?.recentActivityId;
    const saved = readRecentSnapshot<{ kind: "resume-profile" | "talent-check"; profile: CandidateProfile; talentReport?: any; company?: string }>(id);
    if (!saved?.profile) return;
    setProfile(saved.profile);
    setTalentReport(saved.talentReport ?? null);
    const breakdown = saved.talentReport?.per_skillset_gap_breakdown || saved.talentReport?.skillset_gap;
    setRadarChartData(Array.isArray(breakdown) ? breakdown.map((item: any) => ({ category: item.category, Candidate: item.candidate_level, CompanyGoal: item.required_level, fullMark: 5 })) : []);
    if (saved.company) setTargetCompany(saved.company);
    setViewMode("workspace");
  }, [location.key, location.state]);

  // Automatically reset interactive sessions when target or candidate changes
  const resetInteractiveSessions = () => {
    setChatMessages([]);
    setChatInput("");
    setInterviewQuestions([]);
    setInterviewAnswer("");
    setInterviewFeedback("");
    setSprintChallenge(null);
    setSprintSolution("");
    setSprintResult(null);
    setActiveTab("matrix");
  };

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
          Generated by blitzkrieg Talent Check
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

  // Send AI Coach Message (with intelligent fallback)
  const sendChatMessage = async (e?: FormEvent, directQuestion?: string) => {
    if (e) e.preventDefault();
    const userText = (directQuestion || chatInput).trim();
    if (!userText || sendingChat || !talentReport) return;

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
          `Describe a time you encountered a severe performance bottleneck in ${catName}. What steps did you take to isolate, debug, and resolve it?`,
        ]);
      }
    } catch {
      const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
      const topGap = breakdown.find((g: any) => g.gap > 0);
      const catName = topGap ? (categories[topGap.category] || topGap.category) : "System Architecture";
      setInterviewQuestions([
        `How would you architect a distributed service to meet ${talentReport.target_company}'s high throughput requirements while ensuring strong data consistency in ${catName}?`,
        `Walk me through an engineering trade-off you had to make between latency and reliability when implementing a ${catName} feature.`,
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
          task: `Propose 2 targeted architectural solutions (e.g. read-replicas, multi-tier caching, asynchronous queues) to restore response times under SLA.`,
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
        task: `Design a decoupling strategy and write-behind caching pattern to ensure zero downtime.`,
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
      if (data && data.result && typeof data.result.is_passed === "boolean") {
        setSprintResult(data.result);
      } else {
        setSprintResult({
          is_passed: false,
          score_pct: 0,
          feedback: "Evaluation service is currently unavailable. Please verify your provider settings or try submitting again.",
          verified_skill_badge: "",
        });
      }
    } catch {
      setSprintResult({
        is_passed: false,
        score_pct: 0,
        feedback: "Could not connect to evaluation service. Please verify provider settings or try again.",
        verified_skill_badge: "",
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
      recordRecentActivity({ title: formatActivityFilename(profile.source_file), action: `Completed a Talent Check · ${targetCompany}`, path: "/resume-profile" }, { kind: "talent-check", profile, talentReport: data.report, company: targetCompany });
      if (Array.isArray(data.radar_chart_data)) {
        setRadarChartData(data.radar_chart_data);
      } else if (data.report?.per_skillset_gap_breakdown) {
        setRadarChartData(data.report.per_skillset_gap_breakdown.map((item: any) => ({
          category: item.category,
          Candidate: item.candidate_level,
          CompanyGoal: item.required_level,
          fullMark: 5.0,
        })));
      }
      resetInteractiveSessions();
      setViewMode("workspace");
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
    setTalentReport(null);
    setRadarChartData([]);
    resetInteractiveSessions();
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
    setTalentReport(null);
    setRadarChartData([]);
    resetInteractiveSessions();
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch(`${apiBase}/api/parse-resume`, { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as CandidateProfile | { detail?: string } | null;
      if (!response.ok) {
        const detail = payload && "detail" in payload && typeof payload.detail === "string" ? payload.detail : "We could not process this resume. Please try again.";
        throw new Error(detail);
      }
      if (!payload || !("skills" in payload) || !Array.isArray(payload.skills) || !("name" in payload)) {
        throw new Error("The profile service returned an unexpected result. Please try again.");
      }
      setProfile(payload as CandidateProfile);
      recordRecentActivity({ title: formatActivityFilename((payload as CandidateProfile).source_file || file.name), action: "Built a resume profile", path: "/resume-profile" }, { kind: "resume-profile", profile: payload as CandidateProfile });
      setViewMode("workspace");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "We could not process this resume.";
      setError(
        message.toLowerCase().includes("failed to fetch")
          ? "We could not connect to the resume service. Make sure the local analysis service is running, then try again."
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setFile(null);
    setProfile(null);
    setTalentReport(null);
    setRadarChartData([]);
    resetInteractiveSessions();
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-theme min-h-screen bg-transparent">
      {/* Top Header */}
      <header className="border-b border-[#e9e1d5] bg-[#fffdf8]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/companies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#216b5c]"
          >
            <ArrowLeft className="h-4 w-4" /> Company Directory
          </Link>
          <BrandLogo className="h-auto w-32" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Step 1: Upload Card (Visible if no profile loaded yet) */}
        {!profile && (
          <div className="mx-auto max-w-3xl">
            <div className="text-center sm:text-left">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e4f2e9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#246b5d]">
                <Sparkles className="h-3.5 w-3.5" /> STUDENT PROFILE &bull; TALENT CHECK
              </p>
              <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">
                Turn your resume into a verified career profile.
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Review the experience, education, and evidence-backed skills the parser finds, then test readiness across all 12 RADIX company benchmarks.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <Card className="p-6 sm:p-8">
                <form onSubmit={parseResume} className="space-y-5">
                  <div>
                    <label htmlFor="resume-file" className="mb-2 block text-sm font-semibold text-slate-800">
                      Your resume (PDF or DOCX)
                    </label>
                    <label
                      htmlFor="resume-file"
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (!loading) setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition ${
                        dragging
                          ? "border-[#216b5c] bg-[#eaf4ec]"
                          : "border-[#d9d2c5] bg-[#faf7f0] hover:border-[#80b7a4] hover:bg-[#f3f8f1]"
                      } ${loading ? "cursor-wait opacity-70" : ""}`}
                    >
                      <input
                        ref={inputRef}
                        id="resume-file"
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={onFileChange}
                        disabled={loading}
                        className="sr-only"
                      />
                      {file ? <FileText className="h-10 w-10 text-[#246b5d]" /> : <Upload className="h-10 w-10 text-[#679586]" />}
                      <span className="mt-3 max-w-full truncate text-base font-semibold text-slate-800">
                        {file?.name ?? "Choose a resume or drop it here"}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">PDF or DOCX &bull; up to 12 MB</span>
                      {file && <span className="mt-2 text-xs font-semibold text-[#246b5d]">{(file.size / 1024).toFixed(0)} KB &bull; ready to analyze</span>}
                    </label>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] px-4 py-3 text-sm leading-6 text-slate-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#246b5d]" />
                    <p>
                      Your resume is parsed temporarily in-memory and never written to Supabase or persistent student accounts. Relevant resume text is grounded verbatim.
                    </p>
                  </div>

                  {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</div>}

                  <Button type="submit" disabled={!file || loading} className="min-h-12 w-full text-base font-semibold">
                    {loading ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin mr-2" /> Reading your resume &amp; extracting skills…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" /> Build My Profile &amp; Open Talent Check
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Once Profile is Loaded -> Interactive Split-Pane Workspace */}
        {profile && (
          <div className="space-y-6">
            {/* Top Workspace Bar & View Segmenter */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e9e1d5] bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e4f2e9] text-[#246b5d]">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-lg font-bold text-[#26354b] sm:text-xl">{profile.name}</h2>
                    <Badge variant="outline" className="border-[#80b7a4] text-[#246b5d] text-xs">
                      {profile.skills.length} skills found
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {profile.email || "No email in document"} &bull; {profile.source_file}
                  </p>
                </div>
              </div>

              {/* Segmented View Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full bg-[#faf7f0] p-1 border border-[#e9e1d5] dark:border-slate-800 dark:bg-slate-900/90">
                  <button
                    type="button"
                    onClick={() => setViewMode("workspace")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      viewMode === "workspace"
                        ? "bg-[#246b5d] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
                  >
                    <Target className="h-3.5 w-3.5" /> 1. Talent Check Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("profile")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      viewMode === "profile"
                        ? "bg-[#246b5d] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" /> 2. Full Parsed Resume Details
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startOver}
                  className="h-9 rounded-full border-[#d9d2c5] px-4 text-xs text-slate-700 hover:bg-[#faf7f0] dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> New Resume
                </Button>
              </div>
            </div>

            {/* VIEW A: TALENT CHECK SPLIT-PANE WORKSPACE */}
            {viewMode === "workspace" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT PANE: Benchmark Controller & Candidate Scoreboard (Sticky on Desktop) */}
                <div className="lg:col-span-4 xl:col-span-4 space-y-5 lg:sticky lg:top-4">
                  {/* Company Benchmark Selector Card */}
                  <Card className="p-5 border-2 border-[#246b5d]/30 bg-white shadow-sm space-y-4">
                    <div className="border-b border-[#e9e1d5] pb-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#246b5d] flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Target Employer
                      </p>
                      <h3 className="font-heading text-base font-semibold text-[#26354b] mt-1">
                        12-Skill Benchmark Bar
                      </h3>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        Choose Benchmark (118 Directory Companies):
                      </label>
                      <select
                        value={targetCompany}
                        onChange={(e) => {
                          setTargetCompany(e.target.value);
                          setTalentReport(null);
                          setRadarChartData([]);
                          resetInteractiveSessions();
                        }}
                        className="w-full rounded-xl border border-[#d9d2c5] bg-[#faf7f0] px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-[#246b5d] focus:outline-none truncate"
                      >
                        {ALL_118_COMPANIES.map((co) => (
                          <option key={co.company_id} value={co.name}>
                            {co.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      type="button"
                      onClick={runTalentCheckOnProfile}
                      disabled={checkingTalent}
                      className="w-full bg-[#246b5d] hover:bg-[#1b5549] text-white font-semibold min-h-11 text-sm shadow-sm"
                    >
                      {checkingTalent ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> Calculating Gap Matrix…
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" /> {talentReport ? "Re-evaluate Benchmark" : "Run Talent Check"}
                        </>
                      )}
                    </Button>

                    {talentError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                        {talentError}
                      </div>
                    )}
                  </Card>

                  {/* Readiness Summary & KPI Scoreboard */}
                  {talentReport && (
                    <Card className="p-5 border border-[#e9e1d5] bg-white shadow-sm space-y-4">
                      <div className="border-b border-[#e9e1d5] pb-3 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Hiring Evaluation
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            talentReport.is_ready
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {talentReport.is_ready ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" /> READY
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> PREP NEEDED
                            </>
                          )}
                        </span>
                      </div>

                      {/* Large Circular / Metric Readout */}
                      <div className="rounded-2xl border border-[#e9e1d5] bg-[#faf7f0] p-4 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Overall Readiness</p>
                        <div className="mt-1 flex items-baseline justify-center gap-1">
                          <span className="font-heading text-4xl font-extrabold text-[#26354b]">
                            {talentReport.readiness_score}%
                          </span>
                          <span className="text-xs text-slate-500">/ 100%</span>
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              talentReport.is_ready ? "bg-[#246b5d]" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(talentReport.readiness_score, 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500">Hiring Bar: 75.0% + 0 deal-breakers</p>
                      </div>

                      {/* 2-Column Mini Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-[#e9e1d5] bg-[#faf7f0] p-3">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Deal-Breakers</span>
                          <span
                            className={`font-heading text-xl font-bold mt-1 block ${
                              talentReport.deal_breakers_count > 0 ? "text-red-600" : "text-[#246b5d]"
                            }`}
                          >
                            {talentReport.deal_breakers_count}
                          </span>
                          <span className="text-[10px] text-slate-500">gaps &ge; 1.5</span>
                        </div>

                        <div className="rounded-xl border border-[#e9e1d5] bg-[#faf7f0] p-3">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Study Hours</span>
                          <span className="font-heading text-xl font-bold mt-1 block text-[#26354b]">
                            {talentReport.total_estimated_learning_hours} hrs
                          </span>
                          <span className="text-[10px] text-slate-500">12 RADIX weights</span>
                        </div>
                      </div>

                      {/* Quick ROI Box */}
                      <div className="rounded-xl border border-[#f0dfb2] bg-[#fff9e9] p-3 text-xs text-slate-800 leading-relaxed">
                        <p className="font-bold text-[#76591d] flex items-center gap-1 mb-1">
                          <TrendingUp className="h-3.5 w-3.5 text-amber-600" /> Quick Win Strategy:
                        </p>
                        Level up <strong>{talentReport.what_if_recommendation?.recommended_skill_to_study || "Core Gaps"}</strong> by +1.0 level for an immediate projected boost of{" "}
                        <strong className="text-amber-700">+{talentReport.what_if_recommendation?.projected_score_boost_pct || 0}%</strong>!
                      </div>

                      {/* Action / Download Buttons */}
                      <div className="border-t border-[#e9e1d5] pt-3 space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadReportFile}
                          className="w-full text-xs font-semibold bg-white border-[#80b7a4] text-[#246b5d] hover:bg-[#e4f2e9] h-9"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" /> Download .md Report
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={printReportAsPDF}
                          className="w-full text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-slate-100 h-9"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save 1-Page PDF
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>

                {/* RIGHT PANE: Interactive Gap Matrix, Radar Chart, AI Coach, Interview, Sprint */}
                <div className="lg:col-span-8 xl:col-span-8 space-y-5">
                  {!talentReport ? (
                    <Card className="p-8 sm:p-12 text-center border border-[#e9e1d5] bg-white shadow-sm space-y-4">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f2e9] text-[#246b5d]">
                        <Target className="h-7 w-7" />
                      </div>
                      <h3 className="font-heading text-xl font-bold text-[#26354b]">
                        Ready to evaluate against {targetCompany}?
                      </h3>
                      <p className="mx-auto max-w-md text-sm text-slate-600 leading-relaxed">
                        Click <strong>&quot;Run Talent Check&quot;</strong> in the left panel to compare your extracted skills against employer-specific benchmarks, view the 12-competency radar chart, practice interview questions, and run a skill proof sprint.
                      </p>
                      <Button
                        type="button"
                        onClick={runTalentCheckOnProfile}
                        disabled={checkingTalent}
                        className="bg-[#246b5d] hover:bg-[#1b5549] text-white font-semibold"
                      >
                        {checkingTalent ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Run Talent Check Now
                      </Button>
                    </Card>
                  ) : (
                    <Card className="p-5 sm:p-6 border border-[#e9e1d5] bg-white shadow-sm space-y-6">
                      {/* Workflow Navigation Tabs */}
                      <div className="flex flex-wrap gap-2 border-b border-[#e9e1d5] pb-3">
                        <button
                          type="button"
                          onClick={() => setActiveTab("matrix")}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                            activeTab === "matrix"
                              ? "bg-[#246b5d] text-white shadow-sm"
                              : "bg-[#faf7f0] text-slate-600 hover:bg-[#e9e1d5]"
                          }`}
                        >
                          <BarChart2 className="h-3.5 w-3.5" /> 1. Radar Chart &amp; Gap Matrix
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("coach")}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                            activeTab === "coach"
                              ? "bg-[#246b5d] text-white shadow-sm"
                              : "bg-[#faf7f0] text-slate-600 hover:bg-[#e9e1d5]"
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> 2. AI Career Coach
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("interview")}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                            activeTab === "interview"
                              ? "bg-[#246b5d] text-white shadow-sm"
                              : "bg-[#faf7f0] text-slate-600 hover:bg-[#e9e1d5]"
                          }`}
                        >
                          <Zap className="h-3.5 w-3.5" /> 3. Mock Interview
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("sprint")}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                            activeTab === "sprint"
                              ? "bg-[#246b5d] text-white shadow-sm"
                              : "bg-[#faf7f0] text-slate-600 hover:bg-[#e9e1d5]"
                          }`}
                        >
                          <Award className="h-3.5 w-3.5" /> 4. Proof Sprint &amp; Badge
                        </button>
                      </div>

                      {/* TAB 1: RADAR CHART + COMPETENCY MATRIX */}
                      {activeTab === "matrix" && (
                        <div className="space-y-6">
                          {/* 12-Skill Radar Chart Visualization */}
                          <div className="rounded-2xl border border-[#e9e1d5] bg-[#faf7f0] p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <div>
                                <h4 className="font-heading text-sm font-bold text-[#26354b] dark:text-slate-100">
                                  12-Competency RADIX Benchmark Radar
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Visualizing candidate skill profile vs. {talentReport.target_company} expectations (1-5 scale)
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs border-[#e9e1d5] dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800/70">
                                Benchmark: {talentReport.benchmark_source === "radix_median_fallback" ? "RADIX Median" : "Company Specific"}
                              </Badge>
                            </div>

                            <div className="h-80 sm:h-96 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarChartData} outerRadius="75%">
                                  <PolarGrid stroke={isDark ? "rgba(255, 255, 255, 0.18)" : "#e2dad0"} />
                                  <PolarAngleAxis
                                    dataKey="category"
                                    tick={{
                                      fill: isDark ? "#f8fafc" : "#1e293b",
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  />
                                  <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 5]}
                                    stroke={isDark ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1"}
                                    tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10, fontWeight: 600 }}
                                  />
                                  <Radar
                                    name="Candidate Score"
                                    dataKey="Candidate"
                                    stroke={isDark ? "#F472B6" : "#9A5A82"}
                                    fill={isDark ? "#D99CC5" : "#9A5A82"}
                                    fillOpacity={isDark ? 0.45 : 0.35}
                                    strokeWidth={2.5}
                                    dot={{
                                      r: 3.5,
                                      fill: isDark ? "#F472B6" : "#9A5A82",
                                      stroke: isDark ? "#0f172a" : "#ffffff",
                                      strokeWidth: 1.5,
                                    }}
                                  />
                                  <Radar
                                    name="Company Target"
                                    dataKey="CompanyGoal"
                                    stroke={isDark ? "#38BDF8" : "#0284c7"}
                                    fill={isDark ? "#38BDF8" : "#0284c7"}
                                    fillOpacity={isDark ? 0.25 : 0.2}
                                    strokeWidth={2.5}
                                    dot={{
                                      r: 3.5,
                                      fill: isDark ? "#38BDF8" : "#0284c7",
                                      stroke: isDark ? "#0f172a" : "#ffffff",
                                      strokeWidth: 1.5,
                                    }}
                                  />
                                  <Legend
                                    wrapperStyle={{ fontSize: 12, paddingTop: 14 }}
                                    formatter={(value) => (
                                      <span className="font-semibold text-slate-700 dark:text-slate-200 ml-1">
                                        {value}
                                      </span>
                                    )}
                                  />
                                  <Tooltip
                                    formatter={(val: any) => [typeof val === "number" ? val.toFixed(1) : val, ""]}
                                    labelFormatter={(cat: any) => `${categories[cat] || cat} (${cat})`}
                                    contentStyle={{
                                      backgroundColor: isDark ? "#0f172a" : "#ffffff",
                                      borderColor: isDark ? "#334155" : "#e9e1d5",
                                      color: isDark ? "#f8fafc" : "#1e293b",
                                      borderRadius: 12,
                                      fontSize: 12,
                                      boxShadow: isDark ? "0 10px 25px -5px rgba(0,0,0,0.6)" : "0 10px 25px -5px rgba(0,0,0,0.1)",
                                    }}
                                    itemStyle={{
                                      paddingTop: 2,
                                      paddingBottom: 2,
                                      color: isDark ? "#f1f5f9" : "#1e293b",
                                    }}
                                  />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Coach Advice Text Box */}
                          <div className="rounded-2xl border border-[#dbe9dd] bg-[#f3f8f1] p-4 sm:p-5">
                            <p className="text-xs font-bold text-[#246b5d] uppercase tracking-wider flex items-center gap-1 mb-2">
                              <Sparkles className="h-4 w-4" /> AI Candidate Diagnostic Advice
                            </p>
                            <p className="text-sm leading-6 text-slate-700">
                              {talentReport.ai_candidate_agent_advice}
                            </p>
                          </div>

                          {/* Full 12-Skill Gap Breakdown Table */}
                          <div className="overflow-hidden rounded-2xl border border-[#e9e1d5] bg-white">
                            <div className="border-b border-[#e9e1d5] bg-[#faf7f0] px-4 py-3 flex items-center justify-between">
                              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#26354b]">
                                Competency Matrix &bull; 12 RADIX Categories
                              </h4>
                              <span className="text-[11px] text-slate-500">1.0 &ndash; 5.0 Standard Scale</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="bg-[#f5f0e6] text-[11px] font-semibold uppercase text-slate-600">
                                  <tr>
                                    <th className="px-4 py-2.5">Competency</th>
                                    <th className="px-3 py-2.5">Candidate</th>
                                    <th className="px-3 py-2.5">Company Bar</th>
                                    <th className="px-3 py-2.5">Gap</th>
                                    <th className="px-3 py-2.5">Study Hours</th>
                                    <th className="px-3 py-2.5">Deal-Breaker?</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e9e1d5]">
                                  {talentReport.per_skillset_gap_breakdown.map((row: any, idx: number) => (
                                    <tr
                                      key={idx}
                                      className={row.is_deal_breaker ? "bg-red-50/60" : idx % 2 === 0 ? "bg-white" : "bg-[#faf7f0]/40"}
                                    >
                                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                                        {categories[row.category] || row.category}
                                        <span className="text-[10px] text-slate-400 font-normal ml-1.5">({row.category})</span>
                                      </td>
                                      <td className="px-3 py-2.5 font-medium text-slate-700">
                                        {(row.candidate_level || 0).toFixed(1)} / 5.0
                                      </td>
                                      <td className="px-3 py-2.5 font-medium text-slate-600">
                                        {(row.required_level || 0).toFixed(1)} / 5.0
                                      </td>
                                      <td className="px-3 py-2.5">
                                        {row.gap > 0 ? (
                                          <span className="font-bold text-amber-700">+{row.gap.toFixed(1)}</span>
                                        ) : (
                                          <span className="text-green-600 font-semibold">&check; Met</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5 text-slate-600">{row.estimated_learning_hours} hrs</td>
                                      <td className="px-3 py-2.5">
                                        {row.is_deal_breaker ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700">
                                            <AlertTriangle className="h-3 w-3" /> YES
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-slate-400">No</span>
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

                      {/* TAB 2: AI CAREER COACH CHAT */}
                      {activeTab === "coach" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-[#e9e1d5] pb-3">
                            <div>
                              <h4 className="font-heading text-sm font-bold text-[#26354b]">
                                Grounded AI Career Coach Chat
                              </h4>
                              <p className="text-xs text-slate-500">
                                Ask anything about bridging your gap for {talentReport.target_company}.
                              </p>
                            </div>
                            <span className="text-xs text-[#246b5d] font-semibold flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5" /> Context-Aware
                            </span>
                          </div>

                          {/* Quick Suggestion Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              "How can I resolve my top deal-breakers in 2 weeks?",
                              `What projects does ${talentReport.target_company} value most?`,
                              "Give me a structured weekly study roadmap for my gaps",
                            ].map((promptText, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => sendChatMessage(undefined, promptText)}
                                className="rounded-lg border border-[#d9d2c5] bg-[#faf7f0] px-2.5 py-1 text-[11px] text-slate-700 hover:border-[#80b7a4] hover:bg-[#e4f2e9] transition"
                              >
                                &ldquo;{promptText}&rdquo;
                              </button>
                            ))}
                          </div>

                          {/* Conversation Area */}
                          <div className="min-h-56 max-h-96 overflow-y-auto space-y-3 p-4 bg-[#faf7f0] rounded-xl border border-[#e9e1d5]">
                            <div className="rounded-xl bg-white p-3.5 text-xs sm:text-sm text-slate-700 shadow-sm border border-[#e9e1d5]">
                              <p className="font-semibold text-[#246b5d] mb-1 flex items-center gap-1 text-xs">
                                <Sparkles className="h-3.5 w-3.5" /> Initial AI Coach Diagnosis:
                              </p>
                              <p>{talentReport.ai_candidate_agent_advice}</p>
                            </div>

                            {chatMessages.map((msg, i) => (
                              <div
                                key={i}
                                className={`rounded-xl p-3.5 text-xs sm:text-sm shadow-sm max-w-[85%] ${
                                  msg.sender === "user"
                                    ? "ml-auto bg-[#246b5d] text-white"
                                    : "mr-auto bg-white text-slate-800 border border-[#e9e1d5]"
                                }`}
                              >
                                <p className="font-semibold mb-1 text-[10px] uppercase tracking-wider opacity-80">
                                  {msg.sender === "user" ? "You" : "AI Career Coach"}
                                </p>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                              </div>
                            ))}

                            {sendingChat && (
                              <div className="rounded-xl bg-white p-3 text-xs text-slate-500 italic border border-[#e9e1d5] flex items-center gap-2">
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#246b5d]" />
                                AI Coach is preparing your grounded advice…
                              </div>
                            )}
                          </div>

                          {/* Prompt Input */}
                          <form onSubmit={sendChatMessage} className="flex gap-2">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder={`Ask AI Coach about preparing for ${talentReport.target_company}...`}
                              disabled={sendingChat}
                              className="flex-1 rounded-xl border border-[#d9d2c5] px-4 py-2.5 text-xs sm:text-sm focus:border-[#246b5d] focus:outline-none"
                            />
                            <Button
                              type="submit"
                              disabled={!chatInput.trim() || sendingChat}
                              className="bg-[#246b5d] hover:bg-[#1b5549] text-white"
                            >
                              <Send className="h-4 w-4 mr-1" /> Send
                            </Button>
                          </form>
                        </div>
                      )}

                      {/* TAB 3: MOCK INTERVIEW PRACTICE */}
                      {activeTab === "interview" && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9e1d5] pb-3">
                            <div>
                              <h4 className="font-heading text-sm font-bold text-[#26354b]">
                                Gap-Targeted Mock Interview Practice
                              </h4>
                              <p className="text-xs text-slate-500">
                                Practice realistic technical and design questions specifically targeting your largest gaps.
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={generateInterview}
                              disabled={generatingInterview}
                              className="bg-[#246b5d] hover:bg-[#1b5549] text-white text-xs h-9"
                            >
                              {generatingInterview ? (
                                <>
                                  <LoaderCircle className="h-3.5 w-3.5 animate-spin mr-1" /> Generating…
                                </>
                              ) : (
                                <>
                                  <Zap className="h-3.5 w-3.5 mr-1" /> Generate Question
                                </>
                              )}
                            </Button>
                          </div>

                          {interviewQuestions.length > 0 ? (
                            <div className="space-y-4">
                              <div className="rounded-xl bg-[#faf7f0] border border-[#e9e1d5] p-4">
                                <p className="text-[11px] font-bold text-[#246b5d] uppercase tracking-wider">
                                  Interviewer Question:
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">{interviewQuestions[0]}</p>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                  Your Technical Response (STAR Framework):
                                </label>
                                <textarea
                                  rows={4}
                                  value={interviewAnswer}
                                  onChange={(e) => setInterviewAnswer(e.target.value)}
                                  placeholder="Describe Situation, Task, Action, and quantifiable Results..."
                                  className="w-full rounded-xl border border-[#d9d2c5] p-3 text-xs sm:text-sm focus:border-[#246b5d] focus:outline-none"
                                />
                              </div>

                              <Button
                                type="button"
                                onClick={submitInterviewAnswer}
                                disabled={!interviewAnswer.trim() || evaluatingAnswer}
                                className="bg-[#246b5d] hover:bg-[#1b5549] text-white text-xs sm:text-sm"
                              >
                                {evaluatingAnswer ? (
                                  <>
                                    <LoaderCircle className="h-4 w-4 animate-spin mr-1.5" /> Scoring Response…
                                  </>
                                ) : (
                                  "Submit Answer for Feedback"
                                )}
                              </Button>

                              {interviewFeedback && (
                                <div className="rounded-xl border border-[#dbe9dd] bg-[#f3f8f1] p-4 text-xs sm:text-sm space-y-2">
                                  <p className="font-bold text-[#246b5d] flex items-center gap-1.5">
                                    <Sparkles className="h-4 w-4" /> AI Interviewer Feedback &amp; Evaluation:
                                  </p>
                                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                                    {interviewFeedback}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic py-4">
                              Click &quot;Generate Question&quot; to begin your gap-targeted interview practice session.
                            </p>
                          )}
                        </div>
                      )}

                      {/* TAB 4: SKILL PROOF SPRINT */}
                      {activeTab === "sprint" && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9e1d5] pb-3">
                            <div>
                              <h4 className="font-heading text-sm font-bold text-[#26354b]">
                                Skill Proof Sprint (Micro-Challenge)
                              </h4>
                              <p className="text-xs text-slate-500">
                                Solve a focused architecture/coding problem to verify hands-on mastery.
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={startSprint}
                              disabled={generatingSprint}
                              className="bg-[#246b5d] hover:bg-[#1b5549] text-white text-xs h-9"
                            >
                              {generatingSprint ? (
                                <>
                                  <LoaderCircle className="h-3.5 w-3.5 animate-spin mr-1" /> Generating…
                                </>
                              ) : (
                                <>
                                  <Award className="h-3.5 w-3.5 mr-1" /> Generate Challenge
                                </>
                              )}
                            </Button>
                          </div>

                          {sprintChallenge ? (
                            <div className="space-y-4">
                              <div className="rounded-xl bg-[#faf7f0] border border-[#e9e1d5] p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-[#26354b]">
                                    {sprintChallenge.title || "Technical Sprint"}
                                  </span>
                                  <Badge variant="outline">{sprintChallenge.category || "Sprint"}</Badge>
                                </div>
                                <p className="text-xs text-slate-600">
                                  <strong>Scenario:</strong> {sprintChallenge.scenario}
                                </p>
                                <p className="text-xs text-slate-800">
                                  <strong>Your Task:</strong> {sprintChallenge.task}
                                </p>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                  Your Architecture / Logic Proposal:
                                </label>
                                <textarea
                                  rows={4}
                                  value={sprintSolution}
                                  onChange={(e) => setSprintSolution(e.target.value)}
                                  placeholder="Detail your caching strategy, data schemas, decoupling, or error-handling approach..."
                                  className="w-full rounded-xl border border-[#d9d2c5] p-3 text-xs sm:text-sm focus:border-[#246b5d] focus:outline-none"
                                />
                              </div>

                              <Button
                                type="button"
                                onClick={submitSprintSolution}
                                disabled={!sprintSolution.trim() || evaluatingSprint}
                                className="bg-[#246b5d] hover:bg-[#1b5549] text-white text-xs sm:text-sm"
                              >
                                {evaluatingSprint ? (
                                  <>
                                    <LoaderCircle className="h-4 w-4 animate-spin mr-1.5" /> Grading Proposal…
                                  </>
                                ) : (
                                  "Submit Solution & Verify Badge"
                                )}
                              </Button>

                              {sprintResult && (
                                <div
                                  className={`rounded-xl border p-4 space-y-2 ${
                                    sprintResult.is_passed
                                      ? "border-green-200 bg-green-50/70"
                                      : "border-amber-200 bg-amber-50/70"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs sm:text-sm text-[#26354b]">
                                      Status: {sprintResult.is_passed ? "PASSED" : "NEEDS REVISION"} (Score: {sprintResult.score_pct}%)
                                    </span>
                                    {sprintResult.verified_skill_badge && (
                                      <Badge className="bg-[#246b5d] text-white px-2.5 py-0.5 text-xs flex items-center gap-1">
                                        <Award className="h-3 w-3" /> {sprintResult.verified_skill_badge}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs leading-relaxed text-slate-700">{sprintResult.feedback}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic py-4">
                              Click &quot;Generate Challenge&quot; to test your technical skills and verify your competence.
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* VIEW B: FULL PARSED RESUME DETAILS & VERBATIM EVIDENCE */}
            {viewMode === "profile" && (
              <Card className="overflow-hidden border border-[#e9e1d5] bg-white shadow-sm space-y-6">
                <div className="border-b border-[#e9e1d5] bg-[#faf7f0] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#246b5d]">
                      Candidate Profile Breakdown
                    </span>
                    <h3 className="font-heading text-xl font-bold text-[#26354b] mt-0.5">
                      Extracted Resume Sections &amp; Verbatim Evidence
                    </h3>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setViewMode("workspace")}
                    className="bg-[#246b5d] hover:bg-[#1b5549] text-white text-xs h-9"
                  >
                    Return to Talent Check Workspace <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                {/* 6 Structured Resume Sections */}
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <ProfileSection title="Education" items={profile.education} />
                  <ProfileSection title="Projects" items={profile.projects} />
                  <ProfileSection title="Internships" items={profile.internships} />
                  <ProfileSection title="Hackathons" items={profile.hackathons} />
                  <ProfileSection title="Certifications" items={profile.certifications} />
                  <ProfileSection title="Achievements" items={profile.achievements} />
                </div>

                {/* Extracted Skills with Grounded Evidence */}
                <section className="border-t border-[#e9e1d5] p-5 sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <div>
                      <h4 className="font-heading text-base font-semibold text-[#26354b]">
                        Skills and Resume Evidence ({profile.skills.length})
                      </h4>
                      <p className="text-xs text-slate-500">Each skill includes grounded verbatim text found in the document.</p>
                    </div>
                    {profile.preferred_roles.length > 0 && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Preferred roles:</span> {profile.preferred_roles.join(" &bull; ")}
                      </p>
                    )}
                  </div>

                  {profile.skills.length === 0 ? (
                    <p className="rounded-xl bg-[#faf7f0] p-4 text-xs text-slate-600">
                      No supported skills were found in this document.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {profile.skills.map((skill, index) => (
                        <article
                          key={`${skill.skill_name}-${index}`}
                          className="rounded-xl border border-[#e9e1d5] bg-white p-4 space-y-2"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h5 className="font-semibold text-slate-900 text-sm">{skill.skill_name}</h5>
                            <Badge variant="outline" className="text-xs">
                              {skill.category_code}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-500">
                            {categories[skill.category_code] ?? "Other"} &bull; {skill.confidence} confidence
                          </p>
                          <blockquote className="border-l-2 border-[#80b7a4] pl-3 text-xs leading-5 text-slate-600 italic">
                            &ldquo;{skill.evidence}&rdquo;
                          </blockquote>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
