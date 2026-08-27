import { describe, expect, it } from "vitest";
import { resolveStoredZone } from "./use-timezone";

describe("resolveStoredZone", () => {
  it("keeps a zone the user picked", () => {
    expect(resolveStoredZone("America/Toronto")).toBe("America/Toronto");
  });

  it("treats the UTC column default as unset", () => {
    expect(resolveStoredZone("UTC")).toBeNull();
  });

  it("treats null as unset", () => {
    expect(resolveStoredZone(null)).toBeNull();
  });
});
