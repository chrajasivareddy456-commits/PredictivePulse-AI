import React from "react";

export function Card({ title, subtitle, children, className = "", action }) {
  return (
    <div className={`panel shadow-panel p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-medium text-graphite-500 tracking-wide uppercase">{title}</h3>}
            {subtitle && <p className="text-xs text-graphite-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, accent = "text-pulse-400" }) {
  return (
    <div className="panel shadow-panel p-5">
      <p className="text-xs uppercase tracking-wide text-graphite-500 mb-2">{label}</p>
      <p className={`font-mono text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
