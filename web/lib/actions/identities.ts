"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getUser } from "@/lib/session";
import type { LinkedIdentity } from "@/lib/types";

// better auth calls the email and password account "credential", the ui calls it "email"
const toUiProvider = (providerId: string) =>
  providerId === "credential" ? "email" : providerId;

async function listAccounts() {
  return getAuth().api.listUserAccounts({ headers: await headers() });
}

export async function getIdentities(): Promise<LinkedIdentity[]> {
  const user = await getUser();
  if (!user) return [];

  const accounts = await listAccounts();
  return accounts.map((account) => ({
    id: account.id,
    provider: toUiProvider(account.providerId),
    // accounts must share the user's verified email to link, so it is the same address
    email: user.email,
  }));
}

export async function linkGoogle() {
  let url: string | undefined;
  try {
    ({ url } = await getAuth().api.linkSocialAccount({
      body: { provider: "google", callbackURL: "/dashboard/settings" },
      headers: await headers(),
    }));
  } catch (error) {
    console.error("error linking google:", error);
    return { error: error instanceof Error ? error.message : "Link failed" };
  }

  redirect(url);
}

export async function unlinkIdentity(identityId: string) {
  const accounts = await listAccounts();

  // never leave the account without a way to sign in
  if (accounts.length <= 1) {
    return { error: "You can't disconnect your only sign-in method." };
  }

  const account = accounts.find((a) => a.id === identityId);
  if (!account) return { error: "Identity not found" };

  try {
    await getAuth().api.unlinkAccount({
      body: { accountId: account.id },
      headers: await headers(),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unlink failed" };
  }

  revalidatePath("/dashboard/settings");
  return {};
}
