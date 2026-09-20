import type { RethemeResult } from "@/lib/ai/types";
import type { AiMode } from "@/lib/ai/types";
import type { Interest } from "@/lib/types";

/** Browser-side call to our own API. The browser never talks to the model provider and never sees a key. */
export async function requestRetheme(body: { questionId: string; interest: Interest; mode?: AiMode }, opts: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<RethemeResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000);
  opts.signal?.addEventListener("abort", () => controller.abort());
  try {
    const res = await fetch("/api/ai/retheme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "Could not theme this question");
    return json.data as RethemeResult;
  } finally {
    window.clearTimeout(timer);
  }
}
