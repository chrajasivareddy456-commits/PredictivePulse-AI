const Machine = require("../models/Machine");
const SensorRecord = require("../models/SensorRecord");
const Prediction = require("../models/Prediction");

async function listMachines(req, res, next) {
  try {
    const machines = await Machine.find().sort({ createdAt: -1 });
    res.json({ machines });
  } catch (err) {
    next(err);
  }
}

async function getMachine(req, res, next) {
  try {
    const machine = await Machine.findOne({ machineId: req.params.machineId });
    if (!machine) return res.status(404).json({ error: "Machine not found." });
    res.json({ machine });
  } catch (err) {
    next(err);
  }
}

async function createMachine(req, res, next) {
  try {
    const { machineId, name, type, location } = req.body;
    if (!machineId || !name) {
      return res.status(400).json({ error: "machineId and name are required." });
    }
    const machine = await Machine.create({ machineId, name, type, location });
    res.status(201).json({ machine });
  } catch (err) {
    next(err);
  }
}

async function updateMachine(req, res, next) {
  try {
    const machine = await Machine.findOneAndUpdate(
      { machineId: req.params.machineId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!machine) return res.status(404).json({ error: "Machine not found." });
    res.json({ machine });
  } catch (err) {
    next(err);
  }
}

async function getMachineSensors(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const records = await SensorRecord.find({ machineId: req.params.machineId })
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json({ records });
  } catch (err) {
    next(err);
  }
}

async function addMachineSensorRecord(req, res, next) {
  try {
    const record = await SensorRecord.create({
      machineId: req.params.machineId,
      timestamp: req.body.timestamp || new Date(),
      sensorValues: req.body.sensorValues,
    });
    res.status(201).json({ record });
  } catch (err) {
    next(err);
  }
}

async function getMachineHistory(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const predictions = await Prediction.find({ machineId: req.params.machineId })
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json({ predictions });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMachines,
  getMachine,
  createMachine,
  updateMachine,
  getMachineSensors,
  addMachineSensorRecord,
  getMachineHistory,
};
