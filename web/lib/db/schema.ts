import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const sleepSessions = pgTable(
  "sleep_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    // null while the session is still in progress
    endTime: timestamp("end_time", { withTimezone: true }),
    source: text("source", { enum: ["manual", "widget", "shortcut"] })
      .notNull()
      .default("manual"),
    // the handle_sleep_session_updated_at trigger overwrites this on every write
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("valid_end_time", sql`${table.endTime} >= ${table.startTime}`),
    check(
      "valid_source",
      sql`${table.source} in ('manual', 'widget', 'shortcut')`,
    ),
    uniqueIndex("one_active_session_per_user")
      .on(table.userId)
      .where(sql`${table.endTime} is null`),
    index("sleep_sessions_user_start_idx").on(
      table.userId,
      table.startTime.desc(),
    ),
  ],
);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  // "UTC" means the user never picked a zone
  timezone: text("timezone").notNull().default("UTC"),
  targetBedtime: time("target_bedtime").notNull().default("23:00"),
  targetWakeTime: time("target_wake_time").notNull().default("07:00"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // sha256 hex of the raw key, the raw key is shown once and never stored
    keyHash: text("key_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (table) => [index("api_keys_user_id_idx").on(table.userId)],
);
