import React, { useEffect, useState } from "react";
import { PageHeader } from "../layouts/AppLayout";
import { Card, StatCard } from "../components/Card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { getModelInfo } from "../services/modelService";
import { getErrorMessage } from "../services/api";

export default function ModelInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getModelInfo()
      .then(setInfo)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Model Information" subtitle="Actual evaluation results from the last training run — not hardcoded" />
      <div className="p-8 space-y-6">
        <ErrorAlert message={error} />
        {loading && <LoadingSpinner label="Loading model information" />}

        {info && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Selected Classifier" value={info.model_name} accent="text-pulse-400" />
              <StatCard label="Training Samples" value={info.training_size.toLocaleString()} />
              <StatCard label="Test Samples" value={info.test_size.toLocaleString()} />
              <StatCard label="Features" value={info.feature_count} />
            </div>

            <Card title="Selected Model — Overall Metrics">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-graphite-500">Accuracy</p><p className="font-mono text-lg">{(info.selected_model_metrics.accuracy * 100).toFixed(2)}%</p></div>
                <div><p className="text-xs text-graphite-500">Macro Precision</p><p className="font-mono text-lg">{info.selected_model_metrics.macro_precision.toFixed(3)}</p></div>
                <div><p className="text-xs text-graphite-500">Macro Recall</p><p className="font-mono text-lg">{info.selected_model_metrics.macro_recall.toFixed(3)}</p></div>
                <div><p className="text-xs text-graphite-500">Macro F1</p><p className="font-mono text-lg">{info.selected_model_metrics.macro_f1.toFixed(3)}</p></div>
              </div>
              <p className="text-xs text-graphite-500 mt-3">
                Accuracy is reported but was <strong>not</strong> the selection criterion — the production model was chosen by macro F1,
                which weighs all three classes equally regardless of how many examples they have.
              </p>
            </Card>

            <Card title="Per-Class Metrics">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-graphite-500 uppercase border-b border-graphite-700">
                    <th className="py-2">Class</th>
                    <th className="py-2">Precision</th>
                    <th className="py-2">Recall</th>
                    <th className="py-2">F1</th>
                    <th className="py-2">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(info.selected_model_metrics.per_class).map(([cls, m]) => (
                    <tr key={cls} className="border-b border-graphite-800 last:border-0">
                      <td className="py-2.5 font-mono">{cls}</td>
                      <td className="py-2.5 font-mono">{m.precision.toFixed(3)}</td>
                      <td className="py-2.5 font-mono">{m.recall.toFixed(3)}</td>
                      <td className="py-2.5 font-mono">{m.f1.toFixed(3)}</td>
                      <td className="py-2.5 font-mono">{m.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {info.classes.includes("BROKEN") && (
                <p className="text-xs text-signal-medium mt-3">
                  ⚠ BROKEN-class metrics are based on very few examples in the source dataset and should be treated as
                  statistically unreliable, not a robust real-world performance estimate.
                </p>
              )}
            </Card>

            <Card title="Confusion Matrix" subtitle={`Rows = actual, Columns = predicted. Labels: ${info.selected_model_metrics.confusion_matrix_labels.join(", ")}`}>
              <table className="text-sm font-mono">
                <tbody>
                  {info.selected_model_metrics.confusion_matrix.map((row, i) => (
                    <tr key={i}>
                      <td className="pr-3 text-xs text-graphite-500">{info.selected_model_metrics.confusion_matrix_labels[i]}</td>
                      {row.map((val, j) => (
                        <td key={j} className="px-3 py-1 text-center border border-graphite-700">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {info.feature_importance && Object.keys(info.feature_importance).length > 0 && (
              <Card title="Top Feature Importance" subtitle="From the trained model — correlation, not causation">
                <div className="space-y-2">
                  {Object.entries(info.feature_importance).slice(0, 10).map(([feat, val]) => (
                    <div key={feat} className="flex items-center gap-3">
                      <span className="font-mono text-xs w-24 text-graphite-500">{feat}</span>
                      <div className="flex-1 bg-graphite-800 rounded h-2 overflow-hidden">
                        <div className="h-full bg-pulse-500" style={{ width: `${Math.min(val * 400, 100)}%` }} />
                      </div>
                      <span className="font-mono text-xs w-14 text-right">{val.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card title="Why These Models?">
              <div className="space-y-3 text-sm text-graphite-500">
                <p><strong className="text-graphite-400">Classification</strong> recognizes known machine states (NORMAL, RECOVERING, BROKEN) that have been observed and labelled before.</p>
                <p><strong className="text-graphite-400">Isolation Forest</strong> flags statistically unusual sensor patterns that don't match normal operation — useful for catching unknown irregularities the classifier was never trained on, but it does not identify the specific cause of an anomaly.</p>
                <p><strong className="text-graphite-400">BROKEN-class limitation:</strong> only {info.class_distribution_full_dataset.BROKEN} labelled BROKEN examples exist in the entire dataset. More labelled failure data is needed before this system's BROKEN-detection could be trusted for real deployment decisions.</p>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
