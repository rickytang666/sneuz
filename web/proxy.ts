import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const requestHeaders = await headers();
  // validates the session rather than trusting the cookie, a stale cookie would bounce between /login and /dashboard
  const { headers: authHeaders, response: session } =
    await getAuth().api.getSession({
      headers: requestHeaders,
      returnHeaders: true,
    });

  const { pathname } = request.nextUrl;
  const response =
    session && (pathname === "/login" || pathname === "/signup")
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();

  // server components cannot set cookies, so the sliding session refresh has to be written here
  for (const cookie of authHeaders.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

// the dashboard layout still guards access, the proxy only refreshes sessions and skips login for signed-in users
export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*"],
};
