import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";
import { getDb } from "@/lib/db";
import { dbErrorMessage } from "@/lib/db/errors";
import { sleepSessions } from "@/lib/db/schema";
import { toDbSession } from "@/lib/db/sessions";
import { mapDbSessionToSleepSession } from "@/lib/utils/sleep-utils";

type Params = { params: Promise<{ id: string }> };

const ownedBy = (id: string, userId: string) =>
  and(eq(sleepSessions.id, id), eq(sleepSessions.userId, userId));

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  const { id } = await params;

  let body: { bedtime?: string; wake_time?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.bedtime && !body.wake_time) {
    return NextResponse.json(
      { error: "At least one of bedtime or wake_time is required" },
      { status: 400 },
    );
  }

  try {
    const [row] = await getDb()
      .update(sleepSessions)
      .set({
        ...(body.bedtime ? { startTime: new Date(body.bedtime) } : {}),
        ...(body.wake_time ? { endTime: new Date(body.wake_time) } : {}),
      })
      .where(ownedBy(id, user.id))
      .returning({
        id: sleepSessions.id,
        startTime: sleepSessions.startTime,
        endTime: sleepSessions.endTime,
      });

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: mapDbSessionToSleepSession(toDbSession(row)),
    });
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  const { id } = await params;

  try {
    const rows = await getDb()
      .delete(sleepSessions)
      .where(ownedBy(id, user.id))
      .returning({ id: sleepSessions.id });

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
