import { IconDownload, IconPlus } from "@tabler/icons-react";
import { GoogleHealthImportDialog } from "@/components/dashboard/google-health-import-dialog";
import { SleepFormDialog } from "@/components/dashboard/sleep-form-dialog";
import { SleepSessionList } from "@/components/dashboard/sleep-session-list";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Button } from "@/components/ui/button";
import { getGoogleHealthStatus } from "@/lib/actions/google-health";
import {
  getSleepSessions,
  getSleepStats,
  getUserSettings,
} from "@/lib/actions/sleep";
import { connectErrorMessage } from "@/lib/google-health";

// next turns a repeated query key into an array
const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{
    import?: string | string[];
    error?: string | string[];
  }>;
}) {
  const [sessions, settings, googleHealth, query] = await Promise.all([
    getSleepSessions(),
    getUserSettings(),
    getGoogleHealthStatus(),
    searchParams,
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
        <div className="flex gap-2">
          <GoogleHealthImportDialog
            connected={googleHealth.connected}
            tokenExpiresAt={googleHealth.tokenExpiresAt}
            initialConnectError={
              first(query.import) === "connect_failed"
                ? connectErrorMessage(first(query.error))
                : null
            }
          >
            <Button variant="outline">
              <IconDownload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </GoogleHealthImportDialog>
          <SleepFormDialog>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Session
            </Button>
          </SleepFormDialog>
        </div>
      </div>

      {/* Data List */}
      <SleepSessionList sessions={sessions || []} />
    </div>
  );
}
