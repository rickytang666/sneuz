import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { userSettings } from "@/lib/db/schema";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "@/lib/env";

function createAuth() {
  return betterAuth({
    // previews have no fixed url, vercel exposes the stable branch alias instead
    baseURL:
      process.env.BETTER_AUTH_URL ??
      (process.env.VERCEL_BRANCH_URL
        ? `https://${process.env.VERCEL_BRANCH_URL}`
        : undefined),
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    account: {
      // google sign-in attaches to an existing email account with the same verified address
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await getDb()
              .insert(userSettings)
              .values({ userId: user.id })
              .onConflictDoNothing();
          },
        },
      },
    },
    socialProviders: {
      google: {
        clientId: GOOGLE_CLIENT_ID(),
        clientSecret: GOOGLE_CLIENT_SECRET(),
      },
    },
    // uuids so imported sleep data keeps its original user id
    advanced: { database: { generateId: "uuid" } },
    // must stay last so server actions can set session cookies
    plugins: [nextCookies()],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

// lazy so `next build` can import this module without auth env vars
export function getAuth() {
  auth ??= createAuth();
  return auth;
}
