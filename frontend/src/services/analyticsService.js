import api from "./api";

export const getAnalytics = () => api.get("/analytics").then((r) => r.data);
