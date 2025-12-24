"use client"

import React from "react"
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts"
import { format, parseISO, subDays, addDays, startOfDay } from "date-fns"
import { SleepSession } from "@/lib/types"
import { getMinutesFromMidnight, timeStringToMinutes } from "@/lib/utils/sleep-utils"

interface SleepChartProps {
  sessions: SleepSession[]
  days: number
  targetBedtime: string
  targetWakeTime: string
  showTrend?: boolean
}

export function SleepChart({ sessions, days, targetBedtime, targetWakeTime, showTrend = true }: SleepChartProps) {
  const now = new Date()
  const startDate = startOfDay(subDays(now, days - 1))
  
  // Helper: Normalize time to a linear "Evening -> Morning" scale
  // Cutoff at 6pm (18:00): Times after 18:00 are "today" (low values in our shifted scale? no, start of graph)
  // Let's use minutes from midnight.
  // 18:00 -> 1080. 
  // 08:00 (next day) -> 8 * 60 + 1440 = 1920.
  // We want continuous increasing values.
  // If time >= 12:00 (noon), we treat it as base.
  // If time < 12:00 (noon), we add 1440 (24h).
  const normalize = (minutes: number) => {
      // If time is before noon/afternoon (say < 15:00), it's likely "next day" sleep end
      // If time is > 15:00, it's likely "start of night"
      return minutes < 900 ? minutes + 1440 : minutes
  }

  // Pre-calculate target normalized times for reference lines
  const targetBedMinsRaw = timeStringToMinutes(targetBedtime)
  const targetBedNormalized = normalize(targetBedMinsRaw)
  
  const targetWakeMinsRaw = timeStringToMinutes(targetWakeTime)
  const targetWakeNormalized = normalize(targetWakeMinsRaw)

  // We want to force the domain to include the targets? 
  // User said "dataset range ... with padding". 
  // I will prioritize dataset but maybe ensure targets aren't totally off-screen if close.
  // Let's compute dataset range first.

  let minTime = Infinity
  let maxTime = -Infinity

  const chartData = Array.from({ length: days }).map((_, i) => {
    const date = addDays(startDate, i)
    const dateStr = format(date, "yyyy-MM-dd")
    const shortDate = format(date, "MMM d")

    // Filter by WAKE UP day
    const daySessions = sessions.filter(s => 
        s.wake_time && format(parseISO(s.wake_time), "yyyy-MM-dd") === dateStr
    )

    if (daySessions.length === 0) {
      return { name: shortDate, bedtime: null, duration: 0, displayBed: '', displayWake: '' }
    }

    const session = daySessions[0]
    const bedRaw = getMinutesFromMidnight(parseISO(session.bedtime))
    const wakeRaw = getMinutesFromMidnight(parseISO(session.wake_time!))

    // Normalize for linear scale
    const bedLinear = normalize(bedRaw)
    const wakeLinear = normalize(wakeRaw)

    // Edge case: if wake < bed in normalized scale (e.g. extremely long sleep or weird data), 
    // ensure wake is after bed by adding another 24h? or clamp?
    // Normal sleep: Bed 23:00 (1380), Wake 07:00 (420->1860). 1860 > 1380. Correct.
    // Late sleep: Bed 01:00 (60->1500), Wake 09:00 (540->1980). 1980 > 1500. Correct.
    // Nap? Bed 14:00 (840), Wake 16:00 (960). 960 > 840. Correct. (But < 900 threshold might misfire if cutoff is 15:00).
    // Let's assume standard "night sleep".
    
    // Update Min/Max
    if (bedLinear < minTime) minTime = bedLinear
    if (wakeLinear > maxTime) maxTime = wakeLinear

    return {
      name: shortDate,
      fullDate: format(date, "MMM d, yyyy"),
      bedtime: bedLinear,
      duration: wakeLinear - bedLinear,
      displayBed: format(parseISO(session.bedtime), "h:mm a"),
      displayWake: format(parseISO(session.wake_time!), "h:mm a"),
      rawDuration: session.duration_minutes || 0,
      wakeMinutes: wakeLinear
    }
  })

  // Fallbacks if no data, and ensure targets are included in range
  if (minTime === Infinity) {
      minTime = targetBedNormalized
      maxTime = targetWakeNormalized
  } else {
      minTime = Math.min(minTime, targetBedNormalized)
      maxTime = Math.max(maxTime, targetWakeNormalized)
  }

  // Pad to nearest hour
  const paddedMin = Math.floor(minTime / 60) * 60
  const paddedMax = Math.ceil(maxTime / 60) * 60

  // Generate ticks every hour
  const ticks = []
  for (let t = paddedMin; t <= paddedMax; t += 60) {
      ticks.push(t)
  }

  const formatYAxis = (value: number) => {
    // Value is linear (possibly > 1440)
    // Modulo 1440 to get minute of day, then format
    const normalized = value % 1440
    const hrs = Math.floor(normalized / 60)
    const mins = normalized % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const formatDuration = (minutes: number) => {
      const hrs = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hrs} h ${mins} m`
  }

  return (
    <div className="h-[400px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 100, left: 0, bottom: 0 }}
          barGap={0}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false}
            tick={false} 
          />
          <YAxis 
            domain={[paddedMin, paddedMax]} 
            ticks={ticks}
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#a1a1aa' }} // Fixed color for visibility
            reversed
            width={45}
            type="number"
            allowDataOverflow={true}
            interval={0} // Force show all ticks
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }} // Remove hover bg
            animationDuration={0}
            contentStyle={{ backgroundColor: '#22c55e', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                if (data.bedtime === null) return null
                return (
                  <div className="bg-popover border border-border p-3 rounded-md shadow-md text-xs min-w-[140px]">
                    <p className="flex justify-center font-semibold mb-2 text-foreground text-sm">{data.fullDate}</p>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4 text-muted-foreground">
                            <span>Start</span>
                            <span className="text-foreground font-mono">{data.displayBed}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-muted-foreground">
                            <span>End</span>
                            <span className="text-foreground font-mono">{data.displayWake}</span>
                        </div>
                        <div className="flex justify-center gap-4 font-bold text-blue-500 pt-1 mt-1 border-t">
                            <span>{formatDuration(data.rawDuration)}</span>
                        </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          
          <ReferenceLine 
            y={targetBedNormalized} 
            stroke="#22c55e" // green-500
            strokeDasharray="4 4" 
            opacity={0.8}
            label={{ position: 'right', value: 'Target Bed', fill: '#22c55e', fontSize: 12, offset: 10, fontWeight: 'bold' }}
          />
          <ReferenceLine 
            y={targetWakeNormalized} 
            stroke="#22c55e" // green-500
            strokeDasharray="4 4"
            opacity={0.8}
            label={{ position: 'right', value: 'Target Wake', fill: '#22c55e', fontSize: 12, offset: 10, fontWeight: 'bold' }}
          />

          <Bar 
            dataKey="bedtime" 
            stackId="sleep" 
            fill="transparent" 
            isAnimationActive={false}
            tooltipType="none"
          />
          <Bar 
            dataKey="duration" 
            stackId="sleep" 
            name="Sleep"
            isAnimationActive={false}
            radius={[4, 4, 4, 4]}
          >
             {chartData.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={entry.duration > 0 ? "hsl(217, 91%, 60%)" : "transparent"}
                />
             ))}
          </Bar>

          {showTrend && (
            <>
              <Line
                 type="monotone"
                 dataKey="bedtime"
                 stroke="#f59e0b" // amber-500
                 strokeWidth={2}
                 dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                 activeDot={{ r: 5 }}
                 connectNulls={true}
                 isAnimationActive={false}
              />
              <Line
                 type="monotone"
                 dataKey="wakeMinutes"
                 stroke="#b546d3ff"
                 strokeWidth={2}
                 dot={{ r: 3, fill: "#b546d3ff", strokeWidth: 0 }}
                 activeDot={{ r: 5 }}
                 connectNulls={true}
                 isAnimationActive={false}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
