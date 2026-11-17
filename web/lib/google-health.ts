export const GOOGLE_HEALTH_SLEEP_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly";

const SLEEP_DATA_POINTS_URL =
  "https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints";

// the api caps sleep pages at 25
const PAGE_SIZE = 25;

export interface GoogleHealthNight {
  // the data point's resource name, stable across imports
  id: string;
  start: string;
  end: string;
}

interface SleepDataPoint {
  name: string;
  sleep?: { interval?: { startTime?: string; endTime?: string } };
}

interface ListResponse {
  dataPoints?: SleepDataPoint[];
  nextPageToken?: string;
}

export class GoogleHealthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// dates are civil YYYY-MM-DD wake dates, inclusive; sleep can only be filtered by end time
export function sleepFilter(fromDate: string, toDate: string) {
  const end = new Date(`${toDate}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const toExclusive = end.toISOString().slice(0, 10);
  return `sleep.interval.civil_end_time >= "${fromDate}" AND sleep.interval.civil_end_time < "${toExclusive}"`;
}

export async function listSleepNights(
  accessToken: string,
  fromDate: string,
  toDate: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GoogleHealthNight[]> {
  const nights: GoogleHealthNight[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(SLEEP_DATA_POINTS_URL);
    url.searchParams.set("filter", sleepFilter(fromDate, toDate));
    url.searchParams.set("pageSize", String(PAGE_SIZE));
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new GoogleHealthError(
        `google health returned ${res.status}: ${await res.text()}`,
        res.status,
      );
    }

    const body = (await res.json()) as ListResponse;
    for (const point of body.dataPoints ?? []) {
      const interval = point.sleep?.interval;
      if (!interval?.startTime || !interval.endTime) continue;
      nights.push({
        id: point.name,
        start: new Date(interval.startTime).toISOString(),
        end: new Date(interval.endTime).toISOString(),
      });
    }
    pageToken = body.nextPageToken || undefined;
  } while (pageToken);

  return nights.sort((a, b) => a.start.localeCompare(b.start));
}

export interface ExistingSession {
  id: string;
  start: string;
  end: string | null;
}

export interface ImportCandidate extends GoogleHealthNight {
  // existing sessions this night overlaps; empty means it imports without asking
  conflicts: ExistingSession[];
}

// an in-progress session (no end) counts as running until now
export function findConflicts(
  nights: GoogleHealthNight[],
  existing: ExistingSession[],
  now = new Date(),
): ImportCandidate[] {
  return nights.map((night) => {
    const start = Date.parse(night.start);
    const end = Date.parse(night.end);
    const conflicts = existing.filter((session) => {
      const sessionStart = Date.parse(session.start);
      const sessionEnd = session.end ? Date.parse(session.end) : now.getTime();
      return start < sessionEnd && end > sessionStart;
    });
    return { ...night, conflicts };
  });
}

// google serves 25 nights per request, so a long range means many sequential calls in one server action
export const MAX_RANGE_DAYS = 90;

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // rejects dates like 2026-02-30 that Date silently rolls over
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function validateRange(fromDate: string, toDate: string) {
  const from = parseDate(fromDate);
  const to = parseDate(toDate);
  if (!from || !to || from > to) return "Pick a valid date range.";
  const days = (to.getTime() - from.getTime()) / 86_400_000 + 1;
  if (days > MAX_RANGE_DAYS) {
    return `Pick ${MAX_RANGE_DAYS} days or fewer at a time.`;
  }
  return null;
}

// better auth appends its own error code to the error callback url
export function connectErrorMessage(code: string | undefined) {
  switch (code) {
    case "access_denied":
      return "Google Health wasn't connected because access was declined.";
    case "email_does_not_match":
      return "Connect with the Google account that uses your Sneuz email.";
    case "account_already_linked_to_different_user":
      return "That Google account is linked to a different Sneuz account.";
    default:
      return "Connecting Google Health failed. Try again.";
  }
}

export interface ImportSelection {
  start: string;
  end: string;
  // ids of the user's existing sessions this night replaces
  replace: string[];
}

// a night is saved only if every session it overlaps now is one the user chose to replace
export function dropNewlyConflicting(
  selections: ImportSelection[],
  existing: ExistingSession[],
  now = new Date(),
) {
  const candidates = findConflicts(
    selections.map((s, i) => ({ id: String(i), start: s.start, end: s.end })),
    existing,
    now,
  );
  return selections.filter((selection, i) =>
    candidates[i].conflicts.every((c) => selection.replace.includes(c.id)),
  );
}
