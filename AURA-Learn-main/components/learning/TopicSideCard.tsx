import { ArrowRight, Check, Lock } from "lucide-react";
import Link from "next/link";
import { StruggleMeter } from "@/components/adaptive/StruggleMeter";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { LEVEL_NAMES } from "@/lib/adaptive";
import { relativeDay } from "@/lib/format";
import { BAND_LABEL } from "@/lib/mastery";
import type { TopicState } from "@/lib/student";
import { cn } from "@/lib/utils";

export function TopicSideCard({ topic }: { topic: TopicState }) {
  const tone = topic.status === "mastered" ? "success" : topic.status === "attention" ? "warn" : "brand";
  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <Card>
        <div className="flex items-center gap-5">
          <ProgressRing value={topic.score} size={92} stroke={9} tone={tone} label={`${topic.name} mastery`}>
            <span className="t-num text-xl">{topic.score}%</span>
          </ProgressRing>
          <div>
            <p className="font-semibold">{BAND_LABEL[topic.band]}</p>
            <p className="t-small">{topic.started ? `Level ${topic.level} · ${LEVEL_NAMES[topic.level]}` : "Not started yet"}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
          <div><dt className="t-eyebrow">Attempts</dt><dd className="t-num mt-1 text-lg">{topic.attempts}</dd></div>
          <div><dt className="t-eyebrow">Accuracy</dt><dd className="t-num mt-1 text-lg">{topic.started ? `${topic.accuracy}%` : "–"}</dd></div>
          <div><dt className="t-eyebrow">Last</dt><dd className="mt-1 text-sm font-semibold">{relativeDay(topic.lastActivity).replace(" ago", "")}</dd></div>
        </dl>
      </Card>

      {topic.started && (
        <Card>
          <StruggleMeter score={topic.struggle.score} level={topic.struggle.level} label="AURA's read" showScale={false} />
          <p className="t-small mt-3">
            {topic.struggle.insufficientEvidence ? "Answer a few more questions and AURA will start reading how it's going." : "Updated after every answer. See the Insights tab for how it's worked out."}
          </p>
        </Card>
      )}

      {(topic.prereqs.length > 0 || topic.unlocks.length > 0) && (
        <Card>
          {topic.prereqs.length > 0 && (
            <>
              <h3 className="t-eyebrow mb-3">Builds on</h3>
              <ul className="space-y-2">
                {topic.prereqs.map((p) => (
                  <li key={p.id}>
                    <Link href={`/student/learn/${p.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-subtle">
                      <span className={cn("grid size-6 place-items-center rounded-full", p.ok ? "bg-success text-brand-on" : "bg-warn text-brand-on")}>
                        {p.ok ? <Check className="size-3.5" strokeWidth={3} /> : <span className="text-xs font-bold">!</span>}
                      </span>
                      <span className="flex-1 text-sm font-medium">{p.name}</span>
                      <span className="t-num text-sm text-muted">{p.score}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {topic.unlocks.length > 0 && (
            <>
              <h3 className={cn("t-eyebrow mb-3", topic.prereqs.length > 0 && "mt-5 border-t border-line pt-5")}>Unlocks</h3>
              <ul className="space-y-2">
                {topic.unlocks.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 px-2 py-1.5 text-sm">
                    {topic.score >= 60 ? <ArrowRight className="size-4 text-success" aria-hidden /> : <Lock className="size-4 text-faint" aria-hidden />}
                    <span className="font-medium">{u.name}</span>
                    <span className="ml-auto text-xs text-muted">{topic.score >= 60 ? "Open" : `at 60%`}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
