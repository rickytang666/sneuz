// the session shape /api/v1/sessions returns
export interface Session {
  id: string;
  bedtime: string;
  wake_time: string | null;
  duration_minutes: number | null;
}

export interface Settings {
  target_bedtime: string;
  target_wake_time: string;
  timezone: string;
}

export interface SneuzApi {
  listSessions(): Promise<Session[]>;
  createSession(bedtime: Date, wake: Date): Promise<Session>;
  updateSession(id: string, bedtime: Date, wake: Date): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  getSettings(): Promise<Settings>;
}

export function toSession(id: string, bedtime: Date, wake: Date): Session {
  return {
    id,
    bedtime: bedtime.toISOString(),
    wake_time: wake.toISOString(),
    duration_minutes: Math.ceil((wake.getTime() - bedtime.getTime()) / 60_000),
  };
}
