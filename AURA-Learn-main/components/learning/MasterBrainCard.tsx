"use client";

import React, { useState, useEffect, useRef } from "react";
import { Brain, Sparkles, ExternalLink, ArrowRight, Check, X, SkipForward, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MasterBrainChallenge, MasterBrainEvaluationResponse } from "@/lib/mastery-brain/types";
import { cn } from "@/lib/utils";

/**
 * Lightweight, zero-dependency confetti animation.
 * Spawns dynamic colorful confetti particles that burst and flutter downward,
 * naturally cleaning up and removing the canvas after 2.5 seconds.
 */
function triggerMasterBrainConfetti() {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  const renderCtx = ctx;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  renderCtx.scale(dpr, dpr);

  const colors = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#14b8a6"];
  const particleCount = 70;
  const particles = Array.from({ length: particleCount }).map(() => ({
    x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 160,
    y: window.innerHeight * 0.45,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 14 - 4,
    size: Math.random() * 9 + 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    vRotation: (Math.random() - 0.5) * 14,
    shape: Math.random() > 0.4 ? "rect" : "circle",
    alpha: 1,
  }));

  const startTime = Date.now();
  const duration = 2500;

  function render() {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      canvas.remove();
      return;
    }

    renderCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38; // gravity
      p.vx *= 0.985; // air resistance
      p.rotation += p.vRotation;
      p.alpha = Math.max(0, 1 - elapsed / duration);

      renderCtx.save();
      renderCtx.translate(p.x, p.y);
      renderCtx.rotate((p.rotation * Math.PI) / 180);
      renderCtx.globalAlpha = p.alpha;
      renderCtx.fillStyle = p.color;

      if (p.shape === "rect") {
        renderCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else {
        renderCtx.beginPath();
        renderCtx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        renderCtx.fill();
      }

      renderCtx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

interface Props {
  topicId: string;
  topicName: string;
  conceptName?: string;
  masteryScore: number;
  detectedMisconception?: string | null;
  onFinished?: () => void;
  className?: string;
}

export function MasterBrainCard({
  topicId,
  topicName,
  conceptName,
  masteryScore,
  detectedMisconception,
  onFinished,
  className,
}: Props) {
  const [challenge, setChallenge] = useState<MasterBrainChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [freeformThinking, setFreeformThinking] = useState<string>("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<MasterBrainEvaluationResponse | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThinkingBox, setShowThinkingBox] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const hasCelebratedRef = useRef(false);

  // Fetch challenge once on mount
  useEffect(() => {
    let isMounted = true;
    async function loadChallenge() {
      try {
        setLoading(true);
        hasCelebratedRef.current = false;
        const res = await fetch("/api/master-brain/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId,
            topicName,
            conceptName,
            masteryScore,
            detectedMisconception,
          }),
        });
        const json = await res.json();
        if (isMounted) {
          if (json.ok && json.data) {
            setChallenge(json.data);
            // Track shown event
            void fetch("/api/master-brain/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                topicId,
                challengeId: json.data.id,
                eventType: "master_brain_shown",
              }),
            });
          } else {
            setError(json.error || "Failed to load challenge");
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Offline or challenge unavailable");
          setLoading(false);
        }
      }
    }

    void loadChallenge();

    return () => {
      isMounted = false;
    };
  }, [topicId, topicName, conceptName, masteryScore, detectedMisconception]);

  async function handleAnswer() {
    if (!challenge || !selectedOptionId || evaluating) return;
    setEvaluating(true);
    try {
      const res = await fetch("/api/master-brain/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge,
          selectedOptionId,
          freeformThinking: freeformThinking.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setEvaluation(json.data);

        // Confetti celebration triggered EXCLUSIVELY on correct Master Brain answer, once
        if (json.data.correct && !hasCelebratedRef.current) {
          hasCelebratedRef.current = true;
          triggerMasterBrainConfetti();
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4500);
        }

        // Track answered event
        void fetch("/api/master-brain/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId,
            challengeId: challenge.id,
            eventType: json.data.correct ? "master_brain_correct" : "master_brain_incorrect",
            metadata: {
              earnedXp: json.data.earnedBrainXp,
              streak: json.data.newBrainStreak,
            },
          }),
        });
      }
    } catch {
      // Local graceful fallback evaluation if network fails
      const chosen = challenge.options.find((o) => o.id === selectedOptionId);
      const isCorrect = Boolean(chosen?.isCorrect);

      if (isCorrect && !hasCelebratedRef.current) {
        hasCelebratedRef.current = true;
        triggerMasterBrainConfetti();
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4500);
      }

      setEvaluation({
        correct: isCorrect,
        headlineFeedback: isCorrect ? "💡 Brilliant reasoning!" : "Interesting thought! 👀",
        encouragingFeedback: isCorrect
          ? "You connected the dots beyond the textbook!"
          : "That's a very natural first guess! Here's the surprising part...",
        fullExplanation: challenge.explanation,
        surprisingFact: challenge.surprisingFact,
        realWorldConnection: challenge.realWorldConnection,
        earnedBrainXp: 5,
        newBrainStreak: 2,
        streakExtendedToday: true,
      });
    } finally {
      setEvaluating(false);
    }
  }

  function handleSkip() {
    setSkipped(true);
    if (challenge) {
      void fetch("/api/master-brain/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          challengeId: challenge.id,
          eventType: "master_brain_skipped",
        }),
      });
    }
    if (onFinished) onFinished();
  }

  if (skipped) {
    return null;
  }

  if (loading) {
    return (
      <Card padding="md" className={cn("animate-pulse border-brand/20 bg-brand-soft/20", className)}>
        <div className="flex items-center gap-3">
          <Brain className="size-6 text-brand animate-spin" />
          <span className="text-sm font-semibold text-brand">Brewing a Master Brain challenge...</span>
        </div>
      </Card>
    );
  }

  if (error || !challenge) {
    return (
      <Card padding="md" className={cn("border-line bg-surface text-center p-6 space-y-3", className)}>
        <p className="text-sm text-muted">Master Brain challenge is taking a quick breather.</p>
        <Button size="sm" variant="secondary" onClick={onFinished}>
          Continue to Next Question <ArrowRight className="size-3.5 ml-1" />
        </Button>
      </Card>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-3xl border-2 border-brand/30 bg-gradient-to-b from-brand-soft/30 to-surface p-5 sm:p-6 shadow-lg transition-all", className)}>
      {/* Header bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-on shadow-sm">
            <Brain className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Master Brain</span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">Bonus Challenge</span>
            </div>
            <h4 className="text-base font-bold text-ink">{challenge.promptHeadline}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {evaluation && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
              <Flame className="size-3.5 fill-warn" /> {evaluation.newBrainStreak} Day Brain Streak
            </span>
          )}
          {!evaluation && (
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-ink"
            >
              <SkipForward className="size-3.5" /> Skip
            </button>
          )}
        </div>
      </div>

      {/* Question Stem */}
      <div className="mb-5">
        <p className="text-base sm:text-lg font-medium leading-relaxed text-ink">
          {challenge.questionText}
        </p>
      </div>

      {/* Unanswered State: Options list */}
      {!evaluation ? (
        <div className="space-y-4">
          <div role="radiogroup" aria-label="Master brain options" className="grid gap-2.5">
            {challenge.options.map((opt) => {
              const selected = selectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3.5 text-left text-sm font-medium transition active:scale-[0.99]",
                    selected
                      ? "border-brand bg-brand-soft text-ink ring-2 ring-brand/20"
                      : "border-line bg-surface hover:border-brand/40 hover:bg-subtle"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-xs",
                      selected ? "border-brand bg-brand text-brand-on" : "border-line bg-surface"
                    )}
                  >
                    {selected && "•"}
                  </span>
                  <span className="leading-snug">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Optional reasoning text box */}
          {showThinkingBox ? (
            <div className="space-y-1.5">
              <label htmlFor="brain-reasoning" className="text-xs font-semibold text-muted">
                Your reasoning (optional — earns +{challenge.bonusXp} bonus Brain XP):
              </label>
              <input
                id="brain-reasoning"
                type="text"
                value={freeformThinking}
                onChange={(e) => setFreeformThinking(e.target.value)}
                placeholder="In my opinion, because..."
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-brand"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowThinkingBox(true)}
              className="text-xs font-semibold text-brand transition hover:underline"
            >
              + Add your own reasoning for bonus Brain XP
            </button>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button
              size="md"
              onClick={handleAnswer}
              disabled={!selectedOptionId || evaluating}
              loading={evaluating}
              iconLeft={<Sparkles className="size-4" />}
            >
              Think 🤔
            </Button>
          </div>
        </div>
      ) : (
        /* Answered State: Encouraging Feedback + Real World Discovery */
        <div className="space-y-4">
          {/* Celebratory Banner on Correct Master Brain Answer */}
          {showCelebration && (
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-brand-soft to-emerald-500/20 border-2 border-brand/40 p-4 shadow-lg animate-in zoom-in-95 duration-300">
              <span className="text-3xl animate-bounce">🎉</span>
              <div>
                <h4 className="text-sm font-black text-brand tracking-wide">
                  🧠 Brilliant thinking! You cracked it!
                </h4>
                <p className="text-xs text-muted font-medium">
                  Master Brain bonus solved with flying colors
                </p>
              </div>
            </div>
          )}

          <div
            className={cn(
              "rounded-2xl p-4 transition-all",
              evaluation.correct ? "bg-success-soft/80 border border-success/30" : "bg-brand-soft/70 border border-brand/30"
            )}
          >
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  "flex items-center gap-2 text-base font-bold",
                  evaluation.correct ? "text-success" : "text-brand"
                )}
              >
                {evaluation.correct ? <Check className="size-5" strokeWidth={3} /> : <Sparkles className="size-5" />}
                {evaluation.headlineFeedback}
              </p>
              <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-brand shadow-sm">
                +{evaluation.earnedBrainXp} Brain XP
              </span>
            </div>

            <p className="mt-2 text-sm font-medium text-ink/90 leading-relaxed">
              {evaluation.encouragingFeedback}
            </p>
            <p className="mt-2 text-sm text-ink/80 leading-relaxed">
              {evaluation.fullExplanation}
            </p>
          </div>

          {/* Surprising fact chip */}
          {evaluation.surprisingFact && (
            <div className="rounded-2xl bg-warn-soft/60 border border-warn/30 p-3 text-xs leading-relaxed text-ink">
              <span className="font-bold text-warn">Did you know? </span>
              {evaluation.surprisingFact}
            </div>
          )}

          {/* SerpApi Real-World Connection Card */}
          {evaluation.realWorldConnection && (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <span>🌎 Real-World Connection</span>
                <span>•</span>
                <span className="text-brand">{evaluation.realWorldConnection.domain}</span>
                <span className="ml-auto rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">Powered by SerpApi</span>
              </div>
              <h5 className="mt-1 text-sm font-bold text-ink">
                {evaluation.realWorldConnection.title}
              </h5>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                {evaluation.realWorldConnection.description}
              </p>
              {evaluation.realWorldConnection.sourceUrl && (
                <a
                  href={evaluation.realWorldConnection.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                >
                  Explore real-world application <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (onFinished) onFinished();
                setSkipped(true);
              }}
              iconRight={<ArrowRight className="size-3.5" />}
            >
              Continue Practice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
