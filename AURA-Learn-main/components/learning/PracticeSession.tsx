"use client";

import { ArrowDown, ArrowRight, ArrowUp, Check, CircleHelp, Lightbulb, PartyPopper, SkipForward, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdaptiveTimeline } from "@/components/adaptive/AdaptiveTimeline";
import { InterventionCard } from "@/components/adaptive/InterventionCard";
import { SimplerExplanation } from "@/components/adaptive/SimplerExplanation";
import { StruggleChip } from "@/components/adaptive/StruggleMeter";
import type { Lesson } from "@/content/lessons";
import { LEVEL_BLURB, LEVEL_NAMES } from "@/lib/adaptive";
import type { InterventionSummary } from "@/lib/intervention";
import { ThemedStem, type ThemeInfo } from "@/components/ai/ThemedStem";
import { TutorCoach } from "@/components/ai/TutorCoach";
import { bandLabel } from "@/lib/band";
import type { AttemptResult, PublicQuestion } from "@/lib/practice";
import type { StruggleLevel } from "@/lib/struggle";
import type { Interest, Level } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MasterBrainCard } from "./MasterBrainCard";

interface Props {
  topicId: string;
  topicName: string;
  initialScore: number;
  initialLevel: Level;
  initialStruggle: { score: number; level: StruggleLevel };
  initialIntervention: InterventionSummary | null;
  blocksName?: string;
  lesson?: Lesson;
  analogy?: string;
  interests: Interest[];
  onReviewConcept: () => void;
  onOpenInsights: () => void;
}

type Phase = "loading" | "question" | "checking" | "feedback" | "master-brain" | "error" | "locked" | "summary";
interface Answered { id: string; correct: boolean }
const LETTERS = ["A", "B", "C", "D"];

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string; code?: string }> {
  try {
    const res = await fetch(url, init);
    const json = await res.json();
    return json.ok ? { ok: true, data: json.data as T } : { ok: false, error: json.error ?? "Something went wrong", code: json.code };
  } catch {
    return { ok: false, error: "Couldn't reach AURA. Check your connection and try again." };
  }
}

export function PracticeSession({ topicId, topicName, initialScore, initialLevel, initialStruggle, initialIntervention, blocksName, lesson, analogy, interests, onReviewConcept, onOpenInsights }: Props) {
  const router = useRouter();
  const [struggle, setStruggle] = useState(initialStruggle);
  const [intervention, setIntervention] = useState<InterventionSummary | null>(initialIntervention);
  const [hidden, setHidden] = useState(false);
  const [simplerOpen, setSimplerOpen] = useState(false);
  const [themeInfo, setThemeInfo] = useState<ThemeInfo | null>(null);
  const [themeBusy, setThemeBusy] = useState(false);
  const [displayedStem, setDisplayedStem] = useState("");
  const [attemptTick, setAttemptTick] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [pendingMasterBrain, setPendingMasterBrain] = useState<boolean>(false);
  const [masterBrainData, setMasterBrainData] = useState<{
    topicId: string;
    topicName: string;
    masteryScore: number;
    detectedMisconception: string | null;
  } | null>(null);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [level, setLevel] = useState<Level>(initialLevel);
  const [score, setScore] = useState(initialScore);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [history, setHistory] = useState<Answered[]>([]);
  const [unlocked, setUnlocked] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [lockedMsg, setLockedMsg] = useState("");
  const startedAt = useRef(Date.now());
  const startScore = useRef(initialScore);
  const historyRef = useRef<Answered[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadNext = useCallback(async () => {
    setPhase("loading");
    setAnswer("");
    setHint(null);
    setHintsUsed(0);
    setResult(null);
    // Keep every question from this open practice session out of the next request. The server uses
    // this to avoid repeating MCQs until the learner has seen the rest of the topic bank.
    const exclude = historyRef.current.map((h) => h.id).join(",");
    const r = await api<{ question: PublicQuestion; level: Level }>(`/api/practice/next?topicId=${topicId}&exclude=${exclude}`);
    if (!r.ok) {
      if (r.code === "locked") { setLockedMsg(r.error); setPhase("locked"); } else { setError(r.error); setPhase("error"); }
      return;
    }
    setQuestion(r.data.question);
    setLevel(r.data.level);
    startedAt.current = Date.now();
    setPhase("question");
  }, [topicId]);

  function handleNext() {
    if (pendingMasterBrain && masterBrainData) {
      setPendingMasterBrain(false);
      setPhase("master-brain");
    } else {
      void loadNext();
    }
  }

  /** Re-attempt the SAME question the tutor is coaching on, instead of moving to a new one. */
  function retrySame() {
    setAnswer("");
    setHint(null);
    setHintsUsed(0);
    setResult(null);
    startedAt.current = Date.now();
    setPhase("question");
  }

  useEffect(() => { void loadNext(); }, [loadNext]);
  useEffect(() => { if (phase === "question" && question?.type === "numeric") inputRef.current?.focus(); }, [phase, question]);

  // Keyboard shortcuts for multiple choice: 1-4 selects an option.
  useEffect(() => {
    if (phase !== "question" || question?.type !== "mcq") return;
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < (question.options?.length ?? 0) && !(e.target instanceof HTMLInputElement)) setAnswer(question.options![i]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, question]);

  async function requestHint() {
    if (!question || hint) return;
    const r = await api<{ hint: string }>(`/api/questions/${question.id}/hint`);
    if (r.ok) { setHint(r.data.hint); setHintsUsed(1); }
  }

  async function submit(skipped = false) {
    if (!question || (!skipped && !answer.trim())) return;
    setPhase("checking");
    const r = await api<AttemptResult>("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, answer, skipped, hintsUsed, timeTakenSec: (Date.now() - startedAt.current) / 1000, theme: themeInfo ?? undefined }),
    });
    if (!r.ok) {
      if (r.code === "locked") { setLockedMsg(r.error); setPhase("locked"); } else { setError(r.error); setPhase("error"); }
      return;
    }
    const d = r.data;
    setResult(d);
    setScore(d.mastery.after);
    setLevel(d.level.after);
    setStruggle({ score: d.struggle.after, level: d.struggle.level });
    setIntervention(d.intervention);
    // A brand-new or escalated case is always shown, even if the student hid the previous card.
    if (d.intervention && (d.intervention.change === "created" || d.intervention.change === "escalated")) setHidden(false);
    const next = [...historyRef.current, { id: question.id, correct: d.correct }];
    historyRef.current = next;
    setHistory(next);
    if (d.unlocked.length) setUnlocked((cur) => [...cur, ...d.unlocked.filter((u) => !cur.some((c) => c.id === u.id))]);
    setAttemptTick((n) => n + 1);

    // If answer is correct, replace next question with Master Brain!
    if (d.correct) {
      setPendingMasterBrain(true);
      setMasterBrainData({
        topicId,
        topicName: d.topicName,
        masteryScore: d.mastery.after,
        detectedMisconception: d.prerequisiteCheck && !d.prerequisiteCheck.solid ? d.prerequisiteCheck.message : null,
      });
    } else {
      setPendingMasterBrain(false);
      setMasterBrainData(null);
    }

    setPhase("feedback");
    // Re-render the server-side parts of the page (mastery card, unlock list) with the new numbers.
    router.refresh();
  }

  const wrongStreak = history.slice(-2).length === 2 && history.slice(-2).every((h) => !h.correct);

  if (phase === "locked") {
    return (
      <Card padding="none">
        <ErrorState title="This topic is still locked" message={lockedMsg} />
        <div className="-mt-6 pb-10 text-center"><Button href="/student/path">Back to My Path</Button></div>
      </Card>
    );
  }
  if (phase === "error") return <Card padding="none"><ErrorState message={error} onRetry={loadNext} /></Card>;
  if (phase === "summary") return <Summary topicName={topicName} history={history} startScore={startScore.current} score={score} level={level} unlocked={unlocked} onContinue={() => { void loadNext(); }} />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {intervention && !hidden && (
        <InterventionCard
          key={intervention.id}
          intervention={intervention}
          topicName={topicName}
          blocksName={blocksName}
          onSimpler={() => setSimplerOpen(true)}
          onDismiss={() => setHidden(true)}
        />
      )}
      <SimplerExplanation open={simplerOpen} onClose={() => setSimplerOpen(false)} lesson={lesson} analogy={analogy} topicName={topicName} onPractice={() => undefined} />

      {/* Session header: where you are, and how close to unlocking */}
      <Card padding="sm" className="!p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">Level {level} · {LEVEL_NAMES[level]}</span>
            <button type="button" onClick={onOpenInsights} title="See how AURA calculated this" className="rounded-full transition hover:opacity-80">
              <StruggleChip level={struggle.level} score={struggle.score} />
            </button>
          </div>
          <div className="flex items-center gap-1.5" aria-label="This session">
            {history.slice(-8).map((h, i) => (
              <span key={i} className={cn("size-2.5 rounded-full", h.correct ? "bg-success" : "bg-danger")} title={h.correct ? "Correct" : "Incorrect"} />
            ))}
            {history.length === 0 && <span className="text-xs text-faint">New session</span>}
          </div>
        </div>
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-medium">{topicName} mastery</span>
          <span className="t-num">{score}%<span className="ml-1.5 text-xs font-normal text-muted">{bandLabel(score)}</span></span>
        </div>
        <div className="relative">
          <ProgressBar value={score} tone={score >= 80 ? "success" : score >= 60 ? "brand" : "warn"} label={`${topicName} mastery`} />
          <span className="absolute -top-1 h-4 w-0.5 rounded bg-ink/40" style={{ left: "60%" }} aria-hidden />
        </div>
      </Card>

      {phase === "loading" && (
        <Card className="space-y-4" aria-busy="true">
          <Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" />
          <div className="grid gap-3 pt-2 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        </Card>
      )}

      {phase === "master-brain" && masterBrainData && (
        <MasterBrainCard
          topicId={masterBrainData.topicId}
          topicName={masterBrainData.topicName}
          masteryScore={masterBrainData.masteryScore}
          detectedMisconception={masterBrainData.detectedMisconception}
          onFinished={() => {
            setMasterBrainData(null);
            void loadNext();
          }}
        />
      )}

      {question && phase !== "loading" && phase !== "master-brain" && (
        <Card padding="lg" className="enter" key={question.id}>
          <div className="mb-4 flex items-center justify-between">
            <span className="t-eyebrow">Question {history.length + (phase === "feedback" ? 0 : 1)}</span>
            {phase === "question" && (
              <button type="button" onClick={() => void submit(true)} className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink">
                <SkipForward className="size-4" aria-hidden /> Skip
              </button>
            )}
          </div>

          <ThemedStem key={question.id} questionId={question.id} originalStem={question.stem} interests={interests} onResolved={setThemeInfo} onBusyChange={setThemeBusy} onStemText={setDisplayedStem} />

          {question.type === "mcq" ? (
            <div role="radiogroup" aria-label="Answer options" className="mt-6 grid gap-3">
              {question.options!.map((opt, i) => {
                const selected = answer === opt;
                const revealed = phase === "feedback" && result;
                const isCorrect = revealed && opt === (result!.correctAnswer);
                const isWrongPick = revealed && selected && !result!.correct;
                return (
                  <button
                    key={opt} type="button" role="radio" aria-checked={selected}
                    disabled={phase !== "question" || themeBusy}
                    onClick={() => setAnswer(opt)}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99]",
                      isCorrect ? "border-success bg-success-soft" : isWrongPick ? "border-danger bg-danger-soft"
                        : selected ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand/40 hover:bg-subtle",
                    )}
                  >
                    <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold", isCorrect ? "bg-success text-brand-on" : isWrongPick ? "bg-danger text-brand-on" : selected ? "bg-brand text-brand-on" : "bg-subtle text-muted")}>
                      {isCorrect ? <Check className="size-4" strokeWidth={3} /> : isWrongPick ? <X className="size-4" strokeWidth={3} /> : LETTERS[i]}
                    </span>
                    <span className="flex-1 font-medium">{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-6">
              <label htmlFor="numeric-answer" className="mb-2 block text-sm font-medium text-muted">Your answer</label>
              <div className="flex max-w-xs items-center gap-3">
                <input
                  id="numeric-answer" ref={inputRef} inputMode="decimal" autoComplete="off" value={answer}
                  disabled={phase !== "question" || themeBusy}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
                  placeholder="0"
                  className={cn("h-14 w-full rounded-2xl border bg-surface px-4 text-xl font-semibold tabular-nums outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15",
                    phase === "feedback" && result ? (result.correct ? "border-success bg-success-soft" : "border-danger bg-danger-soft") : "border-line")}
                />
                {question.unit && <span className="text-lg font-semibold text-muted">{question.unit}</span>}
              </div>
            </div>
          )}

          {phase !== "feedback" && (
            <div className="mt-6 space-y-4">
              {hint && (
                <p role="note" className="flex gap-3 rounded-2xl bg-warn-soft p-4 text-sm">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden /> {hint}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={requestHint} disabled={!!hint || phase !== "question"} iconLeft={<CircleHelp className="size-4" />}>
                  {hint ? "Hint shown" : "Need a hint?"}
                </Button>
                <Button size="lg" onClick={() => void submit()} loading={phase === "checking"} disabled={!answer.trim() || themeBusy}>Check answer</Button>
              </div>
            </div>
          )}

          {phase === "feedback" && result && (
            <Feedback
              result={result} wrongStreak={wrongStreak} onNext={handleNext} onFinish={() => setPhase("summary")} onReview={onReviewConcept}
              topicId={topicId} questionId={question.id} displayedStem={displayedStem} proactiveTrigger={String(attemptTick)} onRetry={retrySame}
              isNextMasterBrain={pendingMasterBrain}
            />
          )}
        </Card>
      )}
    </div>
  );
}

interface FeedbackProps {
  result: AttemptResult; wrongStreak: boolean; onNext: () => void; onFinish: () => void; onReview: () => void;
  topicId: string; questionId: string; displayedStem: string; proactiveTrigger: string; onRetry: () => void;
  isNextMasterBrain?: boolean;
}

function Feedback({ result, wrongStreak, onNext, onFinish, onReview, topicId, questionId, displayedStem, proactiveTrigger, onRetry, isNextMasterBrain }: FeedbackProps) {
  const delta = result.mastery.after - result.mastery.before;
  const { level } = result;
  return (
    <div className="mt-6 space-y-4" aria-live="polite">
      <div className={cn("rounded-2xl p-5", result.correct ? "bg-success-soft" : result.skipped ? "bg-subtle" : "bg-danger-soft")}>
        <p className={cn("flex items-center gap-2 text-lg font-semibold", result.correct ? "text-success" : result.skipped ? "text-ink" : "text-danger")}>
          {result.correct ? <Check className="size-5" strokeWidth={3} /> : result.skipped ? <SkipForward className="size-5" /> : <X className="size-5" strokeWidth={3} />}
          {result.correct ? "Correct" : result.skipped ? "Skipped" : "Not quite"}
        </p>
        {!result.correct && <p className="mt-2 text-sm"><span className="text-muted">Answer: </span><span className="font-semibold">{result.correctAnswer}</span></p>}
        <p className="mt-2 text-[15px] leading-relaxed">{result.explanation}</p>
        {result.formula && <p className="mt-3 inline-block rounded-lg bg-surface/70 px-3 py-1.5 font-mono text-sm">{result.formula}</p>}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-line px-4 py-3 text-sm">
        <span className="text-muted">{result.topicName} mastery</span>
        <span className="t-num flex items-center gap-2">
          {result.mastery.before}% <ArrowRight className="size-3.5 text-faint" aria-hidden /> {result.mastery.after}%
          {delta !== 0 && <span className={cn("rounded-full px-2 py-0.5 text-xs", delta > 0 ? "bg-success-soft text-success" : "bg-warn-soft text-warn")}>{delta > 0 ? "+" : "−"}{Math.abs(delta)}</span>}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-sm">
        <span className="text-muted">Struggle score</span>
        <span className="t-num flex flex-wrap items-center justify-end gap-2">
          {result.struggle.before} <ArrowRight className="size-3.5 text-faint" aria-hidden /> {result.struggle.after}
          <StruggleChip level={result.struggle.level} />
        </span>
      </div>

      <TutorCoach
        topicId={topicId} questionId={questionId} displayedStem={displayedStem} proactiveTrigger={proactiveTrigger}
        onRetrySameQuestion={onRetry} onNextQuestion={onNext} onReviewConcept={onReview}
      />

      {level.change !== "hold" && (
        <div className={cn("flex gap-3 rounded-2xl p-4 text-sm", level.change === "up" ? "bg-brand-soft" : "bg-warn-soft")}>
          {level.change === "up" ? <ArrowUp className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden /> : <ArrowDown className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />}
          <div>
            <p className="font-semibold">{level.change === "up" ? "Level up" : "Adjusting the level"}: Level {level.after} · {LEVEL_NAMES[level.after]}</p>
            <p className="mt-0.5 text-muted">{level.reason}</p>
          </div>
        </div>
      )}

      {result.prerequisiteCheck && (
        <div className={cn("rounded-2xl p-4 text-sm", result.prerequisiteCheck.solid ? "bg-subtle" : "bg-warn-soft")}>
          <p className="font-semibold">Prerequisite check</p>
          <p className="mt-0.5 text-muted">{result.prerequisiteCheck.message}</p>
          <Link href="/student/path" className="mt-2 inline-flex items-center gap-1 font-semibold text-brand">Open My Path <ArrowRight className="size-4" /></Link>
        </div>
      )}

      {result.events.some((e) => e.type === "intervention" && e.tone === "good") && (
        <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-4 text-sm text-success">
          <Check className="size-5 shrink-0" strokeWidth={3} aria-hidden />
          <p className="font-semibold">{result.events.find((e) => e.type === "intervention" && e.tone === "good")?.title}</p>
        </div>
      )}

      {result.unlocked.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-success p-4 text-brand-on">
          <PartyPopper className="size-6 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{result.unlocked.map((u) => u.name).join(" and ")} unlocked</p>
            <p className="text-sm opacity-90">Your mastery in {result.topicName} opened the next step.</p>
          </div>
          <Link href={`/student/learn/${result.unlocked[0].id}`} className="shrink-0 rounded-xl bg-brand-on px-4 py-2 text-sm font-semibold text-success">Open</Link>
        </div>
      )}

      {wrongStreak && !result.correct && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-subtle p-4 text-sm">
          <span>A couple in a row are tricky. A quick look at the concept can help.</span>
          <Button variant="secondary" size="sm" onClick={onReview}>Review the concept</Button>
        </div>
      )}

      {result.events.length > 0 && (
        <details className="group rounded-2xl border border-line px-4 py-3 text-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
            What AURA just did <span className="t-num text-muted">{result.events.length}</span>
          </summary>
          <div className="mt-4"><AdaptiveTimeline events={result.events} /></div>
        </details>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button variant="ghost" onClick={onFinish}>Finish session</Button>
        <Button size="lg" onClick={onNext} iconRight={<ArrowRight className="size-4" />} autoFocus>
          {isNextMasterBrain ? "Next: Master Brain 🧠" : "Next question"}
        </Button>
      </div>
    </div>
  );
}

function Summary({ topicName, history, startScore, score, level, unlocked, onContinue }: { topicName: string; history: Answered[]; startScore: number; score: number; level: Level; unlocked: { id: string; name: string }[]; onContinue: () => void }) {
  const correct = history.filter((h) => h.correct).length;
  const delta = score - startScore;
  return (
    <Card padding="lg" className="enter mx-auto max-w-2xl text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand"><Check className="size-8" strokeWidth={2.5} /></span>
      <h2 className="t-title mt-5">Session complete</h2>
      <p className="t-body mt-1.5">
        {delta > 0 ? `${topicName} mastery grew by ${delta} points.` : delta < 0 ? `A tougher session. ${topicName} will come back with practice.` : `Steady work on ${topicName}.`}
      </p>
      <dl className="mt-8 grid grid-cols-3 divide-x divide-line">
        <div><dt className="t-eyebrow">Correct</dt><dd className="t-num mt-1.5 text-2xl">{correct}/{history.length}</dd></div>
        <div><dt className="t-eyebrow">Mastery</dt><dd className="t-num mt-1.5 text-2xl">{startScore}% → {score}%</dd></div>
        <div><dt className="t-eyebrow">Level</dt><dd className="t-num mt-1.5 text-2xl">{level}</dd></div>
      </dl>
      {unlocked.length > 0 && (
        <p className="mx-auto mt-6 max-w-sm rounded-2xl bg-success-soft px-4 py-3 text-sm font-medium text-success">Unlocked: {unlocked.map((u) => u.name).join(", ")}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={onContinue}>Keep practising</Button>
        <Button href={unlocked.length ? `/student/learn/${unlocked[0].id}` : "/student/path"} iconRight={<ArrowRight className="size-4" />}>
          {unlocked.length ? `Open ${unlocked[0].name}` : "Back to My Path"}
        </Button>
      </div>
    </Card>
  );
}
