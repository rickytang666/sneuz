import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthFromHeader } from '@/lib/api/auth'
import { generateApiKey, hashApiKey } from '@/lib/api/keys'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthFromHeader(request)
  if (response) return response

  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from('api_keys')
    .select('id, name, created_at, last_used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuthFromHeader(request)
  if (response) return response

  let body: { name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const rawKey = generateApiKey()
  const keyHash = hashApiKey(rawKey)
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from('api_keys')
    .insert({ user_id: user.id, name: body.name.trim(), key_hash: keyHash })
    .select('id, name, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // raw key returned once — never retrievable again
  return NextResponse.json({ data: { ...data, key: rawKey } }, { status: 201 })
}
