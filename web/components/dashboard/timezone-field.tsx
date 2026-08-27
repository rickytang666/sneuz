"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { detectTimeZone } from "@/lib/utils/sleep-utils";

const ZONES =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : [];

export function TimezoneField({ value }: { value: string | null }) {
  const [zone, setZone] = useState(value && value !== "UTC" ? value : "");

  // detected only after mount, the server's zone is not the user's
  useEffect(() => {
    if (!value || value === "UTC") setZone(detectTimeZone());
  }, [value]);

  return (
    <div className="grid gap-2">
      <Label htmlFor="timezone">Timezone</Label>
      <select
        id="timezone"
        name="timezone"
        value={zone}
        onChange={(e) => setZone(e.target.value)}
        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
      >
        {zone && !ZONES.includes(zone) && <option value={zone}>{zone}</option>}
        {ZONES.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>
      <p className="text-muted-foreground text-xs">
        Bedtimes are scored in this zone. Save once to apply it to stats
        calculated on the server.
      </p>
    </div>
  );
}
