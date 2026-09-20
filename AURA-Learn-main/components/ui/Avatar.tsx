import { cn, initialsOf } from "@/lib/utils";

const palette = [
  "bg-brand-soft text-brand",
  "bg-accent-soft text-accent",
  "bg-warn-soft text-warn",
  "bg-success-soft text-success",
  "bg-danger-soft text-danger",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" };

export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold",
        palette[hash(name) % palette.length],
        sizes[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
