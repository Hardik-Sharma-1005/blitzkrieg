export type ActivityFeature =
  | "resume"
  | "profile"
  | "job-description"
  | "job-match"
  | "talent-check"
  | "assessment"
  | "readiness"
  | "company-comparison"
  | "company-intelligence"
  | "skill-intelligence";

export type RecentActivity = {
  id: string;
  feature: ActivityFeature;
  title: string;
  action: string;
  path: string;
  createdAt: number;
  hasSnapshot: boolean;
};

const activityKey = "blitzkrieg-recent-activity-v1";
const snapshotPrefix = "blitzkrieg-recent-snapshot-v1:";
const legacyActivityKey = "blitzkrieg-recent-activity";
const legacySnapshotPrefix = "blitzkrieg-recent-snapshot:";
const changedEvent = "blitzkrieg-recent-activity-changed";

const validFeatures = new Set<ActivityFeature>([
  "resume", "profile", "job-description", "job-match", "talent-check", "assessment", "readiness", "company-comparison",
  "company-intelligence", "skill-intelligence",
]);

export function formatActivityFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[._-]+/g, " ").trim();
  const words = base.split(/\s+/).filter(Boolean);
  if (!words.length) return "Processed file";
  const uppercase = new Set(["jd", "ai", "ml", "sql", "radix", "cv"]);
  return words.map((word) => uppercase.has(word.toLowerCase()) ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)).join(" ");
}

export function getRecentActivities(): RecentActivity[] {
  try {
    const currentValue = window.sessionStorage.getItem(activityKey);
    const parsed: unknown = JSON.parse(currentValue || window.sessionStorage.getItem(legacyActivityKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter((item): item is RecentActivity =>
      item && typeof item.id === "string" && validFeatures.has(item.feature) &&
      typeof item.title === "string" && typeof item.action === "string" &&
      typeof item.path === "string" && Number.isFinite(item.createdAt) &&
      typeof item.hasSnapshot === "boolean"
    );
    if (currentValue) return valid.sort((left, right) => right.createdAt - left.createdAt);

    const migrated = parsed.flatMap((item): RecentActivity[] => {
      if (!item || typeof item.id !== "string" || typeof item.title !== "string" || typeof item.action !== "string" || typeof item.path !== "string" || typeof item.createdAt !== "number") return [];
      const feature: ActivityFeature = item.path.includes("/jd-analytics")
        ? "job-description"
        : item.path.includes("/skill-match")
          ? item.action.toLowerCase().includes("match") ? "job-match" : item.action.toLowerCase().includes("job") ? "job-description" : "resume"
          : item.action.toLowerCase().includes("talent check") ? "talent-check" : "resume";
      return [{ id: item.id, title: item.title, action: item.action, path: item.path, createdAt: item.createdAt, feature, hasSnapshot: window.sessionStorage.getItem(legacySnapshotPrefix + item.id) !== null }];
    });
    window.sessionStorage.setItem(activityKey, JSON.stringify(migrated));
    return migrated.sort((left, right) => right.createdAt - left.createdAt);
  } catch {
    return [];
  }
}

export function recordRecentActivity<T>(
  entry: Omit<RecentActivity, "id" | "createdAt" | "hasSnapshot">,
  snapshot?: T,
): RecentActivity | null {
  try {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    let hasSnapshot = false;
    if (snapshot !== undefined) {
      try {
        window.sessionStorage.setItem(snapshotPrefix + id, JSON.stringify(snapshot));
        hasSnapshot = true;
      } catch {
        // Keep the activity even if a large result cannot be snapshotted.
      }
    }
    const activity: RecentActivity = { ...entry, id, createdAt: Date.now(), hasSnapshot };
    window.sessionStorage.setItem(activityKey, JSON.stringify([activity, ...getRecentActivities()]));
    window.dispatchEvent(new Event(changedEvent));
    return activity;
  } catch {
    return null;
  }
}

export function readRecentSnapshot<T>(id: unknown): T | null {
  if (typeof id !== "string") return null;
  try {
    const raw = window.sessionStorage.getItem(snapshotPrefix + id) ?? window.sessionStorage.getItem(legacySnapshotPrefix + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.kind === "jd") parsed.kind = "jd-analysis";
    if (parsed.kind === "resume-profile") parsed.kind = "resume-parsed";
    if (parsed.kind === "talent-check" && parsed.report === undefined && parsed.talentReport !== undefined) parsed.report = parsed.talentReport;
    return parsed as T;
  } catch {
    return null;
  }
}

export function removeRecentActivity(id: string): void {
  try {
    const next = getRecentActivities().filter((activity) => activity.id !== id);
    window.sessionStorage.removeItem(snapshotPrefix + id);
    window.sessionStorage.removeItem(legacySnapshotPrefix + id);
    window.sessionStorage.setItem(activityKey, JSON.stringify(next));
    window.dispatchEvent(new Event(changedEvent));
  } catch {
    // The current page remains usable if browser session storage is unavailable.
  }
}

export function clearRecentActivities(): void {
  try {
    for (const activity of getRecentActivities()) {
      window.sessionStorage.removeItem(snapshotPrefix + activity.id);
      window.sessionStorage.removeItem(legacySnapshotPrefix + activity.id);
    }
    window.sessionStorage.removeItem(activityKey);
    window.dispatchEvent(new Event(changedEvent));
  } catch {
    // The current page remains usable if browser session storage is unavailable.
  }
}

export function recentActivityEventName() {
  return changedEvent;
}

export function formatActivityTime(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "Time unavailable";
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(today.getDate() - 1);
  const dayLabel = date.toDateString() === today.toDateString()
    ? "Today"
    : date.toDateString() === yesterday.toDateString()
      ? "Yesterday"
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${dayLabel}, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}
