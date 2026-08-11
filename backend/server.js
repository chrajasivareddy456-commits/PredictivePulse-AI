require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB, getDBStatus } = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const machineRoutes = require("./routes/machineRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const modelRoutes = require("./routes/modelRoutes");
const mlService = require("./services/mlService");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", async (req, res) => {
  const mlHealth = await mlService.checkHealth();
  res.json({
    status: "ok",
    backend: "online",
    database: getDBStatus(),
    mlService: mlHealth.online ? "online" : "offline",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/model-info", modelRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] PredictivePulse backend listening on http://localhost:${PORT}`);
    console.log(`[server] ML service expected at ${mlService.ML_SERVICE_URL}`);
  });
}

start();

module.exports = app;
