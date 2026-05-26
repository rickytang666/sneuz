import { describe, it, expect, vi } from "vitest";
import { listKeys, createKey, deleteKey } from "./api-keys";

function makeClient(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    ...overrides,
  };
  return { from: vi.fn(() => chain), _chain: chain } as unknown as Parameters<
    typeof listKeys
  >[0] & { _chain: typeof chain };
}

describe("listKeys", () => {
  it("returns keys for the user", async () => {
    const rows = [
      { id: "1", name: "home", created_at: "2026-01-01", last_used_at: null },
    ];
    const client = makeClient();
    client._chain.order = vi
      .fn()
      .mockResolvedValue({ data: rows, error: null });

    const result = await listKeys(client, "user-1");
    expect(result.data).toEqual(rows);
    expect(result.error).toBeNull();
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient();
    client._chain.order = vi
      .fn()
      .mockResolvedValue({ data: null, error: null });

    const result = await listKeys(client, "user-1");
    expect(result.data).toEqual([]);
  });
});

describe("createKey", () => {
  it("returns key with raw key included", async () => {
    const client = makeClient();
    client._chain.single = vi.fn().mockResolvedValue({
      data: { id: "key-id", name: "test", created_at: "2026-01-01" },
      error: null,
    });

    const result = await createKey(client, "user-1", "test");
    expect(result.error).toBeNull();
    expect(result.data?.key).toMatch(/^snz_[0-9a-f]{64}$/);
    expect(result.data?.name).toBe("test");
    expect(result.data?.id).toBe("key-id");
  });

  it("trims whitespace from name", async () => {
    const client = makeClient();
    client._chain.single = vi.fn().mockResolvedValue({
      data: { id: "key-id", name: "test", created_at: "2026-01-01" },
      error: null,
    });

    const insertSpy = client._chain.insert;
    await createKey(client, "user-1", "  test  ");
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "test" }),
    );
  });

  it("returns error when insert fails", async () => {
    const client = makeClient();
    client._chain.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "db error" },
    });

    const result = await createKey(client, "user-1", "test");
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
});

describe("deleteKey", () => {
  it("returns no error on successful delete", async () => {
    const client = makeClient();
    client._chain.eq = vi
      .fn()
      .mockReturnValueOnce(client._chain)
      .mockResolvedValueOnce({ error: null, count: 1 });

    const result = await deleteKey(client, "user-1", "key-id");
    expect(result.error).toBeNull();
    expect(result.count).toBe(1);
  });

  it("returns count 0 when key not found", async () => {
    const client = makeClient();
    client._chain.eq = vi
      .fn()
      .mockReturnValueOnce(client._chain)
      .mockResolvedValueOnce({ error: null, count: 0 });

    const result = await deleteKey(client, "user-1", "nonexistent");
    expect(result.count).toBe(0);
  });
});
