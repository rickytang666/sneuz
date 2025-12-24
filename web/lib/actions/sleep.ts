'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getSleepSessions() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sleep_sessions')
    .select('*')
    .order('bedtime', { ascending: false })

  if (error) {
    console.error('Error fetching sleep sessions:', error)
    return []
  }

  return data
}

export async function getSleepStats() {
    const supabase = await createClient()
    
    // In a real app we might do more complex aggregation in SQL
    // For now we'll fetch and aggregate or just fetch totals
    const { data, error } = await supabase
      .from('sleep_sessions')
      .select('duration_minutes')

    if (error) {
        console.error('Error fetching stats:', error)
        return { total_hours: 0, avg_hours: 0 }
    }

    const totalMinutes = data.reduce((acc, session) => acc + (session.duration_minutes || 0), 0)
    const avgMinutes = data.length > 0 ? totalMinutes / data.length : 0

    return {
        total_hours: Math.round(totalMinutes / 60),
        avg_hours: Math.round((avgMinutes / 60) * 10) / 10
    }
}

export async function createSleepSession(formData: FormData) {
  const supabase = await createClient()

  // TODO: Add proper Zod validation
  const bedtime = formData.get('bedtime') as string
  const wake_time = formData.get('wake_time') as string
  // Calculate duration? Or let DB trigger handle it? 
  // For now assuming app calculates or we just send start/end.
  
  const { error } = await supabase
    .from('sleep_sessions')
    .insert({
      bedtime,
      wake_time,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
}

export async function updateSleepSession(id: string, formData: FormData) {
    const supabase = await createClient()

    const bedtime = formData.get('bedtime') as string
    const wake_time = formData.get('wake_time') as string

    const { error } = await supabase
        .from('sleep_sessions')
        .update({ bedtime, wake_time })
        .eq('id', id)
    
    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
}

export async function deleteSleepSession(id: string) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('sleep_sessions')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
}
