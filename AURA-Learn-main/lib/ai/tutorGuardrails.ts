import { BLOCKLIST, META, numberTokens, quantityTokens } from "./guardrails";
import type { TutorContext } from "./tutorContext";
import type { TutorCandidate } from "./tutorPrompt";

/**
 * Deterministic validation for tutor output (PRD section 14). Every AI Tutor response passes
 * through here before a student ever sees it, exactly like the re-theming guardrails — same
 * philosophy, adapted for coaching prose instead of a question rewrite: no AI judges AI, every
 * check is plain, inspectable logic.
 */

export interface TutorCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface TutorValidationResult {
  passed: boolean;
  checks: TutorCheck[];
  failed: TutorCheck[];
}

const MIN_LEN = 8;
const MAX_LEN = 700;

export function validateTutorResponse(ctx: TutorContext, cand: TutorCandidate): TutorValidationResult {
  const checks: TutorCheck[] = [];
  const add = (id: string, label: string, passed: boolean, detail: string) => checks.push({ id, label, passed, detail });
  const msg = cand.message;

  // 1. Format: sensible length, plain text.
  const problems: string[] = [];
  if (msg.length < MIN_LEN) problems.push("too short");
  if (msg.length > MAX_LEN) problems.push("too long");
  if (/[\r\n]{3,}|```|<[^>]+>|https?:\/\//.test(msg)) problems.push("contains markup or links");
  add("format", "Clean, reasonably sized coaching message", problems.length === 0, problems.join("; ") || `${msg.length} characters`);

  // 2. Safety / meta / prompt-injection compliance — a coach that reveals its own rules or breaks
  //    character (even because the student asked it to) fails this check.
  const unsafe = msg.match(BLOCKLIST)?.[0] ?? msg.match(META)?.[0];
  add("safety", "On-task, in character, no rule/system-prompt leakage", !unsafe, unsafe ? `contains "${unsafe}"` : "clean");

  // 3. Answer not leaked — the single most important check. Never state the exact correct answer,
  //    with its unit, or the exact correct MCQ option text, regardless of which strategy is active.
  let leaked = false;
  let leakDetail = "no leak detected";
  const q = ctx.question;
  if (q) {
    if (q.type === "numeric" && q.numericAnswer !== undefined) {
      const answerWithUnit = q.unit ? `${q.numericAnswer} ${q.unit}` : String(q.numericAnswer);
      const msgQuantities = quantityTokens(msg);
      const msgNumbers = numberTokens(msg);
      if (msgQuantities.includes(answerWithUnit) || msgNumbers.includes(String(q.numericAnswer))) {
        leaked = true;
        leakDetail = `message states the answer value (${answerWithUnit})`;
      }
    } else if (q.type === "mcq") {
      const answerText = q.answer.toLowerCase().trim();
      if (answerText.length > 3 && msg.toLowerCase().includes(answerText)) {
        leaked = true;
        leakDetail = "message states the correct option's text";
      }
    }
  }
  add("leak", "Correct answer not revealed", !leaked, leakDetail);

  // 4. Hint discipline: a "hint" response must not smuggle in the full worked solution.
  if (cand.type === "hint" && q?.formula) {
    const givesFullEquationWithNumbers = q.type === "numeric" && numberTokens(msg).length >= 2 && new RegExp(q.formula.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split(" ")[0], "i").test(msg);
    add("hint-discipline", "A hint stays a hint, not the full solution", !givesFullEquationWithNumbers, givesFullEquationWithNumbers ? "hint reads like a fully worked solution" : "appropriately partial");
  }

  const failed = checks.filter((c) => !c.passed);
  return { passed: failed.length === 0, checks, failed };
}
