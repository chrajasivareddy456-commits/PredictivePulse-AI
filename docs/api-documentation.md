# API Documentation

See the root `README.md` §9 for the full endpoint tables (FastAPI + Node).

## Example: POST /api/predictions/analyze
Request:
```json
{
  "machineId": "DEFAULT-PUMP",
  "sensor_00": 2.4652,
  "sensor_01": 47.09,
  "sensor_04": 590.03
}
```
(Any subset of `sensor_00`–`sensor_51`, excluding `sensor_15`, may be supplied — missing sensors are median-imputed by the same pipeline used at training time.)

Response:
```json
{
  "result": {
    "machineId": "DEFAULT-PUMP",
    "predictedStatus": "NORMAL",
    "classificationConfidence": 0.97,
    "anomaly": false,
    "anomalyScore": 0.19,
    "riskLevel": "LOW",
    "machineStatus": "NORMAL",
    "recommendation": "Continue normal operation and routine monitoring.",
    "explanation": "...",
    "timestamp": "2026-01-01T00:00:00.000Z"
  },
  "prediction": { "_id": "...", "...": "the stored MongoDB document" }
}
```

## FastAPI Swagger
Full interactive API docs, generated automatically by FastAPI, are available at `http://localhost:8000/docs` once the ML service is running.

## Error format
Every error response from the Node backend is `{ "error": "human-readable message" }`. Raw stack traces are never sent to the client — they are logged server-side only (`middleware/errorHandler.js`).
