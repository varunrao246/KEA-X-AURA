import { NextResponse } from "next/server";

/** Predictable JSON envelope for every API route: { ok, data } or { ok:false, error }. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true as const, data }, init);
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false as const, error }, { status });
}
