from pathlib import Path

file_path = Path(r"C:\Users\HP\OneDrive\Desktop\Documents\GitHub\jss-placement-intelligence-portal\src\pages\ResumeProfile.tsx")
content = file_path.read_text(encoding="utf-8")

# Define resetInteractiveSessions right after sprintResult state
sprint_marker = "  const [sprintResult, setSprintResult] = useState<any | null>(null);"
reset_func = """  const [sprintResult, setSprintResult] = useState<any | null>(null);

  // Automatically reset all interactive sessions when candidate changes
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
  };"""

content = content.replace(sprint_marker, reset_func)

# Call resetInteractiveSessions in runTalentCheckOnProfile
old_talent_success = "      setTalentReport(data.report);"
new_talent_success = """      setTalentReport(data.report);
      resetInteractiveSessions();"""
content = content.replace(old_talent_success, new_talent_success)

# Call in chooseFile
old_choose_file = """  const chooseFile = (candidate: File | undefined) => {
    if (loading) return;
    setError("");
    setProfile(null);"""

new_choose_file = """  const chooseFile = (candidate: File | undefined) => {
    if (loading) return;
    setError("");
    setProfile(null);
    setTalentReport(null);
    resetInteractiveSessions();"""

content = content.replace(old_choose_file, new_choose_file)

# Call in parseResume
old_parse_resume = """  const parseResume = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setProfile(null);"""

new_parse_resume = """  const parseResume = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setProfile(null);
    setTalentReport(null);
    resetInteractiveSessions();"""

content = content.replace(old_parse_resume, new_parse_resume)

# Call in startOver
old_startover = """  const startOver = () => {
    setFile(null);
    setProfile(null);
    setTalentReport(null);"""

new_startover = """  const startOver = () => {
    setFile(null);
    setProfile(null);
    setTalentReport(null);
    resetInteractiveSessions();"""

content = content.replace(old_startover, new_startover)

# Also reset when changing target company dropdown
old_select = 'onChange={(e) => setTargetCompany(e.target.value)}'
new_select = 'onChange={(e) => { setTargetCompany(e.target.value); setTalentReport(null); resetInteractiveSessions(); }}'
content = content.replace(old_select, new_select)

file_path.write_text(content, encoding="utf-8")
print("Successfully applied automatic candidate reset to ResumeProfile.tsx!")
