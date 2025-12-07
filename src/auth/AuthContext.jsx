// src/auth/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking"); // 'checking' | 'authed' | 'guest'

  // Al montar la app, leer token + user desde localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const rawUser = localStorage.getItem("user");

      if (token && rawUser) {
        const parsedUser = JSON.parse(rawUser);
        setUser(parsedUser);
        setStatus("authed");
      } else {
        setUser(null);
        setStatus("guest");
      }
    } catch (err) {
      console.error("Error leyendo localStorage:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setStatus("guest");
    }
  }, []);

  // Login para el panel web
  async function login(email, password) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // backend devuelve: { ok, token, id, email, role, nombre, user }
    const token = data.token;
    const u =
      data.user || {
        id: data.id,
        email: data.email,
        role: data.role,
        nombre: data.nombre,
      };

    if (token) {
      localStorage.setItem("token", token);
    }
    localStorage.setItem("user", JSON.stringify(u));

    setUser(u);
    setStatus("authed");
    return u; // o data, según lo que uses en Login.jsx
  }

  async function logout() {
    try {
      // opcional, no afecta a la sesión en front
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Error en logout:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setStatus("guest");
  }

  const value = {
    user,
    status,
    isAuthenticated: status === "authed",
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
