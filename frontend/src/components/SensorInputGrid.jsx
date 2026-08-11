import React, { useState } from "react";

// sensor_15 is excluded — 100% missing in the source dataset (see
// ml-service/preprocessing/preprocess.py); the backend rejects it too.
const ALL_SENSORS = Array.from({ length: 52 }, (_, i) => `sensor_${String(i).padStart(2, "0")}`).filter(
  (s) => s !== "sensor_15"
);

// Group into chunks of 13 for a manageable, collapsible UI instead of one
// giant wall of 51 inputs.
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
const GROUPS = chunk(ALL_SENSORS, 13);

export function SensorInputGrid({ values, onChange, onLoadSample, sampleLoading }) {
  const [openGroup, setOpenGroup] = useState(0);

  const filledCount = ALL_SENSORS.filter((s) => values[s] !== undefined && values[s] !== "").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-graphite-500">
          <span className="font-mono text-pulse-400">{filledCount}</span> / {ALL_SENSORS.length} sensor fields entered
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            disabled={sampleLoading}
            className="text-xs px-3 py-1.5 rounded-md border border-pulse-500/40 text-pulse-400 hover:bg-pulse-500/10 transition disabled:opacity-50"
          >
            {sampleLoading ? "Loading..." : "Load Example from Dataset"}
          </button>
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs px-3 py-1.5 rounded-md border border-graphite-600 text-graphite-500 hover:bg-graphite-700 transition"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {GROUPS.map((group, idx) => (
          <div key={idx} className="border border-graphite-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenGroup(openGroup === idx ? -1 : idx)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-graphite-800 text-sm text-graphite-500 hover:text-graphite-400"
            >
              <span>
                Sensors {group[0]} – {group[group.length - 1]}
              </span>
              <span className="font-mono text-xs">{openGroup === idx ? "−" : "+"}</span>
            </button>
            {openGroup === idx && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
                {group.map((sensor) => (
                  <label key={sensor} className="text-xs">
                    <span className="block text-graphite-500 mb-1 font-mono">{sensor}</span>
                    <input
                      type="number"
                      step="any"
                      value={values[sensor] ?? ""}
                      onChange={(e) => onChange({ ...values, [sensor]: e.target.value })}
                      placeholder="—"
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-md px-2.5 py-1.5 font-mono text-graphite-500 focus:outline-none focus:border-pulse-500 focus:text-graphite-400"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { ALL_SENSORS };
