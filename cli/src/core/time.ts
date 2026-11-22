import { addDays, type LocalDate, toLocalMidnight } from "./dates";

// a bedtime at or after this hour belongs to the evening before the wake day, same cutoff as the web charts
export const EVENING_CUTOFF_MINUTES = 15 * 60;

// minutes since midnight, from "2330", "23:30", "1:15", "930" or "9"
export function parseTime(input: string): number | null {
  const text = input.trim();
  let hours: number;
  let minutes: number;

  const colon = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (colon) {
    hours = Number(colon[1]);
    minutes = Number(colon[2]);
  } else if (/^\d{1,4}$/.test(text)) {
    if (text.length <= 2) {
      hours = Number(text);
      minutes = 0;
    } else {
      hours = Number(text.slice(0, -2));
      minutes = Number(text.slice(-2));
    }
  } else {
    return null;
  }

  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatClock(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function clockOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isRealDate(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day);
  return d.getMonth() === month - 1 && d.getDate() === day;
}

// "today", "yesterday", "11-14" or "2026-11-14"; a month-day still to come this year means last year
export function parseDateArg(
  input: string,
  today: LocalDate,
): LocalDate | null {
  const text = input.trim().toLowerCase();
  if (text === "today") return today;
  if (text === "yesterday") return addDays(today, -1);

  const full = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  const short = /^(\d{1,2})-(\d{1,2})$/.exec(text);
  let year: number;
  let month: number;
  let day: number;

  if (full) {
    [year, month, day] = full.slice(1).map(Number);
  } else if (short) {
    [month, day] = short.slice(1).map(Number);
    year = Number(today.slice(0, 4));
    const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (candidate > today) year -= 1;
  } else {
    return null;
  }

  if (!isRealDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function instants(
  wakeDate: LocalDate,
  bedMinutes: number,
  wakeMinutes: number,
) {
  const bedDate =
    bedMinutes >= EVENING_CUTOFF_MINUTES ? addDays(wakeDate, -1) : wakeDate;
  const bedtime = toLocalMidnight(bedDate);
  bedtime.setMinutes(bedMinutes);
  const wake = toLocalMidnight(wakeDate);
  wake.setMinutes(wakeMinutes);
  return wake > bedtime ? { bedtime, wake } : null;
}

// bed and wake for the night ending on wakeDate; an impossible morning bedtime (11:55 before 07:20) is read as evening
export function nightTimes(
  wakeDate: LocalDate,
  bedMinutes: number,
  wakeMinutes: number,
): { bedtime: Date; wake: Date } | null {
  const asTyped = instants(wakeDate, bedMinutes, wakeMinutes);
  if (asTyped !== null || bedMinutes >= 12 * 60) return asTyped;
  return instants(wakeDate, bedMinutes + 12 * 60, wakeMinutes);
}
