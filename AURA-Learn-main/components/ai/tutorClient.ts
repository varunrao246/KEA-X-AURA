export type TutorMode = "explain" | "hint" | "review" | "next-step";
export type TutorResponseType = "hint" | "misconception" | "explanation" | "prerequisite" | "encouragement" | "challenge";
export type TutorNextAction = "retry" | "check_understanding" | "learn_prerequisite" | "continue" | "attempt";

export interface TutorSignals {
  mastery: number;
  masteryBand: string;
  struggle: number;
  struggleLevel: string;
  recentAccuracy: number;
  wrongStreak: number;
  hintLevel: number;
  misconception: string | null;
}

export interface TutorResponse {
  type: TutorResponseType;
  message: string;
  nextAction: TutorNextAction;
  strategy: string;
  source: "ai" | "template";
  signals: TutorSignals;
}

/** Browser-side call to our own API. The browser never talks to the model provider and never sees a key. */
export async function askTutor(
  body: { topicId: string; questionId?: string; mode: TutorMode; message?: string; displayedStem?: string; variation?: number },
  opts: { timeoutMs?: number } = {},
): Promise<TutorResponse> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
  try {
    const res = await fetch("/api/ai/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "The tutor couldn't respond");
    return json.data as TutorResponse;
  } finally {
    window.clearTimeout(timer);
  }
}
