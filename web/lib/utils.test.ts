import { describe, expect, it } from "vitest";
import { safeNextPath } from "./utils";

describe("safeNextPath", () => {
  it("keeps a same-origin path", () => {
    expect(safeNextPath("/dashboard/settings")).toBe("/dashboard/settings");
  });

  it("falls back when missing", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });

  it("rejects absolute urls", () => {
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
  });

  it("rejects protocol-relative urls", () => {
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
  });

  it("honours a custom fallback", () => {
    expect(safeNextPath("https://evil.com", "/login")).toBe("/login");
  });
});
