import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, id, ...rest }: InputProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
        {rest.required === false && <span className="ml-1.5 font-normal text-faint">Optional</span>}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${inputId}-note` : undefined}
        className={cn(
          "h-12 w-full rounded-xl border bg-surface px-4 text-[15px] outline-none transition placeholder:text-faint",
          "focus:border-brand focus:ring-4 focus:ring-brand/15",
          error ? "border-danger" : "border-line hover:border-faint/60",
        )}
        {...rest}
      />
      {(error || hint) && (
        <p id={`${inputId}-note`} className={cn("mt-1.5 text-sm", error ? "text-danger" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
