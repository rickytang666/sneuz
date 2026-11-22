import { type Session, type Settings, toSession } from "../api";
import { formatDuration } from "./nights";
import { clockOf, formatClock, parseTime } from "./time";

const SHORT_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function stamp(iso: string): string {
  const d = new Date(iso);
  return `${SHORT_DAYS[d.getDay()]} ${formatClock(clockOf(d))}`;
}

// "fri 23:30 → sat 07:10 · 7h 40m"
export function describeSession(session: Session): string {
  if (session.wake_time === null)
    return `${stamp(session.bedtime)} → in progress`;
  return `${stamp(session.bedtime)} → ${stamp(session.wake_time)} · ${formatDuration(session.duration_minutes ?? 0)}`;
}

export function describeTimes(bedtime: Date, wake: Date): string {
  return describeSession(toSession("", bedtime, wake));
}

export type Defaults = { bed: number; wake: number };

// the settings columns are postgres times like "23:00:00"
export function settingsDefaults(settings: Settings): Defaults {
  return {
    bed: parseTime(settings.target_bedtime.slice(0, 5)) ?? 23 * 60,
    wake: parseTime(settings.target_wake_time.slice(0, 5)) ?? 7 * 60,
  };
}

// node rereads TZ on change, so every Date after this uses the saved zone; "UTC" is the unset default, so the machine's zone stays
export function applyTimezone(settings: Settings): void {
  if (settings.timezone && settings.timezone !== "UTC") {
    process.env.TZ = settings.timezone;
  }
}
