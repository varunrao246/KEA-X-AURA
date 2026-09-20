"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Sparkles, ArrowRight } from "lucide-react";

interface TopicAnalysisTransitionProps {
  topic: string;
  onComplete: () => void;
}

export function TopicAnalysisTransition({ topic, onComplete }: TopicAnalysisTransitionProps) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [progressVal, setProgressVal] = React.useState(15);

  const steps = [
    { title: "Understanding your topic...", description: `Parsing semantic domain and core competencies for "${topic}"` },
    { title: "Identifying prerequisites & dependencies...", description: "Mapping topological knowledge dependencies and foundational concepts" },
    { title: "Building your diagnostic assessment...", description: "Calibrating diagnostic check to evaluate Required vs. Current Knowledge" },
  ];

  React.useEffect(() => {
    // Step 0 -> Step 1 after 600ms
    const t1 = setTimeout(() => {
      setStepIndex(1);
      setProgressVal(55);
    }, 600);

    // Step 1 -> Step 2 after 1300ms
    const t2 = setTimeout(() => {
      setStepIndex(2);
      setProgressVal(90);
    }, 1300);

    // Step 2 -> Complete after 2000ms
    const t3 = setTimeout(() => {
      setProgressVal(100);
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 max-w-xl mx-auto text-center space-y-8 animate-in fade-in duration-300">
      <Badge variant="outline" className="px-3 py-1 gap-1.5 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
        <span>Decomposing: <strong>{topic}</strong></span>
      </Badge>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Constructing Your Knowledge Tree
        </h2>
        <p className="text-sm text-muted-foreground">
          KEA is analyzing prerequisite relationships and calibrating your diagnostic baseline.
        </p>
      </div>

      <Card className="w-full text-left shadow-md border-border/80 bg-card">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Analysis Progress</span>
              <span>{progressVal}%</span>
            </div>
            <Progress value={progressVal} className="h-2" />
          </div>

          <div className="space-y-4 pt-2">
            {steps.map((st, idx) => {
              const isDone = idx < stepIndex;
              const isCurrent = idx === stepIndex;
              return (
                <div
                  key={st.title}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    isCurrent
                      ? "bg-primary/5 border border-primary/20"
                      : isDone
                      ? "bg-muted/40"
                      : "opacity-40"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-border" />
                    )}
                  </div>
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      {st.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                      {st.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border/40">
            <span className="italic">Transparent Local Decomposition</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
              className="text-xs h-8 text-primary hover:text-primary gap-1"
            >
              <span>Skip Wait</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
