"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSleepSession, updateSleepSession } from "@/lib/actions/sleep"
import { useState, useTransition } from "react"

interface SleepFormDialogProps {
  children?: React.ReactNode
  session?: {
      id: string
      bedtime: string
      wake_time: string | null
  }
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SleepFormDialog({ children, session, open, onOpenChange }: SleepFormDialogProps) {
    const [isPending, startTransition] = useTransition()
    const [internalOpen, setInternalOpen] = useState(false)

    // If controlled, use props, otherwise use internal state
    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen

    const isEditing = !!session

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            let result
            if (isEditing && session) {
                result = await updateSleepSession(session.id, formData)
            } else {
                result = await createSleepSession(formData)
            }

            if (result?.error) {
                // TODO: Show toast error
                console.error(result.error)
            } else {
                if (setIsOpen) setIsOpen(false)
            }
        })
    }

    function toLocalISOString(dateString: string) {
        const date = new Date(dateString)
        const offset = date.getTimezoneOffset()
        // Adjust the date to local time by subtracting the offset (in minutes)
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().slice(0, 16)
    }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Session" : "Add Session"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your sleep details." : "Record a new sleep session."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bedtime" className="text-right">
                Bedtime
                </Label>
                <Input
                    id="bedtime"
                    name="bedtime"
                    type="datetime-local"
                    className="col-span-3"
                    defaultValue={session?.bedtime ? toLocalISOString(session.bedtime) : ''}
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="wake_time" className="text-right">
                Wake Time
                </Label>
                <Input
                    id="wake_time"
                    name="wake_time"
                    type="datetime-local"
                    className="col-span-3"
                    defaultValue={session?.wake_time ? toLocalISOString(session.wake_time) : ''}
                />
            </div>
            </div>
            <DialogFooter>
            <Button type="submit" disabled={isPending}>{isEditing ? "Save changes" : "Add session"}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
