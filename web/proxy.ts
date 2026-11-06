import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

// validates the session rather than trusting the cookie, a stale cookie would bounce between /login and /dashboard
export async function proxy(request: NextRequest) {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

// signed-in users skip the login and signup pages, the dashboard layout guards everything else
export const config = {
  matcher: ["/login", "/signup"],
};
