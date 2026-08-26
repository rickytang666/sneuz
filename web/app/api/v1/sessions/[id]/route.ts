import { type NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";
import { mapDbSessionToSleepSession } from "@/lib/utils/sleep-utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, supabase, response } = await requireAuthFromHeader(request);
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

  const payload: Record<string, string> = {};
  if (body.bedtime) payload.start_time = new Date(body.bedtime).toISOString();
  if (body.wake_time) payload.end_time = new Date(body.wake_time).toISOString();

  const { data, error } = await supabase
    .from("sleep_sessions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, start_time, end_time")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: mapDbSessionToSleepSession(data) });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { supabase, user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  const { id } = await params;

  const { error, count } = await supabase
    .from("sleep_sessions")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
