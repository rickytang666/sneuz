import { getSleepSessions, getUserSettings } from "@/lib/actions/sleep"
import { SleepCalendar } from "@/components/dashboard/sleep-calendar"

export default async function CalendarPage() {
  const sessions = await getSleepSessions()
  const settings = await getUserSettings()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <SleepCalendar sessions={sessions || []} goal={Number(settings.target_hours)} />
    </div>
  )
}
