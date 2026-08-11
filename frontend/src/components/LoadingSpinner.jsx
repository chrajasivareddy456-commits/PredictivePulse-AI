import React from "react";

export function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-3 text-graphite-500 py-10 justify-center">
      <div className="w-4 h-4 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">{label}...</span>
    </div>
  );
}
