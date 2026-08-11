import api from "./api";

export const getModelInfo = () => api.get("/model-info").then((r) => r.data);
