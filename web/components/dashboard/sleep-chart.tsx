"use client"

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
  
  // Normalize time: values before 15:00 (900 mins) are treated as "next day"
  const normalize = (minutes: number) => minutes < 900 ? minutes + 1440 : minutes

  // Calculate target times
  const targetBedNormalized = normalize(timeStringToMinutes(targetBedtime))
  const targetWakeNormalized = normalize(timeStringToMinutes(targetWakeTime))

  let minTime = Infinity
  let maxTime = -Infinity

  // Prepare chart data
  const chartData = Array.from({ length: days }).map((_, i) => {
    const date = addDays(startDate, i)
    const dateStr = format(date, "yyyy-MM-dd")
    const shortDate = format(date, "MMM d")

    // Find session by wake-up day
    const session = sessions.find(s => 
      s.wake_time && format(parseISO(s.wake_time), "yyyy-MM-dd") === dateStr
    )

    if (!session) {
      return { name: shortDate, bedtime: null, duration: 0, displayBed: '', displayWake: '' }
    }

    const bedLinear = normalize(getMinutesFromMidnight(parseISO(session.bedtime)))
    const wakeLinear = normalize(getMinutesFromMidnight(parseISO(session.wake_time!)))

    // Update domain
    minTime = Math.min(minTime, bedLinear)
    maxTime = Math.max(maxTime, wakeLinear)

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

  // Include targets in domain
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

  // Generate hourly ticks
  const ticks = []
  for (let t = paddedMin; t <= paddedMax; t += 60) {
    ticks.push(t)
  }

  const formatYAxis = (value: number) => {
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
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            reversed
            width={45}
            type="number"
            allowDataOverflow={true}
            interval={0}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            animationDuration={0}
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
            stroke="#22c55e"
            strokeDasharray="4 4" 
            opacity={0.8}
            label={{ position: 'right', value: 'Target Bed', fill: '#22c55e', fontSize: 12, offset: 10, fontWeight: 'bold' }}
          />
          <ReferenceLine 
            y={targetWakeNormalized} 
            stroke="#22c55e"
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
                stroke="#f59e0b"
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
