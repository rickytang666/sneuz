import { NextRequest, NextResponse } from 'next/server'
import { requireAuthFromHeader } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const { user, supabase, response } = await requireAuthFromHeader(request)
  if (response) return response

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? '',
      avatar_url: user.user_metadata?.avatar_url ?? '',
    },
  })
}
