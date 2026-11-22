import { describe, expect, it, vi } from "vitest";
import { type Session, type SneuzApi, toSession } from "../api";
import {
  blockedReason,
  commitSave,
  createWriteQueue,
  pendingId,
  withConfirmed,
  withSaved,
} from "./writes";

const bed = new Date("2026-11-20T04:30:00Z");
const wake = new Date("2026-11-20T12:10:00Z");
const night = (id: string): Session => toSession(id, bed, wake);

function fakeApi(fail: "write" | null = null) {
  const calls: string[] = [];
  const api = {
    createSession: vi.fn(async () => {
      calls.push("create");
      if (fail === "write") throw new Error("down");
      return night("new");
    }),
    updateSession: vi.fn(async (id: string) => {
      calls.push(`update ${id}`);
      if (fail === "write") throw new Error("down");
      return night(id);
    }),
    deleteSession: vi.fn(async (id: string) => {
      calls.push(`delete ${id}`);
    }),
  } as unknown as SneuzApi;
  return { api, calls };
}

describe("commitSave", () => {
  it("writes before deleting what it replaces", async () => {
    const { api, calls } = fakeApi();
    await commitSave(api, null, bed, wake, [night("old")]);
    expect(calls).toEqual(["create", "delete old"]);
  });

  it("updates an existing night", async () => {
    const { api, calls } = fakeApi();
    await commitSave(api, "a", bed, wake, []);
    expect(calls).toEqual(["update a"]);
  });

  it("keeps the old night when the write fails", async () => {
    const { api, calls } = fakeApi("write");
    await expect(
      commitSave(api, null, bed, wake, [night("old")]),
    ).rejects.toThrow("down");
    expect(calls).toEqual(["create"]);
  });
});

describe("optimistic list", () => {
  it("swaps the replaced nights for the pending one, then the saved one", () => {
    const temp = pendingId(0);
    const shown = withSaved([night("old"), night("other")], temp, bed, wake, [
      night("old"),
    ]);
    expect(shown.map((s) => s.id)).toEqual(["other", temp]);
    expect(withConfirmed(shown, temp, night("real")).map((s) => s.id)).toEqual([
      "other",
      "real",
    ]);
  });
});

describe("blockedReason", () => {
  it("blocks until the nights load", () => {
    expect(blockedReason(null, false, [])).toMatch(/still loading/);
    expect(blockedReason(null, true, [])).toMatch(/didn't load/);
  });

  it("blocks a night that's still saving", () => {
    expect(blockedReason([], false, [night(pendingId(3))])).toMatch(
      /still saving/,
    );
  });

  it("allows a saved night or an empty day", () => {
    expect(blockedReason([night("a")], false, [night("a")])).toBeNull();
    expect(blockedReason([], false, [])).toBeNull();
  });
});

describe("createWriteQueue", () => {
  it("quits right away when nothing is in flight", () => {
    const onIdle = vi.fn();
    expect(createWriteQueue(onIdle).quit()).toBe(true);
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it("waits for every write in flight before quitting", async () => {
    const onIdle = vi.fn();
    const queue = createWriteQueue(onIdle);
    let finish: () => void = () => {};
    const slow = queue.run(() => new Promise<void>((r) => (finish = r)));
    const fast = queue.run(async () => {});
    await fast;
    expect(queue.quit()).toBe(false);
    expect(onIdle).not.toHaveBeenCalled();
    finish();
    await slow;
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it("still quits after a write throws", async () => {
    const onIdle = vi.fn();
    const queue = createWriteQueue(onIdle);
    const failing = queue.run(async () => {
      await Promise.resolve();
      throw new Error("down");
    });
    queue.quit();
    await expect(failing).rejects.toThrow("down");
    expect(onIdle).toHaveBeenCalledOnce();
  });
});
