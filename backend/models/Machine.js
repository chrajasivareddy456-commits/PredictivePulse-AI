const mongoose = require("mongoose");

// The supplied source dataset (sensor.csv) does not contain a physical
// multi-machine identifier. This schema nonetheless supports multiple
// logical machine profiles so the platform is ready for real multi-machine
// data in the future. "DEFAULT-PUMP" is the logical profile created for
// the current single-pump dataset.
const MachineSchema = new mongoose.Schema(
  {
    machineId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    type: { type: String, default: "Pump" },
    location: { type: String, default: "Unspecified" },
    status: { type: String, enum: ["NORMAL", "WARNING", "CRITICAL", "UNKNOWN"], default: "UNKNOWN" },
    currentRisk: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"], default: "UNKNOWN" },
    lastAnalyzedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Machine", MachineSchema);
