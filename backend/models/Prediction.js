const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema(
  {
    machineId: { type: String, required: true, index: true },
    sensorData: { type: Map, of: Number, required: true },
    predictedStatus: { type: String, required: true },
    classificationConfidence: { type: Number, required: true },
    anomaly: { type: Boolean, required: true },
    anomalyScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
    machineStatus: { type: String, required: true },
    recommendation: { type: String, required: true },
    source: { type: String, enum: ["manual", "csv-batch"], default: "manual" },
    timestamp: { type: Date, default: Date.now, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

PredictionSchema.index({ machineId: 1, timestamp: -1 });

module.exports = mongoose.model("Prediction", PredictionSchema);
