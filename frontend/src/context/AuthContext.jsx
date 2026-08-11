import React, { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("pp_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("pp_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then(({ user }) => {
        setUser(user);
        localStorage.setItem("pp_user", JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem("pp_token");
        localStorage.removeItem("pp_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const { token, user } = await authService.login(credentials);
    localStorage.setItem("pp_token", token);
    localStorage.setItem("pp_user", JSON.stringify(user));
    setUser(user);
  }

  async function register(data) {
    const { token, user } = await authService.register(data);
    localStorage.setItem("pp_token", token);
    localStorage.setItem("pp_user", JSON.stringify(user));
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("pp_token");
    localStorage.removeItem("pp_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
