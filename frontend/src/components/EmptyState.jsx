import React from "react";

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-full border border-graphite-600 flex items-center justify-center mb-4">
        <span className="w-2 h-2 rounded-full bg-graphite-500" />
      </div>
      <h4 className="text-graphite-500 font-medium">{title}</h4>
      {description && <p className="text-sm text-graphite-500/80 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
