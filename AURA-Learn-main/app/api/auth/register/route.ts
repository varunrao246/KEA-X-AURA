import { fail, ok } from "@/lib/api";
import { ensureAuthenticatedAccount } from "@/lib/repo";
import { homeFor, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";
import { authErrorMessage, signUpWithSupabase, SupabaseAuthError } from "@/lib/supabase-auth";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

function validEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) && email.length <= 120 ? email : null;
}

/** Creates a real Supabase Auth account, then provisions its empty AURA learning state. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: unknown; email?: unknown; password?: unknown; role?: unknown; facilitatorCode?: unknown } | null;
  const name = String(body?.name ?? "").trim().replace(/\s+/g, " ");
  const email = validEmail(body?.email);
  const password = String(body?.password ?? "");
  const role: Role | null = body?.role === "student" || body?.role === "facilitator" ? body.role : null;
  if (name.length < 2 || name.length > 60) return fail("Enter your name using 2 to 60 characters.");
  if (!email) return fail("Enter a valid email address.");
  if (password.length < 8 || password.length > 72) return fail("Use a password between 8 and 72 characters.");
  if (!role) return fail("Choose whether you are a student or facilitator.");

  const requiredCode = process.env.FACILITATOR_INVITE_CODE;
  if (role === "facilitator" && requiredCode && body?.facilitatorCode !== requiredCode) {
    return fail("A valid facilitator invite code is required.", 403);
  }

  try {
    const { identity, session } = await signUpWithSupabase({ name, email, password, role });
    // Persist the chosen role before email confirmation. On a later sign-in, only this stored
    // role is trusted; mutable Supabase user metadata can never promote someone to facilitator.
    const user = ensureAuthenticatedAccount({ id: identity.id, name: identity.name, email: identity.email, role });
    // When Confirm email is enabled, Supabase deliberately returns no session until the user verifies.
    if (!session) return ok({ needsEmailConfirmation: true, email: identity.email });

    const token = await signSession({ uid: user.id, role: user.role, source: "supabase", name: user.name, email: user.email });
    const response = ok({ user: { id: user.id, name: user.name, role: user.role }, redirectTo: homeFor(user.role) });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
    return response;
  } catch (error) {
    if (error instanceof SupabaseAuthError) return fail(authErrorMessage(error), error.status);
    console.error("[aura] registration failed", error);
    return fail("We couldn't create the account. Check the app server terminal and try again.", 500);
  }
}
