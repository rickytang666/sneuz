"use client";

import { useMemo } from "react";
import { subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMinutesFromMidnight, median, normalizeSleepMinutes } from "@/lib/utils/sleep-utils";
import type { SleepSession } from "@/lib/types";

interface StatsCardsProps {
  stats: {
    on_target_nights: { count: number; total: number } | null;
    median_hours: number;
  };
  sessions: SleepSession[];
}

function formatMinutes(mins: number): string {
  const total = Math.round(mins) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export function StatsCards({ stats, sessions }: StatsCardsProps) {
  const { medianBedtime, medianWake } = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    const recent = sessions.filter(
      (s) => s.wake_time && new Date(s.bedtime) >= cutoff,
    );

    const bedMins = recent.map((s) =>
      normalizeSleepMinutes(getMinutesFromMidnight(s.bedtime)),
    );
    const wakeMins = recent.map((s) =>
      normalizeSleepMinutes(getMinutesFromMidnight(s.wake_time!)),
    );

    const mb = median(bedMins);
    const mw = median(wakeMins);
    return {
      medianBedtime: mb !== null ? formatMinutes(mb) : null,
      medianWake: mw !== null ? formatMinutes(mw) : null,
    };
  }, [sessions]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On-Target Nights</CardTitle>
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
          <CardTitle className="text-sm font-medium">Median Wake Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{medianWake ?? "—"}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
