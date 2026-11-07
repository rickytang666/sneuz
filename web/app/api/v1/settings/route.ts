import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";
import { getDb } from "@/lib/db";
import { dbErrorMessage } from "@/lib/db/errors";
import { userSettings } from "@/lib/db/schema";

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const settingsColumns = {
  target_bedtime: userSettings.targetBedtime,
  target_wake_time: userSettings.targetWakeTime,
  timezone: userSettings.timezone,
};

const DEFAULT_SETTINGS = {
  target_bedtime: "23:00",
  target_wake_time: "07:00",
  timezone: "UTC",
};

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  try {
    const [data] = await getDb()
      .select(settingsColumns)
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1);

    return NextResponse.json({ data: data ?? DEFAULT_SETTINGS });
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  let body: {
    target_bedtime?: string;
    target_wake_time?: string;
    timezone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.target_bedtime && !body.target_wake_time && !body.timezone) {
    return NextResponse.json(
      {
        error:
          "At least one of target_bedtime, target_wake_time or timezone is required",
      },
      { status: 400 },
    );
  }

  if (body.timezone && !isValidTimeZone(body.timezone)) {
    return NextResponse.json(
      { error: "timezone must be a valid IANA zone, e.g. America/Toronto" },
      { status: 400 },
    );
  }

  const changes = {
    ...(body.target_bedtime ? { targetBedtime: body.target_bedtime } : {}),
    ...(body.target_wake_time ? { targetWakeTime: body.target_wake_time } : {}),
    ...(body.timezone ? { timezone: body.timezone } : {}),
  };

  try {
    const [data] = await getDb()
      .insert(userSettings)
      .values({ userId: user.id, ...changes })
      .onConflictDoUpdate({ target: userSettings.userId, set: changes })
      .returning(settingsColumns);

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}
