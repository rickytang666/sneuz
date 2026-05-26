import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthFromHeader } from '@/lib/api/auth'

type Params = { params: Promise<{ id: string }> }

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, response } = await requireAuthFromHeader(request)
  if (response) return response

  const { id } = await params
  const serviceClient = createServiceClient()

  const { error, count } = await serviceClient
    .from('api_keys')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
