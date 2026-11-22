import { describe, expect, it } from "vitest";
import { formatClock, nightTimes, parseDateArg, parseTime } from "./time";

describe("parseTime", () => {
  it.each([
    ["2330", 23 * 60 + 30],
    ["23:30", 23 * 60 + 30],
    ["0710", 7 * 60 + 10],
    ["1:15", 75],
    ["930", 9 * 60 + 30],
    ["9", 9 * 60],
    ["0", 0],
  ])("reads %s", (input, minutes) => {
    expect(parseTime(input)).toBe(minutes);
  });

  it.each(["2400", "1260", "25", "abc", "", "12:5", "11:30p"])(
    "rejects %s",
    (input) => {
      expect(parseTime(input)).toBeNull();
    },
  );

  it("formats back to a clock", () => {
    expect(formatClock(75)).toBe("01:15");
  });
});

describe("parseDateArg", () => {
  const today = "2026-11-20";

  it("reads relative words", () => {
    expect(parseDateArg("today", today)).toBe("2026-11-20");
    expect(parseDateArg("Yesterday", today)).toBe("2026-11-19");
  });

  it("reads month-day in this year", () => {
    expect(parseDateArg("11-14", today)).toBe("2026-11-14");
  });

  it("reads a month-day still to come as last year", () => {
    expect(parseDateArg("12-30", today)).toBe("2025-12-30");
  });

  it("reads full dates", () => {
    expect(parseDateArg("2026-3-5", today)).toBe("2026-03-05");
  });

  it("rejects impossible dates and weekday names", () => {
    expect(parseDateArg("02-30", today)).toBeNull();
    expect(parseDateArg("fri", today)).toBeNull();
  });
});

describe("nightTimes", () => {
  it("puts an evening bedtime on the day before the wake day", () => {
    const night = nightTimes("2026-11-14", 23 * 60 + 30, 7 * 60 + 10);
    expect(night?.bedtime).toEqual(new Date(2026, 10, 13, 23, 30));
    expect(night?.wake).toEqual(new Date(2026, 10, 14, 7, 10));
  });

  it("keeps an after-midnight bedtime on the wake day", () => {
    const night = nightTimes("2026-11-14", 75, 9 * 60);
    expect(night?.bedtime).toEqual(new Date(2026, 10, 14, 1, 15));
  });

  it("treats 15:00 as the start of the evening", () => {
    expect(nightTimes("2026-11-14", 15 * 60, 7 * 60)?.bedtime).toEqual(
      new Date(2026, 10, 13, 15, 0),
    );
    expect(nightTimes("2026-11-14", 14 * 60 + 59, 16 * 60)?.bedtime).toEqual(
      new Date(2026, 10, 14, 14, 59),
    );
  });

  it("reads an impossible morning bedtime as the evening before", () => {
    const night = nightTimes("2026-11-14", 11 * 60 + 55, 7 * 60 + 20);
    expect(night?.bedtime).toEqual(new Date(2026, 10, 13, 23, 55));
    expect(nightTimes("2026-11-14", 9 * 60, 7 * 60)?.bedtime).toEqual(
      new Date(2026, 10, 13, 21, 0),
    );
  });

  it("keeps a morning bedtime that works as typed", () => {
    expect(nightTimes("2026-11-14", 11 * 60 + 55, 13 * 60)?.bedtime).toEqual(
      new Date(2026, 10, 14, 11, 55),
    );
  });

  it("rejects a wake time before an afternoon bedtime", () => {
    expect(nightTimes("2026-11-14", 13 * 60, 12 * 60)).toBeNull();
  });
});
