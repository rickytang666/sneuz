"use client";

import { useEffect, useState } from "react";

interface Props {
  iso: string;
  mode?: "date" | "datetime";
}

// the server formats with its own locale and timezone, the browser with the
// user's, so the formatted value is filled in after mount to avoid a mismatch
export function LocalTime({ iso, mode = "datetime" }: Props) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const date = new Date(iso);
    setText(
      mode === "date"
        ? date.toLocaleDateString(undefined, { dateStyle: "medium" })
        : date.toLocaleString(),
    );
  }, [iso, mode]);

  return <time dateTime={iso}>{text ?? iso.slice(0, 10)}</time>;
}
