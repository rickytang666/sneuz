"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage } from "@/lib/db/errors";
import { createKey, deleteKey, listKeys } from "@/lib/services/api-keys";
import { getUser } from "@/lib/session";

export async function getApiKeys() {
  const user = await getUser();
  if (!user) return [];

  return listKeys(user.id);
}

export async function createApiKey(name: string) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const data = await createKey(user.id, name);
    revalidatePath("/dashboard/settings");
    return { data };
  } catch (error) {
    return { error: dbErrorMessage(error) };
  }
}

export async function deleteApiKey(id: string) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await deleteKey(user.id, id);
  } catch (error) {
    return { error: dbErrorMessage(error) };
  }

  revalidatePath("/dashboard/settings");
  return {};
}
