"use client";

import { subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResolvedTimeZone } from "@/hooks/use-timezone";
import type { SleepSession } from "@/lib/types";
import {
  getMinutesFromMidnight,
  median,
  normalizeSleepMinutes,
} from "@/lib/utils/sleep-utils";

interface StatsCardsProps {
  stats: {
    on_target_nights: { count: number; total: number } | null;
    median_hours: number;
  };
  sessions: SleepSession[];
  timezone?: string | null;
}

function formatMinutes(mins: number): string {
  const total = Math.round(mins) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export function StatsCards({
  stats,
  sessions,
  timezone = null,
}: StatsCardsProps) {
  const timeZone = useResolvedTimeZone(timezone);
  // resolved in the browser, the window is relative to "now" and the server
  // clock and timezone are not the user's
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const { medianBedtime, medianWake } = useMemo(() => {
    if (!now) return { medianBedtime: null, medianWake: null };
    const cutoff = subDays(now, 30);
    const recent = sessions.filter(
      (s) => s.wake_time && new Date(s.bedtime) >= cutoff,
    );

    const bedMins = recent.map((s) =>
      normalizeSleepMinutes(getMinutesFromMidnight(s.bedtime, timeZone)),
    );
    const wakeMins = recent.map((s) =>
      // biome-ignore lint/style/noNonNullAssertion: guarded by the wake_time check above
      normalizeSleepMinutes(getMinutesFromMidnight(s.wake_time!, timeZone)),
    );

    const mb = median(bedMins);
    const mw = median(wakeMins);
    return {
      medianBedtime: mb !== null ? formatMinutes(mb) : null,
      medianWake: mw !== null ? formatMinutes(mw) : null,
    };
  }, [sessions, now, timeZone]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            On-Target Nights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.on_target_nights
              ? `${stats.on_target_nights.count}/${stats.on_target_nights.total}`
              : "—"}
          </div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Median Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.median_hours} hr</div>
          <p className="text-xs text-muted-foreground">Per session</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Median Bedtime</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{medianBedtime ?? "—"}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Median Wake Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{medianWake ?? "—"}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
