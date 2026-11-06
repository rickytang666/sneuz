import { and, desc, eq, gte, lte } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";
import { getDb } from "@/lib/db";
import { dbErrorMessage } from "@/lib/db/errors";
import { sleepSessions } from "@/lib/db/schema";
import { toDbSession } from "@/lib/db/sessions";
import { mapDbSessionToSleepSession } from "@/lib/utils/sleep-utils";

const sessionColumns = {
  id: sleepSessions.id,
  startTime: sleepSessions.startTime,
  endTime: sleepSessions.endTime,
};

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const rows = await getDb()
      .select(sessionColumns)
      .from(sleepSessions)
      .where(
        and(
          eq(sleepSessions.userId, user.id),
          from ? gte(sleepSessions.startTime, new Date(from)) : undefined,
          to ? lte(sleepSessions.startTime, new Date(to)) : undefined,
        ),
      )
      .orderBy(desc(sleepSessions.startTime))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: rows.map((row) => mapDbSessionToSleepSession(toDbSession(row))),
    });
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  let body: { bedtime?: string; wake_time?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.bedtime) {
    return NextResponse.json({ error: "bedtime is required" }, { status: 400 });
  }

  try {
    const [row] = await getDb()
      .insert(sleepSessions)
      .values({
        userId: user.id,
        startTime: new Date(body.bedtime),
        endTime: body.wake_time ? new Date(body.wake_time) : null,
      })
      .returning(sessionColumns);

    return NextResponse.json(
      { data: mapDbSessionToSleepSession(toDbSession(row)) },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}
