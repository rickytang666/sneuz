import { type NextRequest, NextResponse } from "next/server";
import { requireAuthFromHeader } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthFromHeader(request);
  if (response) return response;

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
      full_name: user.name,
      avatar_url: user.image ?? "",
    },
  });
}
