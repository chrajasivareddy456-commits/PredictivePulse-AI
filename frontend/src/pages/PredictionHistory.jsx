import React, { useEffect, useState } from "react";
import { PageHeader } from "../layouts/AppLayout";
import { Card } from "../components/Card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge, RiskBadge } from "../components/Badges";
import { listPredictions } from "../services/predictionService";
import { getErrorMessage } from "../services/api";

export default function PredictionHistory() {
  const [data, setData] = useState({ predictions: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ machineId: "", riskLevel: "", predictedStatus: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (filters.machineId) params.machineId = filters.machineId;
    if (filters.riskLevel) params.riskLevel = filters.riskLevel;
    if (filters.predictedStatus) params.predictedStatus = filters.predictedStatus;

    listPredictions(params)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, filters]);

  return (
    <div>
      <PageHeader title="Prediction History" subtitle={`${data.total} total records`} />
      <div className="p-8 space-y-4">
        <ErrorAlert message={error} />

        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Filter by Machine ID"
            value={filters.machineId}
            onChange={(e) => { setFilters({ ...filters, machineId: e.target.value }); setPage(1); }}
            className="bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm font-mono"
          />
          <select
            value={filters.riskLevel}
            onChange={(e) => { setFilters({ ...filters, riskLevel: e.target.value }); setPage(1); }}
            className="bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <select
            value={filters.predictedStatus}
            onChange={(e) => { setFilters({ ...filters, predictedStatus: e.target.value }); setPage(1); }}
            className="bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="NORMAL">NORMAL</option>
            <option value="RECOVERING">RECOVERING</option>
            <option value="BROKEN">BROKEN</option>
          </select>
        </div>

        <Card>
          {loading && <LoadingSpinner label="Loading predictions" />}
          {!loading && data.predictions.length === 0 && (
            <EmptyState title="No predictions available" description="Analyze a machine or upload a CSV to build history." />
          )}
          {!loading && data.predictions.length > 0 && (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-graphite-500 uppercase border-b border-graphite-700">
                    <th className="py-2">Date</th>
                    <th className="py-2">Machine</th>
                    <th className="py-2">Predicted Status</th>
                    <th className="py-2">Anomaly</th>
                    <th className="py-2">Risk</th>
                    <th className="py-2">Confidence</th>
                    <th className="py-2">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {data.predictions.map((p) => (
                    <tr key={p._id} className="border-b border-graphite-800 last:border-0">
                      <td className="py-2.5 text-xs text-graphite-500 whitespace-nowrap">{new Date(p.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 font-mono text-xs">{p.machineId}</td>
                      <td className="py-2.5"><StatusBadge status={p.predictedStatus} /></td>
                      <td className="py-2.5">{p.anomaly ? "Yes" : "No"}</td>
                      <td className="py-2.5"><RiskBadge risk={p.riskLevel} /></td>
                      <td className="py-2.5 font-mono text-xs">{(p.classificationConfidence * 100).toFixed(1)}%</td>
                      <td className="py-2.5 text-xs text-graphite-500 max-w-xs truncate">{p.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-4 text-xs text-graphite-500">
                <span>Page {data.page} of {data.pages}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-graphite-600 rounded disabled:opacity-40">Previous</button>
                  <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-graphite-600 rounded disabled:opacity-40">Next</button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
