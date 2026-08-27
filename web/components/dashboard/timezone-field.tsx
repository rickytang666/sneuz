"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { detectTimeZone } from "@/lib/utils/sleep-utils";

export function TimezoneField({ value }: { value: string | null }) {
  const saved = value && value !== "UTC" ? value : "";
  const [zone, setZone] = useState(saved);

  // node and the browser disagree on deprecated aliases (Africa/Asmera vs
  // Africa/Asmara), so the list is built after mount to keep the first client
  // render identical to the server's
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    setZones(
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : [],
    );
    if (!saved) setZone(detectTimeZone());
  }, [saved]);

  const options = zones.length ? zones : [zone].filter(Boolean);

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
        {zone && !options.includes(zone) && (
          <option value={zone}>{zone}</option>
        )}
        {options.map((z) => (
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
