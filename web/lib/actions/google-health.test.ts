import { beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleHealthError } from "@/lib/google-health";

const USER = "11111111-1111-1111-1111-111111111111";
const SESSION = "22222222-2222-2222-2222-222222222222";

const mock = await vi.hoisted(async () => {
  const { createDbMock } = await import("@/lib/test/db-mock");
  return createDbMock();
});
const getAccessToken = vi.hoisted(() => vi.fn());
const listSleepNights = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({ getDb: () => mock.db }));
vi.mock("@/lib/session", () => ({ getUser: async () => ({ id: USER }) }));
vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getAccessToken } }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/google-health", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/google-health")>()),
  listSleepNights,
}));

const { GOOGLE_HEALTH_SLEEP_SCOPE } = await import("@/lib/google-health");
const actions = await import("./google-health");

const googleAccount = { id: "acct", scope: GOOGLE_HEALTH_SLEEP_SCOPE };

beforeEach(() => {
  mock.reset();
  getAccessToken.mockReset();
  listSleepNights.mockReset();
});

describe("previewGoogleHealthImport", () => {
  it("asks to reconnect when the refresh token stops working", async () => {
    mock.state.result = [googleAccount];
    getAccessToken.mockRejectedValue(new Error("FAILED_TO_GET_ACCESS_TOKEN"));
    const result = await actions.previewGoogleHealthImport(
      "2026-07-01",
      "2026-07-02",
    );
    expect(result.reconnect).toBe(true);
  });

  it("asks to reconnect when google rejects the token", async () => {
    mock.state.result = [googleAccount];
    getAccessToken.mockResolvedValue({ accessToken: "t" });
    listSleepNights.mockRejectedValue(new GoogleHealthError("denied", 403));
    const result = await actions.previewGoogleHealthImport(
      "2026-07-01",
      "2026-07-02",
    );
    expect(result.reconnect).toBe(true);
  });

  it("doesn't ask to reconnect for a google outage", async () => {
    mock.state.result = [googleAccount];
    getAccessToken.mockResolvedValue({ accessToken: "t" });
    listSleepNights.mockRejectedValue(new GoogleHealthError("down", 503));
    const result = await actions.previewGoogleHealthImport(
      "2026-07-01",
      "2026-07-02",
    );
    expect(result.reconnect).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("rejects a range over 90 days before calling google", async () => {
    const result = await actions.previewGoogleHealthImport(
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.error).toMatch(/90 days/);
    expect(getAccessToken).not.toHaveBeenCalled();
  });
});

describe("saveGoogleHealthImport", () => {
  const night = {
    start: "2026-07-01T23:00:00Z",
    end: "2026-07-02T07:00:00Z",
  };
  // a session that appeared after the preview, overlapping the night
  const newSession = {
    id: SESSION,
    startTime: new Date("2026-07-02T06:00:00Z"),
    endTime: new Date("2026-07-02T08:00:00Z"),
  };

  it("skips a night that a session added since the preview now overlaps", async () => {
    mock.state.result = [newSession];
    const result = await actions.saveGoogleHealthImport([
      { ...night, replace: [] },
    ]);
    expect(result).toEqual({ imported: 0, skipped: 1 });
    expect(mock.calls("values")).toEqual([]);
  });

  it("saves a night when the user chose to replace its overlap", async () => {
    mock.state.result = [newSession];
    const result = await actions.saveGoogleHealthImport([
      { ...night, replace: [SESSION] },
    ]);
    expect(result).toEqual({ imported: 1, skipped: 0 });
    expect(mock.calls("delete")).toHaveLength(1);
  });
});
