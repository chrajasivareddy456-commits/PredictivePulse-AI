const Prediction = require("../models/Prediction");

async function getAnalytics(req, res, next) {
  try {
    const [statusDist, riskDist, anomalyDist, timeline] = await Promise.all([
      Prediction.aggregate([{ $group: { _id: "$predictedStatus", count: { $sum: 1 } } }]),
      Prediction.aggregate([{ $group: { _id: "$riskLevel", count: { $sum: 1 } } }]),
      Prediction.aggregate([{ $group: { _id: "$anomaly", count: { $sum: 1 } } }]),
      Prediction.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            count: { $sum: 1 },
            anomalies: { $sum: { $cond: ["$anomaly", 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 90 },
      ]),
    ]);

    res.json({
      statusDistribution: statusDist,
      riskDistribution: riskDist,
      anomalyDistribution: anomalyDist,
      predictionTimeline: timeline,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics };
