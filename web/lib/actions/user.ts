import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { dbErrorMessage } from "@/lib/db/errors";
import { userSettings } from "@/lib/db/schema";
import { getUser } from "@/lib/session";
import type { UserProfile } from "@/lib/types";

export async function getProfile(): Promise<UserProfile | null> {
  const user = await getUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    full_name: user.name,
    avatar_url: user.image ?? "",
  };
}

export async function updateProfile(formData: FormData) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const full_name = formData.get("full_name") as string;

  try {
    await getAuth().api.updateUser({
      body: { name: full_name },
      headers: await headers(),
    });
  } catch (error) {
    console.error("profile update error:", error);
    return { error: error instanceof Error ? error.message : "Update failed" };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard", "layout");
}

export async function updateSettings(formData: FormData) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const targetBedtime = formData.get("target_bedtime") as string;
  const targetWakeTime = formData.get("target_wake_time") as string;
  // an empty zone keeps whatever is stored, the column is not null
  const timezone = (formData.get("timezone") as string) || undefined;

  const values = { targetBedtime, targetWakeTime, timezone };

  try {
    await getDb()
      .insert(userSettings)
      .values({ userId: user.id, ...values })
      .onConflictDoUpdate({ target: userSettings.userId, set: values });
  } catch (error) {
    return { error: dbErrorMessage(error) };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
}
