'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { differenceInMinutes } from "date-fns"

export async function getSleepSessions() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sleep_sessions')
    .select('*')
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching sleep sessions:', error)
    return []
  }

  // Map DB columns to UI model
  return data.map(session => {
    const start = new Date(session.start_time)
    const end = session.end_time ? new Date(session.end_time) : null
    
    let duration = null
    if (end) {
        const diffMs = end.getTime() - start.getTime()
        duration = Math.ceil(diffMs / (1000 * 60))
    }

    return {
        id: session.id,
        bedtime: session.start_time,
        wake_time: session.end_time,
        duration_minutes: duration,
        created_at: session.created_at
    }
  })
}

export async function getSleepStats() {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sleep_sessions')
      .select('start_time, end_time')

    if (error) {
        console.error('Error fetching stats:', error)
        return { total_hours: 0, avg_hours: 0 }
    }

    let totalMinutes = 0
    let validSessions = 0

    data.forEach(session => {
        if (session.end_time) {
            const start = new Date(session.start_time)
            const end = new Date(session.end_time)
            const duration = differenceInMinutes(end, start)
            if (duration > 0) {
                totalMinutes += duration
                validSessions++
            }
        }
    })

    const avgMinutes = validSessions > 0 ? totalMinutes / validSessions : 0

    return {
        total_hours: Math.round(totalMinutes / 60),
        avg_hours: Math.round((avgMinutes / 60) * 10) / 10
    }
}

export async function createSleepSession(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
      return { error: 'Unauthorized' }
  }

  const start_time = formData.get('bedtime') as string
  const end_time = formData.get('wake_time') as string // Can be empty string
  
  const payload: any = {
      user_id: user.id,
      start_time: new Date(start_time).toISOString(),
  }
  if (end_time) {
      payload.end_time = new Date(end_time).toISOString()
  }

  const { error } = await supabase
    .from('sleep_sessions')
    .insert(payload)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/data')
}

export async function updateSleepSession(id: string, formData: FormData) {
    const supabase = await createClient()

    const start_time = formData.get('bedtime') as string
    const end_time = formData.get('wake_time') as string

    const payload: any = {
        start_time: new Date(start_time).toISOString(),
    }
    if (end_time) {
        payload.end_time = new Date(end_time).toISOString()
    }

    const { error } = await supabase
        .from('sleep_sessions')
        .update(payload)
        .eq('id', id)
    
    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/data')
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

    revalidatePath('/dashboard/data')
}

export async function getUserSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { target_hours: 8 }

    const { data, error } = await supabase
        .from('user_settings')
        .select('target_hours')
        .eq('user_id', user.id)
        .single()
    
    if (error || !data) {
        // Return default if no settings found
        return { target_hours: 8 }
    }

    return data
}
