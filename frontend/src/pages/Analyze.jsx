import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "../layouts/AppLayout";
import { Card } from "../components/Card";
import { ErrorAlert } from "../components/ErrorAlert";
import { StatusBadge, RiskBadge } from "../components/Badges";
import { SensorInputGrid } from "../components/SensorInputGrid";
import { analyzeMachine, getSample } from "../services/predictionService";
import { getErrorMessage } from "../services/api";

export default function Analyze() {
  const location = useLocation();
  const [machineId, setMachineId] = useState(location.state?.machineId || "DEFAULT-PUMP");
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [sampleNote, setSampleNote] = useState("");

  async function handleLoadSample() {
    setSampleLoading(true);
    setError("");
    try {
      const sample = await getSample();
      const stringValues = Object.fromEntries(
        Object.entries(sample.sensorValues).map(([k, v]) => [k, v === null ? "" : v])
      );
      setValues(stringValues);
      setSampleNote(`Example from Dataset — actual status was "${sample.actualStatus}" at ${sample.timestamp}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSampleLoading(false);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = { machineId };
      for (const [k, v] of Object.entries(values)) {
        if (v !== "" && v !== undefined) payload[k] = v;
      }
      const { result } = await analyzeMachine(payload);
      setResult(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Analyze Machine" subtitle="Enter sensor readings and run the AI diagnosis" />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card title="1. Select Machine">
            <input
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full max-w-xs bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm font-mono"
            />
          </Card>

          <Card title="2. Enter Sensor Values">
            {sampleNote && <p className="text-xs text-pulse-400 mb-3">{sampleNote}</p>}
            <SensorInputGrid values={values} onChange={setValues} onLoadSample={handleLoadSample} sampleLoading={sampleLoading} />
          </Card>

          <ErrorAlert message={error} />

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-pulse-500 hover:bg-pulse-600 text-graphite-950 font-medium rounded-md py-3 text-sm transition disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "3. Analyze Machine"}
          </button>
        </div>

        <div>
          <Card title="AI Diagnosis" className="sticky top-8">
            {!result && <p className="text-sm text-graphite-500">Results will appear here after analysis.</p>}
            {result && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-graphite-500 mb-1">Predicted Status</p>
                  <StatusBadge status={result.predictedStatus} />
                </div>
                <div>
                  <p className="text-xs text-graphite-500 mb-1">Confidence</p>
                  <p className="font-mono text-2xl text-pulse-400">{(result.classificationConfidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-graphite-500 mb-1">Anomaly Detection</p>
                  <p className="text-sm">{result.anomaly ? "⚠ Anomaly detected" : "No anomaly detected"} <span className="font-mono text-xs text-graphite-500">(score {result.anomalyScore})</span></p>
                </div>
                <div>
                  <p className="text-xs text-graphite-500 mb-1">Risk Level</p>
                  <RiskBadge risk={result.riskLevel} />
                </div>
                <div className="pt-3 border-t border-graphite-700">
                  <p className="text-xs text-graphite-500 mb-1">Recommendation</p>
                  <p className="text-sm">{result.recommendation}</p>
                </div>
                <p className="text-xs text-graphite-500/80 pt-2 border-t border-graphite-700">{result.explanation}</p>
                <p className="text-xs text-pulse-400">✓ Saved to prediction history</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
