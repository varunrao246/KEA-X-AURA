"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Sparkles, ArrowRight } from "lucide-react";

interface TopicAnalyzingViewProps {
  topic: string;
  onComplete: () => void;
}

export function TopicAnalyzingView({
  topic,
  onComplete,
}: TopicAnalyzingViewProps) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [progressVal, setProgressVal] = React.useState(20);

  const steps = [
    { title: "Understanding your topic", description: `Parsing semantic domain and core competencies for "${topic}"` },
    { title: "Identifying what needs to be learned", description: "Extracting atomic concepts, dependencies, and prerequisite chains" },
    { title: "Structuring your learning path", description: "Organizing milestones into progressive stages from foundations to mastery" },
  ];

  React.useEffect(() => {
    // Step 0 -> Step 1 after 500ms
    const t1 = setTimeout(() => {
      setStepIndex(1);
      setProgressVal(60);
    }, 500);

    // Step 1 -> Step 2 after 1100ms
    const t2 = setTimeout(() => {
      setStepIndex(2);
      setProgressVal(90);
    }, 1100);

    // Step 2 -> Complete after 1700ms
    const t3 = setTimeout(() => {
      setProgressVal(100);
      onComplete();
    }, 1700);

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
        <span>Target Goal: <strong>{topic}</strong></span>
      </Badge>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Structuring Your Learning Path
        </h2>
        <p className="text-sm text-muted-foreground">
          KEA is mapping core concepts, dependencies, and progression milestones.
        </p>
      </div>

      <Card className="w-full text-left shadow-md border-border/80 bg-card">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Structuring Progress</span>
              <span>{progressVal}%</span>
            </div>
            <Progress value={progressVal} className="h-2" />
          </div>

          <div className="space-y-3.5 pt-2">
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
                      {idx + 1}. {st.title}
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
            <span className="italic">Modular Curriculum Generator</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
              className="text-xs h-8 text-primary hover:text-primary gap-1 cursor-pointer"
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
