import { ok, fail } from "@/lib/api";
import { getUserById } from "@/lib/repo";
import { homeFor, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Demo login: choose a seeded demo account. No passwords, the session cookie is still signed. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  if (!body?.userId) return fail("userId is required");

  const user = getUserById(body.userId);
  if (!user || !user.demo) return fail("Unknown demo account", 404);

  const token = await signSession({ uid: user.id, role: user.role });
  const res = ok({
    user: { id: user.id, name: user.name, role: user.role },
    redirectTo: homeFor(user.role),
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
