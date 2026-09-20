import { BarChart3 } from "lucide-react";
import { PlannedPage } from "@/components/shell/PlannedPage";

export const metadata = { title: "Analytics" };

export default function Page() {
  return (
    <PlannedPage
      eyebrow="Analytics"
      title="Analytics"
      description="Trends across the class over time."
      icon={BarChart3}
      feature="P2 · Analytics"
    />
  );
}
