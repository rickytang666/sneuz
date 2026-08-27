import { type NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const DEFAULT_SETTINGS = {
  target_bedtime: "23:00",
  target_wake_time: "07:00",
  timezone: "UTC",
};

export async function GET(request: NextRequest) {
  const { user, supabase, response } = await requireAuthFromHeader(request);
  if (response) return response;

  const { data, error } = await supabase
    .from("user_settings")
    .select("target_bedtime, target_wake_time, timezone")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ data: DEFAULT_SETTINGS });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const { user, supabase, response } = await requireAuthFromHeader(request);
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

  const payload: Record<string, string> = { user_id: user.id };
  if (body.target_bedtime) payload.target_bedtime = body.target_bedtime;
  if (body.target_wake_time) payload.target_wake_time = body.target_wake_time;
  if (body.timezone) payload.timezone = body.timezone;

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(payload)
    .select("target_bedtime, target_wake_time, timezone")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
