const mongoose = require("mongoose");

// Sensor values are stored as a Map<string, number> rather than 51+
// hardcoded fields, since the sensor set is defined once in the ML
// service (preprocessing/preprocess.py) and duplicating it here would
// require keeping two schemas in sync by hand.
const SensorRecordSchema = new mongoose.Schema(
  {
    machineId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    sensorValues: { type: Map, of: Number, required: true },
  },
  { timestamps: true }
);

SensorRecordSchema.index({ machineId: 1, timestamp: -1 });

module.exports = mongoose.model("SensorRecord", SensorRecordSchema);
