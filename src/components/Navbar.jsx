import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function cerrarSesion() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="nav">
      <div className="nav-left">
        <span className="nav-logo">🍽️ RestoApp</span>

        {/* ENLACES SOLO SI HAY USUARIO */}
        {user && (
          <>
            <Link to="/" className="nav-link">Inicio</Link>

            {(user.role === "Cocinero" || user.role === "Jefe") && (
              <Link to="/cocina" className="nav-link">Cocina</Link>
            )}

            {(user.role === "Cajero" || user.role === "Jefe") && (
              <Link to="/caja" className="nav-link">Caja</Link>
            )}

            {user.role === "Jefe" && (
              <Link to="/admin" className="nav-link">Administrador</Link>
            )}
          </>
        )}
      </div>

      <div className="nav-right">
        {!user ? (
          <Link to="/login" className="nav-btn-login">Iniciar sesión</Link>
        ) : (
          <>
            <span className="nav-user">
              👤 {user.email} — <b>{user.role}</b>
            </span>
            <button className="nav-btn-logout" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
