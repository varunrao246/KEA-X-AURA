import { fail, ok } from "@/lib/api";
import { ensureAuthenticatedAccount, getUserById } from "@/lib/repo";
import { homeFor, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";
import { authErrorMessage, signInWithSupabase, SupabaseAuthError } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

/** Verifies email/password with Supabase before issuing AURA's signed, role-aware session cookie. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter a valid email address.");
  if (!password) return fail("Enter your password.");

  try {
    const { identity } = await signInWithSupabase({ email, password });
    // A new direct Supabase signup is safe to use as a student. Facilitator access is granted
    // only through AURA's registration route, which records the chosen role (and optional invite
    // code check) before confirmation. Mutable user metadata can therefore never elevate a role.
    const role = getUserById(identity.id)?.role ?? "student";
    const user = ensureAuthenticatedAccount({ id: identity.id, name: identity.name, email: identity.email, role });
    const token = await signSession({ uid: user.id, role: user.role, source: "supabase", name: user.name, email: user.email });
    const response = ok({ user: { id: user.id, name: user.name, role: user.role }, redirectTo: homeFor(user.role) });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
    return response;
  } catch (error) {
    if (error instanceof SupabaseAuthError) return fail(authErrorMessage(error), error.status);
    console.error("[aura] sign-in failed", error);
    return fail("We couldn't sign you in. Check the app server terminal and try again.", 500);
  }
}
