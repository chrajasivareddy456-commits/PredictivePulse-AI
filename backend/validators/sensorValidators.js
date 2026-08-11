// sensor_15 is intentionally excluded — it is 100% missing in the source
// dataset (see ml-service/preprocessing/preprocess.py) and is dropped
// throughout the pipeline.
const SENSOR_COLUMNS = Array.from({ length: 52 }, (_, i) => `sensor_${String(i).padStart(2, "0")}`).filter(
  (c) => c !== "sensor_15"
);

function validateSensorPayload(body) {
  const errors = [];
  const provided = SENSOR_COLUMNS.filter((c) => body[c] !== undefined && body[c] !== null && body[c] !== "");

  if (provided.length === 0) {
    errors.push("At least one sensor value must be provided.");
  }

  for (const key of Object.keys(body)) {
    if (SENSOR_COLUMNS.includes(key) && body[key] !== null && body[key] !== undefined && body[key] !== "") {
      const num = Number(body[key]);
      if (Number.isNaN(num)) {
        errors.push(`Sensor field ${key} must be numeric.`);
      }
    }
  }

  return errors;
}

module.exports = { SENSOR_COLUMNS, validateSensorPayload };
