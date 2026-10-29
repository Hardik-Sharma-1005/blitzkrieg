import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CandidateSkill = {
  skill_name: string;
  category_code: string;
  evidence: string;
  confidence: "high" | "medium" | "low";
};

export type ProfileEntry = string | Record<string, unknown>;

export type ParsedCandidateProfile = {
  source_type: "resume";
  source_file: string;
  cv_file?: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  education: ProfileEntry[];
  projects: ProfileEntry[];
  hackathons: ProfileEntry[];
  internships: ProfileEntry[];
  certifications: string[];
  achievements: string[];
  preferred_roles: string[];
  skills: CandidateSkill[];
  extraction_mode: "llm_live" | "offline_heuristic" | "offline_heuristic_fallback";
};

export type AssessmentKind = "mock_interview" | "skill_proof_sprint";
export type CandidateSkillBadge = {
  skill_name: string;
  category_code: string;
  assessments: AssessmentKind[];
  evidence: string[];
  awarded_at: string;
};

type ProfileContextValue = {
  profile: ParsedCandidateProfile | null;
  badges: CandidateSkillBadge[];
  profileReviewed: boolean;
  interviewCompleted: boolean;
  readinessChecked: boolean;
  skippedSteps: string[];
  applyResume: (profile: ParsedCandidateProfile) => void;
  updateBasicInfo: (updates: Pick<ParsedCandidateProfile, "name" | "email" | "phone" | "location" | "linkedin" | "github">) => void;
  awardBadge: (skill: CandidateSkill, assessment: AssessmentKind, evidence: string) => void;
  clearProfile: () => void;
  markProfileReviewed: () => void;
  markInterviewCompleted: () => void;
  markReadinessChecked: () => void;
  setStepSkipped: (stepKey: string, skipped: boolean) => void;
};

const storageKey = "blitzkrieg-candidate-session-v1";
const ProfileContext = createContext<ProfileContextValue | null>(null);

function readSession(): { profile: ParsedCandidateProfile | null; badges: CandidateSkillBadge[]; profileReviewed: boolean; interviewCompleted: boolean; readinessChecked: boolean; skippedSteps: string[] } {
  try {
    const saved = window.sessionStorage.getItem(storageKey);
    if (!saved) return { profile: null, badges: [], profileReviewed: false, interviewCompleted: false, readinessChecked: false, skippedSteps: [] };
    const parsed = JSON.parse(saved) as { profile?: ParsedCandidateProfile | null; badges?: CandidateSkillBadge[]; profileReviewed?: boolean; interviewCompleted?: boolean; readinessChecked?: boolean; skippedSteps?: string[] };
    if (!parsed.profile || !Array.isArray(parsed.profile.skills)) return { profile: null, badges: [], profileReviewed: false, interviewCompleted: false, readinessChecked: false, skippedSteps: [] };
    const savedBadges = Array.isArray(parsed.badges) ? parsed.badges : [];
    const legacyInterviewCompleted = savedBadges.some((badge) => Array.isArray(badge.assessments) && badge.assessments.includes("mock_interview"));
    const badges = savedBadges.flatMap((badge) => {
      const assessments = Array.isArray(badge.assessments) ? badge.assessments.filter((assessment) => assessment === "skill_proof_sprint") : [];
      return assessments.length ? [{ ...badge, assessments }] : [];
    });
    return { profile: parsed.profile, badges, profileReviewed: parsed.profileReviewed === true, interviewCompleted: parsed.interviewCompleted === true || legacyInterviewCompleted, readinessChecked: parsed.readinessChecked === true, skippedSteps: Array.isArray(parsed.skippedSteps) ? parsed.skippedSteps : [] };
  } catch {
    return { profile: null, badges: [], profileReviewed: false, interviewCompleted: false, readinessChecked: false, skippedSteps: [] };
  }
}

export function CandidateProfileProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readSession);

  useEffect(() => {
    try {
      if (session.profile) window.sessionStorage.setItem(storageKey, JSON.stringify(session));
      else window.sessionStorage.removeItem(storageKey);
    } catch {
      // The app remains usable when browser session storage is disabled.
    }
  }, [session]);

  const applyResume = useCallback((profile: ParsedCandidateProfile) => {
    setSession({ profile: { ...profile }, badges: [], profileReviewed: false, interviewCompleted: false, readinessChecked: false, skippedSteps: [] });
  }, []);

  const updateBasicInfo = useCallback((updates: Pick<ParsedCandidateProfile, "name" | "email" | "phone" | "location" | "linkedin" | "github">) => {
    setSession((current) => current.profile ? { ...current, profile: { ...current.profile, ...updates } } : current);
  }, []);

  const awardBadge = useCallback((skill: CandidateSkill, assessment: AssessmentKind, evidence: string) => {
    setSession((current) => {
      if (!current.profile) return current;
      const existingIndex = current.badges.findIndex((badge) => badge.skill_name.toLowerCase() === skill.skill_name.toLowerCase());
      if (existingIndex >= 0) {
        const badges = [...current.badges];
        const existing = badges[existingIndex];
        badges[existingIndex] = {
          ...existing,
          assessments: existing.assessments.includes(assessment) ? existing.assessments : [...existing.assessments, assessment],
          evidence: evidence && !existing.evidence.includes(evidence) ? [...existing.evidence, evidence] : existing.evidence,
        };
        return { ...current, badges };
      }
      return {
        ...current,
        badges: [...current.badges, {
          skill_name: skill.skill_name,
          category_code: skill.category_code,
          assessments: [assessment],
          evidence: evidence ? [evidence] : [],
          awarded_at: new Date().toISOString(),
        }],
      };
    });
  }, []);

  const clearProfile = useCallback(() => setSession({ profile: null, badges: [], profileReviewed: false, interviewCompleted: false, readinessChecked: false, skippedSteps: [] }), []);
  const markProfileReviewed = useCallback(() => setSession((current) => current.profile ? { ...current, profileReviewed: true } : current), []);
  const markInterviewCompleted = useCallback(() => setSession((current) => current.profile ? { ...current, interviewCompleted: true } : current), []);
  const markReadinessChecked = useCallback(() => setSession((current) => ({ ...current, readinessChecked: true })), []);
  const setStepSkipped = useCallback((stepKey: string, skipped: boolean) => setSession((current) => ({
    ...current,
    skippedSteps: skipped ? [...new Set([...current.skippedSteps, stepKey])] : current.skippedSteps.filter((key) => key !== stepKey),
  })), []);
  const value = useMemo(() => ({ profile: session.profile, badges: session.badges, profileReviewed: session.profileReviewed, interviewCompleted: session.interviewCompleted, readinessChecked: session.readinessChecked, skippedSteps: session.skippedSteps, applyResume, updateBasicInfo, awardBadge, clearProfile, markProfileReviewed, markInterviewCompleted, markReadinessChecked, setStepSkipped }), [session, applyResume, updateBasicInfo, awardBadge, clearProfile, markProfileReviewed, markInterviewCompleted, markReadinessChecked, setStepSkipped]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useCandidateProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useCandidateProfile must be used inside CandidateProfileProvider");
  return value;
}
