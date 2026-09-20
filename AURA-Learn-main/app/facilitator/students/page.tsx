import { ChevronRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { studentsOverview } from "@/lib/facilitator";

export const metadata = { title: "Students" };
export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  await requireUser("facilitator");
  const students = studentsOverview(getStore());

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader eyebrow="Students" title="Your class" description="Everyone in Class 9A, with mastery and active interventions at a glance." />
      <div className="grid gap-4">
        {students.map((s) => (
          <Link key={s.id} href={`/facilitator/students/${s.id}`}>
            <Card interactive className="flex flex-wrap items-center gap-5">
              <Avatar name={s.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="t-heading">{s.name}</h3>
                  {s.status === "attention" && (
                    <Badge tone="warn"><ShieldAlert className="size-3.5" aria-hidden /> {s.activeInterventions} active</Badge>
                  )}
                </div>
                <p className="t-small mt-0.5">{s.masteredCount} of {s.topicCount} topics mastered</p>
                <div className="mt-3 max-w-xs">
                  <ProgressBar value={s.mastery} tone={s.mastery >= 80 ? "success" : s.mastery >= 60 ? "brand" : "warn"} label={`${s.name} overall mastery`} />
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="t-num text-2xl">{s.mastery}%</span>
                <ChevronRight className="size-5 text-faint" aria-hidden />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
