"use client";

import { format, subDays } from "date-fns";
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
import {
  connectGoogleHealth,
  previewGoogleHealthImport,
  saveGoogleHealthImport,
} from "@/lib/actions/google-health";
import type { ImportCandidate } from "@/lib/google-health";

interface GoogleHealthImportDialogProps {
  children: React.ReactNode;
  connected: boolean;
  tokenExpiresAt: string | null;
  // set when the page was reached from a failed google connect
  initialConnectError: string | null;
}

type Choice = "skip" | "replace";

const toDateInput = (date: Date) => format(date, "yyyy-MM-dd");
const formatTime = (iso: string) => format(new Date(iso), "MMM d, HH:mm");

export function GoogleHealthImportDialog({
  children,
  connected,
  tokenExpiresAt,
  initialConnectError,
}: GoogleHealthImportDialogProps) {
  const [open, setOpen] = useState(initialConnectError !== null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialConnectError);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [fromDate, setFromDate] = useState(() =>
    toDateInput(subDays(new Date(), 7)),
  );
  const [toDate, setToDate] = useState(() => toDateInput(new Date()));
  const [candidates, setCandidates] = useState<ImportCandidate[] | null>(null);
  const [choices, setChoices] = useState<Record<string, Choice>>({});

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setCandidates(null);
      setChoices({});
      setError(null);
      setNotice(null);
    }
  }

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      const result = await connectGoogleHealth();
      if (result?.error) setError(result.error);
    });
  }

  function handlePreview() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await previewGoogleHealthImport(fromDate, toDate);
      if (result.error) {
        setError(result.error);
        setNeedsReconnect(result.reconnect ?? false);
        return;
      }
      setCandidates(result.candidates ?? []);
      setChoices({});
    });
  }

  const choiceFor = (night: ImportCandidate): Choice =>
    choices[night.id] ?? "skip";
  const selected = (candidates ?? []).filter(
    (night) => night.conflicts.length === 0 || choiceFor(night) === "replace",
  );

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveGoogleHealthImport(
        selected.map((night) => ({
          start: night.start,
          end: night.end,
          replace: night.conflicts.map((session) => session.id),
        })),
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      const imported = result.imported ?? 0;
      setNotice(
        `Imported ${imported} ${imported === 1 ? "night" : "nights"}.` +
          (result.skipped
            ? ` Skipped ${result.skipped} that now overlap a session.`
            : ""),
      );
      setCandidates(null);
      setChoices({});
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Import from Google Health</DialogTitle>
          <DialogDescription>
            Read-only: Sneuz reads your sleep and never writes to Google Health.
          </DialogDescription>
        </DialogHeader>

        {!connected || needsReconnect ? (
          <div className="grid gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Connect once to import nights from your Fitbit. Google will warn
              that the app isn&apos;t verified; choose Advanced, then continue.
            </p>
            <DialogFooter>
              <Button onClick={handleConnect} disabled={isPending}>
                Connect Google Health
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="flex gap-2">
              <div className="grid flex-1 gap-1.5">
                <Label htmlFor="import-from">From</Label>
                <Input
                  id="import-from"
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setCandidates(null);
                  }}
                />
              </div>
              <div className="grid flex-1 gap-1.5">
                <Label htmlFor="import-to">To</Label>
                <Input
                  id="import-to"
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setCandidates(null);
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Nights are matched by the day you woke up.
              {tokenExpiresAt &&
                ` Google access expires ${format(new Date(tokenExpiresAt), "MMM d")}.`}
            </p>

            {candidates && candidates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No sleep found in Google Health for these dates.
              </p>
            )}

            {candidates && candidates.length > 0 && (
              <ul className="grid max-h-72 gap-2 overflow-y-auto text-sm">
                {candidates.map((night) => (
                  <li
                    key={night.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="grid">
                      <span>
                        {formatTime(night.start)} to {formatTime(night.end)}
                      </span>
                      {night.conflicts.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Overlaps{" "}
                          {night.conflicts
                            .map((session) =>
                              session.end
                                ? formatTime(session.start)
                                : `your in-progress session from ${formatTime(session.start)}`,
                            )
                            .join(", ")}
                        </span>
                      )}
                    </div>
                    {night.conflicts.length > 0 ? (
                      <select
                        aria-label="Overlap choice"
                        className="rounded-md border bg-background px-2 py-1 text-sm"
                        value={choiceFor(night)}
                        onChange={(e) =>
                          setChoices((prev) => ({
                            ...prev,
                            [night.id]: e.target.value as Choice,
                          }))
                        }
                      >
                        <option value="skip">Skip</option>
                        <option value="replace">Replace</option>
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground">New</span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <DialogFooter>
              {candidates && candidates.length > 0 ? (
                <Button
                  onClick={handleSave}
                  disabled={isPending || selected.length === 0}
                >
                  Import {selected.length}{" "}
                  {selected.length === 1 ? "night" : "nights"}
                </Button>
              ) : (
                <Button onClick={handlePreview} disabled={isPending}>
                  Preview
                </Button>
              )}
            </DialogFooter>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      </DialogContent>
    </Dialog>
  );
}
