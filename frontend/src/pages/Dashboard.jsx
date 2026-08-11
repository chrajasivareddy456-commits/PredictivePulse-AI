import React, { useEffect, useState } from "react";
import { PageHeader } from "../layouts/AppLayout";
import { Card, StatCard } from "../components/Card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge, RiskBadge } from "../components/Badges";
import { getDashboardStats } from "../services/dashboardService";
import { getErrorMessage } from "../services/api";
import { Link } from "react-router-dom";

function HealthDot({ online }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-pulse-500" : "bg-signal-critical"}`} />
      {online ? "Online" : "Offline"}
    </span>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of machine health and system status"
        action={
          stats && (
            <div className="flex gap-4 text-graphite-500">
              <div className="flex items-center gap-1.5">
                ML Service <HealthDot online={stats.systemHealth.mlService === "online"} />
              </div>
              <div className="flex items-center gap-1.5">
                Backend <HealthDot online={stats.systemHealth.backend === "online"} />
              </div>
              <div className="flex items-center gap-1.5">
                Database <HealthDot online={stats.systemHealth.database === "connected"} />
              </div>
            </div>
          )
        }
      />
      <div className="p-8 space-y-6">
        <ErrorAlert message={error} />
        {loading && <LoadingSpinner label="Loading dashboard" />}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Machines" value={stats.totalMachines} />
              <StatCard label="Normal" value={stats.normal} accent="text-pulse-400" />
              <StatCard label="Warning" value={stats.warning} accent="text-signal-medium" />
              <StatCard label="Critical" value={stats.critical} accent="text-signal-critical" />
              <StatCard label="Active Anomalies" value={stats.activeAnomalies} accent="text-signal-high" />
            </div>

            <Card title="Recent Predictions" action={<Link to="/history" className="text-xs text-pulse-400 hover:underline">View all →</Link>}>
              {stats.recentPredictions.length === 0 ? (
                <EmptyState
                  title="No predictions yet"
                  description="Analyze a machine or upload a CSV to see prediction activity here."
                  action={
                    <Link to="/analyze" className="text-xs px-3 py-1.5 rounded-md bg-pulse-500 text-graphite-950 font-medium">
                      Analyze a Machine
                    </Link>
                  }
                />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-graphite-500 uppercase border-b border-graphite-700">
                      <th className="py-2">Machine</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Risk</th>
                      <th className="py-2">Confidence</th>
                      <th className="py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentPredictions.map((p) => (
                      <tr key={p._id} className="border-b border-graphite-800 last:border-0">
                        <td className="py-2.5 font-mono text-xs">{p.machineId}</td>
                        <td className="py-2.5"><StatusBadge status={p.predictedStatus} /></td>
                        <td className="py-2.5"><RiskBadge risk={p.riskLevel} /></td>
                        <td className="py-2.5 font-mono text-xs">{(p.classificationConfidence * 100).toFixed(1)}%</td>
                        <td className="py-2.5 text-xs text-graphite-500">{new Date(p.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
