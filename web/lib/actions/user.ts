'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Use user_metadata for profile info to avoid schema dependency issues
  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || '',
    avatar_url: user.user_metadata?.avatar_url || '',
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const full_name = formData.get('full_name') as string

  // Update user metadata instead of profiles table
  const { error } = await supabase.auth.updateUser({
    data: { full_name }
  })

  // We can also update the profiles table if it exists/has columns, but for now metadata is safer
  // straightforwardly given the schema mismatch.
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard', 'layout') 
}

export async function updateSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Unauthorized' }
  
    const target_bedtime = formData.get('target_bedtime') as string
    const target_wake_time = formData.get('target_wake_time') as string
  
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
          user_id: user.id,
          target_bedtime,
          target_wake_time,
          updated_at: new Date().toISOString()
       })
      .select()
  
    if (error) {
      return { error: error.message }
    }
  
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/calendar') 
  }
