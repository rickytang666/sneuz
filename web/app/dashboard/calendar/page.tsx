import { Suspense } from "react";
import { SleepCalendar } from "@/components/dashboard/sleep-calendar";
import { getSleepSessions, getUserSettings } from "@/lib/actions/sleep";

export default async function CalendarPage() {
  const sessions = await getSleepSessions();
  const settings = await getUserSettings();

  return (
    <div className="space-y-6">
      <Suspense>
        <SleepCalendar
          sessions={sessions}
          targetBedtime={settings?.target_bedtime}
          targetWakeTime={settings?.target_wake_time}
        />
      </Suspense>
    </div>
  );
}
