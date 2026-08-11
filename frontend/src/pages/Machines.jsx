import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../layouts/AppLayout";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge, RiskBadge } from "../components/Badges";
import { listMachines, createMachine } from "../services/machineService";
import { getErrorMessage } from "../services/api";

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ machineId: "", name: "", type: "Pump", location: "" });

  function load() {
    setLoading(true);
    listMachines()
      .then((d) => setMachines(d.machines))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createMachine(form);
      setShowForm(false);
      setForm({ machineId: "", name: "", type: "Pump", location: "" });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const filtered = machines.filter(
    (m) =>
      m.machineId.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Machines"
        subtitle="Logical machine profiles for organizing sensor history and predictions"
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-md bg-pulse-500 text-graphite-950 font-medium"
          >
            + Add Machine
          </button>
        }
      />
      <div className="p-8 space-y-4">
        <ErrorAlert message={error} />

        {showForm && (
          <form onSubmit={handleCreate} className="panel p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <input required placeholder="Machine ID (e.g. DEFAULT-PUMP)" value={form.machineId}
              onChange={(e) => setForm({ ...form, machineId: e.target.value })}
              className="bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm" />
            <input required placeholder="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm" />
            <input placeholder="Location" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm" />
            <button type="submit" className="bg-pulse-500 text-graphite-950 rounded-md text-sm font-medium">Create</button>
          </form>
        )}

        <input
          placeholder="Search machines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm"
        />

        {loading && <LoadingSpinner label="Loading machines" />}

        {!loading && filtered.length === 0 && (
          <EmptyState
            title="No machines available"
            description="Add a machine profile, or run the ML training script and analyze a sensor reading to auto-create DEFAULT-PUMP."
          />
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <Link to={`/machines/${m.machineId}`} key={m.machineId} className="panel shadow-panel p-5 hover:border-pulse-500/40 transition block">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-graphite-500">{m.machineId}</p>
                    <p className="font-medium">{m.name}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-graphite-500">
                  <span>{m.type} · {m.location}</span>
                  <RiskBadge risk={m.currentRisk} />
                </div>
                <p className="text-xs text-graphite-500 mt-2">
                  {m.lastAnalyzedAt ? `Last analyzed ${new Date(m.lastAnalyzedAt).toLocaleString()}` : "Not yet analyzed"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
