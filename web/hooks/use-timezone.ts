"use client";

import { useEffect, useState } from "react";
import { detectTimeZone } from "@/lib/utils/sleep-utils";

/**
 * Resolves the zone to score sessions in: the saved one, else the browser's.
 *
 * "UTC" counts as unsaved because it is the column default rather than
 * anything a user chose. Detecting instead is safe either way: a browser
 * genuinely in UTC reports "UTC" and lands on the same answer.
 *
 * Returns null until mount when nothing is saved, so callers can hold off
 * rather than render a value computed in the server's zone.
 */
export function resolveStoredZone(stored: string | null): string | null {
  return stored && stored !== "UTC" ? stored : null;
}

export function useResolvedTimeZone(stored: string | null): string | null {
  const explicit = resolveStoredZone(stored);
  const [detected, setDetected] = useState<string | null>(null);

  useEffect(() => {
    if (!explicit) setDetected(detectTimeZone());
  }, [explicit]);

  return explicit ?? detected;
}
