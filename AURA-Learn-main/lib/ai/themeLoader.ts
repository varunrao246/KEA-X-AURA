import type { Interest } from "../types";
import type { RethemeResult, ThemeSourceKind } from "./types";

export type ThemeChoice = Interest | "original";

export interface ThemeLoadState {
  /** Bumped on every call; a settling response is applied only if it's still the latest. */
  ticket: { current: number };
  cache: Map<string, RethemeResult>;
}

export function createThemeLoadState(): ThemeLoadState {
  return { ticket: { current: 0 }, cache: new Map() };
}

export interface ThemeLoadCallbacks {
  onPhase: (phase: "loading" | "ready" | "error") => void;
  onResult: (result: RethemeResult | null) => void;
  onError: (message: string) => void;
  onBusyChange: (busy: boolean) => void;
  onResolved: (info: { interest: Interest; source: ThemeSourceKind } | null) => void;
}

/**
 * Fetch (or short-circuit) the themed wording for one choice.
 *
 * Whichever call is the LATEST for this state must always be the one to settle `onBusyChange` —
 * every branch, including the ones that never touch the network (picking "original", or a cache
 * hit), has to call it. Skipping it on those branches is exactly how the busy flag gets stuck
 * `true` forever: an earlier fetch is still in flight when the student switches to "original" or
 * to an already-cached interest, that branch returns without resetting busy, and when the earlier
 * fetch finally settles it sees it's no longer the latest ticket and (correctly) leaves busy alone
 * too — so nothing ever turns it back off.
 */
export async function loadTheme(
  questionId: string,
  choice: ThemeChoice,
  state: ThemeLoadState,
  fetchThemed: (args: { questionId: string; interest: Interest }) => Promise<RethemeResult>,
  cb: ThemeLoadCallbacks,
): Promise<void> {
  const id = ++state.ticket.current;
  const isLatest = () => id === state.ticket.current;

  if (choice === "original") {
    cb.onResult(null);
    cb.onPhase("ready");
    cb.onError("");
    cb.onBusyChange(false);
    cb.onResolved(null);
    return;
  }

  const cacheKey = `${questionId}:${choice}`;
  const hit = state.cache.get(cacheKey);
  if (hit) {
    cb.onResult(hit);
    cb.onPhase("ready");
    cb.onError("");
    cb.onBusyChange(false);
    cb.onResolved({ interest: choice, source: hit.source });
    return;
  }

  cb.onPhase("loading");
  cb.onError("");
  cb.onBusyChange(true);
  try {
    const r = await fetchThemed({ questionId, interest: choice });
    if (!isLatest()) return; // a newer request replaced this one and owns the busy flag
    state.cache.set(cacheKey, r);
    cb.onResult(r);
    cb.onPhase("ready");
    cb.onBusyChange(false);
    cb.onResolved({ interest: choice, source: r.source });
  } catch (e) {
    if (!isLatest()) return;
    cb.onResult(null);
    cb.onPhase("error");
    cb.onBusyChange(false);
    cb.onResolved(null);
    cb.onError(e instanceof DOMException && e.name === "AbortError" ? "Theming took too long." : "Couldn't theme this question.");
  }
}
