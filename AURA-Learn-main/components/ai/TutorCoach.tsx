"use client";

import { Compass, Lightbulb, Loader2, MessagesSquare, RotateCcw, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { askTutor, type TutorMode, type TutorResponse } from "./tutorClient";
import { cn } from "@/lib/utils";

interface Props {
  topicId: string;
  questionId?: string;
  displayedStem?: string;
  /** Bump this (e.g. to the attempt id) whenever a new answer was just graded, to proactively re-ask the tutor. */
  proactiveTrigger?: string;
  onRetrySameQuestion?: () => void;
  onNextQuestion?: () => void;
  onReviewConcept?: () => void;
}

const TYPE_META: Record<TutorResponse["type"], { label: string; icon: typeof Lightbulb }> = {
  hint: { label: "Hint", icon: Lightbulb },
  misconception: { label: "What I noticed", icon: Compass },
  explanation: { label: "Explanation", icon: MessagesSquare },
  prerequisite: { label: "Foundation first", icon: Compass },
  encouragement: { label: "Coach", icon: Sparkles },
  challenge: { label: "Challenge", icon: TrendingUp },
};

/**
 * AURA's learning coach: not a chat window, a running commentary on how the student is doing right
 * now, with a small number of purposeful actions. Every message is grounded in the same mastery/
 * struggle/prerequisite state the adaptive engine already computed — the tutor only supplies wording.
 */
export function TutorCoach({ topicId, questionId, displayedStem, proactiveTrigger, onRetrySameQuestion, onNextQuestion, onReviewConcept }: Props) {
  const [response, setResponse] = useState<TutorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const ticket = useRef(0);
  const explanationVariation = useRef(0);

  async function ask(mode: TutorMode, message?: string, variation?: number) {
    const id = ++ticket.current;
    setLoading(true);
    setError("");
    setDismissed(false);
    try {
      const r = await askTutor({ topicId, questionId, mode, displayedStem, message, variation });
      if (id === ticket.current) setResponse(r);
    } catch {
      if (id === ticket.current) setError("Couldn't reach your tutor right now.");
    } finally {
      if (id === ticket.current) setLoading(false);
    }
  }

  // Proactively check in after a graded attempt — this is what makes it feel adaptive rather than
  // "ask me anything": the student never has to think to request help.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (proactiveTrigger) void ask("review"); }, [proactiveTrigger]);

  function refreshExplanation() {
    explanationVariation.current += 1;
    void ask(
      "explain",
      "Please use a fresh teaching angle rather than repeat the previous explanation.",
      explanationVariation.current,
    );
  }

  if (!loading && !response && !error) return null;
  if (dismissed) return null;

  const meta = response ? TYPE_META[response.type] : TYPE_META.encouragement;
  const Icon = meta.icon;

  return (
    <Card className="enter space-y-4 border-brand/25 bg-brand-soft/30">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-on"><Icon className="size-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">AURA Tutor</p>
            {response && <Badge tone="brand">{meta.label}</Badge>}
          </div>
          {loading && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Thinking about how to help…</p>
          )}
          {error && <p className="mt-2 text-sm text-muted">{error}</p>}
          {!loading && response && <p className="mt-2 text-[15px] leading-relaxed">{response.message}</p>}
        </div>
      </div>

      {!loading && response && (
        <>
          <div className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-3.5">
            <Button variant="secondary" size="sm" onClick={() => void ask("hint")} iconLeft={<Lightbulb className="size-4" />}>Give me a hint</Button>
            <Button variant="secondary" size="sm" onClick={refreshExplanation} iconLeft={<RotateCcw className="size-4" />}>Refresh explanation</Button>
            {response.nextAction === "learn_prerequisite" && onReviewConcept && (
              <Button variant="secondary" size="sm" onClick={onReviewConcept} iconLeft={<Compass className="size-4" />}>Review the concept</Button>
            )}
            {(response.nextAction === "retry" || response.nextAction === "check_understanding") && onRetrySameQuestion && (
              <Button variant="soft" size="sm" onClick={onRetrySameQuestion} iconLeft={<RotateCcw className="size-4" />}>Try this one again</Button>
            )}
            {(response.nextAction === "continue" || response.nextAction === "attempt") && onNextQuestion && (
              <Button variant="soft" size="sm" onClick={onNextQuestion}>Try another question</Button>
            )}
            <button type="button" onClick={() => setDismissed(true)} className="ml-auto text-sm text-muted transition hover:text-ink">Dismiss</button>
          </div>

          <p className="t-small flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-ink">Recent learning signal:</span>
            <span>{response.signals.wrongStreak > 0 ? `${response.signals.wrongStreak} incorrect in a row` : "on track"}</span>
            {response.signals.misconception && <span>· possible {response.signals.misconception.replace("_", " ")}</span>}
            <span>· struggle {response.signals.struggleLevel}</span>
            <span className={cn("ml-auto text-faint")}>{response.source === "ai" ? "AI-personalized" : "AURA coach"}</span>
          </p>
        </>
      )}
    </Card>
  );
}
