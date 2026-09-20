import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { ThemeStudio, type StudioSample } from "@/components/ai/ThemeStudio";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { aiStatus } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { getStudentState, recommend } from "@/lib/student";

export const metadata = { title: "AURA AI" };
export const dynamic = "force-dynamic";

/** Numeric questions with clear before and after: the PRD example first. */
const SAMPLE_IDS = ["ohms-law-l2-1", "ohms-law-l3-1", "ohms-law-l4-1", "electric-current-l2-1", "voltage-l3-1", "resistance-l3-1", "ph-l3-1", "titration-l3-1"];

export default async function AiPage() {
  const user = await requireUser("student");
  const store = getStore();
  const topics = new Map(store.topics.map((t) => [t.id, t.name]));
  const samples: StudioSample[] = SAMPLE_IDS.map((id) => store.questions.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => !!q)
    .map((q) => ({ id: q.id, stem: q.stem, topic: topics.get(q.topicId) ?? q.topicId, level: q.level, objective: q.objective, unit: q.unit }));
  const status = aiStatus();

  const state = getStudentState(store, user.id);
  const focusTopicId = recommend(state, 1)[0]?.topicId ?? state.currentTopicId;
  const focusTopic = focusTopicId ? state.topics.find((t) => t.id === focusTopicId) : undefined;

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader
        eyebrow="AURA AI"
        title="Same problem, your story"
        description="AURA rewrites the story around what you love and leaves the science untouched. Every version is checked before you see it."
      />

      {focusTopic && (
        <Card className="enter mb-8 flex flex-wrap items-center gap-4 border-brand/25 bg-brand-soft/30">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-brand-on"><GraduationCap className="size-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Want a coach while you practice, not just a themed question?</p>
            <p className="t-small mt-0.5">AURA's tutor watches how you're doing on {focusTopic.name} and adapts its help in real time — hints, explanations, or a nudge to try independently.</p>
          </div>
          <Link href={`/student/learn/${focusTopic.id}?tab=practice`} className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-on transition hover:brightness-110">
            Practice {focusTopic.name} with the tutor
          </Link>
        </Card>
      )}

      <ThemeStudio
        samples={samples}
        defaultId={samples[0].id}
        status={{ configured: status.configured, label: status.label, model: status.model, mode: status.mode }}
        allowReveal={process.env.AURA_ALLOW_ANSWER_REVEAL !== "false"}
      />
    </div>
  );
}
