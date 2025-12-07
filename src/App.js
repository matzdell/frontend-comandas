// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import HistorialCaja from "./pages/HistorialCaja";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import EditProducto from "./pages/EditProducto";
import Cocina from "./pages/Cocina";
import Caja from "./pages/Caja";
import Forbidden from "./pages/Forbidden";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* PÚBLICAS */}
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />

          {/* PRIVADAS */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cocina"
            element={
              <ProtectedRoute roles={["Cocinero", "Jefe"]}>
                <Cocina />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caja"
            element={
              <ProtectedRoute roles={["Cajero", "Jefe"]}>
                <Caja />
              </ProtectedRoute>
            }
          />

          {/* 👇 RUTA HISTORIAL CAJA */}
          <Route
            path="/caja/historial"
            element={
              <ProtectedRoute roles={["Cajero", "Jefe"]}>
                <HistorialCaja />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["Jefe"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/productos/:id"
            element={
              <ProtectedRoute roles={["Jefe"]}>
                <EditProducto />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
