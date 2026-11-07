import { and, desc, eq } from "drizzle-orm";
import { generateApiKey, hashApiKey } from "@/lib/api/keys";
import { getDb } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";

export async function listKeys(userId: string) {
  const rows = await getDb()
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    created_at: row.createdAt.toISOString(),
    last_used_at: row.lastUsedAt?.toISOString() ?? null,
  }));
}

export async function createKey(userId: string, name: string) {
  const rawKey = generateApiKey();

  const [row] = await getDb()
    .insert(apiKeys)
    .values({ userId, name: name.trim(), keyHash: hashApiKey(rawKey) })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
    });

  return {
    id: row.id,
    name: row.name,
    created_at: row.createdAt.toISOString(),
    key: rawKey,
  };
}

// returns how many keys were deleted, 0 when the id is not this user's
export async function deleteKey(userId: string, id: string) {
  const rows = await getDb()
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .returning({ id: apiKeys.id });
  return rows.length;
}
