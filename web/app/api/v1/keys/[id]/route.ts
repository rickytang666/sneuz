import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";
import { deleteKey } from "@/lib/services/api-keys";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, supabase, response } = await requireAuthFromHeader(request);
  if (response) return response;

  const { id } = await params;
  const { error, count } = await deleteKey(supabase, user.id, id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
