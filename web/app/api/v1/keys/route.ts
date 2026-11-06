import { type NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";
import { dbErrorMessage } from "@/lib/db/errors";
import { createKey, listKeys } from "@/lib/services/api-keys";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  try {
    return NextResponse.json({ data: await listKeys(user.id) });
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const data = await createKey(user.id, body.name);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}
