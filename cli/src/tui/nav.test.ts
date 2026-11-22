import { describe, expect, it } from "vitest";
import {
  initialNav,
  type NavContext,
  nearestEmpty,
  reduceNav,
  visibleRows,
} from "./nav";

const ctx: NavContext = { today: "2026-11-20", visibleWeeks: 4 };

describe("reduceNav", () => {
  it("never moves past today", () => {
    expect(reduceNav(initialNav(ctx.today), "right", ctx).cursorDate).toBe(
      "2026-11-20",
    );
  });

  it("scrolls up a week when the cursor leaves the top row", () => {
    let nav = initialNav(ctx.today);
    for (let i = 0; i < 4; i++) nav = reduceNav(nav, "up", ctx);
    expect(nav.cursorDate).toBe("2026-10-23");
    expect(nav.scroll).toBe(1);
    expect(visibleRows(ctx.today, nav, 4)[0].days[0].date).toBe("2026-10-19");
  });

  it("scrolls back down as the cursor returns", () => {
    let nav = { cursorDate: "2026-10-23", scroll: 1 };
    nav = reduceNav(nav, "down", ctx);
    expect(nav.scroll).toBe(1);
    for (let i = 0; i < 3; i++) nav = reduceNav(nav, "down", ctx);
    expect(nav.scroll).toBe(0);
  });

  it("keeps going back past any data, years if needed", () => {
    let nav = initialNav(ctx.today);
    for (let i = 0; i < 52 * 30; i++) nav = reduceNav(nav, "up", ctx);
    expect(nav.cursorDate).toBe("1996-12-27");
    const rows = visibleRows(ctx.today, nav, 4);
    expect(rows[0].days.some((d) => d.date === nav.cursorDate)).toBe(true);
  });

  it("jumps home on today", () => {
    const nav = reduceNav(
      { cursorDate: "2026-09-01", scroll: 9 },
      "today",
      ctx,
    );
    expect(nav).toEqual(initialNav(ctx.today));
  });
});

describe("nearestEmpty", () => {
  const logged = new Set(["2026-11-20", "2026-11-19", "2026-11-17"]);

  it("finds an empty day back even before all the data", () => {
    const full = new Set(["2026-11-20", "2026-11-19"]);
    expect(nearestEmpty("2026-11-20", -1, full, ctx)).toBe("2026-11-18");
  });

  it("finds the closest empty day back", () => {
    expect(nearestEmpty("2026-11-20", -1, logged, ctx)).toBe("2026-11-18");
  });

  it("finds the closest empty day forward, never past today", () => {
    expect(nearestEmpty("2026-11-16", 1, logged, ctx)).toBe("2026-11-18");
    expect(nearestEmpty("2026-11-19", 1, logged, ctx)).toBeNull();
  });
});

describe("month jumps", () => {
  it("moves a month at a time and scrolls the grid", () => {
    const nav = reduceNav(initialNav(ctx.today), "monthBack", ctx);
    expect(nav.cursorDate).toBe("2026-10-20");
    expect(
      visibleRows(ctx.today, nav, 4).some((row) =>
        row.days.some((d) => d.date === "2026-10-20"),
      ),
    ).toBe(true);
  });

  it("stops at today going forward", () => {
    const nav = reduceNav(
      { cursorDate: "2026-11-01", scroll: 2 },
      "monthForward",
      ctx,
    );
    expect(nav.cursorDate).toBe("2026-11-20");
  });
});
