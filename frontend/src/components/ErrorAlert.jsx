import React from "react";

export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-signal-critical/30 bg-signal-critical/10 text-signal-critical text-sm px-4 py-3">
      {message}
    </div>
  );
}
