"use server";

import { differenceInMinutes, subDays } from "date-fns";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { dbErrorMessage } from "@/lib/db/errors";
import { sleepSessions, userSettings } from "@/lib/db/schema";
import { toDbSession } from "@/lib/db/sessions";
import { getUser } from "@/lib/session";
import {
  isLateBedtime,
  mapDbSessionToSleepSession,
} from "@/lib/utils/sleep-utils";

export async function getSleepSessions() {
  const user = await getUser();
  if (!user) return [];

  const rows = await getDb()
    .select({
      id: sleepSessions.id,
      startTime: sleepSessions.startTime,
      endTime: sleepSessions.endTime,
    })
    .from(sleepSessions)
    .where(eq(sleepSessions.userId, user.id))
    .orderBy(desc(sleepSessions.startTime));

  return rows.map((row) => mapDbSessionToSleepSession(toDbSession(row)));
}

export async function getSleepStats(
  targetBedtime = "23:00",
  timeZone: string | null = null,
) {
  // "UTC" is the column default, not a choice, and there is no browser to fall
  // back to here. scoring in it would repeat the bug this change is fixing.
  const zone = timeZone && timeZone !== "UTC" ? timeZone : null;
  const user = await getUser();
  if (!user) {
    return {
      on_target_nights: null,
      median_hours: 0,
      avg_bedtime: null,
      avg_wake_time: null,
    };
  }

  const data = (
    await getDb()
      .select({
        id: sleepSessions.id,
        startTime: sleepSessions.startTime,
        endTime: sleepSessions.endTime,
      })
      .from(sleepSessions)
      .where(eq(sleepSessions.userId, user.id))
  ).map(toDbSession);

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
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const start_time = formData.get("bedtime") as string;
  const end_time = formData.get("wake_time") as string; // Can be empty string

  try {
    await getDb()
      .insert(sleepSessions)
      .values({
        userId: user.id,
        startTime: new Date(start_time),
        endTime: end_time ? new Date(end_time) : null,
      });
  } catch (error) {
    return { error: dbErrorMessage(error) };
  }

  revalidatePath("/dashboard/data");
}

export async function updateSleepSession(id: string, formData: FormData) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const start_time = formData.get("bedtime") as string;
  const end_time = formData.get("wake_time") as string;

  try {
    await getDb()
      .update(sleepSessions)
      .set({
        startTime: new Date(start_time),
        ...(end_time ? { endTime: new Date(end_time) } : {}),
      })
      .where(and(eq(sleepSessions.id, id), eq(sleepSessions.userId, user.id)));
  } catch (error) {
    return { error: dbErrorMessage(error) };
  }

  revalidatePath("/dashboard/data");
}

export async function deleteSleepSession(id: string) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await getDb()
      .delete(sleepSessions)
      .where(and(eq(sleepSessions.id, id), eq(sleepSessions.userId, user.id)));
  } catch (error) {
    return { error: dbErrorMessage(error) };
  }

  revalidatePath("/dashboard/data");
}

export async function getUserSettings() {
  const user = await getUser();

  // Default: Bedtime 11pm, Wake 7am
  const defaultSettings = {
    target_bedtime: "23:00",
    target_wake_time: "07:00",
    timezone: "UTC",
  };

  if (!user) return defaultSettings;

  const [data] = await getDb()
    .select({
      target_bedtime: userSettings.targetBedtime,
      target_wake_time: userSettings.targetWakeTime,
      timezone: userSettings.timezone,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1);

  return data ?? defaultSettings;
}
