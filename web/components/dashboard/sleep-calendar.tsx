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
    const radius = 18
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    
    // Map Tailwind color classes to actual stroke colors for the SVG
    let strokeColor = "stroke-emerald-500"
    if (colorClass.includes("rose")) strokeColor = "stroke-rose-500"
    else if (colorClass.includes("amber")) strokeColor = "stroke-amber-500"

    return (
        <div className="relative flex items-center justify-center h-12 w-12">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 48 48">
                {/* Background Ring */}
                <circle
                    className="stroke-muted"
                    strokeWidth="4"
                    fill="transparent"
                    r={radius}
                    cx="24"
                    cy="24"
                />
                {/* Progress Ring */}
                <circle
                    className={strokeColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="24"
                    cy="24"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                        transition: "stroke-dashoffset 0.5s ease-in-out"
                    }}
                />
            </svg>
            <div className="absolute text-[10px] font-bold">
               {percentage > 100 ? '100%+' : `${Math.round(percentage)}%`}
            </div>
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

  // Color coding based on duration
  const getSleepStats = (minutes: number | null) => {
      if (!minutes) return { percent: 0, color: "text-muted-foreground" }
      const hours = minutes / 60
      const percent = Math.min((hours / goal) * 100, 100)
      
      let color = "rose" // Red
      if (hours >= goal) color = "emerald" // Green
      else if (hours >= goal * 0.75) color = "amber" // Yellow
      
      return { percent, color }
  }

  const formatDuration = (minutes: number) => {
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
        {calendarDays.map((day, dayIdx) => {
            const session = getSessionForDay(day)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const { percent, color } = getSleepStats(session?.duration_minutes || null)
            
            return (
                <div
                    key={day.toString()}
                    className={cn(
                        "min-h-[100px] bg-background p-2 transition-colors relative border sm:border-0 flex flex-col items-center justify-between",
                        !isCurrentMonth && "bg-muted/10 text-muted-foreground opacity-50"
                    )}
                >
                    <div className="w-full flex justify-start">
                         <span className={cn(
                             "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                             isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                         )}>
                             {format(day, "d")}
                         </span>
                    </div>

                    {session && session.duration_minutes ? (
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-default">
                                        <SleepRing percentage={percent} colorClass={color} />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-center">
                                        <p className="font-bold">{formatDuration(session.duration_minutes)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(parseISO(session.bedtime), "h:mm a")} - {format(parseISO(session.wake_time!), "h:mm a")}
                                        </p>
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
