import { type NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";
import { dbErrorMessage } from "@/lib/db/errors";
import { deleteKey } from "@/lib/services/api-keys";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  const { id } = await params;

  try {
    if ((await deleteKey(user.id, id)) === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
