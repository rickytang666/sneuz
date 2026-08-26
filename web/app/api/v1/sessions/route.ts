import { type NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";
import { mapDbSessionToSleepSession } from "@/lib/utils/sleep-utils";

export async function GET(request: NextRequest) {
  const { user, supabase, response } = await requireAuthFromHeader(request);
  if (response) return response;

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("sleep_sessions")
    .select("id, start_time, end_time")
    .eq("user_id", user.id)
    .order("start_time", { ascending: false })
    .range(offset, offset + limit - 1);

  if (from) query = query.gte("start_time", from);
  if (to) query = query.lte("start_time", to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data.map(mapDbSessionToSleepSession) });
}

export async function POST(request: NextRequest) {
  const { user, supabase, response } = await requireAuthFromHeader(request);
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

  const payload: Record<string, string> = {
    user_id: user.id,
    start_time: new Date(body.bedtime).toISOString(),
  };
  if (body.wake_time) {
    payload.end_time = new Date(body.wake_time).toISOString();
  }

  const { data, error } = await supabase
    .from("sleep_sessions")
    .insert(payload)
    .select("id, start_time, end_time")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: mapDbSessionToSleepSession(data) },
    { status: 201 },
  );
}
