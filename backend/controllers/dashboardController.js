const Machine = require("../models/Machine");
const Prediction = require("../models/Prediction");
const mlService = require("../services/mlService");
const { getDBStatus } = require("../config/db");

async function getStats(req, res, next) {
  try {
    const [totalMachines, statusCounts, recentPredictions, anomalyCount] = await Promise.all([
      Machine.countDocuments(),
      Machine.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Prediction.find().sort({ timestamp: -1 }).limit(10),
      Prediction.countDocuments({ anomaly: true }),
    ]);

    const statusMap = { NORMAL: 0, WARNING: 0, CRITICAL: 0, UNKNOWN: 0 };
    for (const s of statusCounts) statusMap[s._id] = s.count;

    const mlHealth = await mlService.checkHealth();

    res.json({
      totalMachines,
      normal: statusMap.NORMAL,
      warning: statusMap.WARNING,
      critical: statusMap.CRITICAL,
      unknown: statusMap.UNKNOWN,
      activeAnomalies: anomalyCount,
      recentPredictions,
      systemHealth: {
        mlService: mlHealth.online ? "online" : "offline",
        backend: "online",
        database: getDBStatus(),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
