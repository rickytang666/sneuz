import { IconPlus } from "@tabler/icons-react";
import { SleepFormDialog } from "@/components/dashboard/sleep-form-dialog";
import { SleepSessionList } from "@/components/dashboard/sleep-session-list";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Button } from "@/components/ui/button";
import {
  getSleepSessions,
  getSleepStats,
  getUserSettings,
} from "@/lib/actions/sleep";

export default async function DataPage() {
  const [sessions, settings] = await Promise.all([
    getSleepSessions(),
    getUserSettings(),
  ]);
  const stats = await getSleepStats(
    settings?.target_bedtime,
    settings?.timezone,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Overview */}
      <StatsCards
        stats={stats}
        sessions={sessions}
        timezone={settings?.timezone ?? null}
      />

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
  );
}
