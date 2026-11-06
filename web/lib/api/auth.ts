import { eq } from "drizzle-orm";
import { after } from "next/server";
import { getDb } from "@/lib/db";
import { apiKeys, user as users } from "@/lib/db/schema";
import { hashApiKey } from "./keys";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

type AuthResult =
  | { user: ApiUser; response: null }
  | { user: null; response: Response };

const unauthorized = (): AuthResult => ({
  user: null,
  response: new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  }),
});

async function authFromApiKey(key: string): Promise<AuthResult> {
  const [row] = await getDb()
    .select({
      keyId: apiKeys.id,
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
    })
    .from(apiKeys)
    .innerJoin(users, eq(users.id, apiKeys.userId))
    .where(eq(apiKeys.keyHash, hashApiKey(key)))
    .limit(1);

  if (!row) return unauthorized();

  const { keyId, ...user } = row;

  // runs after the response is sent, so the bookkeeping write adds no latency
  after(() =>
    getDb()
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyId)),
  );

  return { user, response: null };
}

export async function requireAuthFromHeader(
  request: Request,
): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("ApiKey ")) {
    return authFromApiKey(authHeader.slice(7));
  }

  return unauthorized();
}
