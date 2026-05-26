'use server'

import { createClient } from '@/lib/supabase/server'
import { listKeys, createKey, deleteKey } from '@/lib/services/api-keys'
import { revalidatePath } from 'next/cache'

export async function getApiKeys() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await listKeys(supabase, user.id)
  return data
}

export async function createApiKey(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await createKey(supabase, user.id, name)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { data }
}

export async function deleteApiKey(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await deleteKey(supabase, user.id, id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return {}
}
