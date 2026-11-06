import { beforeEach, describe, expect, it, vi } from "vitest";
import { createKey, deleteKey, listKeys } from "./api-keys";

// a thenable stand-in for drizzle's query builder, every chained call returns itself
const query = {
  result: [] as unknown[],
  calls: {} as Record<string, unknown[][]>,
};
const builder: Record<string, unknown> = new Proxy(
  {},
  {
    get(_, prop: string) {
      if (prop === "then") {
        return (resolve: (value: unknown) => void) => resolve(query.result);
      }
      return (...args: unknown[]) => {
        query.calls[prop] ??= [];
        query.calls[prop].push(args);
        return builder;
      };
    },
  },
);

vi.mock("@/lib/db", () => ({ getDb: () => builder }));

beforeEach(() => {
  query.result = [];
  query.calls = {};
});

describe("listKeys", () => {
  it("maps rows to the snake_case api shape", async () => {
    query.result = [
      {
        id: "1",
        name: "home",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        lastUsedAt: null,
      },
    ];

    expect(await listKeys("user-1")).toEqual([
      {
        id: "1",
        name: "home",
        created_at: "2026-01-01T00:00:00.000Z",
        last_used_at: null,
      },
    ]);
  });

  it("returns an empty array when the user has no keys", async () => {
    expect(await listKeys("user-1")).toEqual([]);
  });
});

describe("createKey", () => {
  beforeEach(() => {
    query.result = [
      { id: "key-id", name: "test", createdAt: new Date("2026-01-01") },
    ];
  });

  it("returns the raw key once", async () => {
    const result = await createKey("user-1", "test");
    expect(result.key).toMatch(/^snz_[0-9a-f]{64}$/);
    expect(result.name).toBe("test");
    expect(result.id).toBe("key-id");
  });

  it("stores a trimmed name and only the hash", async () => {
    const result = await createKey("user-1", "  test  ");
    const [values] = query.calls.values[0] as [Record<string, string>];
    expect(values.name).toBe("test");
    expect(values.userId).toBe("user-1");
    expect(values.keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(values.keyHash).not.toBe(result.key);
  });
});

describe("deleteKey", () => {
  it("returns 1 when the key was deleted", async () => {
    query.result = [{ id: "key-id" }];
    expect(await deleteKey("user-1", "key-id")).toBe(1);
  });

  it("returns 0 when the key is not the user's", async () => {
    expect(await deleteKey("user-1", "nonexistent")).toBe(0);
  });
});
