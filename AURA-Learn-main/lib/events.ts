import type { AdaptiveEvent, Store } from "./types";

/** Append to the adaptive audit trail: what the engine decided, and why. */
export function recordEvent(store: Store, ev: Omit<AdaptiveEvent, "id" | "at">, now: Date): AdaptiveEvent {
  const full: AdaptiveEvent = { ...ev, id: `evt-${now.getTime()}-${store.events.length}`, at: now.toISOString() };
  store.events.push(full);
  // Keep the log bounded for a long-running demo.
  if (store.events.length > 500) store.events.splice(0, store.events.length - 500);
  return full;
}

export function eventsFor(store: Store, studentId: string, opts: { topicId?: string; limit?: number } = {}): AdaptiveEvent[] {
  const { topicId, limit = 20 } = opts;
  return store.events
    .filter((e) => e.studentId === studentId && (!topicId || e.topicId === topicId))
    .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id))
    .slice(0, limit);
}
