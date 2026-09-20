import { ok, fail } from "@/lib/api";
import { dbHealth } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ status: "up", db: dbHealth() });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Database unavailable", 503);
  }
}
