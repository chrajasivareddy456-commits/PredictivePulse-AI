import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "../layouts/AppLayout";
import { Card } from "../components/Card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge, RiskBadge } from "../components/Badges";
import { getMachine, getMachineHistory } from "../services/machineService";
import { getErrorMessage } from "../services/api";

export default function MachineDetails() {
  const { machineId } = useParams();
  const [machine, setMachine] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMachine(machineId), getMachineHistory(machineId)])
      .then(([m, h]) => {
        setMachine(m.machine);
        setHistory(h.predictions);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [machineId]);

  const latest = history[0];

  return (
    <div>
      <PageHeader
        title={machine ? machine.name : machineId}
        subtitle={`Machine ID: ${machineId}`}
        action={
          <Link to="/analyze" state={{ machineId }} className="text-xs px-3 py-1.5 rounded-md bg-pulse-500 text-graphite-950 font-medium">
            Analyze This Machine
          </Link>
        }
      />
      <div className="p-8 space-y-6">
        <ErrorAlert message={error} />
        {loading && <LoadingSpinner label="Loading machine details" />}

        {machine && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Machine Information">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-graphite-500">Status</dt><dd><StatusBadge status={machine.status} /></dd></div>
                  <div className="flex justify-between"><dt className="text-graphite-500">Risk</dt><dd><RiskBadge risk={machine.currentRisk} /></dd></div>
                  <div className="flex justify-between"><dt className="text-graphite-500">Type</dt><dd>{machine.type}</dd></div>
                  <div className="flex justify-between"><dt className="text-graphite-500">Location</dt><dd>{machine.location}</dd></div>
                  <div className="flex justify-between"><dt className="text-graphite-500">Last Analyzed</dt><dd>{machine.lastAnalyzedAt ? new Date(machine.lastAnalyzedAt).toLocaleString() : "Never"}</dd></div>
                </dl>
              </Card>

              <Card title="Latest Analysis">
                {latest ? (
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-graphite-500">Predicted Status</dt><dd>{latest.predictedStatus}</dd></div>
                    <div className="flex justify-between"><dt className="text-graphite-500">Confidence</dt><dd className="font-mono">{(latest.classificationConfidence * 100).toFixed(1)}%</dd></div>
                    <div className="flex justify-between"><dt className="text-graphite-500">Anomaly</dt><dd>{latest.anomaly ? "Yes" : "No"}</dd></div>
                    <div className="flex justify-between"><dt className="text-graphite-500">Anomaly Score</dt><dd className="font-mono">{latest.anomalyScore}</dd></div>
                    <div className="pt-2 border-t border-graphite-700 text-graphite-500 text-xs">{latest.recommendation}</div>
                  </dl>
                ) : (
                  <p className="text-sm text-graphite-500">No analysis records available yet.</p>
                )}
              </Card>
            </div>

            <Card title="Prediction History">
              {history.length === 0 ? (
                <EmptyState title="No analysis records available yet." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-graphite-500 uppercase border-b border-graphite-700">
                      <th className="py-2">Date</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Anomaly</th>
                      <th className="py-2">Risk</th>
                      <th className="py-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((p) => (
                      <tr key={p._id} className="border-b border-graphite-800 last:border-0">
                        <td className="py-2.5 text-xs text-graphite-500">{new Date(p.timestamp).toLocaleString()}</td>
                        <td className="py-2.5"><StatusBadge status={p.predictedStatus} /></td>
                        <td className="py-2.5">{p.anomaly ? "Yes" : "No"}</td>
                        <td className="py-2.5"><RiskBadge risk={p.riskLevel} /></td>
                        <td className="py-2.5 font-mono text-xs">{(p.classificationConfidence * 100).toFixed(1)}%</td>
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
