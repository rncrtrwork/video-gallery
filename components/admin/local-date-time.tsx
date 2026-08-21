"use client";

import { useEffect, useState } from "react";

export function LocalDateTime({ value, dateOnly = false }: { value: string; dateOnly?: boolean }) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    const date = new Date(value);
    setFormatted(dateOnly ? date.toLocaleDateString() : date.toLocaleString());
  }, [dateOnly, value]);

  return (
    <time dateTime={value}>
      {formatted || "Loading…"}
    </time>
  );
}
