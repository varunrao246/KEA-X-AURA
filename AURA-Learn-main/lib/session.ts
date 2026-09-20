import type { Role } from "./types";

/**
 * Signed session cookie (HMAC-SHA256 over a small JSON payload).
 * Uses only Web Crypto so the same code runs in middleware (edge) and route handlers (node).
 * This is demo authentication: there are no passwords, but the cookie cannot be forged or
 * edited to switch roles without the server secret.
 */

export const SESSION_COOKIE = "aura_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface SessionPayload {
  uid: string;
  role: Role;
  /** Demo accounts live in the seeded store; external accounts are verified by Supabase at sign-in. */
  source?: "demo" | "supabase";
  /** Signed display data lets an external account survive a demo-store reset. */
  name?: string;
  email?: string;
  /** Expiry, unix seconds. */
  exp: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let warnedMissingSecret = false;

function secret() {
  const configured = process.env.AUTH_SECRET;
  if (!configured && process.env.NODE_ENV === "production" && !warnedMissingSecret) {
    warnedMissingSecret = true;
    // Not a hard failure (a missing env var should not take down a live demo), but this must not
    // go unnoticed: without AUTH_SECRET, every session is signed with a secret that is public
    // source code, so a cookie can be forged for any user or role.
    console.warn("[aura] AUTH_SECRET is not set in production. Session cookies are signed with a public fallback secret — set AUTH_SECRET before sharing this deployment.");
  }
  return configured || "aura-dev-secret-change-me";
}

function toB64Url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey() {
  return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSession(input: Omit<SessionPayload, "exp">, maxAgeSec = SESSION_MAX_AGE): Promise<string> {
  const payload: SessionPayload = { ...input, exp: Math.floor(Date.now() / 1000) + maxAgeSec };
  const body = toB64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(body));
  return `${body}.${toB64Url(new Uint8Array(sig))}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64Url(sig), encoder.encode(body));
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(fromB64Url(body))) as SessionPayload;
    if (payload.role !== "student" && payload.role !== "facilitator") return null;
    if (typeof payload.uid !== "string" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function homeFor(role: Role) {
  return role === "facilitator" ? "/facilitator" : "/student";
}
