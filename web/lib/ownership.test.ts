import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// row level security is gone, so these tests are what keep every query scoped to the signed-in user

const USER = "11111111-1111-1111-1111-111111111111";
const OTHER_ROW = "22222222-2222-2222-2222-222222222222";

const mock = await vi.hoisted(async () => {
  const { createDbMock } = await import("@/lib/test/db-mock");
  return createDbMock();
});

vi.mock("@/lib/db", () => ({ getDb: () => mock.db }));
vi.mock("@/lib/api/auth", () => ({
  requireAuthFromHeader: async () => ({ user: { id: USER }, response: null }),
}));
vi.mock("@/lib/session", () => ({ getUser: async () => ({ id: USER }) }));
vi.mock("@/lib/auth", () => ({ getAuth: () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const sessionsRoute = await import("@/app/api/v1/sessions/route");
const sessionRoute = await import("@/app/api/v1/sessions/[id]/route");
const settingsRoute = await import("@/app/api/v1/settings/route");
const apiKeys = await import("@/lib/services/api-keys");
const sleepActions = await import("@/lib/actions/sleep");
const userActions = await import("@/lib/actions/user");

const request = (method = "GET", body?: unknown) =>
  new NextRequest("http://localhost/api/v1/x", {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
const params = { params: Promise.resolve({ id: OTHER_ROW }) };

function expectEveryWhereScopedToUser() {
  const wheres = mock.whereParams();
  expect(wheres.length).toBeGreaterThan(0);
  for (const bound of wheres) expect(bound).toContain(USER);
}

function expectInsertOwnedByUser() {
  const [[values]] = mock.calls("values") as [[{ userId: string }]];
  expect(values.userId).toBe(USER);
}

beforeEach(() => mock.reset());

describe("api routes scope queries to the api key owner", () => {
  it("GET /sessions", async () => {
    await sessionsRoute.GET(request());
    expectEveryWhereScopedToUser();
  });

  it("POST /sessions", async () => {
    mock.state.result = [{ id: "s", startTime: new Date(), endTime: null }];
    await sessionsRoute.POST(
      request("POST", { bedtime: "2026-11-01T23:00:00Z" }),
    );
    expectInsertOwnedByUser();
  });

  it("PATCH /sessions/[id] on another user's row is 404", async () => {
    const res = await sessionRoute.PATCH(
      request("PATCH", { wake_time: "2026-11-02T07:00:00Z" }),
      params,
    );
    expect(res.status).toBe(404);
    expectEveryWhereScopedToUser();
    expect(mock.whereParams()[0]).toContain(OTHER_ROW);
  });

  it("DELETE /sessions/[id] on another user's row is 404", async () => {
    const res = await sessionRoute.DELETE(request("DELETE"), params);
    expect(res.status).toBe(404);
    expectEveryWhereScopedToUser();
  });

  it("GET /settings", async () => {
    await settingsRoute.GET(request());
    expectEveryWhereScopedToUser();
  });

  it("PATCH /settings", async () => {
    mock.state.result = [{}];
    await settingsRoute.PATCH(request("PATCH", { timezone: "UTC" }));
    expectInsertOwnedByUser();
  });
});

describe("api key service scopes to the given user", () => {
  it("listKeys", async () => {
    await apiKeys.listKeys(USER);
    expectEveryWhereScopedToUser();
  });

  it("deleteKey", async () => {
    await apiKeys.deleteKey(USER, OTHER_ROW);
    expectEveryWhereScopedToUser();
  });

  it("createKey", async () => {
    mock.state.result = [{ id: "k", name: "n", createdAt: new Date() }];
    await apiKeys.createKey(USER, "n");
    expectInsertOwnedByUser();
  });
});

describe("dashboard actions scope to the signed-in user", () => {
  const form = new FormData();
  form.set("bedtime", "2026-11-01T23:00:00Z");
  form.set("wake_time", "2026-11-02T07:00:00Z");

  it("getSleepSessions", async () => {
    await sleepActions.getSleepSessions();
    expectEveryWhereScopedToUser();
  });

  it("getSleepStats", async () => {
    await sleepActions.getSleepStats();
    expectEveryWhereScopedToUser();
  });

  it("getUserSettings", async () => {
    await sleepActions.getUserSettings();
    expectEveryWhereScopedToUser();
  });

  it("createSleepSession", async () => {
    await sleepActions.createSleepSession(form);
    expectInsertOwnedByUser();
  });

  it("updateSleepSession", async () => {
    await sleepActions.updateSleepSession(OTHER_ROW, form);
    expectEveryWhereScopedToUser();
  });

  it("deleteSleepSession", async () => {
    await sleepActions.deleteSleepSession(OTHER_ROW);
    expectEveryWhereScopedToUser();
  });

  it("updateSettings", async () => {
    const settings = new FormData();
    settings.set("target_bedtime", "23:00");
    settings.set("target_wake_time", "07:00");
    await userActions.updateSettings(settings);
    expectInsertOwnedByUser();
  });
});
