import { describe, expect, it } from "vitest";
import { type Session, toSession } from "../api";
import {
  findOverlaps,
  groupByWakeDate,
  mainSession,
  sevenDayMedian,
  wakeDateOf,
} from "./nights";

const night = (id: string, bed: Date, wake: Date) => toSession(id, bed, wake);
const open = (id: string, bed: Date): Session => ({
  id,
  bedtime: bed.toISOString(),
  wake_time: null,
  duration_minutes: null,
});

describe("wake dates", () => {
  it("files a night under the day it ended", () => {
    const s = night("a", new Date(2026, 10, 13, 23), new Date(2026, 10, 14, 7));
    expect(wakeDateOf(s)).toBe("2026-11-14");
  });

  it("files an in-progress evening session under the next day", () => {
    expect(wakeDateOf(open("a", new Date(2026, 10, 13, 23)))).toBe(
      "2026-11-14",
    );
  });

  it("groups a nap with the night that ended the same day", () => {
    const byDay = groupByWakeDate([
      night("nap", new Date(2026, 10, 14, 14), new Date(2026, 10, 14, 15)),
      night("main", new Date(2026, 10, 13, 23), new Date(2026, 10, 14, 7)),
    ]);
    const day = byDay.get("2026-11-14") ?? [];
    expect(day.map((s) => s.id)).toEqual(["main", "nap"]);
    expect(mainSession(day)?.id).toBe("main");
  });
});

describe("sevenDayMedian", () => {
  it("takes the median of the last 7 wake days only", () => {
    // nights ending nov 3..10 last 4h..11h; nov 3 falls outside the window
    const sessions = [3, 4, 5, 6, 7, 8, 9, 10].map((day) => {
      const wake = new Date(2026, 10, day, 7);
      const bed = new Date(wake.getTime() - (day + 1) * 3_600_000);
      return night(String(day), bed, wake);
    });
    expect(sevenDayMedian(groupByWakeDate(sessions), "2026-11-10")).toBe(
      8 * 60,
    );
  });

  it("is null with no nights", () => {
    expect(sevenDayMedian(new Map(), "2026-11-10")).toBeNull();
  });
});

describe("findOverlaps", () => {
  const existing = night(
    "x",
    new Date(2026, 10, 13, 23),
    new Date(2026, 10, 14, 7),
  );

  it("finds an overlapping night", () => {
    expect(
      findOverlaps(
        new Date(2026, 10, 14, 6),
        new Date(2026, 10, 14, 8),
        [existing],
        null,
      ),
    ).toEqual([existing]);
  });

  it("ignores back to back nights and the night being edited", () => {
    expect(
      findOverlaps(
        new Date(2026, 10, 14, 7),
        new Date(2026, 10, 14, 9),
        [existing],
        null,
      ),
    ).toEqual([]);
    expect(
      findOverlaps(
        new Date(2026, 10, 14, 6),
        new Date(2026, 10, 14, 8),
        [existing],
        "x",
      ),
    ).toEqual([]);
  });
});
