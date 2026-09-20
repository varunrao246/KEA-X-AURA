/** "today", "yesterday", "3 days ago". Days are counted in UTC to match how streaks are computed. */
export function relativeDay(iso: string | null, now = new Date()): string {
  if (!iso) return "Not started";
  const day = (d: Date) => Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000);
  const diff = day(now) - day(new Date(iso));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return "Last week";
  return `${Math.floor(diff / 7)} weeks ago`;
}

export function paceLabel(pace: number) {
  return pace >= 80 ? "Fast" : pace >= 60 ? "Steady" : "Thoughtful";
}

export function timeGreeting(hour: number) {
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** "just now", "5 min ago", "2 h ago", then falls back to "Yesterday", "3 days ago". */
export function timeAgo(iso: string, now = new Date()): string {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 45) return "just now";
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} min ago`;
  if (diff < 86_400 && new Date(iso).getUTCDate() === now.getUTCDate()) return `${Math.round(diff / 3600)} h ago`;
  return relativeDay(iso, now);
}

/** Student-facing wording for where a case is in the intervention process. */
export function interventionStatusLabel(
  status: "detected" | "recommended" | "viewed" | "started" | "responding" | "resolved",
  helpRequested = false,
  hasAssigned = false
): string {
  if (hasAssigned && status !== "resolved") return "Your facilitator has assigned a specific step";
  switch (status) {
    case "detected":
    case "recommended": return helpRequested ? "Your facilitator has been asked to help" : "AURA has suggested next steps";
    case "viewed": return "Your facilitator has seen this";
    case "started": return "Your facilitator is helping";
    case "responding": return "You're improving. Keep going";
    case "resolved": return "Resolved";
  }
}

/** Facilitator-facing wording for the same states. Describes the learning state, never the student. */
export function facilitatorStatusLabel(status: "detected" | "recommended" | "viewed" | "started" | "responding" | "resolved", helpRequested = false): string {
  switch (status) {
    case "detected":
    case "recommended": return helpRequested ? "Student asked for help" : "AURA recommended a next step";
    case "viewed": return "You've reviewed this";
    case "started": return "You're helping with this";
    case "responding": return "Responding well, awaiting your review";
    case "resolved": return "Resolved";
  }
}
