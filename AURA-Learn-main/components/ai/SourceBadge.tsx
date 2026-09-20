import { FileText, Sparkles, Wand2 } from "lucide-react";
import type { ThemeSourceKind } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

const META: Record<ThemeSourceKind, { label: string; icon: typeof Sparkles; tone: string; title: string }> = {
  ai: { label: "AI-themed", icon: Sparkles, tone: "bg-brand-soft text-brand", title: "Rewritten by the AI model and checked by AURA's guardrails" },
  template: { label: "Themed", icon: Wand2, tone: "bg-accent-soft text-accent", title: "Themed by AURA's built-in writer and checked by the same guardrails" },
  original: { label: "Original", icon: FileText, tone: "bg-subtle text-muted", title: "The question as originally written" },
};

export function SourceBadge({ source, className }: { source: ThemeSourceKind; className?: string }) {
  const { label, icon: Icon, tone, title } = META[source];
  return (
    <span title={title} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", tone, className)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
