import { NotebookPen } from "lucide-react";
import { PlannedPage } from "@/components/shell/PlannedPage";

export const metadata = { title: "Notes" };

export default function Page() {
  return (
    <PlannedPage
      eyebrow="Notes"
      title="Notes"
      description="Jot down what's confusing so AURA and your teacher can help."
      icon={NotebookPen}
      feature="P1 · Student notes"
    />
  );
}
