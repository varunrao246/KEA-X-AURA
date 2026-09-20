"use client";

import { ArrowRight, Lightbulb, Shuffle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Lesson } from "@/content/lessons";
import type { Interest } from "@/lib/types";
import { INTEREST_OPTIONS } from "@/components/student/interests";

export interface Analogy { interest: Interest; text: string }

export function LearnPanel({ lesson, analogies, onStartPractice }: { lesson: Lesson | undefined; analogies: Analogy[]; onStartPractice: () => void }) {
  const [idx, setIdx] = useState(0);
  if (!lesson) return <Card><p className="t-body">Lesson content for this topic is coming soon. Try the practice tab.</p></Card>;
  const analogy = analogies[idx % Math.max(1, analogies.length)];
  const meta = analogy ? INTEREST_OPTIONS.find((o) => o.id === analogy.interest) : undefined;
  const AnalogyIcon = meta?.icon ?? Lightbulb;

  return (
    <div className="space-y-5">
      <Card padding="lg" className="enter">
        <p className="t-eyebrow mb-2">The big idea</p>
        <p className="text-2xl font-medium leading-snug tracking-tight sm:text-[1.7rem]">{lesson.bigIdea}</p>
      </Card>

      {analogy && (
        <Card className="enter border-accent/30 bg-accent-soft/60" style={{ ["--i" as string]: 1 }}>
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-brand-on"><AnalogyIcon className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="t-eyebrow text-accent">In your world · {meta?.label}</p>
                {analogies.length > 1 && (
                  <button type="button" onClick={() => setIdx((i) => i + 1)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-ink">
                    <Shuffle className="size-3.5" aria-hidden /> Another world
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[15px] leading-relaxed">{analogy.text}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {lesson.points.map((p, i) => (
          <Card key={p.title} className="enter" style={{ ["--i" as string]: i + 2 }}>
            <span className="t-num text-sm text-brand">0{i + 1}</span>
            <h3 className="mt-2 font-semibold">{p.title}</h3>
            <p className="t-small mt-1.5">{p.text}</p>
          </Card>
        ))}
      </div>

      {lesson.formula && (
        <Card className="enter bg-brand-soft/60 text-center" style={{ ["--i" as string]: 5 }}>
          <p className="t-eyebrow mb-3">Remember</p>
          <p className="text-3xl font-semibold tracking-tight text-brand sm:text-4xl">{lesson.formula.expr}</p>
          <p className="t-small mx-auto mt-3 max-w-md">{lesson.formula.legend}</p>
        </Card>
      )}

      {lesson.example && (
        <Card className="enter" style={{ ["--i" as string]: 6 }}>
          <p className="t-eyebrow mb-1">Worked example</p>
          <h3 className="t-heading">{lesson.example.title}</h3>
          <ol className="mt-4 space-y-2">
            {lesson.example.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-[15px]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-xs font-semibold text-muted">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl bg-success-soft px-4 py-3 font-semibold text-success">{lesson.example.result}</p>
        </Card>
      )}

      <div className="flex justify-center pt-2">
        <Button size="lg" onClick={onStartPractice} iconRight={<ArrowRight className="size-4" />}>Ready? Try some questions</Button>
      </div>
    </div>
  );
}
