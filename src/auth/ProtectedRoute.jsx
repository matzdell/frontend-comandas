// src/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, status } = useAuth();
  const location = useLocation();

  // Mientras estamos verificando la sesión (cookie /api/auth/me)
  if (status === "checking") {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        Cargando sesión...
      </div>
    );
  }

  // Si no hay usuario → mandar a login
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Si hay restricción de roles y no coincide → 403
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  // Todo OK, renderizamos la ruta
  return children;
}
