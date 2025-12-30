"use client"

import { useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  parseISO
} from "date-fns"
import { IconChevronLeft, IconChevronRight, IconChartBar, IconCalendarMonth, IconTrendingUp } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SleepChart } from "./sleep-chart"
import { isLateBedtime } from "@/lib/utils/sleep-utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ProgressRing from '@/components/ui/progress-ring';

interface SleepSession {
    id: string
    bedtime: string
    wake_time: string | null
    duration_minutes: number | null
    created_at: string
}

interface SleepCalendarProps {
  sessions: SleepSession[]
  targetBedtime?: string
  targetWakeTime?: string
}

function SleepRing({ percentage, color }: { percentage: number, color: string }) {
    return (
        <div className="group h-9 w-9 md:h-12 md:w-12 hover:cursor-pointer">
             <ProgressRing
                val={Math.ceil(percentage)}
                color={color}
            />
        </div>
    )
}

export function SleepCalendar({ sessions, targetBedtime = '23:00', targetWakeTime = '07:00' }: SleepCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState<'grid' | 'chart'>('grid')
  const [chartDays, setChartDays] = useState<7 | 30>(7)
  const [showTrend, setShowTrend] = useState(true)

  // Calculate goal hours
  const bed = new Date(`2000-01-01T${targetBedtime}`)
  const wake = new Date(`2000-01-01T${targetWakeTime}`)
  if (wake < bed) wake.setDate(wake.getDate() + 1)
  const goal = (wake.getTime() - bed.getTime()) / (1000 * 60 * 60)

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  // Weekday headers
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Helper to find session for a day
  const getSessionForDay = (day: Date) => {
    return sessions.find(session => {
        if (!session.wake_time) return false
        const wakeDate = parseISO(session.wake_time)
        return isSameDay(wakeDate, day)
    })
  }

  // Continuous color mapping: <= 50% = Red (0), > 50% maps 50..100 to 0..120
  const getPercentageColor = (percentage: number) => {
      if (percentage <= 50) return `hsl(0, 70%, 45%)`
      
      // Clamp at 100
      const effective = Math.min(percentage, 100)
      // Map 50..100 to 0..120
      // (val - 50) / 50 * 120 = (val - 50) * 2.4
      const hue = (effective - 50) * 2.4
      return `hsl(${hue}, 70%, 45%)`
  }

  const getSleepStats = (minutes: number | null) => {
      if (!minutes) return { percent: 0, color: "hsl(0, 0%, 80%)" } // Gray for empty
      const hours = minutes / 60
      const percent = Math.min((hours / goal) * 100, 100)
      
      return { percent, color: getPercentageColor(percent) }
  }

  const formatDuration = (minutes: number | null) => {
      if (!minutes) return "0h 0m"
      const hrs = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hrs}h ${mins}m`
  }

  return (
    <div className="space-y-4">
      {/* View Toggle & Header */}
      {/* View Toggle & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Main View Toggle */}
        <div className="flex items-center p-1 bg-muted rounded-lg w-fit border border-border/50">
          <button
            onClick={() => setView('grid')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200",
              view === 'grid' 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconCalendarMonth className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={() => setView('chart')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200",
              view === 'chart' 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconChartBar className="h-4 w-4" />
            Analytics
          </button>
        </div>

        {view === 'chart' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-muted rounded-lg w-fit border border-border/50">
                <button
                onClick={() => setChartDays(7)}
                className={cn(
                    "px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 min-w-[80px]",
                    chartDays === 7 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                >
                7 Days
                </button>
                <button
                onClick={() => setChartDays(30)}
                className={cn(
                    "px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 min-w-[80px]",
                    chartDays === 30 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                >
                30 Days
                </button>
            </div>

             {/* Trend Toggle */}
            <div className="flex items-center p-1 bg-muted rounded-lg w-fit border border-border/50">
                 <button
                    onClick={() => setShowTrend(!showTrend)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200",
                        showTrend
                        ? "bg-primary/10 text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                 >
                    <IconTrendingUp className="h-4 w-4" />
                    Trend
                 </button>
            </div>
          </div>
        )}

        {view === 'grid' && (
          <div className="flex items-center gap-2">
              <div className="mr-4 text-sm text-muted-foreground hidden md:block">
                  <span className="font-medium text-foreground">{goal.toFixed(1)}h</span> Goal
              </div>
              <Button className="bg-primary/10 text-foreground hover:bg-primary/20 hover:text-primary border-2 border-border" size="sm" onClick={() => setCurrentMonth(new Date())}>
                  Today
              </Button>
              <div className="flex items-center gap-1 ml-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                    <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                    <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
          </div>
        )}
      </div>

      {view === 'grid' ? (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          
          <div className="grid grid-cols-7 gap-px bg-muted/50 border rounded-lg overflow-hidden shadow-sm">
            {weekDays.map((day) => (
              <div
                key={day}
                className="bg-card p-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-widest"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((day) => {
                const session = getSessionForDay(day)
                const isCurrentMonth = isSameMonth(day, monthStart)
                const { percent, color } = getSleepStats(session?.duration_minutes || null)
                const isLate = session ? isLateBedtime(session.bedtime, targetBedtime) : false
                
                return (
                    <div
                        key={day.toString()}
                        className={cn(
                            "min-h-[80px] md:min-h-[120px] bg-card p-1 md:p-2 transition-colors relative border sm:border-0 flex flex-col items-center justify-between group",
                            !isCurrentMonth && "bg-muted/10 text-muted-foreground opacity-50",
                            isLate && "bg-amber-100/50 dark:bg-amber-900/20"
                        )}
                    >
                        <div className="w-full flex justify-between items-start">
                             <span className={cn(
                                 "text-[10px] md:text-xs font-medium h-5 w-5 md:h-6 md:w-6 flex items-center justify-center rounded-full transition-colors",
                                 isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                             )}>
                                 {format(day, "d")}
                             </span>
                        </div>
                     {session && session.duration_minutes ? (
                         <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <div className="cursor-pointer">
                                        <SleepRing percentage={percent} color={color} />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="p-3 bg-popover border shadow-lg rounded-xl">
                                    <div className="space-y-1 text-center min-w-[120px]">
                                        <p className="font-bold text-lg text-foreground">
                                            {formatDuration(session.duration_minutes)}
                                        </p>
                                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <span>{format(parseISO(session.bedtime), "h:mm a")}</span>
                                            <span>→</span>
                                            <span>{format(parseISO(session.wake_time!), "h:mm a")}</span>
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                         </TooltipProvider>
                    ) : (
                        <div className="h-9 w-9 md:h-12 md:w-12" /> /* Spacer */
                    )}
                </div>
            )
        })}
      </div>
      <div className="flex items-center gap-2 text-xs px-1">
        <div className="flex items-center gap-2">
           <div className="h-3 w-3 rounded-sm bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" />
           <span className="bg-amber-200/30">stayed up late</span>
        </div>
      </div>
     </div>
      ) : (
        <div className="border rounded-lg p-6 bg-card shadow-sm">
            <div className="mb-4">
                <h2 className="font-semibold text-lg">Sleep Activity</h2>
            </div>
            <SleepChart 
                sessions={sessions} 
                days={chartDays} 
                targetBedtime={targetBedtime} 
                targetWakeTime={targetWakeTime} 
                showTrend={showTrend}
            />
        </div>
      )}
    </div>
  )
}
