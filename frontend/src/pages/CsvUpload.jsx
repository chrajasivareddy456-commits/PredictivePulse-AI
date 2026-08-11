import React, { useState } from "react";
import { PageHeader } from "../layouts/AppLayout";
import { Card, StatCard } from "../components/Card";
import { ErrorAlert } from "../components/ErrorAlert";
import { uploadCsv } from "../services/predictionService";
import { getErrorMessage } from "../services/api";

export default function CsvUpload() {
  const [file, setFile] = useState(null);
  const [machineId, setMachineId] = useState("DEFAULT-PUMP");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleUpload() {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const data = await uploadCsv(file, machineId, setProgress);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  function downloadResults() {
    if (!result?.csv) return;
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="CSV Upload" subtitle="Batch-predict machine status for many sensor readings at once" />
      <div className="p-8 space-y-6 max-w-3xl">
        <ErrorAlert message={error} />

        <Card title="Upload CSV">
          <p className="text-xs text-graphite-500 mb-4">
            The CSV must contain sensor_00 – sensor_51 columns (matching the format of the source
            sensor.csv). Extra columns like timestamp or machine_status are fine and will be ignored
            for prediction.
          </p>
          <div className="space-y-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-sm text-graphite-500"
            />
            <input
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              placeholder="Machine ID"
              className="w-full max-w-xs bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm font-mono"
            />
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-pulse-500 hover:bg-pulse-600 text-graphite-950 font-medium rounded-md px-4 py-2 text-sm transition disabled:opacity-50"
            >
              {uploading ? `Processing... ${progress}%` : "Upload and Predict"}
            </button>
          </div>
        </Card>

        {result && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Records" value={result.summary.total} />
              <StatCard label="Normal" value={result.summary.byStatus.NORMAL || 0} accent="text-pulse-400" />
              <StatCard label="Recovering" value={result.summary.byStatus.RECOVERING || 0} accent="text-signal-high" />
              <StatCard label="Broken" value={result.summary.byStatus.BROKEN || 0} accent="text-signal-critical" />
            </div>
            <Card title="Anomalies & Risk Distribution" subtitle="Isolation Forest anomaly status is shown separately from the classifier's predicted machine_status">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-graphite-500 mb-2">Anomalies detected</p>
                  <p className="font-mono text-2xl text-signal-high">{result.summary.anomalies}</p>
                </div>
                <div>
                  <p className="text-xs text-graphite-500 mb-2">Risk breakdown</p>
                  <div className="flex gap-3 text-xs font-mono">
                    {Object.entries(result.summary.byRisk).map(([k, v]) => (
                      <span key={k}>{k}: {v}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={downloadResults}
                className="mt-4 text-xs px-3 py-1.5 rounded-md border border-pulse-500/40 text-pulse-400 hover:bg-pulse-500/10"
              >
                Download predictions.csv
              </button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
