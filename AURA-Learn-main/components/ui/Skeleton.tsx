import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Loading placeholder with a soft shimmer. */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden rounded-xl bg-subtle", className)}
      {...rest}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface/60 to-transparent" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page space-y-6 py-8" role="status" aria-label="Loading">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-72 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl sm:col-span-2 lg:col-span-1" />
      </div>
    </div>
  );
}
