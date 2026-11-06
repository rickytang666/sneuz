import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashApiKey } from "./keys";

const db = vi.hoisted(() => ({
  rows: [] as unknown[],
  where: [] as unknown[],
}));

// a thenable stand-in for drizzle's query builder, every chained call returns itself
vi.mock("@/lib/db", () => {
  const builder: Record<string, unknown> = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === "then") {
          return (resolve: (value: unknown) => void) => resolve(db.rows);
        }
        return (...args: unknown[]) => {
          if (prop === "where") db.where.push(args[0]);
          return builder;
        };
      },
    },
  );
  return { getDb: () => builder };
});

const afterSpy = vi.hoisted(() => vi.fn());
vi.mock("next/server", () => ({ after: afterSpy }));

const { requireAuthFromHeader } = await import("./auth");

function makeRequest(authHeader?: string): Request {
  const headers: HeadersInit = authHeader ? { Authorization: authHeader } : {};
  return new Request("http://localhost/api/v1/sessions", { headers });
}

beforeEach(() => {
  db.rows = [];
  db.where = [];
  afterSpy.mockClear();
});

describe("requireAuthFromHeader", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const result = await requireAuthFromHeader(makeRequest());
    expect(result.response?.status).toBe(401);
    expect(result.user).toBeNull();
  });

  it("returns 401 for unrecognized scheme", async () => {
    const result = await requireAuthFromHeader(makeRequest("Basic abc123"));
    expect(result.response?.status).toBe(401);
  });

  it("rejects Bearer tokens now that only api keys are supported", async () => {
    const result = await requireAuthFromHeader(makeRequest("Bearer jwt"));
    expect(result.response?.status).toBe(401);
  });

  it("returns the key owner for a known ApiKey", async () => {
    db.rows = [
      {
        keyId: "key-id",
        id: "user-1",
        email: "a@example.com",
        name: "a",
        image: null,
      },
    ];
    const result = await requireAuthFromHeader(
      makeRequest("ApiKey snz_abc123"),
    );
    expect(result.response).toBeNull();
    expect(result.user).toEqual({
      id: "user-1",
      email: "a@example.com",
      name: "a",
      image: null,
    });
    expect(afterSpy).toHaveBeenCalledOnce();
  });

  it("returns 401 for an unknown ApiKey", async () => {
    const result = await requireAuthFromHeader(makeRequest("ApiKey snz_nope"));
    expect(result.response?.status).toBe(401);
    expect(afterSpy).not.toHaveBeenCalled();
  });

  it("looks the key up by its hash, never the raw key", async () => {
    await requireAuthFromHeader(makeRequest("ApiKey snz_abc123"));
    const serialized = JSON.stringify(db.where[0], (_, value) =>
      typeof value === "object" && value?.constructor?.name === "PgTable"
        ? undefined
        : value,
    );
    expect(serialized).toContain(hashApiKey("snz_abc123"));
    expect(serialized).not.toContain("snz_abc123");
  });

  it("401 response is JSON with an error field", async () => {
    const result = await requireAuthFromHeader(makeRequest());
    expect(result.response?.headers.get("Content-Type")).toBe(
      "application/json",
    );
    expect(await result.response?.json()).toHaveProperty("error");
  });
});
