import type { sleepSessions } from "./schema";

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
