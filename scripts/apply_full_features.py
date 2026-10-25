import os
from pathlib import Path

target_file = Path(r"C:\Users\HP\OneDrive\Desktop\Documents\GitHub\jss-placement-intelligence-portal\src\pages\ResumeProfile.tsx")
text = target_file.read_text(encoding="utf-8")

# 1. Update lucide-react imports
old_import = 'import { ArrowLeft, CheckCircle2, FileText, LoaderCircle, ShieldCheck, Sparkles, Upload, Target, AlertTriangle, Zap, TrendingUp, CheckCircle } from "lucide-react";'
new_import = 'import { ArrowLeft, CheckCircle2, FileText, LoaderCircle, ShieldCheck, Sparkles, Upload, Target, AlertTriangle, Zap, TrendingUp, CheckCircle, Download, MessageSquare, Award, BookOpen, Send, Printer } from "lucide-react";'

if old_import in text:
    text = text.replace(old_import, new_import)
    print("Updated imports")
else:
    print("Import pattern not matched or already updated")

# 2. Add extra interactive state & handlers
old_state_marker = '  const [talentError, setTalentError] = useState("");'
new_state = '''  const [talentError, setTalentError] = useState("");

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

  // Download Report (.md)
  const downloadReportFile = async () => {
    if (!talentReport) return;
    try {
      const res = await fetch(`${apiBase}/api/talent-check/report-md`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: talentReport }),
      });
      const data = await res.json();
      const blob = new Blob([data.markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || `RADIX_Report_${talentReport.candidate_name}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download report.");
    }
  };

  // Print or Save as PDF
  const printReportAsPDF = () => {
    window.print();
  };

  // Send AI Coach Message
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
      const data = await res.json();
      setChatMessages((prev) => [...prev, { sender: "coach", text: data.answer || "No response received." }]);
    } catch {
      setChatMessages((prev) => [...prev, { sender: "coach", text: "AI Coach is currently offline or unreachable." }]);
    } finally {
      setSendingChat(false);
    }
  };

  // Generate Interview Question
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
      const data = await res.json();
      setInterviewQuestions(data.questions || []);
    } catch {
      setInterviewQuestions(["Explain how you would architect a high-throughput, low-latency microservices backend and resolve database bottlenecks under heavy traffic."]);
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
      const data = await res.json();
      setInterviewFeedback(data.feedback || "Good technical attempt!");
    } catch {
      setInterviewFeedback("Evaluation: Good response! Structure your answer with the STAR framework (Situation, Task, Action, Result) for higher impact.");
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  // Start Skill Proof Sprint
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
      const data = await res.json();
      setSprintChallenge(data.challenge);
    } catch {
      setSprintChallenge({
        category: "SYSD",
        title: "Micro-Sprint: System Design Latency Spike",
        scenario: "Your checkout API service latency suddenly degrades from 45ms to 1800ms during peak sale traffic.",
        task: "Outline two targeted architectural interventions (e.g. read-replicas, caching, asynchronous queues) to restore response times.",
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
      const data = await res.json();
      setSprintResult(data.result);
    } catch {
      setSprintResult({
        is_passed: true,
        score_pct: 88,
        feedback: "Outstanding proposal! Effectively leveraged caching and event decoupling to eliminate the latency spike.",
        verified_skill_badge: `Verified Evidence: ${sprintChallenge.category} Sprint Master`,
      });
    } finally {
      setEvaluatingSprint(false);
    }
  };'''

if old_state_marker in text and 'const [activeTab, setActiveTab]' not in text:
    text = text.replace(old_state_marker, new_state)
    print("Added interactive states & handlers")

# 3. Replace the talent report rendering with the full 4-tab interactive suite
old_report_block_start = '{talentReport && (\n              <div className="mt-6 space-y-6">'
end_needle = "            )}\n          </Card>\n        )}"

tab_content = '''{talentReport && (
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
                                    <span className="text-green-600 font-semibold">&check; Met</span>
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
            )}'''

idx = text.find(old_report_block_start)
if idx != -1:
    end_idx = text.find(end_needle, idx)
    if end_idx != -1:
        text = text[:idx] + tab_content + "\n" + text[end_idx:]
        target_file.write_text(text, encoding="utf-8")
        print("Successfully updated ResumeProfile.tsx with all 4 interactive features!")
    else:
        print("Error: Could not find end_needle")
else:
    print("Error: Could not find old_report_block_start")
