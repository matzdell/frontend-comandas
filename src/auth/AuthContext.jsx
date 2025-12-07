// src/auth/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "../api";

// Creamos el contexto
const AuthContext = createContext(null);

// Proveedor de autenticación
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking"); // 'checking' | 'authed' | 'guest'

  // Al montar la app, intentamos validar el token guardado en localStorage
  useEffect(() => {
    async function cargarUsuario() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // No hay token -> invitado
          setUser(null);
          setStatus("guest");
          return;
        }

        // /api/auth/me ahora usa authRequired (cookie o Bearer)
        const data = await apiFetch("/api/auth/me");
        // Esperamos { ok: true, user }
        if (data?.ok && data.user) {
          setUser(data.user);
          setStatus("authed");
        } else {
          localStorage.removeItem("token");
          setUser(null);
          setStatus("guest");
        }
      } catch (err) {
        console.error("Error cargando /api/auth/me:", err);
        localStorage.removeItem("token");
        setUser(null);
        setStatus("guest");
      }
    }

    cargarUsuario();
  }, []);

  // Login para el panel web
  async function login(email, password) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // el backend devuelve: { ok, token, id, email, role, nombre, user }
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }

    // preferimos data.user (payload limpio)
    const u =
      data.user || {
        id: data.id,
        email: data.email,
        role: data.role,
        nombre: data.nombre,
      };

    setUser(u);
    setStatus("authed");
    return data;
  }

  // Logout
  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Error en logout:", err);
    }
    localStorage.removeItem("token");
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

// Hook para consumir el contexto
export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
