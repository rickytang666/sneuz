"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

const message = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = safeNextPath(formData.get("next") as string);

  try {
    await getAuth().api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (error) {
    return { error: message(error, "Login failed") };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  try {
    await getAuth().api.signUpEmail({
      body: { email, password, name },
      headers: await headers(),
    });
  } catch (error) {
    return { error: message(error, "Sign up failed") };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signout() {
  await getAuth().api.signOut({ headers: await headers() });
  revalidatePath("/", "layout");
  redirect("/login");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function signInWithGoogle(_formData: FormData) {
  let url: string | undefined;
  try {
    ({ url } = await getAuth().api.signInSocial({
      body: {
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/login?error=google_sign_in_failed",
      },
      headers: await headers(),
    }));
  } catch (error) {
    console.error("error signing in with google:", error);
    return { error: message(error, "Google sign-in failed") };
  }

  if (url) redirect(url);
}
