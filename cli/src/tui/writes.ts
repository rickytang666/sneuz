import { type Session, type SneuzApi, toSession } from "../api";

const PENDING_PREFIX = "temp-";

export const pendingId = (n: number): string => `${PENDING_PREFIX}${n}`;

export const isPending = (session: Session): boolean =>
  session.id.startsWith(PENDING_PREFIX);

// the grid right after a save is sent: the edited night in, anything it replaces out
export function withSaved(
  sessions: Session[],
  id: string,
  bedtime: Date,
  wake: Date,
  replace: Session[],
): Session[] {
  const dropped = new Set([id, ...replace.map((s) => s.id)]);
  return [
    ...sessions.filter((s) => !dropped.has(s.id)),
    toSession(id, bedtime, wake),
  ];
}

export function withConfirmed(
  sessions: Session[],
  id: string,
  saved: Session,
): Session[] {
  return sessions.map((s) => (s.id === id ? saved : s));
}

// why the cursor's night can't be edited or deleted yet, or null when it can
export function blockedReason(
  sessions: Session[] | null,
  loadFailed: boolean,
  touched: Session[],
): string | null {
  if (sessions === null) {
    return loadFailed
      ? "your nights didn't load; quit and try again"
      : "still loading your nights";
  }
  if (touched.some(isPending)) return "still saving that night";
  return null;
}

// writes before deleting, so a failed write leaves an extra night rather than none
export async function commitSave(
  api: SneuzApi,
  sessionId: string | null,
  bedtime: Date,
  wake: Date,
  replace: Session[],
): Promise<Session> {
  const saved = sessionId
    ? await api.updateSession(sessionId, bedtime, wake)
    : await api.createSession(bedtime, wake);
  for (const session of replace) await api.deleteSession(session.id);
  return saved;
}

export type WriteQueue = {
  run(write: () => Promise<void>): Promise<void>;
  // true when nothing is in flight and onIdle already ran
  quit(): boolean;
  readonly quitting: boolean;
};

// counts writes in flight so quitting waits for them instead of dropping a failure
export function createWriteQueue(onIdle: () => void): WriteQueue {
  let inFlight = 0;
  let quitting = false;
  return {
    async run(write) {
      inFlight++;
      try {
        await write();
      } finally {
        inFlight--;
        if (quitting && inFlight === 0) onIdle();
      }
    },
    quit() {
      quitting = true;
      if (inFlight > 0) return false;
      onIdle();
      return true;
    },
    get quitting() {
      return quitting;
    },
  };
}
