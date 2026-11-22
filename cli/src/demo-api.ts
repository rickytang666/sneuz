import { randomUUID } from "node:crypto";
import { type Session, type Settings, type SneuzApi, toSession } from "./api";
import { addDays, todayLocalDate, toLocalMidnight } from "./core/dates";

const LATENCY_MS = 200;
const DAYS = 90;

// a fixed seed so every demo run shows the same calendar
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedNights(): Session[] {
  const random = seeded(42);
  const today = todayLocalDate();
  const sessions: Session[] = [];

  for (let i = DAYS - 1; i >= 0; i--) {
    const wakeDay = addDays(today, -i);
    // about one night in eight is missing, for backfilling
    if (random() < 0.12) continue;

    const wake = toLocalMidnight(wakeDay);
    wake.setMinutes(6 * 60 + 30 + Math.round(random() * 150));
    const minutes = 5 * 60 + 15 + Math.round(random() * 3.5 * 60);
    const bedtime = new Date(wake.getTime() - minutes * 60_000);
    sessions.push(toSession(randomUUID(), bedtime, wake));
  }
  return sessions;
}

const pause = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

// in-memory stand-in for /api/v1; SNEUZ_DEMO_FAIL=1 makes every write fail, to see the rollback
export function createDemoApi(): SneuzApi {
  let sessions = seedNights();
  const failWrites = process.env.SNEUZ_DEMO_FAIL === "1";

  async function write<T>(apply: () => T): Promise<T> {
    await pause();
    if (failWrites) throw new Error("demo write failure");
    return apply();
  }

  return {
    async listSessions() {
      await pause();
      return [...sessions];
    },
    createSession: (bedtime, wake) =>
      write(() => {
        const session = toSession(randomUUID(), bedtime, wake);
        sessions = [...sessions, session];
        return session;
      }),
    updateSession: (id, bedtime, wake) =>
      write(() => {
        if (!sessions.some((s) => s.id === id)) throw new Error("not found");
        const session = toSession(id, bedtime, wake);
        sessions = sessions.map((s) => (s.id === id ? session : s));
        return session;
      }),
    deleteSession: (id) =>
      write(() => {
        sessions = sessions.filter((s) => s.id !== id);
      }),
    async getSettings(): Promise<Settings> {
      await pause();
      return {
        target_bedtime: "23:00:00",
        target_wake_time: "07:00:00",
        timezone: "UTC",
      };
    },
  };
}
