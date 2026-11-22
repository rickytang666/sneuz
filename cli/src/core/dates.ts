// a calendar day in the machine's zone, as YYYY-MM-DD
export type LocalDate = string;

export type DayCell = { date: LocalDate; isFuture: boolean };
// always seven days, monday first
export type WeekRow = { days: DayCell[] };

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function formatLocalDate(d: Date): LocalDate {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalDate(now = new Date()): LocalDate {
  return formatLocalDate(now);
}

export function toLocalMidnight(date: LocalDate): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: LocalDate, delta: number): LocalDate {
  const d = toLocalMidnight(date);
  d.setDate(d.getDate() + delta);
  return formatLocalDate(d);
}

// the same day of another month, pulled back to the month's last day when it's shorter (jan 31 -> feb 28)
export function addMonths(date: LocalDate, delta: number): LocalDate {
  const [year, month, day] = date.split("-").map(Number);
  const lastDay = new Date(year, month - 1 + delta + 1, 0).getDate();
  return formatLocalDate(
    new Date(year, month - 1 + delta, Math.min(day, lastDay)),
  );
}

// "fri nov 14", with the year added outside the current one so a scrolled-back cursor is never ambiguous
export function formatDay(date: LocalDate, today?: LocalDate): string {
  const d = toLocalMidnight(date);
  const base = `${WEEKDAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return today && date.slice(0, 4) !== today.slice(0, 4)
    ? `${base} ${d.getFullYear()}`
    : base;
}

// count week rows of seven days from a monday, with days after today marked future
export function weekRows(
  firstMonday: LocalDate,
  count: number,
  today: LocalDate,
): WeekRow[] {
  return Array.from({ length: count }, (_, w) => ({
    days: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(firstMonday, w * 7 + i);
      return { date, isFuture: date > today };
    }),
  }));
}

function monthLabel(date: LocalDate): string {
  return MONTHS[Number(date.slice(5, 7)) - 1];
}

// a label on the first row and on each row containing the 1st of a month
export function monthDividers(rows: WeekRow[]): (string | null)[] {
  return rows.map((row, index) => {
    const first = row.days.find((day) => day.date.endsWith("-01"));
    if (first) return monthLabel(first.date);
    return index === 0 ? monthLabel(row.days[0].date) : null;
  });
}
