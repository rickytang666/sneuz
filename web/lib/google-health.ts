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
