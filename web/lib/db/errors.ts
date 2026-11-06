// drizzle's own message embeds the sql and params, so surface the postgres message from its cause
export function dbErrorMessage(error: unknown): string {
  console.error("database error:", error);
  const cause = error instanceof Error ? error.cause : undefined;
  if (cause instanceof Error) return cause.message;
  return "Database error";
}
