import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Machines from "./pages/Machines";
import MachineDetails from "./pages/MachineDetails";
import Analyze from "./pages/Analyze";
import CsvUpload from "./pages/CsvUpload";
import PredictionHistory from "./pages/PredictionHistory";
import Analytics from "./pages/Analytics";
import ModelInfo from "./pages/ModelInfo";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/machines" element={<Machines />} />
        <Route path="/machines/:machineId" element={<MachineDetails />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/upload" element={<CsvUpload />} />
        <Route path="/history" element={<PredictionHistory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/model-info" element={<ModelInfo />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
