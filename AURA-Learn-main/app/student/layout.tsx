import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Guards everything under /student. The shell lives one level down, in the (app) group. */
export default async function StudentRootLayout({ children }: { children: React.ReactNode }) {
  await requireUser("student");
  return children;
}
