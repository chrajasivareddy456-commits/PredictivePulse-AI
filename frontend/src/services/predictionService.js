import api from "./api";

export const analyzeMachine = (payload) => api.post("/predictions/analyze", payload).then((r) => r.data);

export const listPredictions = (params) => api.get("/predictions", { params }).then((r) => r.data);

export const getPrediction = (id) => api.get(`/predictions/${id}`).then((r) => r.data);

export const getSample = () => api.get("/predictions/sample").then((r) => r.data);

export const uploadCsv = (file, machineId, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  if (machineId) form.append("machineId", machineId);
  return api
    .post("/predictions/upload-csv", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress) onProgress(Math.round((evt.loaded * 100) / evt.total));
      },
    })
    .then((r) => r.data);
};
