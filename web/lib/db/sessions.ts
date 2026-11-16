import { eq } from "drizzle-orm";
import { sleepSessions } from "./schema";

type SessionRow = Pick<
  typeof sleepSessions.$inferSelect,
  "id" | "startTime" | "endTime"
>;

// snake_case iso strings, the row shape the session mappers and api responses expect
export function toDbSession(row: SessionRow) {
  return {
    id: row.id,
    start_time: row.startTime.toISOString(),
    end_time: row.endTime?.toISOString() ?? null,
  };
}

// no row level security, so every sleep session query must include this
export function forUser(userId: string) {
  return eq(sleepSessions.userId, userId);
}
