"use client";

import * as React from "react";
import { Mic, MicOff, Sparkles, Send, Brain, AlertCircle, CheckCircle2, Volume2, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OralEvaluationResult } from "@/lib/oral/types";

interface OralProbeModalProps {
  conceptId: string;
  conceptTitle: string;
  studentName?: string;
  onApplyOralEvidence: (score: number) => void;
  onClose: () => void;
}

interface IWindowSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

export function OralProbeModal({
  conceptId,
  conceptTitle,
  studentName = "Aarav",
  onApplyOralEvidence,
  onClose,
}: OralProbeModalProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [speechSupported, setSpeechSupported] = React.useState(false);
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [evaluation, setEvaluation] = React.useState<OralEvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Recognition ref
  const recognitionRef = React.useRef<IWindowSpeechRecognition | null>(null);

  React.useEffect(() => {
    // Check for SpeechRecognition support after mount
    if (typeof window !== "undefined") {
      const SpeechRecognitionConstructor =
        (window as unknown as { SpeechRecognition?: new () => IWindowSpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => IWindowSpeechRecognition }).webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        try {
          const recognition = new SpeechRecognitionConstructor();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: ISpeechRecognitionEvent) => {
            let fullTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
              fullTranscript += event.results[i][0].transcript + " ";
            }
            setTranscript(fullTranscript.trim());
          };

          recognition.onerror = () => {
            setIsRecording(false);
          };

          recognition.onend = () => {
            setIsRecording(false);
          };

          recognitionRef.current = recognition;
          // Defer state update to next microtask tick to prevent synchronous effect render
          queueMicrotask(() => {
            setSpeechSupported(true);
          });
        } catch {
          // Speech recognition failed to initialize
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleRecording = () => {
    setErrorMsg(null);
    if (!recognitionRef.current) {
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn("Could not start recognition:", err);
        setIsRecording(false);
      }
    }
  };

  const handleEvaluate = async () => {
    if (!transcript.trim()) {
      setErrorMsg("Please speak into the mic or type your explanation first.");
      return;
    }

    setIsEvaluating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/oral/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: `student_${studentName.toLowerCase().replace(/\s+/g, "_")}`,
          conceptId,
          conceptTitle,
          transcript,
        }),
      });

      if (!res.ok) {
        throw new Error("Evaluation request failed.");
      }

      const data: OralEvaluationResult = await res.json();
      setEvaluation(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to evaluate response.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleApplyScore = () => {
    if (!evaluation) return;
    const scorePercentage = Math.round(evaluation.conceptualUnderstandingScore * 100);
    onApplyOralEvidence(scorePercentage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-border/80 shadow-2xl bg-card">
        <CardHeader className="flex flex-row items-start justify-between pb-3 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-[11px]">
                AI Oral Comprehension Probe
              </Badge>
              <Badge variant="outline" className="text-xs">
                Weight: 40% (W-EMM)
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-foreground">
              Explain Your Thinking in Words
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Concept: <span className="font-semibold text-foreground">{conceptTitle}</span>
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          {/* Question Prompt */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-primary">
              <Brain className="h-3.5 w-3.5" />
              <span>Diagnostic Reflection Prompt:</span>
            </div>
            <p className="text-sm text-foreground">
              &quot;Why is <strong>5/8</strong> greater than <strong>3/8</strong>? Explain what the top number (numerator) and bottom number (denominator) tell you about the slices.&quot;
            </p>
          </div>

          {/* Voice Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5" />
                Live Speech or Natural Text
              </label>

              {speechSupported ? (
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleRecording}
                  className="gap-2 text-xs font-semibold rounded-full px-3 transition-all"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-3.5 w-3.5 animate-pulse" />
                      Listening (Click to Stop)...
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-primary" />
                      Record with Microphone
                    </>
                  )}
                </Button>
              ) : (
                <span className="text-[11px] text-muted-foreground italic">
                  Microphone speech recognition not active in this browser. Type below!
                </span>
              )}
            </div>

            {/* Pulsing indicator when recording */}
            {isRecording && (
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs animate-pulse">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>Microphone active — speak clearly into your device...</span>
              </div>
            )}

            {/* Live Transcript / Textarea */}
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Speak or type your explanation here (e.g. 'Both have 8 slices, so having 5 slices is more than 3 slices')..."
              rows={4}
              className="w-full p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-sans"
            />

            {errorMsg && (
              <div className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTranscript("Both fractions have 8 equal slices, so having 5 slices gives you more pizza than 3 slices.");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Insert sample explanation
              </Button>

              <Button
                onClick={handleEvaluate}
                disabled={isEvaluating || !transcript.trim()}
                className="gap-2 text-xs font-bold"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    AI Analyzing Conceptual Depth...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Analyze Conceptual Understanding
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Diagnostic Result Card */}
          {evaluation && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3.5 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Conceptual Mastery Score:
                  </span>
                  <Badge
                    className={
                      evaluation.conceptualUnderstandingScore >= 0.8
                        ? "bg-emerald-500 text-white font-mono"
                        : evaluation.conceptualUnderstandingScore >= 0.5
                        ? "bg-amber-500 text-white font-mono"
                        : "bg-rose-500 text-white font-mono"
                    }
                  >
                    {Math.round(evaluation.conceptualUnderstandingScore * 100)}%
                  </Badge>
                </div>

                <Badge variant="outline" className="text-[11px]">
                  {evaluation.articulatesKeyPrinciple ? "Principle Articulated" : "Needs Clarification"}
                </Badge>
              </div>

              {/* Misconception Flag */}
              {evaluation.identifiedMisconception !== "none" ? (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-amber-800 dark:text-amber-300">
                      Identified Misconception: {evaluation.identifiedMisconception.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <p className="text-muted-foreground">
                      {evaluation.misconceptionDescription || "The student exhibited a partial mental model."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    No Conceptual Misconceptions Detected! High-depth reasoning.
                  </span>
                </div>
              )}

              {/* Encouraging Feedback */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Child-Friendly Feedback:
                </span>
                <p className="text-xs text-foreground italic">
                  &quot;{evaluation.encouragingChildFeedback}&quot;
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyScore}
                  className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                >
                  <Send className="h-3.5 w-3.5" />
                  Apply Oral Evidence to Mastery (+40% Weight)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
