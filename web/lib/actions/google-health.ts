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
  dropNewlyConflicting,
  findConflicts,
  GOOGLE_HEALTH_SLEEP_SCOPE,
  GoogleHealthError,
  type ImportCandidate,
  type ImportSelection,
  listSleepNights,
  validateRange,
} from "@/lib/google-health";
import { getUser } from "@/lib/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// a 90 day range holds far fewer nights than this
const MAX_SELECTIONS = 500;

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
        errorCallbackURL: "/dashboard/data?import=connect_failed",
      },
      headers: await headers(),
    }));
  } catch (error) {
    console.error("error connecting google health:", error);
    return { error: error instanceof Error ? error.message : "Connect failed" };
  }

  redirect(url);
}

// sessions of the user's that overlap the span of the given nights
async function overlappingSessions(
  db: Pick<ReturnType<typeof getDb>, "select">,
  userId: string,
  nights: { start: string; end: string }[],
) {
  const windowStart = new Date(
    Math.min(...nights.map((n) => Date.parse(n.start))),
  );
  const windowEnd = new Date(Math.max(...nights.map((n) => Date.parse(n.end))));
  const rows = await db
    .select({
      id: sleepSessions.id,
      startTime: sleepSessions.startTime,
      endTime: sleepSessions.endTime,
    })
    .from(sleepSessions)
    .where(
      and(
        forUser(userId),
        lt(sleepSessions.startTime, windowEnd),
        or(
          isNull(sleepSessions.endTime),
          gt(sleepSessions.endTime, windowStart),
        ),
      ),
    );
  return rows.map((row) => ({
    id: row.id,
    start: row.startTime.toISOString(),
    end: row.endTime?.toISOString() ?? null,
  }));
}

export async function previewGoogleHealthImport(
  fromDate: string,
  toDate: string,
): Promise<{
  candidates?: ImportCandidate[];
  error?: string;
  // the stored google access no longer works, so the user must connect again
  reconnect?: boolean;
}> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };
  const rangeError = validateRange(fromDate, toDate);
  if (rangeError) return { error: rangeError };

  const google = await findGoogleAccount(user.id);
  if (!google || !hasSleepScope(google.scope)) {
    return { error: "Connect Google Health first.", reconnect: true };
  }

  let nights: Awaited<ReturnType<typeof listSleepNights>>;
  try {
    // throws when the refresh token was revoked or expired
    const { accessToken } = await getAuth().api.getAccessToken({
      body: { accountId: google.id },
      headers: await headers(),
    });
    if (!accessToken) throw new GoogleHealthError("no access token", 401);
    nights = await listSleepNights(accessToken, fromDate, toDate);
  } catch (error) {
    console.error("error reading google health:", error);
    const apiFailure =
      error instanceof GoogleHealthError &&
      error.status !== 401 &&
      error.status !== 403;
    return apiFailure
      ? { error: "Google Health couldn't be read. Try again later." }
      : {
          error: "Google Health access stopped working. Connect again.",
          reconnect: true,
        };
  }
  if (nights.length === 0) return { candidates: [] };

  const existing = await overlappingSessions(getDb(), user.id, nights);
  return { candidates: findConflicts(nights, existing) };
}

export async function saveGoogleHealthImport(
  selections: ImportSelection[],
): Promise<{ imported?: number; skipped?: number; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const valid =
    selections.length <= MAX_SELECTIONS &&
    selections.every(({ start, end, replace }) => {
      const startMs = Date.parse(start);
      const endMs = Date.parse(end);
      return (
        !Number.isNaN(startMs) &&
        !Number.isNaN(endMs) &&
        endMs >= startMs &&
        replace.every((id) => UUID.test(id))
      );
    });
  if (!valid) return { error: "Invalid import data." };
  if (selections.length === 0) return { imported: 0, skipped: 0 };

  let saved: ImportSelection[] = [];
  try {
    await getDb().transaction(async (tx) => {
      // the preview can be stale: another tab or a widget may have added a session since
      const existing = await overlappingSessions(tx, user.id, selections);
      saved = dropNewlyConflicting(selections, existing);
      if (saved.length === 0) return;

      const replaceIds = [...new Set(saved.flatMap((s) => s.replace))];
      if (replaceIds.length > 0) {
        await tx
          .delete(sleepSessions)
          .where(and(forUser(user.id), inArray(sleepSessions.id, replaceIds)));
      }
      await tx.insert(sleepSessions).values(
        saved.map(({ start, end }) => ({
          userId: user.id,
          startTime: new Date(start),
          endTime: new Date(end),
          source: "google_health" as const,
        })),
      );
    });
  } catch (error) {
    return { error: dbErrorMessage(error) };
  }

  revalidatePath("/dashboard/data");
  return { imported: saved.length, skipped: selections.length - saved.length };
}
