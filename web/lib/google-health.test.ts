import { describe, expect, it } from "vitest";
import {
  connectErrorMessage,
  dropNewlyConflicting,
  findConflicts,
  listSleepNights,
  sleepFilter,
  validateRange,
} from "./google-health";

const night = {
  id: "n1",
  start: "2026-07-01T23:00:00.000Z",
  end: "2026-07-02T07:00:00.000Z",
};

describe("findConflicts", () => {
  it("flags an existing session that overlaps the night", () => {
    const [result] = findConflicts(
      [night],
      [
        { id: "a", start: "2026-07-02T06:00:00Z", end: "2026-07-02T08:00:00Z" },
        { id: "b", start: "2026-07-02T09:00:00Z", end: "2026-07-02T10:00:00Z" },
      ],
    );
    expect(result.conflicts.map((c) => c.id)).toEqual(["a"]);
  });

  it("treats back to back sessions as not overlapping", () => {
    const [result] = findConflicts(
      [night],
      [{ id: "a", start: "2026-07-02T07:00:00Z", end: "2026-07-02T08:00:00Z" }],
    );
    expect(result.conflicts).toEqual([]);
  });

  it("counts an in-progress session as running until now", () => {
    const [result] = findConflicts(
      [night],
      [{ id: "a", start: "2026-07-01T20:00:00Z", end: null }],
      new Date("2026-07-03T00:00:00Z"),
    );
    expect(result.conflicts.map((c) => c.id)).toEqual(["a"]);
  });
});

describe("sleepFilter", () => {
  it("filters by civil wake date, inclusive of the last day", () => {
    expect(sleepFilter("2026-07-01", "2026-07-31")).toBe(
      'sleep.interval.civil_end_time >= "2026-07-01" AND sleep.interval.civil_end_time < "2026-08-01"',
    );
  });
});

describe("listSleepNights", () => {
  it("follows page tokens and sorts nights by start", async () => {
    const pages = [
      {
        dataPoints: [
          {
            name: "p2",
            sleep: {
              interval: {
                startTime: "2026-07-02T23:00:00Z",
                endTime: "2026-07-03T07:00:00Z",
              },
            },
          },
        ],
        nextPageToken: "next",
      },
      {
        dataPoints: [
          {
            name: "p1",
            sleep: {
              interval: {
                startTime: "2026-07-01T23:00:00Z",
                endTime: "2026-07-02T07:00:00Z",
              },
            },
          },
          { name: "no-interval", sleep: {} },
        ],
      },
    ];
    const urls: string[] = [];
    const fetchImpl = (async (url: URL) => {
      urls.push(url.toString());
      return new Response(JSON.stringify(pages[urls.length - 1]));
    }) as unknown as typeof fetch;

    const nights = await listSleepNights(
      "t",
      "2026-07-01",
      "2026-07-03",
      fetchImpl,
    );

    expect(nights.map((n) => n.id)).toEqual(["p1", "p2"]);
    expect(new URL(urls[1]).searchParams.get("pageToken")).toBe("next");
  });

  it("throws with the status when google rejects the call", async () => {
    const fetchImpl = (async () =>
      new Response("denied", { status: 403 })) as unknown as typeof fetch;
    await expect(
      listSleepNights("t", "2026-07-01", "2026-07-03", fetchImpl),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("validateRange", () => {
  it("accepts a range of exactly 90 days", () => {
    expect(validateRange("2026-07-01", "2026-09-28")).toBeNull();
  });

  it("rejects a range over 90 days", () => {
    expect(validateRange("2026-07-01", "2026-09-29")).toMatch(/90 days/);
  });

  it("rejects reversed ranges and impossible dates", () => {
    expect(validateRange("2026-07-02", "2026-07-01")).not.toBeNull();
    expect(validateRange("2026-13-45", "2026-13-46")).not.toBeNull();
    expect(validateRange("2026-02-30", "2026-03-01")).not.toBeNull();
  });
});

describe("connectErrorMessage", () => {
  it("explains a mismatched google account", () => {
    expect(connectErrorMessage("email_does_not_match")).toMatch(/Sneuz email/);
  });

  it("falls back to a generic message", () => {
    expect(connectErrorMessage(undefined)).toMatch(/failed/);
  });
});

describe("dropNewlyConflicting", () => {
  const selection = { ...night, replace: [] as string[] };
  const overlapping = {
    id: "a",
    start: "2026-07-02T06:00:00Z",
    end: "2026-07-02T08:00:00Z",
  };

  it("drops a night that now overlaps a session it doesn't replace", () => {
    expect(dropNewlyConflicting([selection], [overlapping])).toEqual([]);
  });

  it("keeps a night whose only overlap is one it replaces", () => {
    const replacing = { ...selection, replace: ["a"] };
    expect(dropNewlyConflicting([replacing], [overlapping])).toEqual([
      replacing,
    ]);
  });
});
