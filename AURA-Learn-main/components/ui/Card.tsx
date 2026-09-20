import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover lift, for cards that navigate or open something. */
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };

export function Card({ interactive, padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "surface",
        paddings[padding],
        interactive && "cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
      {...rest}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h3 className="t-heading">{title}</h3>
        {subtitle && <p className="t-small mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
