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
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
  goal?: number
}

function SleepRing({ percentage, colorClass }: { percentage: number, colorClass: string }) {

    // Map Tailwind color classes to hex codes
    let pathColor = "#10b981"; // emerald-500
    if (colorClass.includes("rose")) pathColor = "#f43f5e"; // rose-500
    else if (colorClass.includes("amber")) pathColor = "#f59e0b"; // amber-500
    else if (colorClass.includes("muted")) pathColor = "#e5e7eb"; // gray-200

    return (
        <div className="group h-12 w-12 hover:cursor-pointer">
             <ProgressRing
                val={percentage}
            />
        </div>
    )
}

export function SleepCalendar({ sessions, goal = 8 }: SleepCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

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

  const getSleepStats = (minutes: number | null) => {
      if (!minutes) return { percent: 0, color: "text-muted-foreground" }
      const hours = minutes / 60
      const percent = Math.min((hours / goal) * 100, 100)
      
      let color = "rose" // Red
      if (hours >= goal) color = "emerald" // Green
      else if (hours >= goal * 0.75) color = "amber" // Yellow
      
      return { percent, color }
  }

  const formatDuration = (minutes: number | null) => {
      if (!minutes) return "0h 0m"
      const hrs = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hrs}h ${mins}m`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
            <div className="mr-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{goal}h</span> Goal
            </div>
            <Button variant="outline" size="icon" onClick={prevMonth}>
                <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
                <IconChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-muted/20 border rounded-lg overflow-hidden shadow-sm">
        {/* Weekday Headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-widest"
          >
            {day}
          </div>
        ))}

        {/* Days */}
        {calendarDays.map((day) => {
            const session = getSessionForDay(day)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const { percent, color } = getSleepStats(session?.duration_minutes || null)
            
            return (
                <div
                    key={day.toString()}
                    className={cn(
                        "min-h-[120px] bg-background p-2 transition-colors relative border sm:border-0 flex flex-col items-center justify-between group",
                        !isCurrentMonth && "bg-muted/10 text-muted-foreground opacity-50"
                    )}
                >
                    <div className="w-full flex justify-start">
                         <span className={cn(
                             "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full transition-colors",
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
                                        <SleepRing percentage={percent} colorClass={color} />
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
                        <div className="h-12 w-12" /> /* Spacer */
                    )}
                </div>
            )
        })}
      </div>
    </div>
  )
}
