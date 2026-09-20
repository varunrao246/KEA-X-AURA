import { AppShell } from "@/components/shell/AppShell";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FacilitatorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("facilitator");
  return (
    <AppShell role="facilitator" user={{ name: user.name, subtitle: "Facilitator · Class 9A" }}>
      {children}
    </AppShell>
  );
}
