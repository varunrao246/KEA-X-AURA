import { BAND_LABEL, bandOf } from "./mastery";

/** "Learning", "Proficient", ... for a 0-100 score. Small helper for client components. */
export const bandLabel = (score: number) => BAND_LABEL[bandOf(score)];
