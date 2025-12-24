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
import { useRouter } from "next/navigation"

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
    const router = useRouter() // Though actions handle revalidation, router.refresh is sometimes safer

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
                    defaultValue={session?.bedtime ? new Date(session.bedtime).toISOString().slice(0, 16) : ''}
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
                    defaultValue={session?.wake_time ? new Date(session.wake_time).toISOString().slice(0, 16) : ''}
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
