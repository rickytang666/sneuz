import { SleepFormDialog } from "@/components/dashboard/sleep-form-dialog"
import { getSleepSessions, getSleepStats } from "@/lib/actions/sleep"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { SleepSessionList } from "@/components/dashboard/sleep-session-list"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"

export default async function DataPage() {
  const sessions = await getSleepSessions()
  const stats = await getSleepStats()

  return (
    <div className="flex flex-col gap-6">
        {/* Stats Overview */}
        <StatsCards stats={stats} />

        {/* Action Header */}
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sleep Sessions</h2>
            <SleepFormDialog>
                <Button>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Session
                </Button>
            </SleepFormDialog>
        </div>

        {/* Data List */}
        <SleepSessionList sessions={sessions || []} />
    </div>
  )
}
