import { Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { StudentProfile } from "@/lib/types";
import { PREFERENCE_LABELS } from "@/lib/student";
import { INTEREST_OPTIONS } from "./interests";

export function InterestStrip({ profile }: { profile: StudentProfile }) {
  const chosen = INTEREST_OPTIONS.filter((o) => profile.interests.includes(o.id));
  return (
    <Card className="enter" style={{ ["--i" as string]: 5 }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="t-heading">Learning your way</h3>
          <p className="t-small mt-0.5">AURA uses this to pick examples and what to suggest next</p>
        </div>
        <Link href="/student/onboarding?edit=1" aria-label="Edit interests" className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-subtle hover:text-ink">
          <Pencil className="size-4" />
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {chosen.map(({ id, label, icon: Icon }) => (
          <Badge key={id} tone="brand" className="py-1.5 pl-2 pr-3">
            <Icon className="size-3.5" aria-hidden /> {label}
          </Badge>
        ))}
        {profile.learningPreference && <Badge tone="accent" className="py-1.5">{PREFERENCE_LABELS[profile.learningPreference]} learner</Badge>}
      </div>
    </Card>
  );
}
