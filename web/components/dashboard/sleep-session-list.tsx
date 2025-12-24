"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { deleteSleepSession } from "@/lib/actions/sleep"
import { useTransition } from "react"
import { IconTrash, IconPencil } from "@tabler/icons-react"
import { SleepFormDialog } from "@/components/dashboard/sleep-form-dialog"

interface SleepSession {
    id: string
    bedtime: string
    wake_time: string | null
    duration_minutes: number | null
    created_at: string
}

export function SleepSessionList({ sessions }: { sessions: SleepSession[] }) {
    const [isPending, startTransition] = useTransition()

    return (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bedtime</TableHead>
                <TableHead>Wake Time</TableHead>
                <TableHead>Duration (min)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No results.
                    </TableCell>
                  </TableRow>
              ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{new Date(session.bedtime).toLocaleString()}</TableCell>
                      <TableCell>{session.wake_time ? new Date(session.wake_time).toLocaleString() : '-'}</TableCell>
                      <TableCell>{session.duration_minutes || '-'}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                         <SleepFormDialog session={session}>
                            <Button variant="ghost" size="icon">
                                <IconPencil className="h-4 w-4" />
                            </Button>
                         </SleepFormDialog>
                         <Button variant="ghost" size="icon" disabled={isPending} onClick={() => {
                             startTransition(async () => {
                                 await deleteSleepSession(session.id)
                             })
                         }}>
                            <IconTrash className="h-4 w-4 text-red-500" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      )
}
