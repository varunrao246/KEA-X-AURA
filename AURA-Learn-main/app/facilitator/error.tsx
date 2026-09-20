"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function SectionError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page py-16">
      <ErrorState onRetry={reset} />
    </div>
  );
}
