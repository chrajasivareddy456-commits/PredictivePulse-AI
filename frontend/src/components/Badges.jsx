import React from "react";

const STATUS_STYLES = {
  NORMAL: "bg-pulse-500/10 text-pulse-400 border-pulse-500/30",
  WARNING: "bg-signal-medium/10 text-signal-medium border-signal-medium/30",
  CRITICAL: "bg-signal-critical/10 text-signal-critical border-signal-critical/30",
  UNKNOWN: "bg-graphite-600/30 text-graphite-500 border-graphite-600",
  RECOVERING: "bg-signal-high/10 text-signal-high border-signal-high/30",
  BROKEN: "bg-signal-critical/10 text-signal-critical border-signal-critical/30",
};

export function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.UNKNOWN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current pulse-dot" />
      {status}
    </span>
  );
}

const RISK_STYLES = {
  LOW: "bg-signal-low/10 text-signal-low border-signal-low/30",
  MEDIUM: "bg-signal-medium/10 text-signal-medium border-signal-medium/30",
  HIGH: "bg-signal-high/10 text-signal-high border-signal-high/30",
  CRITICAL: "bg-signal-critical/10 text-signal-critical border-signal-critical/30",
  UNKNOWN: "bg-graphite-600/30 text-graphite-500 border-graphite-600",
};

export function RiskBadge({ risk }) {
  const cls = RISK_STYLES[risk] || RISK_STYLES.UNKNOWN;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold tracking-wide ${cls}`}>
      {risk}
    </span>
  );
}
