"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LinkedIdentity } from "@/lib/types";

export async function getIdentities(): Promise<LinkedIdentity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUserIdentities();

  if (error || !data) return [];

  return data.identities.map((identity) => ({
    id: identity.identity_id,
    provider: identity.provider,
    email: identity.identity_data?.email as string | undefined,
  }));
}

export async function linkGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard/settings`,
    },
  });

  if (error) {
    console.error("Error linking Google:", error.message);
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function unlinkIdentity(identityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUserIdentities();

  if (error || !data) {
    return { error: error?.message ?? "Could not load identities" };
  }

  // never leave the account without a way to sign in
  if (data.identities.length <= 1) {
    return { error: "You can't disconnect your only sign-in method." };
  }

  const identity = data.identities.find((i) => i.identity_id === identityId);
  if (!identity) return { error: "Identity not found" };

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unlinkError) return { error: unlinkError.message };

  revalidatePath("/dashboard/settings");
  return {};
}
