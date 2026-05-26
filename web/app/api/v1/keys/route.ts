import { NextRequest, NextResponse } from 'next/server'
import { requireAuthFromHeader } from '@/lib/api/auth'
import { listKeys, createKey } from '@/lib/services/api-keys'

export async function GET(request: NextRequest) {
  const { user, supabase, response } = await requireAuthFromHeader(request)
  if (response) return response

  const { data, error } = await listKeys(supabase, user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const { user, supabase, response } = await requireAuthFromHeader(request)
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

  const { data, error } = await createKey(supabase, user.id, body.name)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
