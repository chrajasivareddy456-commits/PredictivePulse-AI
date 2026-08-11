import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { PageHeader } from "../layouts/AppLayout";
import { Card } from "../components/Card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { EmptyState } from "../components/EmptyState";
import { getAnalytics } from "../services/analyticsService";
import { getErrorMessage } from "../services/api";

const COLORS = ["#2DD4BF", "#F5924A", "#F1554C", "#F5C451", "#445260"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const hasData = data && (data.statusDistribution?.length || 0) > 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Aggregated statistics from stored predictions" />
      <div className="p-8 space-y-6">
        <ErrorAlert message={error} />
        {loading && <LoadingSpinner label="Loading analytics" />}

        {!loading && !hasData && (
          <EmptyState title="No analytics data available" description="Analytics populate once predictions have been recorded." />
        )}

        {!loading && hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Machine Status Distribution">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.statusDistribution.map((d) => ({ name: d._id, count: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#212B33" />
                  <XAxis dataKey="name" stroke="#445260" fontSize={12} />
                  <YAxis stroke="#445260" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#12181C", border: "1px solid #212B33" }} />
                  <Bar dataKey="count" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Risk Distribution">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.riskDistribution.map((d) => ({ name: d._id, value: d.count }))}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {data.riskDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#12181C", border: "1px solid #212B33" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Anomaly Distribution">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.anomalyDistribution.map((d) => ({ name: d._id ? "Anomaly" : "Normal", count: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#212B33" />
                  <XAxis dataKey="name" stroke="#445260" fontSize={12} />
                  <YAxis stroke="#445260" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#12181C", border: "1px solid #212B33" }} />
                  <Bar dataKey="count" fill="#F5924A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Prediction Timeline" subtitle="Daily prediction volume and anomaly count">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.predictionTimeline.map((d) => ({ date: d._id, count: d.count, anomalies: d.anomalies }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#212B33" />
                  <XAxis dataKey="date" stroke="#445260" fontSize={10} />
                  <YAxis stroke="#445260" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#12181C", border: "1px solid #212B33" }} />
                  <Line type="monotone" dataKey="count" stroke="#2DD4BF" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="anomalies" stroke="#F1554C" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
