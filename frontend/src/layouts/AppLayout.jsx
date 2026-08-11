import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/machines", label: "Machines" },
  { to: "/analyze", label: "Analyze" },
  { to: "/upload", label: "Upload Data" },
  { to: "/history", label: "Prediction History" },
  { to: "/analytics", label: "Analytics" },
  { to: "/model-info", label: "Model Information" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-graphite-700 bg-graphite-900/60 flex flex-col">
        <div className="px-5 py-5 border-b border-graphite-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pulse-500 pulse-dot" />
            <span className="font-semibold tracking-tight">PredictivePulse</span>
          </div>
          <p className="text-[11px] text-graphite-500 mt-1 uppercase tracking-wider">Factory AI Diagnostics</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm transition ${
                  isActive
                    ? "bg-pulse-500/10 text-pulse-400 border border-pulse-500/30"
                    : "text-graphite-500 hover:text-graphite-400 hover:bg-graphite-800 border border-transparent"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-graphite-700">
          <button
            onClick={() => navigate("/profile")}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-graphite-500 hover:text-graphite-400 hover:bg-graphite-800"
          >
            {user?.name || "Profile"}
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-signal-critical/80 hover:bg-signal-critical/10"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="border-b border-graphite-700 px-8 py-5 flex items-center justify-between bg-graphite-900/40">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-graphite-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
