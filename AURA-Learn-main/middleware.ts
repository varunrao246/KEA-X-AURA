import { NextResponse, type NextRequest } from "next/server";
import { homeFor, SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * Role separation at the edge:
 *   signed out            -> login
 *   student on /facilitator -> /student   (and vice versa)
 * Server layouts re-check with requireUser(), so this is defence in depth.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const area = pathname.startsWith("/facilitator") ? "facilitator" : "student";
  if (session.role !== area) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(session.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/student/:path*", "/facilitator/:path*"] };
