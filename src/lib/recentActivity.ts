export type RecentActivity = {
  id: string;
  title: string;
  action: string;
  path: string;
  createdAt: number;
};

const activityKey = "blitzkrieg-recent-activity";
const snapshotPrefix = "blitzkrieg-recent-snapshot:";
const maxItems = 5;
const changedEvent = "blitzkrieg-recent-activity-changed";

export function formatActivityFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[._-]+/g, " ").trim();
  const words = base.split(/\s+/).filter(Boolean);
  if (!words.length) return "Processed file";
  const upper = new Set(["jd", "ai", "ml", "sql", "radix", "cv"]);
  const title = words.map((word) => upper.has(word.toLowerCase()) ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1).toLowerCase());
  const jdIndex = title.findIndex((word) => word === "JD");
  if (jdIndex >= 2) return `${title[0]} - ${title.slice(1).join(" ")}`;
  return title.join(" ");
}

export function getRecentActivities(): RecentActivity[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(activityKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is RecentActivity =>
      item && typeof item.id === "string" && typeof item.title === "string" && typeof item.action === "string" && typeof item.path === "string" && typeof item.createdAt === "number"
    ).slice(0, maxItems) : [];
  } catch { return []; }
}

export function recordRecentActivity(entry: Omit<RecentActivity, "id" | "createdAt">, snapshot: unknown): RecentActivity | null {
  try {
    const activity: RecentActivity = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now() };
    sessionStorage.setItem(snapshotPrefix + activity.id, JSON.stringify(snapshot));
    const previous = getRecentActivities();
    const next = [activity, ...previous].slice(0, maxItems);
    const retained = new Set(next.map((item) => item.id));
    for (const oldItem of previous) if (!retained.has(oldItem.id)) sessionStorage.removeItem(snapshotPrefix + oldItem.id);
    sessionStorage.setItem(activityKey, JSON.stringify(next));
    window.dispatchEvent(new Event(changedEvent));
    return activity;
  } catch { return null; }
}

export function readRecentSnapshot<T>(id: unknown): T | null {
  if (typeof id !== "string") return null;
  try { return JSON.parse(sessionStorage.getItem(snapshotPrefix + id) || "null") as T | null; }
  catch { return null; }
}

export function recentActivityEventName() { return changedEvent; }

export function formatActivityTime(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(today.getDate() - 1);
  const dayLabel = date.toDateString() === today.toDateString() ? "Today" : date.toDateString() === yesterday.toDateString() ? "Yesterday" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${dayLabel}, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}
