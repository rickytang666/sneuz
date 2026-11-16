"use server";

import { and, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { dbErrorMessage } from "@/lib/db/errors";
import { account, sleepSessions } from "@/lib/db/schema";
import { forUser } from "@/lib/db/sessions";
import {
  findConflicts,
  GOOGLE_HEALTH_SLEEP_SCOPE,
  GoogleHealthError,
  type ImportCandidate,
  listSleepNights,
} from "@/lib/google-health";
import { getUser } from "@/lib/session";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findGoogleAccount(userId: string) {
  const [row] = await getDb()
    .select({
      id: account.id,
      scope: account.scope,
      refreshTokenExpiresAt: account.refreshTokenExpiresAt,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .limit(1);
  return row;
}

// better auth stores granted scopes as one delimited string
function hasSleepScope(scope: string | null) {
  return (scope ?? "").split(/[\s,]+/).includes(GOOGLE_HEALTH_SLEEP_SCOPE);
}

export interface GoogleHealthStatus {
  connected: boolean;
  // set only when google issued a time-limited refresh token
  tokenExpiresAt: string | null;
}

export async function getGoogleHealthStatus(): Promise<GoogleHealthStatus> {
  const user = await getUser();
  if (!user) return { connected: false, tokenExpiresAt: null };

  const google = await findGoogleAccount(user.id);
  return {
    connected: !!google && hasSleepScope(google.scope),
    tokenExpiresAt: google?.refreshTokenExpiresAt?.toISOString() ?? null,
  };
}

export async function connectGoogleHealth() {
  let url: string | undefined;
  try {
    ({ url } = await getAuth().api.linkSocialAccount({
      body: {
        provider: "google",
        scopes: [GOOGLE_HEALTH_SLEEP_SCOPE],
        // google returns a refresh token only for offline access on a fresh consent
        additionalParams: { access_type: "offline", prompt: "consent" },
        callbackURL: "/dashboard/data",
        errorCallbackURL: "/dashboard/data?error=google_health_connect_failed",
      },
      headers: await headers(),
    }));
  } catch (error) {
    console.error("error connecting google health:", error);
    return { error: error instanceof Error ? error.message : "Connect failed" };
  }

  redirect(url);
}

export async function previewGoogleHealthImport(
  fromDate: string,
  toDate: string,
): Promise<{ candidates?: ImportCandidate[]; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };
  if (!DATE.test(fromDate) || !DATE.test(toDate) || fromDate > toDate) {
    return { error: "Pick a valid date range." };
  }

  const google = await findGoogleAccount(user.id);
  if (!google || !hasSleepScope(google.scope)) {
    return { error: "Connect Google Health first." };
  }

  let nights: Awaited<ReturnType<typeof listSleepNights>>;
  try {
    const { accessToken } = await getAuth().api.getAccessToken({
      body: { accountId: google.id },
      headers: await headers(),
    });
    if (!accessToken) throw new GoogleHealthError("no access token", 401);
    nights = await listSleepNights(accessToken, fromDate, toDate);
  } catch (error) {
    console.error("error reading google health:", error);
    if (error instanceof GoogleHealthError && error.status === 403) {
      return { error: "Google Health denied access to sleep data." };
    }
    return {
      error: "Couldn't read Google Health. Try connecting again.",
    };
  }
  if (nights.length === 0) return { candidates: [] };

  const windowStart = new Date(nights[0].start);
  const windowEnd = new Date(Math.max(...nights.map((n) => Date.parse(n.end))));
  const existing = await getDb()
    .select({
      id: sleepSessions.id,
      startTime: sleepSessions.startTime,
      endTime: sleepSessions.endTime,
    })
    .from(sleepSessions)
    .where(
      and(
        forUser(user.id),
        lt(sleepSessions.startTime, windowEnd),
        or(
          isNull(sleepSessions.endTime),
          gt(sleepSessions.endTime, windowStart),
        ),
      ),
    );

  return {
    candidates: findConflicts(
      nights,
      existing.map((row) => ({
        id: row.id,
        start: row.startTime.toISOString(),
        end: row.endTime?.toISOString() ?? null,
      })),
    ),
  };
}

export interface ImportSelection {
  start: string;
  end: string;
  // ids of the user's existing sessions this night replaces
  replace: string[];
}

export async function saveGoogleHealthImport(
  selections: ImportSelection[],
): Promise<{ imported?: number; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const nights = selections.map((s) => ({
    start: new Date(s.start),
    end: new Date(s.end),
  }));
  const replaceIds = [...new Set(selections.flatMap((s) => s.replace))];
  const valid =
    nights.every(
      ({ start, end }) =>
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end >= start,
    ) && replaceIds.every((id) => UUID.test(id));
  if (!valid) return { error: "Invalid import data." };
  if (nights.length === 0) return { imported: 0 };

  try {
    await getDb().transaction(async (tx) => {
      if (replaceIds.length > 0) {
        await tx
          .delete(sleepSessions)
          .where(and(forUser(user.id), inArray(sleepSessions.id, replaceIds)));
      }
      await tx.insert(sleepSessions).values(
        nights.map(({ start, end }) => ({
          userId: user.id,
          startTime: start,
          endTime: end,
          source: "google_health" as const,
        })),
      );
    });
  } catch (error) {
    return { error: dbErrorMessage(error) };
  }

  revalidatePath("/dashboard/data");
  return { imported: nights.length };
}
