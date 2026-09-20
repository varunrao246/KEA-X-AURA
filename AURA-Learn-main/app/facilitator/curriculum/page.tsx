import { Map } from "lucide-react";
import { PlannedPage } from "@/components/shell/PlannedPage";

export const metadata = { title: "Curriculum" };

export default function Page() {
  return (
    <PlannedPage
      eyebrow="Curriculum"
      title="Curriculum"
      description="The prerequisite graph and where your class sits on it."
      icon={Map}
      feature="P1 · Curriculum view"
    />
  );
}
