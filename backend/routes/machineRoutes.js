const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  listMachines,
  getMachine,
  createMachine,
  updateMachine,
  getMachineSensors,
  addMachineSensorRecord,
  getMachineHistory,
} = require("../controllers/machineController");

router.get("/", requireAuth, listMachines);
router.post("/", requireAuth, createMachine);
router.get("/:machineId", requireAuth, getMachine);
router.put("/:machineId", requireAuth, updateMachine);
router.get("/:machineId/sensors", requireAuth, getMachineSensors);
router.post("/:machineId/sensors", requireAuth, addMachineSensorRecord);
router.get("/:machineId/history", requireAuth, getMachineHistory);

module.exports = router;
