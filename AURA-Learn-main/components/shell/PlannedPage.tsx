import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

interface PlannedPageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Roadmap reference, e.g. "F5 · Curriculum graph". */
  feature: string;
}

/** Placeholder for screens that arrive in later build steps. Keeps navigation real from day one. */
export function PlannedPage({ eyebrow, title, description, icon, feature }: PlannedPageProps) {
  return (
    <div className="page py-8 lg:py-10">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card padding="none" className="enter" style={{ ["--i" as string]: 1 }}>
        <EmptyState
          icon={icon}
          title="This screen is next in the build"
          description="The route, navigation and role protection are live. The content lands with its feature."
          action={<Badge tone="brand">{feature}</Badge>}
        />
      </Card>
    </div>
  );
}
