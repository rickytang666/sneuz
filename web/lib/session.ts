import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "@/lib/auth";

// cached per request, so a layout and its page share one session lookup
export const getUser = cache(async () => {
  // read headers first: it marks the page dynamic before getAuth() needs runtime env
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session?.user ?? null;
});

export async function requireUser(next = "/dashboard") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
