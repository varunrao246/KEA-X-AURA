import { ProgressBar, type ProgressTone } from "@/components/ui/ProgressBar";

export function MetricBar({ label, value, note, tone = "brand" }: { label: string; value: number; note: string; tone?: ProgressTone }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-medium">{label}</span>
        <span className="t-num">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} label={label} />
      <p className="t-small mt-1.5">{note}</p>
    </div>
  );
}
