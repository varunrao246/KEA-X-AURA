import type { Candidate, Check, ThemeSource, ValidationResult } from "./types";

/**
 * The validation layer (PRD sections 2.2, 14 and 27).
 *
 * AI may change the story, characters, context and vocabulary. It may NOT change the numbers, units,
 * the thing being asked for, the answer, or the concept. A re-themed question is only ever shown if EVERY
 * check below passes; otherwise it is thrown away and the original (or a deterministic theme) is used.
 *
 * All checks are plain string logic on purpose: fast, deterministic and easy to audit. No AI judges AI.
 */

/* ------------------------------------------------------------------ normalisation */

const SUPERSCRIPT: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };

/** Make equivalent spellings identical: 10⁻³ and 10^-3, "1,000" and "1000", "12 volts" and "12 V". */
export function normalize(text: string): string {
  let t = text.normalize("NFC").replace(/ /g, " ");
  t = t.replace(/⁻/g, "^-").replace(/⁺/g, "^+").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (m) => SUPERSCRIPT[m]);
  t = t.replace(/(\d),(\d{3})(?!\d)/g, "$1$2");
  const words: [RegExp, string][] = [
    [/(\d)\s*(?:milliamps?|milliamperes?)\b/gi, "$1 mA"],
    [/(\d)\s*(?:amperes?|amps?)\b/gi, "$1 A"],
    [/(\d)\s*volts?\b/gi, "$1 V"],
    [/(\d)\s*ohms?\b/gi, "$1 Ω"],
    [/(\d)\s*coulombs?\b/gi, "$1 C"],
    [/(\d)\s*joules?\b/gi, "$1 J"],
    [/(\d)\s*seconds?\b/gi, "$1 s"],
    [/(\d)\s*minutes?\b/gi, "$1 min"],
    [/(\d)\s*millilit(?:re|er)s?\b/gi, "$1 mL"],
  ];
  for (const [re, to] of words) t = t.replace(re, to);
  return t;
}

/** Chemical formulae and pH must survive exactly, e.g. HCl, NaOH, H₂SO₄. */
export function chemTokens(text: string): string[] {
  const found = text.match(/\b(?:[A-Z][a-z]?[₀-₉]*){2,}[⁺⁻]?/g) ?? [];
  const ph = /\bpH\b/.test(text) ? ["pH"] : [];
  return [...found, ...ph];
}

function stripChem(text: string): string {
  return text.replace(/\b(?:[A-Z][a-z]?[₀-₉]*){2,}[⁺⁻]?/g, " ");
}

export function numberTokens(text: string): string[] {
  const t = stripChem(normalize(text));
  return t.match(/\^[-+]?\d+|\d+(?:\.\d+)?/g) ?? [];
}

const QUANTITY = /(\d+(?:\.\d+)?)\s?(mol\/L|mL|mA|kΩ|Ω|V|A|C|J|s|min|M)(?![A-Za-z0-9])/g;

export function quantityTokens(text: string): string[] {
  const t = normalize(text);
  return [...t.matchAll(QUANTITY)].map((m) => `${m[1]} ${m[2]}`);
}

function sameNumbers(a: (number | string)[], b: number[]): boolean {
  const x = a.map(Number).sort((p, q) => p - q);
  const y = [...b].sort((p, q) => p - q);
  return x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) < 1e-9);
}

function diff(orig: string[], cand: string[]) {
  const o = [...orig];
  const extra: string[] = [];
  for (const c of cand) {
    const i = o.indexOf(c);
    if (i >= 0) o.splice(i, 1);
    else extra.push(c);
  }
  return { missing: o, extra };
}

const list = (xs: string[]) => xs.map((x) => (x.startsWith("^") ? `10${x}` : x)).join(", ");

/* ------------------------------------------------------------------ concept anchors */

interface Group { id: string; label: string; words?: RegExp; symbols?: RegExp }

/** Concept groups with synonyms. If the original uses a concept, the themed version must still express it. */
const GROUPS: Group[] = [
  { id: "current", label: "current", words: /\bcurrents?\b|\bamp(?:ere)?s?\b/i, symbols: /\d\s?m?A(?![A-Za-z])/ },
  { id: "voltage", label: "voltage", words: /\bvoltages?\b|\bvolts?\b|potential difference/i, symbols: /\d\s?V(?![A-Za-z])/ },
  { id: "resistance", label: "resistance", words: /\bresistances?\b|\bresistors?\b|\bohms?\b/i, symbols: /\d\s?kΩ|\d\s?Ω/ },
  { id: "charge", label: "charge", words: /\bcharges?\b|\bcoulombs?\b/i, symbols: /\d\s?C(?![A-Za-z])/ },
  { id: "energy", label: "energy or work", words: /\benergy\b|\bwork\b|\bjoules?\b/i, symbols: /\d\s?J(?![A-Za-z])/ },
  { id: "time", label: "time", words: /\btime\b|\bseconds?\b|\bminutes?\b/i, symbols: /\d\s?(?:s|min)(?![A-Za-z])/ },
  { id: "battery", label: "battery or supply", words: /\bbatter(?:y|ies)\b|\bcells?\b|\bsupply\b|\bpower (?:source|pack)\b/i },
  { id: "bulb", label: "bulbs", words: /\bbulbs?\b|\blamps?\b|\bLEDs?\b|\blights?\b/i },
  { id: "series", label: "series", words: /\bseries\b/i },
  { id: "parallel", label: "parallel", words: /\bparallel\b/i },
  { id: "identical", label: "identical", words: /\bidentical\b|\bsame\b|\bequal(?:ly)?\b/i },
  { id: "wire", label: "wire", words: /\bwires?\b|\bcables?\b|\bfilament\b/i },
  { id: "length", label: "length", words: /\blong(?:er)?\b|\blength\b/i },
  { id: "thickness", label: "thickness or area", words: /\bthick(?:er|ness)?\b|\barea\b|cross-sectional/i },
  { id: "concentration", label: "concentration", words: /\bconcentrations?\b|\bmolarity\b|\bmol\/L\b|\bmolar\b/i, symbols: /\d\s?M(?![A-Za-z])/ },
  { id: "volume", label: "volume", words: /\bvolume\b|\bmillilit(?:re|er)s?\b/i, symbols: /\d\s?mL/ },
  { id: "hydrogen", label: "hydrogen ions", words: /\bhydrogen ions?\b/i, symbols: /H⁺|H\^\+|\[H/ },
  { id: "diluted", label: "dilution", words: /\bdilut/i },
  { id: "neutral", label: "neutralisation or endpoint", words: /\bneutralis|\bneutraliz|\btitrat|\bendpoint|\bburette/i },
  { id: "acid", label: "acid", words: /\bacids?\b/i },
  { id: "base", label: "base", words: /\bbases?\b|\balkali/i },
  { id: "ratio", label: "how many times", words: /\bhow many times\b|\bfactor\b|\bratio\b/i },
  { id: "multiples", label: "times as long or thick", words: /\btimes as\b|\bas long\b|\bas thick\b|\btimes the\b/i },
];

function hits(g: Group, text: string, normalised: string): boolean {
  return !!(g.words?.test(text) || g.symbols?.test(normalised));
}

const STOP = new Set(["which", "what", "that", "this", "these", "those", "with", "from", "when", "where", "there", "their", "about", "into", "through", "would", "could", "should", "have", "does", "each", "between", "following", "these"]);

function contentWords(text: string): string[] {
  return [...new Set((text.toLowerCase().match(/[a-z]{5,}/g) ?? []).map((w) => w.replace(/(?:ies)$/, "y").replace(/s$/, "")).filter((w) => !STOP.has(w)))];
}

const NUMBER_WORDS = /\b(?:zero|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand|million|dozen|twice|thrice|double|doubled|triple|tripled|quadruple|half|halve|halved|quarter)\b/gi;

const ASK = /\?|\b(?:calculate|find|determine|work out|what|which|how|name|identify|choose|select|state)\b/i;

/* ------------------------------------------------------------------ safety */

export const BLOCKLIST = /\b(?:kill|murder|blood|gore|gun|weapon|bomb|explosive|suicide|drugs?|cocaine|heroin|alcohol|beer|vodka|sex|sexy|porn|nude|hate|racist|slur|damn|hell|shit|fuck|bitch|asshole|stupid|idiot|dumb|die)\b/i;
export const META = /\b(?:as an ai|language model|i cannot|i can't|i'm sorry|sorry,|here is|here's|sure[,!]|certainly|of course|ignore (?:all|any|the|previous)|system prompt|instructions?)\b/i;
const ALLOWED = /^[A-Za-zÀ-ɏ0-9\s.,;:!?'"’“”()\[\]\/\-–—+=×÷·%^_°Ωμ⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉→∝≈≤≥&*]*$/;

/* ------------------------------------------------------------------ the checks */

export function validateRetheme(src: ThemeSource, cand: Candidate): ValidationResult {
  const checks: Check[] = [];
  const add = (id: string, label: string, passed: boolean, detail: string) => checks.push({ id, label, passed, detail, kind: "validated" });

  const stem = typeof cand.stem === "string" ? cand.stem.trim() : "";
  const origN = normalize(src.stem);
  const candN = normalize(stem);

  // 1. Format
  const minLen = Math.max(20, Math.floor(src.stem.length * 0.7));
  const maxLen = Math.min(450, src.stem.length * 3 + 60);
  const formatProblems: string[] = [];
  if (!stem) formatProblems.push("empty");
  if (stem && stem.length < minLen) formatProblems.push("too short");
  if (stem.length > maxLen) formatProblems.push("too long");
  if (/[\r\n]{2,}|```|<[^>]+>|https?:\/\/|www\.|@\w/.test(stem)) formatProblems.push("contains markup, links or several paragraphs");
  if (stem && !ALLOWED.test(stem)) formatProblems.push("contains unsupported characters");
  add("format", "Clean text, sensible length", formatProblems.length === 0, formatProblems.join("; ") || `${stem.length} characters`);

  // 2. Safety
  const unsafe = stem.match(BLOCKLIST)?.[0] ?? stem.match(META)?.[0];
  add("safety", "Age-appropriate, on task", !unsafe, unsafe ? `contains "${unsafe}"` : "no inappropriate or off-task content");

  // 3. Numbers
  const oNums = numberTokens(src.stem);
  const cNums = numberTokens(stem);
  const nd = diff(oNums, cNums);
  add("numbers", "Numbers unchanged", nd.missing.length === 0 && nd.extra.length === 0,
    nd.missing.length || nd.extra.length ? `${nd.missing.length ? `missing ${list(nd.missing)}` : ""}${nd.missing.length && nd.extra.length ? "; " : ""}${nd.extra.length ? `added ${list(nd.extra)}` : ""}` : `${oNums.length} numbers kept: ${list(oNums)}`);

  // 3b. Quantities smuggled in as words ("three astronauts", "twice as long")
  const wordsIn = (t: string) => new Set((t.toLowerCase().match(NUMBER_WORDS) ?? []).map((w) => w.toLowerCase()));
  const origWords = wordsIn(src.stem);
  const newWords = [...wordsIn(stem)].filter((w) => !origWords.has(w));
  add("numberwords", "No new quantities written as words", newWords.length === 0, newWords.length ? `adds "${newWords.join('", "')}"` : "no number words added");

  // 4. Quantities with units
  const oQ = quantityTokens(src.stem);
  const cQ = quantityTokens(stem);
  const qd = diff(oQ, cQ);
  add("quantities", "Units unchanged", qd.missing.length === 0 && qd.extra.length === 0,
    qd.missing.length || qd.extra.length ? `expected ${oQ.join(", ") || "none"}, found ${cQ.join(", ") || "none"}` : oQ.length ? `kept ${oQ.join(", ")}` : "no quantities with units");

  // 5. Variables (the structured values behind the stem)
  const varValues = Object.values(src.variables ?? {}).map((v) => String(v));
  const cNumSet = new Set(cNums);
  // pH questions store the exponent as a plain integer, and it appears in the text as 10^-n.
  const stillLost = varValues.filter((v) => !cNumSet.has(v) && !cNums.includes(`^-${v}`));
  add("variables", "Variables unchanged", varValues.length === 0 || stillLost.length === 0, varValues.length === 0 ? "no numeric variables" : stillLost.length ? `variable value ${stillLost.join(", ")} not found` : `all ${varValues.length} variable values present`);

  // 6. Chemistry formulae and pH
  const oChem = chemTokens(src.stem);
  const cChem = chemTokens(stem);
  const missingChem = oChem.filter((c) => !cChem.includes(c));
  // One-directional on purpose: losing HCl or H₂SO₄ changes the chemistry; adding an acronym like "LED" does not.
  add("formulae", "Formulae and symbols unchanged", missingChem.length === 0, missingChem.length ? `lost ${missingChem.join(", ")}` : oChem.length ? `kept ${oChem.join(", ")}` : "no formulae");

  // 7. Concept anchors: every concept the original uses must still be there
  const lostConcepts = GROUPS.filter((g) => hits(g, src.stem, origN) && !hits(g, stem, candN)).map((g) => g.label);
  add("concept", "Same concept and quantities", lostConcepts.length === 0, lostConcepts.length ? `no longer mentions: ${lostConcepts.join(", ")}` : "every quantity and concept still present");

  // 8. It still asks for the same thing
  const asks = !ASK.test(src.stem) || ASK.test(stem);
  add("ask", "Still asks the same question", asks, asks ? "the task is still stated" : "no longer asks for anything");

  // 9. Content-word retention (guards MCQs and anything the anchors do not cover)
  const oWords = contentWords(src.stem);
  const cWords = new Set(contentWords(stem));
  const kept = oWords.filter((w) => cWords.has(w)).length;
  const need = src.type === "mcq" ? 0.7 : 0.5;
  const ratio = oWords.length ? kept / oWords.length : 1;
  add("retention", "Key wording preserved", ratio >= need, `${kept} of ${oWords.length} key words kept (needs ${Math.round(need * 100)}%)`);

  // 10. Answer not revealed
  let leakDetail = "answer is not stated";
  let leaked = false;
  if (src.type === "mcq") {
    const oSet = new Set(contentWords(src.stem));
    const leak = contentWords(src.answer).filter((w) => !oSet.has(w) && cWords.has(w));
    if (leak.length) { leaked = true; leakDetail = `mentions "${leak[0]}", part of the answer`; }
    if (candN.toLowerCase().includes(src.answer.toLowerCase()) && !origN.toLowerCase().includes(src.answer.toLowerCase())) { leaked = true; leakDetail = "states the correct option"; }
  } else {
    const ans = String(src.answer);
    const answerWithUnit = src.unit ? `${ans} ${src.unit}` : ans;
    const extraAnswer = cQ.includes(answerWithUnit) && !oQ.includes(answerWithUnit);
    if (extraAnswer) { leaked = true; leakDetail = `states the answer (${answerWithUnit})`; }
  }
  add("leak", "Answer not revealed", !leaked, leakDetail);

  // 11. Options never edited
  const optsOk = !cand.options || (src.options && cand.options.length === src.options.length && cand.options.every((o, i) => o === src.options![i]));
  add("options", "Answer options unchanged", !!optsOk, optsOk ? (src.options ? "options untouched" : "not applicable") : "the options were modified");

  // 12. Model echo cross-check (only if the model provided it)
  if (cand.echo) {
    const e = cand.echo;
    const problems: string[] = [];
    if (e.numbers && src.variables && !sameNumbers(e.numbers, Object.values(src.variables))) problems.push("numbers differ from the original");
    if (typeof e.difficulty === "number" && e.difficulty !== src.difficulty) problems.push("difficulty differs");
    if (e.unit !== undefined && (src.unit ?? "") !== e.unit) problems.push("unit differs");
    if (e.learningObjective && e.learningObjective.trim().toLowerCase() !== src.learningObjective.trim().toLowerCase()) problems.push("learning objective differs");
    if (e.answerUnchanged === false) problems.push("model says the answer changed");
    add("echo", "Model confirms nothing academic changed", problems.length === 0, problems.join("; ") || "echo matches the original");
  }

  const failed = checks.filter((c) => !c.passed);
  return { passed: failed.length === 0, checks, failed };
}

/** The guarantees the server holds by construction, listed next to the validated checks for transparency. */
export function constructionChecks(src: ThemeSource): Check[] {
  const c = (id: string, label: string, detail: string): Check => ({ id, label, passed: true, detail, kind: "by-construction" });
  return [
    c("answer-key", "Answer key unchanged", "grading always uses the original question, never the themed text"),
    c("objective", "Learning objective unchanged", `"${src.learningObjective}" is copied from the original`),
    c("difficulty", "Difficulty unchanged", `Level ${src.difficulty}, set by the adaptive engine and not editable by the model`),
  ];
}
