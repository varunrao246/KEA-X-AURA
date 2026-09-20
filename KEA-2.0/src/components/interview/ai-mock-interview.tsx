"use client";

import * as React from "react";
import { InterviewTurnEvaluation, InterviewSummary } from "@/lib/ai/schemas";
import { ExecutionMetadata } from "@/lib/ai/ai-provider";
import { InterviewSummaryView } from "./interview-summary";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  FileText,
  User,
  Bot,
} from "lucide-react";

interface TurnHistoryItem {
  turnNumber: number;
  question: string;
  studentAnswer: string;
  understanding?: "strong" | "partial" | "weak";
  misconceptions?: string[];
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: {
        isFinal: boolean;
        [index: number]: { transcript: string };
      };
    };
  }) => void;
  onerror: () => void;
  onend: () => void;
}

interface AIMockInterviewProps {
  topic: string;
  stageNumber?: number;
  targetConcepts?: Array<{ id: string; title: string }>;
  learnerMastery?: number;
  demoMode?: boolean;
  onMetadataUpdate?: (metadata: ExecutionMetadata) => void;
  onEvidenceRecorded?: (evidence: {
    conceptId: string;
    understanding: "strong" | "partial" | "weak";
    score: number;
    misconceptions: string[];
    confidence: number;
    source: string;
  }) => void;
  onClose?: () => void;
}

export function AIMockInterview({
  topic,
  stageNumber = 3,
  targetConcepts = [],
  learnerMastery = 60,
  demoMode = false,
  onMetadataUpdate,
  onEvidenceRecorded,
  onClose,
}: AIMockInterviewProps) {
  const [sessionId, setSessionId] = React.useState<string>("");
  const [currentQuestion, setCurrentQuestion] = React.useState<string>("");
  const [currentConceptId, setCurrentConceptId] = React.useState<string>("");
  const [turnCount, setTurnCount] = React.useState<number>(1);
  const [history, setHistory] = React.useState<TurnHistoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Input states
  const [inputMode, setInputMode] = React.useState<"voice" | "text">("voice");
  const [typedResponse, setTypedResponse] = React.useState<string>("");
  const [isListening, setIsListening] = React.useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = React.useState<string>("");

  // Last feedback & final summary
  const [lastFeedback, setLastFeedback] = React.useState<InterviewTurnEvaluation | null>(null);
  const [summary, setSummary] = React.useState<InterviewSummary | null>(null);

  // Speech Recognition Ref
  const recognitionRef = React.useRef<BrowserSpeechRecognition | null>(null);

  const onMetadataUpdateRef = React.useRef(onMetadataUpdate);
  React.useEffect(() => {
    onMetadataUpdateRef.current = onMetadataUpdate;
  }, [onMetadataUpdate]);

  const targetConceptsRef = React.useRef(targetConcepts);
  React.useEffect(() => {
    targetConceptsRef.current = targetConcepts;
  }, [targetConcepts]);

  // Initialize Interview Session
  const initSession = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHistory([]);
    setTurnCount(1);
    setLastFeedback(null);
    setSummary(null);
    setTypedResponse("");
    setSpeechTranscript("");

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          stageNumber,
          targetConcepts: targetConceptsRef.current,
          learnerMastery,
          demoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start interview.");
      }

      setSessionId(data.sessionId);
      setCurrentQuestion(data.currentQuestion);
      setCurrentConceptId(data.currentConceptId);
      if (data.metadata && onMetadataUpdateRef.current) {
        onMetadataUpdateRef.current(data.metadata);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initialize interview");
    } finally {
      setIsLoading(false);
    }
  }, [topic, stageNumber, learnerMastery, demoMode]);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/interview/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        stageNumber,
        targetConcepts: targetConceptsRef.current,
        learnerMastery,
        demoMode,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setSessionId(data.sessionId);
          setCurrentQuestion(data.currentQuestion);
          setCurrentConceptId(data.currentConceptId);
          if (data.metadata && onMetadataUpdateRef.current) {
            onMetadataUpdateRef.current(data.metadata);
          }
        } else {
          setError(data.error || "Failed to start interview.");
        }
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to initialize interview");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [topic, stageNumber, learnerMastery, demoMode]);

  // Speech Recognition Setup
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: new () => BrowserSpeechRecognition })
          .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => BrowserSpeechRecognition })
          .webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const combined = (finalTranscript + interimTranscript).trim();
          setSpeechTranscript(combined);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setInputMode("text");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setSpeechTranscript("");
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Submit Answer (Speech or Text)
  const handleSubmitResponse = async () => {
    const studentAnswer = (
      inputMode === "voice" ? speechTranscript : typedResponse
    ).trim();

    if (!studentAnswer || isEvaluating) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const res = await fetch("/api/interview/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          topic,
          currentQuestion,
          currentConceptId,
          studentResponse: studentAnswer,
          history,
          turnCount,
          maxTurns: 4,
          demoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process interview turn.");
      }

      const evaluation: InterviewTurnEvaluation = data.evaluation;
      setLastFeedback(evaluation);

      // Record evidence into MasteryEngine
      if (data.masteryEvidence && onEvidenceRecorded) {
        onEvidenceRecorded(data.masteryEvidence);
      }

      // Add to conversation history
      const updatedHistory: TurnHistoryItem[] = [
        ...history,
        {
          turnNumber: turnCount,
          question: currentQuestion,
          studentAnswer,
          understanding: evaluation.understanding,
          misconceptions: evaluation.misconceptions,
        },
      ];
      setHistory(updatedHistory);

      // Reset inputs
      setSpeechTranscript("");
      setTypedResponse("");

      // Check if finished
      if (evaluation.nextAction === "finish" || turnCount >= 4) {
        await completeInterview(updatedHistory);
      } else {
        // Advance to next turn
        setCurrentQuestion(evaluation.nextQuestion);
        if (evaluation.nextConceptId) {
          setCurrentConceptId(evaluation.nextConceptId);
        }
        setTurnCount((prev) => prev + 1);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error evaluating turn");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Complete Interview and fetch comprehensive summary
  const completeInterview = async (finalHistory: TurnHistoryItem[]) => {
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          topic,
          history: finalHistory,
          demoMode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSummary(data.summary);
      }
    } catch (err: unknown) {
      console.warn("Failed to generate summary:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Render Summary View if completed
  if (summary) {
    return (
      <InterviewSummaryView
        summary={summary}
        onRestart={initSession}
        onClose={onClose}
      />
    );
  }

  const activeResponseText = inputMode === "voice" ? speechTranscript : typedResponse;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 gap-1 font-mono text-xs">
              <Sparkles className="h-3 w-3" />
              <span>Adaptive AI Oral Defense</span>
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              Turn {turnCount} of 4
            </Badge>
            {demoMode && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                Demo Mode
              </Badge>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {topic} Oral Mastery Defense
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={initSession}
            disabled={isLoading || isEvaluating}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Restart Defense</span>
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer text-xs">
              Exit
            </Button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Initializing Oral Defense Session...
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Calibrating opening probing question to your current mastery context...
            </p>
          </div>
        </div>
      )}

      {/* Error Card */}
      {error && !isLoading && (
        <Card className="border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button size="sm" onClick={initSession} className="cursor-pointer">
            Retry Session
          </Button>
        </Card>
      )}

      {/* Active Interview Interface */}
      {!isLoading && !summary && currentQuestion && (
        <div className="space-y-6">
          {/* Transcript History Feed */}
          {history.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {history.map((turn, tIdx) => (
                <div key={tIdx} className="space-y-2 text-xs">
                  {/* AI Question */}
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50">
                    <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Interviewer (Turn {turn.turnNumber}): </span>
                      <span className="text-muted-foreground">{turn.question}</span>
                    </div>
                  </div>

                  {/* Student Answer */}
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20 ml-6">
                    <User className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold text-foreground">You: </span>
                      <span className="text-foreground/90 italic">&ldquo;{turn.studentAnswer}&rdquo;</span>
                      {turn.understanding && (
                        <div className="pt-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              turn.understanding === "strong"
                                ? "text-emerald-500 border-emerald-500/30"
                                : turn.understanding === "partial"
                                ? "text-amber-500 border-amber-500/30"
                                : "text-destructive border-destructive/30"
                            }`}
                          >
                            {turn.understanding} understanding evaluated
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Question Card */}
          <Card className="border-primary/40 shadow-md bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Target: {currentConceptId}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    Turn {turnCount}
                  </Badge>
                </div>
                {lastFeedback && (
                  <Badge
                    variant="outline"
                    className={`capitalize font-mono text-[10px] ${
                      lastFeedback.understanding === "strong"
                        ? "text-emerald-500 border-emerald-500/30"
                        : lastFeedback.understanding === "partial"
                        ? "text-amber-500 border-amber-500/30"
                        : "text-destructive border-destructive/30"
                    }`}
                  >
                    Feedback: {lastFeedback.understanding}
                  </Badge>
                )}
              </div>
              <div className="flex items-start gap-3 pt-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
                    Interviewer Probing Question
                  </span>
                  <p className="text-base sm:text-lg font-bold text-foreground leading-snug">
                    {currentQuestion}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {/* Input Mode Toggle (Voice vs Text) */}
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <span className="text-xs text-muted-foreground font-mono">Response Method:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant={inputMode === "voice" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInputMode("voice")}
                    className="gap-1.5 text-xs h-7 cursor-pointer"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Microphone</span>
                  </Button>
                  <Button
                    variant={inputMode === "text" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInputMode("text")}
                    className="gap-1.5 text-xs h-7 cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Type Text</span>
                  </Button>
                </div>
              </div>

              {/* Voice Input Mode */}
              {inputMode === "voice" ? (
                <div className="space-y-4 py-2">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      size="lg"
                      onClick={toggleListening}
                      disabled={isEvaluating}
                      className={`gap-2 font-bold cursor-pointer transition-all ${
                        isListening
                          ? "bg-destructive hover:bg-destructive/90 text-white animate-pulse"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-5 w-5" />
                          <span>Stop Speaking (Click when done)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-5 w-5" />
                          <span>Click to Speak Your Explanation</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Speech transcript preview box */}
                  <div className="p-4 rounded-lg border border-border/80 bg-background/80 min-h-[90px] space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>Live Speech Transcript:</span>
                      {isListening && (
                        <span className="text-primary flex items-center gap-1 animate-pulse">
                          ● Recording audio...
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/90 font-sans italic">
                      {speechTranscript || (
                        <span className="text-muted-foreground/60 not-italic">
                          Your spoken response will appear here in real time...
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                /* Text Input Mode */
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={typedResponse}
                    onChange={(e) => setTypedResponse(e.target.value)}
                    placeholder="Articulate your conceptual explanation or defense here..."
                    className="w-full p-3.5 rounded-lg border border-border/80 bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans leading-relaxed"
                  />
                </div>
              )}

              {/* Submit Action */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSpeechTranscript("");
                    setTypedResponse("");
                  }}
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Clear
                </Button>

                <Button
                  size="sm"
                  onClick={handleSubmitResponse}
                  disabled={!activeResponseText.trim() || isEvaluating}
                  className="gap-1.5 cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Evaluating Reasoning...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Verbal Defense</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
