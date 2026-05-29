"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { differenceInMinutes, subDays } from "date-fns";
import { mapDbSessionToSleepSession, getMinutesFromMidnight, isLateBedtime } from "@/lib/utils/sleep-utils";

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

export async function getSleepStats(targetBedtime = "23:00") {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sleep_sessions")
    .select("start_time, end_time");

  if (error) {
    console.error("Error fetching stats:", error);
    return { on_target_nights: null, median_hours: 0, avg_bedtime: null, avg_wake_time: null };
  }

  const durations = data
    .filter((s) => s.end_time)
    .map((s) => differenceInMinutes(new Date(s.end_time!), new Date(s.start_time)))
    .filter((d) => d > 0)
    .sort((a, b) => a - b);

  const mid = Math.floor(durations.length / 2);
  const medianMinutes =
    durations.length === 0
      ? 0
      : durations.length % 2 === 0
        ? (durations[mid - 1] + durations[mid]) / 2
        : durations[mid];

  // avg bedtime and wake time over last 30 days
  const normalize = (mins: number) => (mins < 900 ? mins + 1440 : mins);
  const cutoff = subDays(new Date(), 30);
  const recent = data.filter(
    (s) => s.end_time && new Date(s.start_time) >= cutoff,
  );

  const medianNormalized = (values: number[]) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  };

  const formatAvgTime = (mins: number | null) => {
    if (mins === null) return null;
    const total = Math.round(mins) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    const suffix = h < 12 ? "AM" : "PM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
  };

  const avgBed = medianNormalized(
    recent.map((s) => normalize(getMinutesFromMidnight(new Date(s.start_time)))),
  );
  const avgWake = medianNormalized(
    recent.map((s) => normalize(getMinutesFromMidnight(new Date(s.end_time!)))),
  );

  const onTarget = recent.filter(
    (s) => !isLateBedtime(new Date(s.start_time), targetBedtime, 15),
  ).length;

  return {
    on_target_nights: { count: onTarget, total: recent.length },
    median_hours: Math.round((medianMinutes / 60) * 10) / 10,
    avg_bedtime: formatAvgTime(avgBed),
    avg_wake_time: formatAvgTime(avgWake),
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
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/data");
}

export async function deleteSleepSession(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("sleep_sessions").delete().eq("id", id);

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
  };

  if (!user) return defaultSettings;

  const { data, error } = await supabase
    .from("user_settings")
    .select("target_bedtime, target_wake_time")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return defaultSettings;
  }

  return data;
}
