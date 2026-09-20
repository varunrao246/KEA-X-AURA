"use client";

import { AlertTriangle, ArrowRight, Check, LifeBuoy, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { LEVEL_NAMES } from "@/lib/adaptive";
import { findBlocker } from "@/lib/blockers";
import { relativeDay } from "@/lib/format";
import type { TopicState, TopicStatus } from "@/lib/student";
import { cn } from "@/lib/utils";

const NODE: Record<TopicStatus, string> = {
  mastered: "bg-success text-brand-on",
  learning: "bg-brand text-brand-on",
  attention: "bg-warn text-brand-on",
  locked: "border-2 border-dashed border-faint/60 bg-surface text-faint",
};

const CARD: Record<TopicStatus, string> = {
  mastered: "border-success/30",
  learning: "border-line hover:border-brand/40",
  attention: "border-warn/50 bg-warn-soft/40",
  locked: "border-dashed border-line bg-subtle/60",
};

interface CurriculumGraphProps {
  /** Every topic in the student's curriculum; used to resolve blockers. */
  allTopics: TopicState[];
  /** The topics of the course being shown, in order. */
  topics: TopicState[];
  goalTopicId: string;
  /** Opens the prerequisite-gap dialog on load, e.g. after being redirected from a locked topic. */
  autoOpenGap?: string;
}

export function CurriculumGraph({ allTopics, topics, goalTopicId, autoOpenGap }: CurriculumGraphProps) {
  const [gapId, setGapId] = useState<string | null>(autoOpenGap && topics.some((t) => t.id === autoOpenGap && t.locked) ? autoOpenGap : null);
  const gapTopic = topics.find((t) => t.id === gapId);
  const blocker = gapTopic ? findBlocker(allTopics, gapTopic.id) : null;
  const missing = gapTopic?.missing[0];

  return (
    <>
      <ol className="relative" aria-label="Learning path">
        {topics.map((t, i) => {
          const next = topics[i + 1];
          const Icon = t.status === "mastered" ? Check : t.status === "locked" ? Lock : t.status === "attention" ? AlertTriangle : null;
          const isGoal = t.id === goalTopicId;
          return (
            <li key={t.id} className="enter" style={{ ["--i" as string]: i }}>
              <div className="flex gap-4 sm:gap-5">
                {/* Rail: node circle and the connector to the next topic */}
                <div className="flex w-12 shrink-0 flex-col items-center">
                  <span className={cn("grid size-12 place-items-center rounded-full text-lg font-bold shadow-card", NODE[t.status])} aria-hidden>
                    {Icon ? <Icon className="size-5" strokeWidth={2.5} /> : i + 1}
                  </span>
                  {next && <span className={cn("my-1 w-0.5 flex-1", next.locked ? "border-l-2 border-dashed border-faint/50" : "bg-brand/50")} aria-hidden />}
                </div>

                <div className="min-w-0 flex-1 pb-3">
                  <NodeCard topic={t} isGoal={isGoal} onLockedClick={() => setGapId(t.id)} />
                  {next && (
                    <div className="py-3 pl-1">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", next.locked ? "bg-subtle text-muted" : "bg-success-soft text-success")}>
                        {next.locked ? <Lock className="size-3" aria-hidden /> : <Check className="size-3" strokeWidth={3} aria-hidden />}
                        {next.locked
                          ? `${next.name} unlocks when ${next.missing[0]?.name ?? t.name} reaches 60%`
                          : `${t.name} passed, ${next.name} is open`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <Modal
        open={!!gapTopic}
        onClose={() => setGapId(null)}
        title="AURA noticed a prerequisite gap"
        description={gapTopic && missing ? `${missing.name} needs more practice before you continue to ${gapTopic.name}.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setGapId(null)}>Not now</Button>
            {blocker && (
              <Button href={`/student/learn/${blocker.id}?tab=practice`} iconRight={<ArrowRight className="size-4" />}>
                Practice {blocker.name}
              </Button>
            )}
          </>
        }
      >
        {missing && (
          <div className="rounded-2xl bg-subtle p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">{missing.name}</span>
              <span className="t-num">{missing.score}% <span className="font-normal text-muted">of 60% needed</span></span>
            </div>
            <div className="relative">
              <ProgressBar value={missing.score} tone="warn" label={`${missing.name} mastery`} />
              <span className="absolute -top-1 h-4 w-0.5 rounded bg-ink/50" style={{ left: "60%" }} aria-hidden />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function NodeCard({ topic: t, isGoal, onLockedClick }: { topic: TopicState; isGoal: boolean; onLockedClick: () => void }) {
  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{t.name}</h3>
            {isGoal && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand">Goal</span>}
          </div>
          <p className="t-small mt-0.5">{t.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusPill status={t.status} />
          {!t.locked && (t.struggle.level === "intervention" || t.struggle.level === "immediate") && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
              <LifeBuoy className="size-3.5" aria-hidden /> Support suggested
            </span>
          )}
        </div>
      </div>

      {t.locked ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Lock className="size-4 shrink-0" aria-hidden />
          Locked. Tap to see what's needed to open it.
        </p>
      ) : (
        <>
          <div className="relative mt-4">
            <ProgressBar value={t.score} tone={t.status === "mastered" ? "success" : t.status === "attention" ? "warn" : "brand"} label={`${t.name} mastery`} />
            {t.status !== "mastered" && <span className="absolute -top-1 h-4 w-0.5 rounded bg-ink/30" style={{ left: "60%" }} aria-hidden />}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              <span className="t-num text-ink">{t.score}%</span>
              {t.started ? ` · Level ${t.level} ${LEVEL_NAMES[t.level]} · ${relativeDay(t.lastActivity)}` : " · Not started yet"}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
              {t.status === "mastered" ? "Review" : t.started ? "Practice" : "Start"}
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </div>
        </>
      )}
    </>
  );

  const cls = cn("block w-full rounded-2xl border p-4 text-left transition duration-200 sm:p-5", CARD[t.status], t.locked ? "hover:bg-subtle" : "bg-surface shadow-card hover:-translate-y-0.5 hover:shadow-lift");

  return t.locked ? (
    <button type="button" onClick={onLockedClick} className={cls} aria-label={`${t.name}, locked. Show what's needed to unlock`}>
      {body}
    </button>
  ) : (
    <Link href={`/student/learn/${t.id}${t.status === "attention" ? "?tab=practice" : ""}`} className={cls}>
      {body}
    </Link>
  );
}
