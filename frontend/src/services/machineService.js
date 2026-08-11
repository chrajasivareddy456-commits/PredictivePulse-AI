import api from "./api";

export const listMachines = () => api.get("/machines").then((r) => r.data);
export const getMachine = (machineId) => api.get(`/machines/${machineId}`).then((r) => r.data);
export const createMachine = (data) => api.post("/machines", data).then((r) => r.data);
export const updateMachine = (machineId, data) => api.put(`/machines/${machineId}`, data).then((r) => r.data);
export const getMachineHistory = (machineId, limit = 50) =>
  api.get(`/machines/${machineId}/history`, { params: { limit } }).then((r) => r.data);
export const getMachineSensors = (machineId, limit = 100) =>
  api.get(`/machines/${machineId}/sensors`, { params: { limit } }).then((r) => r.data);
