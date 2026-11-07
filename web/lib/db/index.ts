import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { DATABASE_URL } from "@/lib/env";
import * as schema from "./schema";

function createDb() {
  // pool driver over websockets, better auth needs transactions that neon-http lacks
  return drizzle({
    client: new Pool({ connectionString: DATABASE_URL() }),
    schema,
  });
}

let db: ReturnType<typeof createDb> | undefined;

// lazy so `next build` can import this module without database env vars
export function getDb() {
  db ??= createDb();
  return db;
}
