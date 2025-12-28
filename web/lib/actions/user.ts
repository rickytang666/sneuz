import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { UserProfile } from "@/lib/types"

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Fetch from 'profiles' table
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name') // Removed avatar_url (column missing)
    .eq('id', user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email,
    full_name: profile?.full_name ?? user.user_metadata?.full_name ?? '',
    avatar_url: user.user_metadata?.avatar_url ?? '',
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Unauthorized" }
  
  const full_name = formData.get('full_name') as string

  // 1. Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
        id: user.id,
        full_name,
        updated_at: new Date().toISOString()
    })

  if (profileError) {
      console.error("Profile update error:", profileError)
      return { error: profileError.message }
  }

  // 2. Sync with Auth Metadata (Optional but good for consistency)
  await supabase.auth.updateUser({
    data: { full_name }
  })

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
