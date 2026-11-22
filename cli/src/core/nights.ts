import type { Session } from "../api";
import { addDays, formatLocalDate, type LocalDate } from "./dates";
import { clockOf, EVENING_CUTOFF_MINUTES } from "./time";

// an in-progress session has no wake yet, so it's filed under the day it will end on
export function wakeDateOf(session: Session): LocalDate {
  if (session.wake_time) return formatLocalDate(new Date(session.wake_time));
  const bedtime = new Date(session.bedtime);
  const day = formatLocalDate(bedtime);
  return clockOf(bedtime) >= EVENING_CUTOFF_MINUTES ? addDays(day, 1) : day;
}

export function groupByWakeDate(
  sessions: Session[],
): Map<LocalDate, Session[]> {
  const byDay = new Map<LocalDate, Session[]>();
  for (const session of sessions) {
    const day = wakeDateOf(session);
    byDay.set(day, [...(byDay.get(day) ?? []), session]);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.bedtime.localeCompare(b.bedtime));
  }
  return byDay;
}

// the longest session stands for the day when there's also a nap
export function mainSession(sessions: Session[]): Session | undefined {
  return sessions.reduce<Session | undefined>(
    (best, s) =>
      (s.duration_minutes ?? -1) > (best?.duration_minutes ?? -1) ? s : best,
    undefined,
  );
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

// median of the main nights that ended in the 7 days up to today
export function sevenDayMedian(
  byDay: Map<LocalDate, Session[]>,
  today: LocalDate,
): number | null {
  const durations: number[] = [];
  for (let i = 0; i < 7; i++) {
    const minutes = mainSession(
      byDay.get(addDays(today, -i)) ?? [],
    )?.duration_minutes;
    if (minutes) durations.push(minutes);
  }
  if (durations.length === 0) return null;
  durations.sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  return durations.length % 2
    ? durations[mid]
    : Math.round((durations[mid - 1] + durations[mid]) / 2);
}

// back to back nights don't overlap; an in-progress session runs until now
export function findOverlaps(
  bedtime: Date,
  wake: Date,
  sessions: Session[],
  excludeId: string | null,
  now = new Date(),
): Session[] {
  return sessions.filter((s) => {
    if (s.id === excludeId) return false;
    const start = Date.parse(s.bedtime);
    const end = s.wake_time ? Date.parse(s.wake_time) : now.getTime();
    return bedtime.getTime() < end && wake.getTime() > start;
  });
}
