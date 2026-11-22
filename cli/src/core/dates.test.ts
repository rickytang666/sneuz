import { describe, expect, it } from "vitest";
import { addMonths, formatDay, monthDividers, weekRows } from "./dates";

describe("weekRows", () => {
  it("lays out weeks from a monday and marks days after today", () => {
    const rows = weekRows("2026-11-09", 2, "2026-11-20");
    expect(rows[1].days[0].date).toBe("2026-11-16");
    expect(rows[1].days[6]).toEqual({ date: "2026-11-22", isFuture: true });
  });
});

describe("monthDividers", () => {
  it("labels rows that hold a 1st", () => {
    const rows = weekRows("2026-10-26", 4, "2026-11-20");
    // the top row runs oct 26 to nov 1, so it opens november
    expect(monthDividers(rows)).toEqual(["nov", null, null, null]);
  });

  it("keeps labels to the month so the gutter stays one width", () => {
    const rows = weekRows("2025-12-29", 2, "2026-01-10");
    expect(monthDividers(rows)).toEqual(["jan", null]);
  });
});

describe("formatDay", () => {
  it("is short and lowercase", () => {
    expect(formatDay("2026-11-14", "2026-11-20")).toBe("sat nov 14");
  });

  it("adds the year outside the current one", () => {
    expect(formatDay("2023-01-20", "2026-11-20")).toBe("fri jan 20 2023");
  });
});

describe("addMonths", () => {
  it("keeps the day of the month", () => {
    expect(addMonths("2026-11-14", -1)).toBe("2026-10-14");
    expect(addMonths("2026-01-14", -1)).toBe("2025-12-14");
  });

  it("pulls back to a shorter month's last day", () => {
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
  });
});
