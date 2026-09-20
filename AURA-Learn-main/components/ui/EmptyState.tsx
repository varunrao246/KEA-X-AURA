import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="relative mb-5 grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
        <span className="absolute inset-0 animate-aura-pulse rounded-2xl bg-brand/10" aria-hidden />
        <Icon className="relative size-7" aria-hidden />
      </div>
      <h3 className="t-heading">{title}</h3>
      {description && <p className="t-body mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
