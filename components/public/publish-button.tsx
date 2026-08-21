"use client";

import { useFormStatus } from "react-dom";

export function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn upload-button" type="submit" disabled={pending} aria-busy={pending}>
      {pending && <span className="spinner spinner-dark" aria-hidden="true" />}
      {pending ? "Publishing…" : "Publish Video"}
    </button>
  );
}
