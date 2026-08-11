import React from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../layouts/AppLayout";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account details" />
      <div className="p-8 max-w-md">
        <Card>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-graphite-500">Name</dt>
              <dd>{user?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite-500">Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite-500">Role</dt>
              <dd className="capitalize">{user?.role}</dd>
            </div>
          </dl>
          <button
            onClick={handleLogout}
            className="mt-6 w-full text-sm px-4 py-2 rounded-md border border-signal-critical/40 text-signal-critical hover:bg-signal-critical/10 transition"
          >
            Logout
          </button>
        </Card>
      </div>
    </div>
  );
}
