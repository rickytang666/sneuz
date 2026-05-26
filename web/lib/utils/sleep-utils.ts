import { parseISO } from "date-fns";
import { SleepSession } from "@/lib/types";

export function mapDbSessionToSleepSession(session: {
  id: string;
  start_time: string;
  end_time: string | null;
}): SleepSession {
  const start = new Date(session.start_time);
  const end = session.end_time ? new Date(session.end_time) : null;
  const duration_minutes = end
    ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60))
    : null;

  return {
    id: session.id,
    bedtime: session.start_time,
    wake_time: session.end_time,
    duration_minutes,
    created_at: session.start_time,
  };
}

/**
 * Converts a date or ISO string to minutes from start of day (midnight)
 */
export function getMinutesFromMidnight(date: Date | string): number {
  const d = typeof date === "string" ? parseISO(date) : date;
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Converts "HH:mm" string to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hrs, mins] = timeStr.split(":").map(Number);
  return hrs * 60 + mins;
}

/**
 * Formats minutes from midnight back to "HH:mm"
 */
export function minutesToTimeString(minutes: number): string {
  const hrs = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Determines if a bedtime is "late" relative to a target bedtime with a grace period.
 * Handles cases where target might be 22:00 and actual is 01:00 (next day).
 */
export function isLateBedtime(
  actual: Date | string,
  target: string,
  graceMinutes: number = 60,
): boolean {
  const actualDate = typeof actual === "string" ? parseISO(actual) : actual;
  const actualMins = getMinutesFromMidnight(actualDate);
  const targetMins = timeStringToMinutes(target);

  // handle cross-midnight: if target is 22:00 and actual is 01:00
  let diff = actualMins - targetMins;
  if (diff < -720) diff += 1440; // e.g., -1300 becomes 140
  if (diff > 720) diff -= 1440;

  return diff > graceMinutes;
}
