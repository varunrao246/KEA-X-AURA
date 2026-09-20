"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something didn't load",
  message = "That's on us, not you. Give it another try.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-danger-soft text-danger">
        <TriangleAlert className="size-7" aria-hidden />
      </div>
      <h3 className="t-heading">{title}</h3>
      <p className="t-body mt-1.5 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" iconLeft={<RotateCcw className="size-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
