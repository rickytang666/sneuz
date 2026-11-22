import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createHttpApi } from "./http-api";

const api = createHttpApi("https://sneuz.test", "snz_test");

function respond(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("createHttpApi", () => {
  it("sends the api key and unwraps data", async () => {
    const fetch = vi.fn(async () => respond(200, { data: { email: "a@b.c" } }));
    vi.stubGlobal("fetch", fetch);
    expect(await api.getProfile()).toEqual({ email: "a@b.c" });
    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("https://sneuz.test/api/v1/profile");
    expect(init.headers).toMatchObject({ Authorization: "ApiKey snz_test" });
  });

  it("pages through sessions until a short page", async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({ id: String(i) }));
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respond(200, { data: full }))
      .mockResolvedValueOnce(respond(200, { data: [{ id: "last" }] }));
    vi.stubGlobal("fetch", fetch);
    expect(await api.listSessions()).toHaveLength(1001);
    expect(String(fetch.mock.calls[1][0])).toContain("offset=1000");
  });

  it("sends iso times on create", async () => {
    const fetch = vi.fn(async () => respond(201, { data: { id: "s" } }));
    vi.stubGlobal("fetch", fetch);
    await api.createSession(
      new Date("2026-11-13T23:30:00Z"),
      new Date("2026-11-14T07:10:00Z"),
    );
    const [, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      bedtime: "2026-11-13T23:30:00.000Z",
      wake_time: "2026-11-14T07:10:00.000Z",
    });
  });

  it("treats 204 as done", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond(204)),
    );
    await expect(api.deleteSession("s")).resolves.toBeUndefined();
  });

  it("points a rejected key at login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond(401, { error: "Unauthorized" })),
    );
    await expect(api.getSettings()).rejects.toThrow(/sneuz login/);
  });

  it("passes the server's error through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond(404, { error: "Not found" })),
    );
    await expect(api.deleteSession("s")).rejects.toMatchObject({
      message: "Not found",
      status: 404,
    });
  });

  it("names the server when it can't be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    await expect(api.getSettings()).rejects.toBeInstanceOf(ApiError);
    await expect(api.getSettings()).rejects.toThrow(/can't reach/);
  });

  it.each([
    ["an html page", new Response("<html></html>", { status: 200 })],
    ["json null", new Response("null", { status: 200 })],
    ["json without data", respond(200, { ok: true })],
  ])("rejects a 2xx with %s", async (_, response) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response),
    );
    await expect(api.getSettings()).rejects.toThrow(/unexpected response/);
  });
});
