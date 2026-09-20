import { ArrowRight, Clock, FlaskConical } from "lucide-react";
import Link from "next/link";
import { LABS } from "@/content/labs";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { getStudentState, recommend } from "@/lib/student";

export const metadata = { title: "Labs" };
export const dynamic = "force-dynamic";

export default async function LabsPage() {
  const user = await requireUser("student");
  const state = getStudentState(getStore(), user.id);
  const recommended = new Set(recommend(state, 6).filter((r) => r.kind === "lab").map((r) => r.href.split("/").pop()));
  const pref = state.profile.learningPreference;

  const labs = LABS.map((lab) => {
    const topics = lab.topicIds.map((id) => state.topics.find((t) => t.id === id)!);
    const open = topics.some((t) => !t.locked);
    return { lab, topics, open, best: state.labCompleted[lab.id] ?? null, recommended: recommended.has(lab.id) };
  }).sort((a, b) => Number(b.recommended) - Number(a.recommended) || Number(b.open) - Number(a.open));

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader
        eyebrow="Labs"
        title="Virtual Labs"
        description={pref === "interactive" ? "Hands-on is how you learn best, so these are a great place to spend time." : "Experiment, see what happens, and add to your mastery."}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {labs.map(({ lab, topics, open, best, recommended: rec }, i) => {
          const card = (
            <Card interactive={open} className={`enter flex h-full flex-col ${open ? "" : "opacity-70"}`} style={{ ["--i" as string]: i }}>
              <div className="mb-5 flex items-start justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent"><FlaskConical className="size-7" aria-hidden /></span>
                {rec ? <Badge tone="brand" dot>Recommended</Badge> : best !== null ? <Badge tone="success">Best {best}%</Badge> : null}
              </div>
              <p className="t-eyebrow">{lab.subjectId}</p>
              <h2 className="t-heading mt-1">{lab.title}</h2>
              <p className="t-small mt-2 flex-1">{lab.blurb}</p>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted"><Clock className="size-4" aria-hidden /> {lab.minutes} min</span>
                <span className="text-muted">{topics.map((t) => t.name).join(" · ")}</span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                {open ? (best !== null ? "Run again" : "Open lab") : "Unlocks as you progress"} {open && <ArrowRight className="size-4" aria-hidden />}
              </span>
            </Card>
          );
          return open ? <Link key={lab.id} href={`/student/labs/${lab.id}`}>{card}</Link> : <div key={lab.id}>{card}</div>;
        })}
      </div>
    </div>
  );
}
