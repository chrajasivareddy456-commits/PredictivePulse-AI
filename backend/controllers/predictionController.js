const { parse } = require("csv-parse/sync");
const Prediction = require("../models/Prediction");
const Machine = require("../models/Machine");
const mlService = require("../services/mlService");
const { SENSOR_COLUMNS, validateSensorPayload } = require("../validators/sensorValidators");

async function upsertMachineAfterAnalysis(machineId, result) {
  await Machine.findOneAndUpdate(
    { machineId },
    {
      $setOnInsert: { machineId, name: machineId },
      $set: {
        status: result.machineStatus,
        currentRisk: result.riskLevel,
        lastAnalyzedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
}

async function analyzeMachine(req, res, next) {
  try {
    const errors = validateSensorPayload(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(" ") });

    const machineId = req.body.machineId || "DEFAULT-PUMP";
    const sensorPayload = { machineId };
    for (const col of SENSOR_COLUMNS) {
      if (req.body[col] !== undefined && req.body[col] !== "") {
        sensorPayload[col] = Number(req.body[col]);
      }
    }

    const result = await mlService.analyze(sensorPayload);

    const sensorDataMap = {};
    for (const col of SENSOR_COLUMNS) {
      if (sensorPayload[col] !== undefined) sensorDataMap[col] = sensorPayload[col];
    }

    const prediction = await Prediction.create({
      machineId,
      sensorData: sensorDataMap,
      predictedStatus: result.predictedStatus,
      classificationConfidence: result.classificationConfidence,
      anomaly: result.anomaly,
      anomalyScore: result.anomalyScore,
      riskLevel: result.riskLevel,
      machineStatus: result.machineStatus,
      recommendation: result.recommendation,
      source: "manual",
      timestamp: result.timestamp,
      userId: req.user?.id,
    });

    await upsertMachineAfterAnalysis(machineId, result);

    res.json({ result, prediction });
  } catch (err) {
    next(err);
  }
}

async function listPredictions(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    const filter = {};
    if (req.query.machineId) filter.machineId = req.query.machineId;
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
    if (req.query.predictedStatus) filter.predictedStatus = req.query.predictedStatus;

    const [predictions, total] = await Promise.all([
      Prediction.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Prediction.countDocuments(filter),
    ]);

    res.json({ predictions, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

async function getPrediction(req, res, next) {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) return res.status(404).json({ error: "Prediction not found." });
    res.json({ prediction });
  } catch (err) {
    next(err);
  }
}

async function uploadCsv(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file was uploaded." });
    }

    const csvText = await mlService.predictCsv(
      req.file.buffer,
      req.file.originalname
    );

    const rows = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    const machineId = req.body.machineId || "DEFAULT-PUMP";
    const BATCH_SIZE = 500;
    let stored = 0;

    // Store all predictions in MongoDB
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((row) => {
        const sensorDataMap = {};

        for (const col of SENSOR_COLUMNS) {
          if (row[col] !== undefined && row[col] !== "") {
            sensorDataMap[col] = Number(row[col]);
          }
        }

        // Convert predicted machine state into dashboard machine status
        let machineStatus = "UNKNOWN";

        if (row.predictedStatus === "BROKEN") {
          machineStatus = "CRITICAL";
        } else if (row.predictedStatus === "RECOVERING") {
          machineStatus = "WARNING";
        } else if (row.predictedStatus === "NORMAL") {
          machineStatus = "NORMAL";
        }

        return {
          machineId,
          sensorData: sensorDataMap,
          predictedStatus: row.predictedStatus,
          classificationConfidence: Number(
            row.classificationConfidence
          ),
          anomaly:
            row.anomaly === "True" ||
            row.anomaly === "true",
          anomalyScore: Number(row.anomalyScore),
          riskLevel: row.riskLevel,
          machineStatus,
          recommendation:
            row.predictedStatus === "BROKEN"
              ? "Immediate inspection and maintenance recommended."
              : row.predictedStatus === "RECOVERING"
              ? "Continue monitoring machine recovery."
              : "Continue normal operation and routine monitoring.",
          source: "csv-batch",
          timestamp: row.timestamp || new Date(),
          userId: req.user?.id,
        };
      });

      await Prediction.insertMany(batch, { ordered: false });
      stored += batch.length;
    }

    // ---------------------------------------------------------
    // UPDATE CURRENT MACHINE STATUS
    // ---------------------------------------------------------
    // Find the chronologically latest prediction from this upload.
    // This makes the dashboard represent the machine's latest state.
    // ---------------------------------------------------------

    if (rows.length > 0) {
      const latestRow = [...rows].sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      })[0];

      let latestMachineStatus = "UNKNOWN";

      if (latestRow.predictedStatus === "BROKEN") {
        latestMachineStatus = "CRITICAL";
      } else if (latestRow.predictedStatus === "RECOVERING") {
        latestMachineStatus = "WARNING";
      } else if (latestRow.predictedStatus === "NORMAL") {
        latestMachineStatus = "NORMAL";
      }

      const latestResult = {
        predictedStatus: latestRow.predictedStatus,
        machineStatus: latestMachineStatus,
        riskLevel: latestRow.riskLevel,
      };

      await upsertMachineAfterAnalysis(
        machineId,
        latestResult
      );

      console.log(
        `[csv] ${machineId} updated -> ${latestMachineStatus} / ${latestRow.riskLevel}`
      );
    }

    // ---------------------------------------------------------
    // CREATE UPLOAD SUMMARY
    // ---------------------------------------------------------

    const summary = rows.reduce(
      (acc, r) => {
        acc.total += 1;

        acc.byStatus[r.predictedStatus] =
          (acc.byStatus[r.predictedStatus] || 0) + 1;

        acc.byRisk[r.riskLevel] =
          (acc.byRisk[r.riskLevel] || 0) + 1;

        if (
          r.anomaly === "True" ||
          r.anomaly === "true"
        ) {
          acc.anomalies += 1;
        }

        return acc;
      },
      {
        total: 0,
        anomalies: 0,
        byStatus: {},
        byRisk: {},
      }
    );

    res.json({
      summary,
      storedRecords: stored,
      machineId,
      latestMachineStatus:
        rows.length > 0
          ? rows
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.timestamp || 0) -
                  new Date(a.timestamp || 0)
              )[0].predictedStatus
          : "UNKNOWN",
      csv: csvText,
    });
  } catch (err) {
    next(err);
  }
}

async function getSampleRow(req, res, next) {
  try {
    const sample = await mlService.getSample();
    res.json(sample);
  } catch (err) {
    next(err);
  }
}

module.exports = { analyzeMachine, listPredictions, getPrediction, uploadCsv, getSampleRow };
