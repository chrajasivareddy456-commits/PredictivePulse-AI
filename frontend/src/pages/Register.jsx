import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorAlert } from "../components/ErrorAlert";
import { getErrorMessage } from "../services/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pulse-500 pulse-dot" />
            <span className="font-semibold text-lg tracking-tight">PredictivePulse</span>
          </div>
          <p className="text-xs text-graphite-500 uppercase tracking-wider">Factory AI Diagnostics</p>
        </div>
        <form onSubmit={handleSubmit} className="panel shadow-panel p-6 space-y-4">
          <h2 className="text-sm font-medium text-graphite-500 uppercase tracking-wide">Create Account</h2>
          <ErrorAlert message={error} />
          <div>
            <label className="block text-xs text-graphite-500 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-pulse-500"
            />
          </div>
          <div>
            <label className="block text-xs text-graphite-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-pulse-500"
            />
          </div>
          <div>
            <label className="block text-xs text-graphite-500 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-graphite-900 border border-graphite-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-pulse-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pulse-500 hover:bg-pulse-600 text-graphite-950 font-medium rounded-md py-2 text-sm transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <p className="text-xs text-graphite-500 text-center">
            Already have an account? <Link to="/login" className="text-pulse-400 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
