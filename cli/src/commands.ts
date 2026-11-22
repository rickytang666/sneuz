import type { Session, SneuzApi } from "./api";
import { loadConfig, saveApiKey } from "./config";
import {
  addDays,
  formatDay,
  type LocalDate,
  todayLocalDate,
} from "./core/dates";
import { applyTimezone, describeSession, describeTimes } from "./core/format";
import { findOverlaps, groupByWakeDate, mainSession } from "./core/nights";
import { nightTimes, parseDateArg, parseTime } from "./core/time";
import { ApiError, createHttpApi } from "./http-api";
import { askHidden, confirm, readStdin } from "./prompt";
import { commitSave } from "./tui/writes";

export const DEFAULT_LIST_DAYS = 14;

export class UsageError extends Error {}

export async function connect(): Promise<SneuzApi> {
  const { apiKey, apiUrl } = await loadConfig();
  if (!apiKey) throw new UsageError("not logged in; run `sneuz login` first");
  return createHttpApi(apiUrl, apiKey);
}

// settings first, so the timezone is in place before any date is worked out
async function connectWithTimezone(): Promise<SneuzApi> {
  const api = await connect();
  applyTimezone(await api.getSettings());
  return api;
}

export async function login(): Promise<void> {
  const { apiUrl } = await loadConfig();
  // a piped key keeps it out of shell history and works in scripts
  const apiKey = process.stdin.isTTY
    ? await askHidden("api key (create one in Settings > API Keys): ")
    : await readStdin();
  if (!apiKey) throw new UsageError("no api key given");

  const profile = await createHttpApi(apiUrl, apiKey)
    .getProfile()
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        throw new UsageError("that api key was rejected");
      }
      throw error;
    });
  await saveApiKey(apiKey);
  console.log(`logged in as ${profile.email}`);
}

export async function add(args: string[]): Promise<void> {
  if (args.length < 2 || args.length > 3) {
    throw new UsageError("usage: sneuz add [date] <bed> <wake>");
  }
  const [dateArg, bedArg, wakeArg]: [string | null, string, string] =
    args.length === 3 ? [args[0], args[1], args[2]] : [null, args[0], args[1]];
  const api = await connectWithTimezone();
  const today = todayLocalDate();

  const wakeDate = dateArg === null ? today : parseDateArg(dateArg, today);
  if (wakeDate === null) {
    throw new UsageError(
      `${dateArg} isn't a date; use 11-14, 2026-11-14, today or yesterday`,
    );
  }
  const bed = parseTime(bedArg);
  const wake = parseTime(wakeArg);
  if (bed === null || wake === null) {
    throw new UsageError(
      `${bed === null ? bedArg : wakeArg} isn't a time; use 2330, 23:30 or 9`,
    );
  }
  const night = nightTimes(wakeDate, bed, wake);
  if (night === null) throw new UsageError("wake has to be after bed");

  const overlaps = findOverlaps(
    night.bedtime,
    night.wake,
    await api.listSessions(),
    null,
  );
  if (overlaps.length > 0) {
    const listed = overlaps.map(describeSession).join(", ");
    if (!process.stdin.isTTY) {
      throw new UsageError(
        `overlaps ${listed}; run it in a terminal to replace`,
      );
    }
    if (!(await confirm(`overlaps ${listed}. replace it?`))) {
      console.log("nothing saved");
      return;
    }
  }

  await commitSave(api, null, night.bedtime, night.wake, overlaps);
  console.log(`✓ ${describeTimes(night.bedtime, night.wake)}`);
}

export function parseDays(value: string): number {
  const days = Number(value);
  if (!/^\d+$/.test(value) || days < 1) {
    throw new UsageError(
      `${value} isn't a number of days; use a whole number like 30`,
    );
  }
  return days;
}

export type RangeOptions = { from?: string; to?: string; days?: string };

// one window: --to ends it (default today), --from or --days starts it
export function resolveRange(
  { from, to, days }: RangeOptions,
  today: LocalDate,
): { first: LocalDate; last: LocalDate } {
  if (from !== undefined && days !== undefined) {
    throw new UsageError("use --from or --days, not both");
  }
  const parse = (value: string) => {
    const date = parseDateArg(value, today);
    if (date === null) {
      throw new UsageError(
        `${value} isn't a date; use 11-14, 2026-11-14, today or yesterday`,
      );
    }
    return date;
  };
  const last = to === undefined ? today : parse(to);
  const first =
    from === undefined
      ? addDays(
          last,
          -((days === undefined ? DEFAULT_LIST_DAYS : parseDays(days)) - 1),
        )
      : parse(from);
  if (first > last) throw new UsageError("--from has to be on or before --to");
  return { first, last };
}

export async function ls(
  options: RangeOptions & { json: boolean },
): Promise<void> {
  const api = await connectWithTimezone();
  const today = todayLocalDate();
  const { first, last } = resolveRange(options, today);
  const byDay = groupByWakeDate(await api.listSessions());

  if (options.json) {
    const inRange: Session[] = [];
    for (const [day, sessions] of byDay) {
      if (day >= first && day <= last) inRange.push(...sessions);
    }
    inRange.sort((a, b) => b.bedtime.localeCompare(a.bedtime));
    console.log(JSON.stringify(inRange, null, 2));
    return;
  }

  for (let day = last; day >= first; day = addDays(day, -1)) {
    const sessions = byDay.get(day) ?? [];
    const night = mainSession(sessions);
    const more = sessions.length > 1 ? `  +${sessions.length - 1} more` : "";
    console.log(
      `${formatDay(day, today).padEnd(11)}  ${night ? describeSession(night) : "·"}${more}`,
    );
  }
}
