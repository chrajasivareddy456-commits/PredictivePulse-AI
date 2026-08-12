const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 10000, // 10s — the ML service is a local process, this is generous
});

async function checkHealth() {
  try {
    const { data } = await client.get("/health");
    return { online: true, ...data };
  } catch (err) {
    return { online: false };
  }
}

async function analyze(sensorPayload) {
  const { data } = await client.post("/analyze", sensorPayload);
  return data;
}

async function getModelInfo() {
  const { data } = await client.get("/model-info");
  return data;
}

async function getSample() {
  const { data } = await client.get("/sample");
  return data;
}

async function predictCsv(fileBuffer, filename) {
  const FormData = require("form-data");
  const form = new FormData();
  form.append("file", fileBuffer, filename);
  const { data } = await client.post("/predict-csv", form, {
    headers: form.getHeaders(),
    responseType: "text",
    timeout: 60000, // batch CSV jobs can take longer
  });
  return data; // CSV text
}

module.exports = { checkHealth, analyze, getModelInfo, getSample, predictCsv, ML_SERVICE_URL };
