import { getSleepSessions, getUserSettings } from "@/lib/actions/sleep"
import { SleepCalendar } from "@/components/dashboard/sleep-calendar"

export default async function CalendarPage() {
  const sessions = await getSleepSessions()
  const settings = await getUserSettings()

  return (
    <div className="space-y-6">
       <SleepCalendar 
            sessions={sessions} 
            targetBedtime={settings?.target_bedtime} 
            targetWakeTime={settings?.target_wake_time} 
       />
    </div>
  )
}
