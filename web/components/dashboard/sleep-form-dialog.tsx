"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSleepSession, updateSleepSession } from "@/lib/actions/sleep";

interface SleepFormDialogProps {
  children?: React.ReactNode;
  session?: {
    id: string;
    bedtime: string;
    wake_time: string | null;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function toLocalDateString(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function toLocalTimeString(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(11, 16);
}

function defaultBedtimeDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultWakeDate() {
  return new Date().toISOString().slice(0, 10);
}

export function SleepFormDialog({
  children,
  session,
  open,
  onOpenChange,
}: SleepFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditing = !!session;

  async function handleSubmit(formData: FormData) {
    const bedtimeDate = formData.get("bedtime_date") as string;
    const bedtimeTime = formData.get("bedtime_time") as string;
    const wakeDate = formData.get("wake_date") as string;
    const wakeTime = formData.get("wake_time_time") as string;

    if (bedtimeDate && bedtimeTime) {
      formData.set(
        "bedtime",
        new Date(`${bedtimeDate}T${bedtimeTime}`).toISOString(),
      );
    }
    if (wakeDate && wakeTime) {
      formData.set(
        "wake_time",
        new Date(`${wakeDate}T${wakeTime}`).toISOString(),
      );
    }

    startTransition(async () => {
      const result =
        isEditing && session
          ? await updateSleepSession(session.id, formData)
          : await createSleepSession(formData);

      if (result?.error) {
        console.error(result.error);
      } else {
        if (setIsOpen) setIsOpen(false);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Session" : "Add Session"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your sleep details."
              : "Record a new sleep session."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label>Bedtime</Label>
              <div className="flex gap-2">
                <Input
                  name="bedtime_date"
                  type="date"
                  className="flex-1"
                  defaultValue={
                    session?.bedtime
                      ? toLocalDateString(session.bedtime)
                      : defaultBedtimeDate()
                  }
                  required
                />
                <Input
                  name="bedtime_time"
                  type="time"
                  className="flex-1"
                  defaultValue={
                    session?.bedtime
                      ? toLocalTimeString(session.bedtime)
                      : "23:00"
                  }
                  required
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Wake Time</Label>
              <div className="flex gap-2">
                <Input
                  name="wake_date"
                  type="date"
                  className="flex-1"
                  defaultValue={
                    session?.wake_time
                      ? toLocalDateString(session.wake_time)
                      : defaultWakeDate()
                  }
                />
                <Input
                  name="wake_time_time"
                  type="time"
                  className="flex-1"
                  defaultValue={
                    session?.wake_time
                      ? toLocalTimeString(session.wake_time)
                      : "07:00"
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isEditing ? "Save changes" : "Add session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
