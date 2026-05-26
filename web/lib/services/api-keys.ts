import type { SupabaseClient } from "@supabase/supabase-js";
import { generateApiKey, hashApiKey } from "@/lib/api/keys";

export async function listKeys(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, created_at, last_used_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data: data ?? [], error };
}

export async function createKey(
  supabase: SupabaseClient,
  userId: string,
  name: string,
) {
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ user_id: userId, name: name.trim(), key_hash: keyHash })
    .select("id, name, created_at")
    .single();

  if (error) return { data: null, error };
  return { data: { ...data, key: rawKey }, error: null };
}

export async function deleteKey(
  supabase: SupabaseClient,
  userId: string,
  id: string,
) {
  const { error, count } = await supabase
    .from("api_keys")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);

  return { error, count };
}
