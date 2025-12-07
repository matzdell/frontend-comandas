// src/pages/HistorialCaja.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";

function HistorialCaja() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Filtros
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [mesa, setMesa] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [limit, setLimit] = useState(50);

  async function cargarHistorial() {
    setCargando(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (desde) params.append("desde", desde);
      if (hasta) params.append("hasta", hasta);
      if (mesa) params.append("mesa", mesa);
      if (metodoPago) params.append("metodo_pago", metodoPago);
      if (limit) params.append("limit", limit);

      const url = "/api/caja/historial?" + params.toString();
      const data = await apiFetch(url);

      // Por si tu backend devuelve {rows: [...]}
      const lista = Array.isArray(data) ? data : data.rows || [];
      setPagos(lista);
    } catch (err) {
      console.error("Error cargando historial:", err);
      setError(err.message || "Error al cargar historial");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarHistorial();
  }, []);

  return (
    <div className="kds-container">
      <header className="kds-header">
        <h1>📜 Historial de Caja</h1>
      </header>

      <div className="kds-card" style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Filtros */}
        <div style={{ marginBottom: 16, fontSize: 14 }}>
          <h3>Filtros</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 8,
              marginTop: 8,
            }}
          >
            <div>
              <label>Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                style={{
                  width: "100%",
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label>Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                style={{
                  width: "100%",
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label>Mesa</label>
              <input
                type="number"
                min="1"
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                style={{
                  width: "100%",
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label>Método de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                style={{
                  width: "100%",
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                }}
              >
                <option value="">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div>
              <label>Máx. resultados</label>
              <input
                type="number"
                min="10"
                max="500"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                style={{
                  width: 100,
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                  marginLeft: 4,
                }}
              />
            </div>

            <button
              className="btn-reload"
              onClick={cargarHistorial}
              style={{ marginLeft: "auto", padding: "6px 12px" }}
            >
              🔍 Buscar
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: "crimson", marginBottom: 10 }}>{error}</p>
        )}

        {cargando && <p>Cargando historial...</p>}

        {!cargando && pagos.length === 0 && !error && (
          <p style={{ fontSize: 14 }}>
            No se encontraron pagos con esos filtros.
          </p>
        )}

        {!cargando && pagos.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    ID Pago
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    ID Comanda
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    Mesa
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    Total sin propina
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    Propina
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    Total pagado
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    Método
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    Entregado
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    Cambio
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: 6 }}>
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id_pago}>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                      {p.id_pago}
                    </td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                      {p.id_comanda}
                    </td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                      {p.mesa}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        padding: 6,
                        textAlign: "right",
                      }}
                    >
                      ${p.total_sin_propina.toLocaleString("es-CL")}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        padding: 6,
                        textAlign: "right",
                      }}
                    >
                      ${p.propina.toLocaleString("es-CL")}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        padding: 6,
                        textAlign: "right",
                      }}
                    >
                      ${p.total_pagado.toLocaleString("es-CL")}
                    </td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                      {p.metodo_pago}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        padding: 6,
                        textAlign: "right",
                      }}
                    >
                      {p.monto_entregado != null
                        ? "$" + p.monto_entregado.toLocaleString("es-CL")
                        : "-"}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        padding: 6,
                        textAlign: "right",
                      }}
                    >
                      {p.cambio != null
                        ? "$" + p.cambio.toLocaleString("es-CL")
                        : "-"}
                    </td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: 6 }}>
                      {new Date(p.pagado_en).toLocaleString("es-CL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistorialCaja;
