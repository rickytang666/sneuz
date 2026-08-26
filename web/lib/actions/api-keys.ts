"use server";

import { revalidatePath } from "next/cache";
import { createKey, deleteKey, listKeys } from "@/lib/services/api-keys";
import { createClient } from "@/lib/supabase/server";

export async function getApiKeys() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await listKeys(supabase, user.id);
  return data;
}

export async function createApiKey(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await createKey(supabase, user.id, name);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { data };
}

export async function deleteApiKey(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await deleteKey(supabase, user.id, id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return {};
}
