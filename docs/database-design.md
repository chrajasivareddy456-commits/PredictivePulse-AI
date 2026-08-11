# Database Design (MongoDB / Mongoose)

## Collections

### User
`name, email (unique), password (bcrypt hash), role (operator|engineer|admin), timestamps`

### Machine
`machineId (unique), name, type, location, status (NORMAL|WARNING|CRITICAL|UNKNOWN), currentRisk (LOW|MEDIUM|HIGH|CRITICAL|UNKNOWN), lastAnalyzedAt, timestamps`

The source dataset has no physical machine ID; `DEFAULT-PUMP` is created as a logical profile the first time an analysis is run (upsert in `predictionController.js`). The schema itself places no limit on the number of machines, so it extends cleanly to real multi-machine data.

### SensorRecord
`machineId (indexed), timestamp (indexed), sensorValues (Map<string, number>), timestamps`
Sensor values are stored as a `Map` rather than 51 hardcoded schema fields, so the sensor set only needs to be defined once (in `ml-service/preprocessing/preprocess.py`) instead of being duplicated and kept in sync across the ML service and the Mongoose schema.

### Prediction
`machineId (indexed), sensorData (Map), predictedStatus, classificationConfidence, anomaly, anomalyScore, riskLevel, machineStatus, recommendation, source (manual|csv-batch), timestamp (indexed), userId (ref User), timestamps`

## Indexes
- `SensorRecord`: `{ machineId: 1, timestamp: -1 }`
- `Prediction`: `{ machineId: 1, timestamp: -1 }`

Both support the common query pattern "most recent N records for machine X" used by the Machine Details and Prediction History pages.

## Aggregations
Dashboard stats and the Analytics page use MongoDB aggregation pipelines (`$group`, `$dateToString`) rather than pulling all documents into Node and aggregating in JavaScript, so they scale reasonably as prediction history grows.
