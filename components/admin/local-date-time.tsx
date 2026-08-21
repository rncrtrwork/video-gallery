"use client";

import { useEffect, useState } from "react";

export function LocalDateTime({ value }: { value: string }) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setFormatted(new Date(value).toLocaleString());
  }, [value]);

  return (
    <time dateTime={value}>
      {formatted || "Loading…"}
    </time>
  );
}
