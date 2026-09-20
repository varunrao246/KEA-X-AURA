"use client";

import * as React from "react";
import { StudentTheme } from "@/types";
import { RethemedQuestion } from "@/lib/retheming/types";
import { FractionVisualizer } from "./fraction-visualizer";
import { OralProbeModal } from "./oral-probe-modal";
import { PaceMascotCard } from "./pace-mascot-card";
import { FractionScaffoldStrip } from "./fraction-scaffold-strip";
import { calculatePaceMetrics } from "@/lib/pace/calculator";
import { AttemptLog } from "@/lib/pace/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Rocket,
  Compass,
  Utensils,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Mic,
  Layers,
  Award,
} from "lucide-react";

interface StudentLearningCanvasProps {
  conceptId?: string;
  conceptTitle?: string;
  initialTheme?: StudentTheme;
  studentName?: string;
  onMasteryAchieved?: (score: number) => void;
  onRemediationReroute?: (targetNodeId: string, targetTitle: string) => void;
}

const THEME_ICONS: Record<StudentTheme, React.ReactNode> = {
  space: <Rocket className="h-3.5 w-3.5" />,
  wildlife: <Compass className="h-3.5 w-3.5" />,
  chef: <Utensils className="h-3.5 w-3.5" />,
  superhero: <Shield className="h-3.5 w-3.5" />,
};

const THEME_BORDER_STYLES: Record<StudentTheme, string> = {
  space: "border-sky-500/40 shadow-sky-500/5",
  wildlife: "border-emerald-500/40 shadow-emerald-500/5",
  chef: "border-amber-500/40 shadow-amber-500/5",
  superhero: "border-purple-500/40 shadow-purple-500/5",
};

export function StudentLearningCanvas({
  conceptId = "NODE_03",
  conceptTitle = "Comparing Like Denominators",
  initialTheme = "space",
  studentName = "Aarav Sharma",
  onMasteryAchieved,
  onRemediationReroute,
}: StudentLearningCanvasProps) {
  const [theme, setTheme] = React.useState<StudentTheme>(initialTheme);
  const [question, setQuestion] = React.useState<RethemedQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = React.useState<string | null>(null);
  const [attemptCount, setAttemptCount] = React.useState<number>(0);
  const [consecutiveFailures, setConsecutiveFailures] = React.useState<number>(0);
  const [masteryScore, setMasteryScore] = React.useState<number>(35);
  const [showOralProbe, setShowOralProbe] = React.useState<boolean>(false);
  const [showScaffoldStrip, setShowScaffoldStrip] = React.useState<boolean>(false);
  const [isCelebrationActive, setIsCelebrationActive] = React.useState<boolean>(false);

  // Attempt timing tracker for pace calculator
  const startTimeRef = React.useRef<number>(0);
  const [attemptHistory, setAttemptHistory] = React.useState<AttemptLog[]>([
    { conceptId, secondsSpent: 62, isCorrect: false, timestamp: 1 },
  ]);

  const [feedback, setFeedback] = React.useState<{
    submitted: boolean;
    isCorrect: boolean;
    explanation: string;
    struggleTriggered?: boolean;
    rerouteTarget?: { id: string; title: string };
  } | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/content/retheme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canonicalItemId: conceptId,
        targetTheme: theme,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.themingSuccess) {
          setQuestion({
            canonicalId: conceptId,
            conceptId,
            theme,
            thematicContext: data.thematicContext,
            questionText: data.rethemedQuestion,
            options: data.options,
            correctOptionId: data.correctOptionId,
            explanation: data.explanation,
            isFallback: data.isFallback,
            invariantCheckPassed: data.invariantCheckPassed,
          });
          setSelectedOptionId(null);
          setFeedback(null);
          startTimeRef.current = Date.now();
        }
      })
      .catch(err => {
        console.error("Failed to fetch rethemed question", err);
      });

    return () => {
      isMounted = false;
    };
  }, [conceptId, theme]);

  const handleThemeChange = (newTheme: StudentTheme) => {
    setTheme(newTheme);
  };

  const paceState = calculatePaceMetrics(attemptHistory);

  const handleSubmit = async () => {
    if (!selectedOptionId || !question) return;

    const isCorrect = selectedOptionId === question.correctOptionId;
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    const secondsSpent = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));
    setAttemptHistory(prev => [
      ...prev,
      { conceptId, secondsSpent, isCorrect, timestamp: Date.now() },
    ]);
    startTimeRef.current = Date.now();

    if (isCorrect) {
      // Success: W-EMM update: 35 + 0.4 * (100 - 35) = 61 (or 61 + 0.4 * 39 = 77)
      const newScore = Math.min(100, Math.round(masteryScore + 0.4 * (100 - masteryScore)));
      setMasteryScore(newScore);
      setConsecutiveFailures(0);

      setFeedback({
        submitted: true,
        isCorrect: true,
        explanation: question.explanation,
      });

      if (newScore >= 80) {
        setIsCelebrationActive(true);
        onMasteryAchieved?.(newScore);
      }
    } else {
      // Failure
      const newFailures = consecutiveFailures + 1;
      setConsecutiveFailures(newFailures);
      const newScore = Math.max(0, Math.round(masteryScore + 0.4 * (20 - masteryScore)));
      setMasteryScore(newScore);

      if (newFailures >= 2) {
        // Struggle Trigger! Dispatch real-time intervention for Aarav
        try {
          await fetch("/api/facilitator/interventions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "acknowledge",
              interventionId: `intv_${studentName}_${conceptId}`,
            }),
          });
        } catch {
          // ignore background intervention dispatch errors
        }

        const rerouteTarget = {
          id: "NODE_02",
          title: "Numerator and Denominator",
        };

        setFeedback({
          submitted: true,
          isCorrect: false,
          explanation: question.explanation,
          struggleTriggered: true,
          rerouteTarget,
        });

        // Automatically open manipulative scaffold strip for hands-on remediation
        setShowScaffoldStrip(true);

        onRemediationReroute?.(rerouteTarget.id, rerouteTarget.title);
      } else {
        setFeedback({
          submitted: true,
          isCorrect: false,
          explanation: "Take another look at the visual fraction strip above. Look at which bar has fewer shaded blocks.",
        });
      }
    }
  };

  const handleApplyOralEvidence = (oralPercentage: number) => {
    // W-EMM update for oral evidence (weight 0.40)
    const newScore = Math.min(100, Math.round(masteryScore + 0.40 * (oralPercentage - masteryScore)));
    setMasteryScore(newScore);
    setShowOralProbe(false);

    if (newScore >= 80) {
      setIsCelebrationActive(true);
      onMasteryAchieved?.(newScore);
    }
  };

  const handleResetAttempt = () => {
    setSelectedOptionId(null);
    setFeedback(null);
    startTimeRef.current = Date.now();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Celebratory Mastery Confetti Banner (P2-03) */}
      {isCelebrationActive && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 border-2 border-emerald-500/50 flex items-center justify-between shadow-lg animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🎉</span>
            <div>
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Award className="h-4 w-4" />
                Mastery Threshold Achieved (80%+)!
              </h3>
              <p className="text-xs text-muted-foreground">
                You proved solid conceptual understanding. Next curriculum node unlocked!
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white font-mono font-bold text-xs px-3 py-1">
            Score: {masteryScore}%
          </Badge>
        </div>
      )}

      {/* Top Banner: Student, Theme Switcher, and Pace Mascot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student & Concept Info */}
        <div className="md:col-span-2 p-4 rounded-2xl border border-border/80 bg-card shadow-sm flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-mono text-[11px]">
                Active Challenge
              </Badge>
              <span className="text-xs font-bold text-foreground">
                Learner: {studentName} (Class 4-B)
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {conceptTitle}
            </h2>
          </div>

          {/* 4-Theme Switcher (P1-03) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60 self-start">
            <span className="text-[11px] font-bold text-muted-foreground px-2">Theme:</span>
            {(["space", "wildlife", "chef", "superhero"] as StudentTheme[]).map(t => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  theme === t
                    ? "bg-background text-foreground shadow-xs border border-border/70"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {THEME_ICONS[t]}
                <span className="hidden sm:inline">{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Learning Pace & Mascot Card (P1-02) */}
        <div>
          <PaceMascotCard paceState={paceState} />
        </div>
      </div>

      {/* Main Interactive Challenge Card */}
      <Card className={`border shadow-md transition-all duration-300 ${THEME_BORDER_STYLES[theme]}`}>
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 font-mono text-[11px]">
                <Sparkles className="h-3 w-3" />
                <span>Themed Scenario</span>
              </Badge>
              {question?.thematicContext && (
                <span className="text-xs font-bold text-foreground">
                  {question.thematicContext}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Concept Mastery:</span>
              <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                {masteryScore}%
              </Badge>
            </div>
          </div>

          <CardTitle className="text-base sm:text-lg font-semibold text-foreground pt-2">
            {!question ? "Adapting question to your theme..." : question.questionText}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Fraction Strip Visualizer */}
          <FractionVisualizer
            fractionA={{ num: 3, den: 8, label: "3/8 (Alpha)" }}
            fractionB={{ num: 5, den: 8, label: "5/8 (Beta)" }}
          />

          {/* Options */}
          {question && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Select the Correct Statement:
              </span>
              {question.options.map(option => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={feedback?.submitted && feedback.isCorrect}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                        : "border-border/70 hover:border-primary/40 bg-card hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <span>{option.text}</span>
                    <span
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Row: Submit & AI Oral Probe Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowOralProbe(true)}
              className="gap-2 text-xs font-semibold cursor-pointer border-primary/30 hover:bg-primary/5"
            >
              <Mic className="h-3.5 w-3.5 text-primary" />
              <span>Explain in Words (AI Oral Probe)</span>
              <Badge className="bg-primary/20 text-primary text-[10px] font-mono py-0 px-1">
                +40% Weight
              </Badge>
            </Button>

            {!feedback?.submitted && (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOptionId || !question}
                className="gap-2 cursor-pointer font-bold ml-auto"
              >
                <span>Submit Answer</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Feedback Card */}
          {feedback && (
            <div className="space-y-4 pt-2">
              {feedback.isCorrect ? (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Brilliant! That is 100% correct!</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {feedback.explanation}
                  </p>
                  <p className="text-[11px] font-mono font-semibold pt-1">
                    Mastery increased to {masteryScore}%.
                  </p>
                </div>
              ) : feedback.struggleTriggered ? (
                /* Struggle Triggered Card: Golden Loop Escalation */
                <div className="p-5 rounded-2xl bg-destructive/10 border-2 border-destructive/40 text-destructive space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    <span>Struggle Detected (2 Consecutive Incorrect Attempts)</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">
                    You seem to be mixing up numerator and denominator roles.
                    An alert has been dispatched to <strong>Ms. Priya&apos;s Facilitator Cockpit</strong> with a 3-minute concrete manipulative activity!
                  </p>

                  <div className="p-3 rounded-xl bg-card border border-border text-xs text-foreground space-y-1">
                    <span className="font-bold text-primary uppercase text-[10px] block">
                      Automatic Learning Path Reroute:
                    </span>
                    <p>
                      KEA is rerouting your path to foundational prerequisite:{" "}
                      <strong>{feedback.rerouteTarget?.title}</strong> to reinforce visual fraction parts.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowScaffoldStrip(true)}
                      className="cursor-pointer text-xs gap-1.5"
                    >
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      <span>Open Remediation Strip (Manipulative)</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemediationReroute?.("NODE_02", "Numerator and Denominator")}
                      className="cursor-pointer text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Review Prerequisite (NODE_02)</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Attempt 1 Incorrect Card */
                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Not quite right on this attempt</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {feedback.explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetAttempt}
                      className="cursor-pointer text-xs gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Try Again</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Fraction Scaffold Remediation Tool (P1-04) */}
      {showScaffoldStrip && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-3 duration-300">
          <FractionScaffoldStrip
            onCompleteRemediation={() => {
              setShowScaffoldStrip(false);
              // Remediation gives a boost back to 50%
              setMasteryScore(Math.max(masteryScore, 50));
            }}
          />
        </div>
      )}

      {/* AI Oral Comprehension Probe Modal (P1-01) */}
      {showOralProbe && (
        <OralProbeModal
          conceptId={conceptId}
          conceptTitle={conceptTitle}
          studentName={studentName}
          onApplyOralEvidence={handleApplyOralEvidence}
          onClose={() => setShowOralProbe(false)}
        />
      )}
    </div>
  );
}
