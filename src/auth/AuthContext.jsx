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

  // Al montar la app, intenta leer /api/auth/me (cookie httpOnly)
  useEffect(() => {
    async function cargarUsuario() {
      try {
        const data = await apiFetch("/api/auth/me");

        if (data) {
          setUser(data);
          setStatus("authed");
        } else {
          setUser(null);
          setStatus("guest");
        }
      } catch (err) {
        console.error("Error cargando /api/auth/me:", err);
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
    // el backend devuelve el payload (id, email, role, nombre, token, user, etc.)
    setUser(data);
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
    setUser(null);
    setStatus("guest");
  }

  const value = {
    user,
    status,
    isAuthenticated: !!user,
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

// Export default (por si en algún lado lo usas así)
export default AuthContext;
