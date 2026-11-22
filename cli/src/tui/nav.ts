import {
  addDays,
  addMonths,
  type LocalDate,
  toLocalMidnight,
  type WeekRow,
  weekRows,
} from "../core/dates";

export type NavState = {
  cursorDate: LocalDate;
  // whole weeks scrolled up from the week holding today
  scroll: number;
};

export type NavAction =
  | "left"
  | "right"
  | "up"
  | "down"
  | "monthBack"
  | "monthForward"
  | "today";

export type NavContext = {
  today: LocalDate;
  visibleWeeks: number;
};

const DELTAS: Record<"left" | "right" | "up" | "down", number> = {
  left: -1,
  right: 1,
  up: -7,
  down: 7,
};

export function initialNav(today: LocalDate): NavState {
  return { cursorDate: today, scroll: 0 };
}

function mondayOf(date: LocalDate): LocalDate {
  // getDay() counts from sunday; shift so monday is 0
  return addDays(date, -((toLocalMidnight(date).getDay() + 6) % 7));
}

// whole weeks from the week holding date up to the week holding today
function weeksBack(date: LocalDate, today: LocalDate): number {
  const utcDay = (d: LocalDate) => {
    const [year, month, day] = d.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / 86_400_000;
  };
  return Math.round((utcDay(mondayOf(today)) - utcDay(mondayOf(date))) / 7);
}

// builds only the rows on screen, so scrolling years back costs the same as one week
export function visibleRows(
  today: LocalDate,
  nav: NavState,
  weeks: number,
): WeekRow[] {
  const firstMonday = addDays(mondayOf(today), -(nav.scroll + weeks - 1) * 7);
  return weekRows(firstMonday, weeks, today);
}

export function reduceNav(
  nav: NavState,
  action: NavAction,
  ctx: NavContext,
): NavState {
  if (action === "today") return initialNav(ctx.today);
  if (action === "monthBack" || action === "monthForward") {
    const delta = action === "monthBack" ? -1 : 1;
    return moveTo(nav, addMonths(nav.cursorDate, delta), ctx);
  }
  return moveTo(nav, addDays(nav.cursorDate, DELTAS[action]), ctx);
}

// history has no floor, only today as a ceiling; scrolls just enough to keep the cursor's week on screen
export function moveTo(
  nav: NavState,
  target: LocalDate,
  ctx: NavContext,
): NavState {
  const cursorDate = target > ctx.today ? ctx.today : target;
  const back = weeksBack(cursorDate, ctx.today);

  let scroll = nav.scroll;
  if (back < scroll) scroll = back;
  if (back > scroll + ctx.visibleWeeks - 1) {
    scroll = back - ctx.visibleWeeks + 1;
  }
  return { cursorDate, scroll };
}

// the closest day with no night in one direction; going back always finds one, forward stops at today
export function nearestEmpty(
  from: LocalDate,
  direction: 1 | -1,
  logged: ReadonlySet<LocalDate>,
  ctx: NavContext,
): LocalDate | null {
  for (
    let day = addDays(from, direction);
    day <= ctx.today;
    day = addDays(day, direction)
  ) {
    if (!logged.has(day)) return day;
  }
  return null;
}
