import type { Interest } from "../types";

export const INTEREST_IDS: Interest[] = ["space", "sports", "gaming", "animals", "technology", "environment", "art"];

export const INTEREST_NAMES: Record<Interest, string> = {
  space: "Space", sports: "Sports", gaming: "Gaming", animals: "Animals", technology: "Technology", environment: "Environment", art: "Art",
};

export function isInterest(x: unknown): x is Interest {
  return typeof x === "string" && (INTEREST_IDS as string[]).includes(x);
}
