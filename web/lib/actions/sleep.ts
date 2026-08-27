"use server";

import { differenceInMinutes, subDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isLateBedtime,
  mapDbSessionToSleepSession,
} from "@/lib/utils/sleep-utils";

export async function getSleepSessions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sleep_sessions")
    .select("*")
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Error fetching sleep sessions:", error);
    return [];
  }

  return data.map(mapDbSessionToSleepSession);
}

export async function getSleepStats(
  targetBedtime = "23:00",
  timeZone: string | null = null,
) {
  // "UTC" is the column default, not a choice, and there is no browser to fall
  // back to here. scoring in it would repeat the bug this change is fixing.
  const zone = timeZone && timeZone !== "UTC" ? timeZone : null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sleep_sessions")
    .select("start_time, end_time");

  if (error) {
    console.error("Error fetching stats:", error);
    return {
      on_target_nights: null,
      median_hours: 0,
      avg_bedtime: null,
      avg_wake_time: null,
    };
  }

  const durations = data
    .reduce<number[]>((acc, s) => {
      if (!s.end_time) return acc;
      const minutes = differenceInMinutes(
        new Date(s.end_time),
        new Date(s.start_time),
      );
      if (minutes > 0) acc.push(minutes);
      return acc;
    }, [])
    .sort((a, b) => a - b);

  const mid = Math.floor(durations.length / 2);
  const medianMinutes =
    durations.length === 0
      ? 0
      : durations.length % 2 === 0
        ? (durations[mid - 1] + durations[mid]) / 2
        : durations[mid];

  const cutoff = subDays(new Date(), 30);
  const recent = data.filter(
    (s) => s.end_time && new Date(s.start_time) >= cutoff,
  );

  const onTarget = recent.filter(
    (s) => !isLateBedtime(new Date(s.start_time), targetBedtime, 15, zone),
  ).length;

  return {
    on_target_nights: { count: onTarget, total: recent.length },
    median_hours: Math.round((medianMinutes / 60) * 10) / 10,
  };
}

export async function createSleepSession(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const start_time = formData.get("bedtime") as string;
  const end_time = formData.get("wake_time") as string; // Can be empty string

  const payload: Record<string, string> = {
    user_id: user.id,
    start_time: new Date(start_time).toISOString(),
  };
  if (end_time) {
    payload.end_time = new Date(end_time).toISOString();
  }

  const { error } = await supabase.from("sleep_sessions").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/data");
}

export async function updateSleepSession(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const start_time = formData.get("bedtime") as string;
  const end_time = formData.get("wake_time") as string;

  const payload: Record<string, string> = {
    start_time: new Date(start_time).toISOString(),
  };
  if (end_time) {
    payload.end_time = new Date(end_time).toISOString();
  }

  const { error } = await supabase
    .from("sleep_sessions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/data");
}

export async function deleteSleepSession(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("sleep_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/data");
}

export async function getUserSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Default: Bedtime 11pm, Wake 7am
  const defaultSettings = {
    target_bedtime: "23:00",
    target_wake_time: "07:00",
    timezone: "UTC",
  };

  if (!user) return defaultSettings;

  const { data, error } = await supabase
    .from("user_settings")
    .select("target_bedtime, target_wake_time, timezone")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return defaultSettings;
  }

  return data;
}
