import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <EmptyState
        icon={Compass}
        title="We couldn't find that page"
        description="The link may be old, or the page may have moved."
        action={<Button href="/">Back to AURA</Button>}
      />
    </div>
  );
}
