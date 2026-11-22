import { describe, expect, it } from "vitest";
import { parseDays, resolveRange, UsageError } from "./commands";

describe("parseDays", () => {
  it("accepts whole positive numbers", () => {
    expect(parseDays("1")).toBe(1);
    expect(parseDays("365")).toBe(365);
  });

  it.each(["0", "-3", "2.5", "abc", "", "1e3"])("rejects %j", (value) => {
    expect(() => parseDays(value)).toThrow(UsageError);
  });
});

describe("resolveRange", () => {
  const today = "2026-11-21";

  it("defaults to the last 14 days", () => {
    expect(resolveRange({}, today)).toEqual({
      first: "2026-11-08",
      last: today,
    });
  });

  it("counts --days back from --to", () => {
    expect(resolveRange({ to: "09-30", days: "30" }, today)).toEqual({
      first: "2026-09-01",
      last: "2026-09-30",
    });
  });

  it("takes an explicit window", () => {
    expect(resolveRange({ from: "09-01", to: "09-30" }, today)).toEqual({
      first: "2026-09-01",
      last: "2026-09-30",
    });
  });

  it("runs --from up to today without --to", () => {
    expect(resolveRange({ from: "11-20" }, today)).toEqual({
      first: "2026-11-20",
      last: today,
    });
  });

  it.each([
    [{ from: "09-01", days: "3" }, "not both"],
    [{ from: "09-30", to: "09-01" }, "on or before"],
    [{ to: "nope" }, "isn't a date"],
    [{ days: "0" }, "isn't a number"],
  ])("rejects %j", (options, message) => {
    expect(() => resolveRange(options, today)).toThrow(message);
  });
});
