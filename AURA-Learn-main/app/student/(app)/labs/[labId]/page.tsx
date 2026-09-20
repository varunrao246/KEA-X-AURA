import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLab } from "@/content/labs";
import { LabFrame } from "@/components/labs/LabFrame";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { getStudentState } from "@/lib/student";

export const dynamic = "force-dynamic";

export default async function LabPage({ params }: { params: Promise<{ labId: string }> }) {
  const user = await requireUser("student");
  const { labId } = await params;
  const lab = getLab(labId);
  if (!lab) notFound();
  const state = getStudentState(getStore(), user.id);
  // Point "related topic" at the lab's first topic the student can actually open.
  const related = lab.topicIds.map((id) => state.topics.find((t) => t.id === id)!).find((t) => t && !t.locked) ?? null;

  return (
    <div className="page py-8 lg:py-10">
      <nav aria-label="Breadcrumb" className="enter mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/student/labs" className="transition hover:text-ink">Labs</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-ink">{lab.title}</span>
      </nav>
      <header className="enter mb-6">
        <h1 className="t-title">{lab.title}</h1>
        <p className="t-body mt-2 max-w-xl">{lab.blurb}</p>
        {related && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-medium text-brand">
            This hands-on activity strengthens your understanding of {related.name}
          </p>
        )}
      </header>
      <LabFrame labId={lab.id} file={lab.file} title={lab.title} tasks={lab.tasks} relatedTopic={related ? { id: related.id, name: related.name } : null} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  return { title: getLab(labId)?.title ?? "Lab" };
}
