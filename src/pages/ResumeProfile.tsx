import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
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
  UserRound,
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
import { useCandidateProfile, type CandidateSkill as Skill, type ParsedCandidateProfile as CandidateProfile, type ProfileEntry } from "@/lib/candidateProfile";
import { formatActivityFilename, readRecentSnapshot, recordRecentActivity } from "@/lib/recentActivity";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();
  const navigate = useNavigate();
  const isTalentCheckRoute = location.pathname === "/talent-check";
  const [searchParams] = useSearchParams();
  const { profile: savedProfile, badges: savedBadges, applyResume, awardBadge } = useCandidateProfile();
  const requestedCompany = ALL_118_COMPANIES.find((company) => String(company.company_id) === searchParams.get("company_id"));
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [profileApplied, setProfileApplied] = useState(false);
  const [replaceWarning, setReplaceWarning] = useState(false);
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
    const saved = readRecentSnapshot<{ kind: "resume-parsed" | "talent-check"; profile: CandidateProfile; report?: any; company?: string; radarChartData?: any[]; activeTab?: "matrix" | "coach" | "interview" | "sprint"; chatMessages?: Array<{ sender: "user" | "coach"; text: string }>; interviewQuestions?: string[]; interviewAnswer?: string; interviewFeedback?: string; sprintChallenge?: any; sprintSolution?: string; sprintResult?: any }>(id);
    if (!saved?.profile) return;
    resetInteractiveSessions();
    setProfile(saved.profile);
    setProfileApplied(saved.kind === "talent-check");
    setTalentReport(saved.report ?? null);
    setRadarChartData(saved.radarChartData ?? []);
    if (saved.company) setTargetCompany(saved.company);
    setChatMessages(saved.chatMessages ?? []);
    setInterviewQuestions(saved.interviewQuestions ?? []);
    setInterviewAnswer(saved.interviewAnswer ?? "");
    setInterviewFeedback(saved.interviewFeedback ?? "");
    setSprintChallenge(saved.sprintChallenge ?? null);
    setSprintSolution(saved.sprintSolution ?? "");
    setSprintResult(saved.sprintResult ?? null);
    setActiveTab(saved.activeTab ?? "matrix");
    setViewMode("workspace");
  // The history item is the only input that should trigger a restore.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const skillForCategory = (categoryCode?: string): Skill => {
    const breakdown = talentReport?.per_skillset_gap_breakdown || talentReport?.skillset_gap || [];
    const code = categoryCode || breakdown.find((row: any) => row.gap > 0)?.category || "OTHER";
    const matched = profile?.skills.find((skill) => skill.category_code === code);
    return matched ?? { skill_name: categories[code] ?? code, category_code: code, evidence: "Assessed in a generated practice activity.", confidence: "low" };
  };

  const recordTalentActivity = (action: string, details: Record<string, unknown> = {}) => {
    if (!profile || !talentReport) return;
    recordRecentActivity({ feature: "talent-check", title: `${profile.name || "Candidate"} · ${targetCompany}`, action, path: "/talent-check" }, {
      kind: "talent-check", profile, report: talentReport, company: targetCompany, radarChartData, activeTab,
      chatMessages, interviewQuestions, interviewAnswer, interviewFeedback, sprintChallenge, sprintSolution, sprintResult,
      ...details,
    });
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
      recordTalentActivity("Downloaded Talent Check report", { activeTab: "matrix" });
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
    recordTalentActivity("Printed or saved Talent Check report", { activeTab: "matrix" });
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }
    const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
    const rowsHtml = breakdown.map((row: any, idx: number) => `
      <tr style="${idx % 2 === 0 ? 'background: #ffffff;' : 'background: #faf7f0;'}">
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-weight: 600; font-size: 12px; color: #1e293b;">${categories[row.category] || row.category}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 12px;">${profile?.skills.some((skill) => skill.category_code === row.category) ? 'Found in resume' : 'No evidence found'}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 12px;">${(row.required_level || 0).toFixed(1)} / 5.0</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e9e1d5; font-size: 12px;">${profile?.skills.some((skill) => skill.category_code === row.category) ? 'Validate through an assessment' : 'Build resume evidence'}</td>
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
            <h1>Resume Evidence and Company Benchmark Overview</h1>
            <div class="meta">Candidate: <strong>${talentReport.candidate_name}</strong> | Target: <strong>${talentReport.target_company}</strong></div>
          </div>
          <div><span class="badge" style="background: #e4f2e9; color: #246b5d;">BENCHMARK OVERVIEW</span></div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="label">Resume skill areas found</div>
            <div class="val">${new Set(profile?.skills.map((skill) => skill.category_code) ?? []).size}</div>
          </div>
          <div class="card">
            <div class="label">Company benchmark areas</div>
            <div class="val">${breakdown.length}</div>
          </div>
          <div class="card">
            <div class="label">Interpretation</div>
            <div class="val" style="font-size: 13px;">Informational</div>
          </div>
        </div>

        <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #26354b;">Competency Matrix vs. ${talentReport.target_company} (12 RADIX Skillsets)</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Competency</th>
              <th>Resume evidence</th>
              <th>Company target</th>
              <th>Suggested focus</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="box">
          <strong style="color: #246b5d;">How to use this overview:</strong> Resume mentions are evidence to review, not a measure of skill proficiency or a hiring decision. Use an assessment to validate a skill.
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
        const coachAnswer = String(data.answer);
        setChatMessages((prev) => [...prev, { sender: "coach", text: coachAnswer }]);
        recordTalentActivity("Asked the AI coach for guidance", { activeTab: "coach", chatMessages: [...chatMessages, { sender: "user", text: userText }, { sender: "coach", text: coachAnswer }] });
      } else {
        const answerFallback = "The coach is temporarily unavailable. Review the resume evidence next to the company benchmark, then use a practical assessment to validate any skill that matters for your target role.";
        setChatMessages((prev) => [...prev, { sender: "coach", text: answerFallback }]);
        recordTalentActivity("Requested AI coach guidance", { activeTab: "coach", chatMessages: [...chatMessages, { sender: "user", text: userText }, { sender: "coach", text: answerFallback }] });
      }
    } catch {
      const answerFallback = "The coach is temporarily unavailable. A missing resume mention is not proof that you lack a skill; consider adding relevant evidence or validating the skill through an assessment.";
      setChatMessages((prev) => [...prev, { sender: "coach", text: answerFallback }]);
      recordTalentActivity("Requested AI coach guidance", { activeTab: "coach", chatMessages: [...chatMessages, { sender: "user", text: userText }, { sender: "coach", text: answerFallback }] });
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
        recordTalentActivity("Generated mock interview questions", { activeTab: "interview", interviewQuestions: data.questions });
      } else {
        const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
        const topGap = breakdown.find((g: any) => g.gap > 0);
        const catName = topGap ? (categories[topGap.category] || topGap.category) : "System Architecture";
        const questions = [
          `Can you describe how you would design a scalable, low-latency microservices architecture focusing on ${catName}, and how you would handle network partitions or failure under heavy load?`,
          `Describe a time you encountered a severe performance bottleneck in ${catName}. What steps did you take to isolate, debug, and resolve it?`,
        ];
        setInterviewQuestions(questions);
        recordTalentActivity("Generated mock interview questions", { activeTab: "interview", interviewQuestions: questions });
      }
    } catch {
      const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
      const topGap = breakdown.find((g: any) => g.gap > 0);
      const catName = topGap ? (categories[topGap.category] || topGap.category) : "System Architecture";
      const questions = [
        `How would you architect a distributed service to meet ${talentReport.target_company}'s high throughput requirements while ensuring strong data consistency in ${catName}?`,
        `Walk me through an engineering trade-off you had to make between latency and reliability when implementing a ${catName} feature.`,
      ];
      setInterviewQuestions(questions);
      recordTalentActivity("Generated mock interview questions", { activeTab: "interview", interviewQuestions: questions });
    } finally {
      setGeneratingInterview(false);
    }
  };

  // Evaluate Interview Answer
  const submitInterviewAnswer = async () => {
    if (!profileApplied || !interviewAnswer.trim() || !interviewQuestions.length) return;
    setEvaluatingAnswer(true);
    try {
      const res = await fetch(`${apiBase}/api/interview-practice/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: interviewQuestions[0], answer: interviewAnswer, skill_name: skillForCategory().skill_name }),
      });
      const data = await res.json().catch(() => null);
      if (data && data.feedback && !data.feedback.startsWith("[API Error]")) {
        const status = data.evaluation_status === "unavailable" ? "NOT SCORED · No badge awarded" : data.is_passed ? `PASSED · ${data.score_pct}%` : `KEEP PRACTICING · ${data.score_pct ?? 0}%`;
        setInterviewFeedback(`${status}\n${data.feedback}`);
        recordTalentActivity("Submitted a mock interview answer", { activeTab: "interview", interviewAnswer, interviewFeedback: `${status}\n${data.feedback}` });
        if (data.is_passed === true && data.evaluation_status === "scored" && profileApplied) {
          const assessedSkill = skillForCategory();
          const alreadyEarned = savedBadges.some((badge) => badge.skill_name.toLowerCase() === assessedSkill.skill_name.toLowerCase());
          awardBadge(assessedSkill, "mock_interview", "Passed one generated Mock Interview question");
          toast.success(alreadyEarned ? `${assessedSkill.skill_name} badge updated with additional assessment evidence.` : `${assessedSkill.skill_name} badge added to your profile!`);
        }
      } else {
        const fallback = `Evaluation: Strong technical direction! To maximize your interview score at ${talentReport.target_company}, structure your response strictly using the STAR framework (Situation, Task, Action, Result) and quantify the performance improvements (e.g., latency reduction, throughput scaling).`;
        setInterviewFeedback(fallback);
        recordTalentActivity("Submitted a mock interview answer", { activeTab: "interview", interviewAnswer, interviewFeedback: fallback });
      }
    } catch {
      const fallback = "Evaluation: Good response! Enhance it by explaining specific design trade-offs and stating concrete metrics achieved.";
      setInterviewFeedback(fallback);
      recordTalentActivity("Submitted a mock interview answer", { activeTab: "interview", interviewAnswer, interviewFeedback: fallback });
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  // Start Skill Proof Sprint (with gap-targeted guarantee)
  const startSprint = async () => {
    if (!talentReport || !profileApplied) return;
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
        recordTalentActivity("Generated a Skill Proof Sprint challenge", { activeTab: "sprint", sprintChallenge: data.challenge });
      } else {
        const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
        const topGap = breakdown.find((g: any) => g.gap > 0);
        const cat = topGap ? topGap.category : "CDG";
        const catName = categories[cat] || cat;
        const challenge = {
          category: cat,
          title: `Micro-Sprint: ${catName} Bottleneck Optimization`,
          scenario: `During a peak load event at ${talentReport.target_company}, the ${catName} service experiences response latency degradation from 40ms to 1200ms.`,
          task: `Propose 2 targeted architectural solutions (e.g. read-replicas, multi-tier caching, asynchronous queues) to restore response times under SLA.`,
        };
        setSprintChallenge(challenge);
        recordTalentActivity("Generated a Skill Proof Sprint challenge", { activeTab: "sprint", sprintChallenge: challenge });
      }
    } catch {
      const breakdown = talentReport.per_skillset_gap_breakdown || talentReport.skillset_gap || [];
      const topGap = breakdown.find((g: any) => g.gap > 0);
      const cat = topGap ? topGap.category : "CDG";
      const catName = categories[cat] || cat;
      const challenge = {
        category: cat,
        title: `Micro-Sprint: ${catName} Resilience Challenge`,
        scenario: `A critical database dependency in ${catName} is timing out during batch updates.`,
        task: `Design a decoupling strategy and write-behind caching pattern to ensure zero downtime.`,
      };
      setSprintChallenge(challenge);
      recordTalentActivity("Generated a Skill Proof Sprint challenge", { activeTab: "sprint", sprintChallenge: challenge });
    } finally {
      setGeneratingSprint(false);
    }
  };

  // Evaluate Sprint Solution
  const submitSprintSolution = async () => {
    if (!profileApplied || !sprintSolution.trim() || !sprintChallenge) return;
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
        recordTalentActivity("Submitted a Skill Proof Sprint solution", { activeTab: "sprint", sprintSolution, sprintResult: data.result });
        if (data.result.is_passed === true && data.result.evaluation_status === "scored" && profileApplied) {
          const assessedSkill = skillForCategory(sprintChallenge.category);
          const alreadyEarned = savedBadges.some((badge) => badge.skill_name.toLowerCase() === assessedSkill.skill_name.toLowerCase());
          awardBadge(assessedSkill, "skill_proof_sprint", `Passed Skill Proof Sprint: ${sprintChallenge.title}`);
          toast.success(alreadyEarned ? `${assessedSkill.skill_name} badge updated with additional assessment evidence.` : `${assessedSkill.skill_name} badge added to your profile!`);
        }
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
      const radarData = Array.isArray(data.radar_chart_data)
        ? data.radar_chart_data
        : data.report?.per_skillset_gap_breakdown?.map((item: any) => ({ category: item.category, Candidate: item.candidate_level, CompanyGoal: item.required_level, fullMark: 5 })) ?? [];
      setTalentReport(data.report);
      setRadarChartData(radarData);
      recordRecentActivity({ feature: "talent-check", title: `${profile.name || "Candidate"} · ${targetCompany}`, action: "Completed a company Talent Check", path: "/talent-check" }, { kind: "talent-check", profile, report: data.report, company: targetCompany, radarChartData: radarData });
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
    setProfileApplied(false);
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
      const parsedProfile = payload as CandidateProfile;
      setProfile(parsedProfile);
      setProfileApplied(false);
      setViewMode("workspace");
      recordRecentActivity({ feature: "resume", title: formatActivityFilename(parsedProfile.source_file || file.name), action: "Parsed resume for profile building", path: "/resume-profile" }, { kind: "resume-parsed", profile: parsedProfile });
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
    setProfileApplied(false);
    setTalentReport(null);
    setRadarChartData([]);
    resetInteractiveSessions();
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const applyParsedResume = () => {
    if (!profile) return;
    applyResume(profile);
    recordRecentActivity({ feature: "profile", title: profile.name || formatActivityFilename(profile.source_file), action: "Built candidate profile from resume", path: "/candidate-profile" }, { kind: "candidate-profile", profile });
    setProfileApplied(true);
    setReplaceWarning(false);
    if (isTalentCheckRoute) setViewMode("workspace");
    else navigate("/candidate-profile");
    toast.success(savedProfile ? "Candidate profile updated from the new resume. Previous skill badges were removed." : "Candidate profile created from your resume.");
  };

  const requestApplyResume = () => {
    if (!profile) return;
    if (savedProfile) setReplaceWarning(true);
    else applyParsedResume();
  };

  return (
    <div className="space-theme min-h-screen bg-transparent">
      {replaceWarning && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="replace-profile-title" className="w-full max-w-md rounded-2xl border border-[#e9e1d5] bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><AlertTriangle className="h-5 w-5" /></span><div><h2 id="replace-profile-title" className="font-heading text-lg font-semibold text-[#26354b]">Replace your current profile?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Applying this resume will replace all current profile information{savedBadges.length ? ` and remove ${savedBadges.length === 1 ? "your skill badge" : "your skill badges"}` : " and clear any skill badges"}. This only affects this browser session.</p></div></div>
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setReplaceWarning(false)}>Cancel</Button><Button type="button" onClick={applyParsedResume}>Continue</Button></div>
          </section>
        </div>
      )}
      {/* Top Header */}
      <header className="border-b border-[#e9e1d5] bg-[#fffdf8]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/check-where-you-stand"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#216b5c]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to checklist
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
                <Sparkles className="h-3.5 w-3.5" /> TEMPORARY CANDIDATE PROFILE
              </p>
              <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[#26354b] sm:text-4xl">
                Build your temporary candidate profile from a resume.
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Parse a PDF or DOCX resume, then apply it to a session-only candidate profile. You can check job readiness separately when you choose.
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
                      Your profile stays in this browser tab session and is cleared when the tab closes. Resume text is not saved to a student account.
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
                        <Sparkles className="h-5 w-5 mr-2" /> Parse Resume
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}

        {profile && !profileApplied && <div className="mx-auto max-w-5xl space-y-5 pt-8">
          <Card className="space-y-4 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e4f2e9] text-[#246b5d]"><CheckCircle2 className="h-6 w-6" /></span><div><h1 className="font-heading text-2xl font-semibold text-[#26354b]">Resume parsing results</h1><p className="mt-1 text-sm leading-6 text-slate-600">Review what we extracted from {file?.name ?? profile.source_file}. You can edit your basic contact details after applying this profile.</p></div></div>
              <Badge variant="outline">{profile.skills.length} skills found</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {([ ["Name", profile.name], ["Email", profile.email], ["Phone", profile.phone], ["Location", profile.location], ["LinkedIn", profile.linkedin], ["GitHub", profile.github] ] as const).map(([label, value]) => <div key={label} className="rounded-xl bg-[#faf7f0] px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm text-slate-800">{value || "Not found"}</p></div>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileSection title="Education" items={profile.education} />
              <ProfileSection title="Projects" items={profile.projects} />
              <ProfileSection title="Internships" items={profile.internships} />
              <ProfileSection title="Hackathons" items={profile.hackathons} />
              <ProfileSection title="Certifications" items={profile.certifications} />
              <ProfileSection title="Achievements" items={profile.achievements} />
            </div>
            <section className="rounded-2xl border border-[#e9e1d5] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-heading text-base font-semibold text-[#26354b]">Extracted skills and evidence</h2><span className="text-xs text-slate-500">Resume mentions are not assessment badges.</span></div>
              {profile.skills.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{profile.skills.map((skill, index) => <article key={`${skill.skill_name}-${index}`} className="rounded-xl border border-[#e9e1d5] bg-[#faf7f0] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-900">{skill.skill_name}</h3><Badge variant="outline">{categories[skill.category_code] ?? skill.category_code}</Badge></div><p className="mt-1 text-xs text-slate-500">{skill.confidence} extraction confidence</p><blockquote className="mt-2 border-l-2 border-[#80b7a4] pl-3 text-sm leading-5 text-slate-700">“{skill.evidence}”</blockquote></article>)}</div> : <p className="mt-3 text-sm text-slate-500">No supported skills were found in this document.</p>}
            </section>
            <div className="flex flex-col gap-2 border-t border-[#e9e1d5] pt-4 sm:flex-row"><Button type="button" onClick={requestApplyResume} className="min-h-11 flex-1">Apply to Candidate Profile</Button><Button type="button" variant="outline" onClick={startOver} className="min-h-11">Choose another resume</Button></div>
          </Card>
        </div>}

        {/* Step 2: Once Profile is Loaded -> Interactive Split-Pane Workspace */}
        {profile && profileApplied && (
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
                {profileApplied && <Button asChild type="button" variant="outline" size="sm" className="h-9 rounded-full px-4 text-xs"><Link to="/candidate-profile"><UserRound className="mr-1 h-3.5 w-3.5" /> Candidate Profile</Link></Button>}
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
                          Resume evidence vs. company benchmark
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f2e9] px-2.5 py-0.5 text-xs font-bold text-[#246b5d]">
                          <><CheckCircle className="h-3.5 w-3.5 text-green-600" /> INFORMATIONAL</>
                        </span>
                      </div>

                      {/* Large Circular / Metric Readout */}
                      <div className="rounded-2xl border border-[#e9e1d5] bg-[#faf7f0] p-4 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Resume evidence found</p>
                        <div className="mt-1 flex items-baseline justify-center gap-1">
                          <span className="font-heading text-4xl font-extrabold text-[#26354b]">
                            {new Set(profile.skills.map((skill) => skill.category_code)).size}
                          </span>
                          <span className="text-xs text-slate-500">skill areas</span>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500">Resume mentions do not independently verify proficiency.</p>
                      </div>

                      {/* 2-Column Mini Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-[#e9e1d5] bg-[#faf7f0] p-3">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Benchmark areas</span>
                          <span
                            className={`font-heading text-xl font-bold mt-1 block ${
                              "text-[#246b5d]"
                            }`}
                          >
                            {talentReport.per_skillset_gap_breakdown?.length ?? talentReport.skillset_gap?.length ?? 0}
                          </span>
                          <span className="text-[10px] text-slate-500">in the company profile</span>
                        </div>

                        <div className="rounded-xl border border-[#e9e1d5] bg-[#faf7f0] p-3">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Resume skills</span>
                          <span className="font-heading text-xl font-bold mt-1 block text-[#26354b]">
                            {profile.skills.length}
                          </span>
                          <span className="text-[10px] text-slate-500">with source evidence</span>
                        </div>
                      </div>

                      {/* Quick ROI Box */}
                      <div className="rounded-xl border border-[#f0dfb2] bg-[#fff9e9] p-3 text-xs text-slate-800 leading-relaxed">
                        <p className="font-bold text-[#76591d] flex items-center gap-1 mb-1">
                          <TrendingUp className="h-3.5 w-3.5 text-amber-600" /> Quick Win Strategy:
                        </p>
                        Use the table as a guide to compare resume evidence with this company benchmark. A missing mention is not proof that you lack the skill; add evidence to your resume or validate it through an assessment.
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
                          <div className="hidden rounded-2xl border border-[#e9e1d5] bg-[#faf7f0] p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm transition-colors">
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

                          <div className="rounded-xl border border-[#e9e1d5] bg-white p-4 text-sm leading-6 text-slate-600">The resume parser identifies skill mentions and supporting text; it does not measure proficiency. Use the table below to compare evidence with the company benchmark, then use an assessment to validate skills.</div>

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
                                Resume Evidence Compared with Company Benchmark
                              </h4>
                              <span className="text-[11px] text-slate-500">Benchmark targets are informational</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="bg-[#f5f0e6] text-[11px] font-semibold uppercase text-slate-600">
                                  <tr>
                                    <th className="px-4 py-2.5">Competency</th>
                                    <th className="px-3 py-2.5">Resume evidence</th>
                                    <th className="px-3 py-2.5">Company target</th>
                                    <th className="px-3 py-2.5">Suggested focus</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e9e1d5]">
                                  {talentReport.per_skillset_gap_breakdown.map((row: any, idx: number) => (
                                    <tr
                                      key={idx}
                                      className={idx % 2 === 0 ? "bg-white" : "bg-[#faf7f0]/40"}
                                    >
                                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                                        {categories[row.category] || row.category}
                                        <span className="text-[10px] text-slate-400 font-normal ml-1.5">({row.category})</span>
                                      </td>
                                      <td className="px-3 py-2.5 font-medium text-slate-700">
                                        {profile.skills.some((skill) => skill.category_code === row.category) ? "Found in resume" : "No evidence found"}
                                      </td>
                                      <td className="px-3 py-2.5 font-medium text-slate-600">
                                        {(row.required_level || 0).toFixed(1)} / 5.0
                                      </td>
                                      <td className="px-3 py-2.5">
                                        {profile.skills.some((skill) => skill.category_code === row.category) ? <span className="text-slate-600">Validate with an assessment</span> : <span className="font-medium text-amber-700">Build resume evidence</span>}
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
                              "Which benchmark areas should I review first?",
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
                                {profileApplied ? "Practice a question based on your selected company benchmark." : "Apply this resume to your Candidate Profile before earning assessment badges."}
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={generateInterview}
                              disabled={generatingInterview || !profileApplied}
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
                                disabled={!profileApplied || !interviewAnswer.trim() || evaluatingAnswer}
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
                                {profileApplied ? "Solve a focused practical challenge to earn an applied skill badge." : "Apply this resume to your Candidate Profile before earning assessment badges."}
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={startSprint}
                              disabled={generatingSprint || !profileApplied}
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
                                disabled={!profileApplied || !sprintSolution.trim() || evaluatingSprint}
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
                                    {profileApplied && sprintResult.is_passed && sprintResult.evaluation_status === "scored" && (
                                      <Badge className="bg-[#246b5d] text-white px-2.5 py-0.5 text-xs flex items-center gap-1">
                                        <Award className="h-3 w-3" /> {skillForCategory(sprintChallenge.category).skill_name} badge earned
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
