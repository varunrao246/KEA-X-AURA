import { Settings } from "lucide-react";
import { PlannedPage } from "@/components/shell/PlannedPage";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <PlannedPage
      eyebrow="Settings"
      title="Settings"
      description="Class and notification preferences."
      icon={Settings}
      feature="P2 · Settings"
    />
  );
}
