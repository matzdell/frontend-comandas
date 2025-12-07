// src/pages/Caja.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import io from "socket.io-client";
import "../App.css";

const TOTAL_MESAS = 19;

// Instancia de socket apuntando al backend
// Si más adelante quieres usar variable de entorno, puedes usar:
// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";
const BACKEND_URL = "http://localhost:3000";

const socket = io(BACKEND_URL, {
  transports: ["websocket"],
});

function crearMesasIniciales() {
  return Array.from({ length: TOTAL_MESAS }, (_, i) => ({
    id: i + 1,
    total: 0,
    estado: "Libre", // Libre | Abierta | Pagada
  }));
}

export default function Caja() {
  const [mesas, setMesas] = useState(crearMesasIniciales);

  const [comanda, setComanda] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | cargando | ok | error
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [propinaPorc, setPropinaPorc] = useState(0);
  const [metodoPago, setMetodoPago] = useState("debito"); // "debito" | "credito" | "efectivo"
  const [montoEfectivo, setMontoEfectivo] = useState("");

  // ================= SOCKET: totales de mesas =================
  useEffect(() => {
    console.log("[CAJA] montando componente, conectando socket…");

    const handleTotales = (data) => {
      console.log("[CAJA] caja_totales recibido:", data);
      // data = [{ mesaId, total, estado }, ...]
      setMesas(() => {
        const base = crearMesasIniciales(); // 19 mesas Libres en 0
        return base.map((m) => {
          const encontrada = data.find((d) => d.mesaId === m.id);
          return encontrada
            ? {
                ...m,
                total: encontrada.total,
                estado: encontrada.estado || "Abierta",
              }
            : m; // las que no vienen en data quedan como Libre / 0
        });
      });
    };

    socket.on("connect", () => {
      console.log("[CAJA] socket conectado", socket.id);
      socket.emit("caja_suscribirse_totales");
    });

    socket.on("caja_totales", handleTotales);

    return () => {
      console.log("[CAJA] desmontando Caja, desuscribiendo socket");
      socket.emit("caja_desuscribirse_totales");
      socket.off("caja_totales", handleTotales);
      socket.off("connect");
    };
  }, []);

  // ================= API: cargar comanda por mesa =================
  async function cargarComandaPorMesa(nroMesa) {
    setStatus("cargando");
    setError("");
    setMensaje("");
    setComanda(null);

    try {
      const data = await apiFetch(`/api/caja/mesa/${nroMesa}`);
      if (!data) {
        setStatus("ok");
        setMensaje(`Mesa ${nroMesa} sin comanda abierta.`);
        setComanda(null);
        return;
      }

      setComanda(data);
      setStatus("ok");
      setPropinaPorc(0);
      setMetodoPago("debito");
      setMontoEfectivo("");
    } catch (err) {
      console.error("Error cargando comanda por mesa:", err);
      setError(err.message || "Error al cargar comanda");
      setStatus("error");
    }
  }

  // ================= CÁLCULO DE TOTALES =================
  const total = comanda?.total || 0;

  const propinaReal = Math.round(total * (propinaPorc / 100));
  const propinaRedondeada = Math.round(propinaReal / 100) * 100;
  const totalReal = total + propinaReal;
  const totalConPropinaRedondeada = total + propinaRedondeada;
  const totalRedondeadoFinal = Math.round(totalReal / 100) * 100;

  const montoAPagar = totalConPropinaRedondeada;

  const efectivoNumber = Number(montoEfectivo) || 0;
  const cambio =
    metodoPago === "efectivo" && efectivoNumber > 0
      ? Math.max(efectivoNumber - montoAPagar, 0)
      : 0;
  const falta =
    metodoPago === "efectivo" && efectivoNumber > 0
      ? Math.max(montoAPagar - efectivoNumber, 0)
      : 0;

  // ================= CONFIRMAR PAGO =================
  async function handlePagar() {
    if (!comanda) return;

    setError("");
    setMensaje("");

    if (metodoPago === "efectivo") {
      if (!montoEfectivo) {
        setError("Ingresa con cuánto paga en efectivo.");
        return;
      }
      if (falta > 0) {
        setError("El monto en efectivo es menor al total a pagar.");
        return;
      }
    }

    try {
      const payload = {
        id_comanda: comanda.id_comanda,
        mesa: comanda.mesa,
        total_sin_propina: total,
        propina: propinaRedondeada,
        total_pagado: montoAPagar,
        metodo_pago: metodoPago,
        monto_entregado: metodoPago === "efectivo" ? efectivoNumber : null,
        cambio: metodoPago === "efectivo" ? cambio : 0,
      };

      await apiFetch("/api/caja/pagar", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // 🔥 Liberar mesa en la grilla inmediatamente
      setMesas((prev) =>
        prev.map((m) =>
          m.id === comanda.mesa
            ? { ...m, total: 0, estado: "Libre" }
            : m
        )
      );

      setMensaje("✅ Pago registrado y mesa liberada.");
      setComanda(null);
      setPropinaPorc(0);
      setMontoEfectivo("");
      setMetodoPago("debito");
    } catch (err) {
      console.error("Error al registrar pago:", err);
      setError(err.message || "Error al registrar el pago");
    }
  }

  // ================= Helpers UI =================
  function colorFondoMesa(estado) {
    if (estado === "Pagada") return "#dcfce7"; // verde claro
    if (estado === "Abierta") return "#fef9c3"; // amarillo claro
    return "#f3f4f6"; // gris
  }

  return (
    <div className="kds-container">
      <header className="kds-header">
        <div>
          <h1>💰 Caja</h1>
          <div className="kds-sub">
            {status === "cargando" && "Cargando comanda..."}
            {status === "ok" && comanda && (
              <>Comanda #{comanda.id_comanda} — Mesa {comanda.mesa}</>
            )}
            {status === "ok" && !comanda && !mensaje && "Selecciona una mesa."}
            {status === "error" && "Error al cargar comanda"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn-reload" href="/caja/historial">
            📜 Historial
          </a>
        </div>
      </header>

      {error && (
        <p style={{ color: "crimson", padding: 10 }}>
          {error}
        </p>
      )}

      {mensaje && !error && (
        <p style={{ color: "green", padding: 10 }}>
          {mensaje}
        </p>
      )}

      {/* ================= GRID DE MESAS ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 16,
          padding: 20,
        }}
      >
        {mesas.map((mesa) => (
          <div
            key={mesa.id}
            onClick={() => cargarComandaPorMesa(mesa.id)}
            style={{
              background: colorFondoMesa(mesa.estado),
              borderRadius: 12,
              padding: 12,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: 4 }}>Mesa {mesa.id}</h3>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
              {mesa.estado}
            </div>
            <div style={{ fontWeight: "bold", fontSize: 16 }}>
              ${mesa.total.toLocaleString("es-CL")}
            </div>
          </div>
        ))}
      </div>

      {/* ================= DETALLE DE COMANDA ================= */}
      {status === "ok" && comanda && (
        <div className="kds-card" style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ marginBottom: 10, fontSize: 14, opacity: 0.8 }}>
            <div>
              <b>ID Comanda:</b> {comanda.id_comanda}
            </div>
            <div>
              <b>Mesa:</b> {comanda.mesa}
            </div>
            <div>
              <b>Fecha/Hora:</b>{" "}
              {comanda.creado_en
                ? new Date(comanda.creado_en).toLocaleString()
                : "—"}
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              marginTop: 10,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "left",
                    padding: 6,
                  }}
                >
                  Producto
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "center",
                    padding: 6,
                  }}
                >
                  Cant.
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "right",
                    padding: 6,
                  }}
                >
                  Precio
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "right",
                    padding: 6,
                  }}
                >
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {comanda.items.map((item, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      padding: 6,
                    }}
                  >
                    {item.nombre}
                    {item.cliente_nro && (
                      <span style={{ fontSize: 12, opacity: 0.7 }}>
                        {" "}
                        (Cliente {item.cliente_nro})
                      </span>
                    )}
                    {item.notas && (
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        📝 {item.notas}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      padding: 6,
                      textAlign: "center",
                    }}
                  >
                    {item.cantidad}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      padding: 6,
                      textAlign: "right",
                    }}
                  >
                    ${item.precio.toLocaleString("es-CL")}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      padding: 6,
                      textAlign: "right",
                    }}
                  >
                    ${item.subtotal.toLocaleString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales y Propinas */}
          <div
            style={{
              marginTop: 16,
              borderTop: "1px solid #e5e7eb",
              paddingTop: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span>Total sin propina:</span>
              <strong>${total.toLocaleString("es-CL")}</strong>
            </div>

            {/* Selección Propina */}
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <span>Propina: </span>

              <button
                className="btn-reload"
                style={{ padding: "4px 8px", marginRight: 6 }}
                onClick={() => setPropinaPorc(0)}
              >
                0%
              </button>
              <button
                className="btn-reload"
                style={{ padding: "4px 8px", marginRight: 6 }}
                onClick={() => setPropinaPorc(10)}
              >
                10%
              </button>
              <button
                className="btn-reload"
                style={{ padding: "4px 8px", marginRight: 6 }}
                onClick={() => setPropinaPorc(15)}
              >
                15%
              </button>

              <span style={{ marginLeft: 8, fontSize: 13 }}>
                o personalizado:
              </span>
              <input
                type="number"
                min="0"
                max="100"
                value={propinaPorc}
                onChange={(e) =>
                  setPropinaPorc(Number(e.target.value) || 0)
                }
                style={{
                  width: 60,
                  marginLeft: 6,
                  padding: 4,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                }}
              />
              %
            </div>

            <div style={{ marginTop: 10 }}>
              <div
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>Propina exacta:</span>
                <strong>${propinaReal.toLocaleString("es-CL")}</strong>
              </div>

              <div
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>Propina redondeada (centenas):</span>
                <strong>
                  ${propinaRedondeada.toLocaleString("es-CL")}
                </strong>
              </div>
            </div>

            <hr style={{ margin: "10px 0" }} />

            <div
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span>Total exacto:</span>
              <strong>${totalReal.toLocaleString("es-CL")}</strong>
            </div>

            <div
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span>Total con propina redondeada:</span>
              <strong>
                ${totalConPropinaRedondeada.toLocaleString("es-CL")}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                fontSize: 17,
              }}
            >
              <span>Total redondeado final (centenas):</span>
              <strong>
                ${totalRedondeadoFinal.toLocaleString("es-CL")}
              </strong>
            </div>
          </div>

          {/* MÉTODO DE PAGO */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 12,
              borderTop: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <h3 style={{ marginBottom: 8 }}>Método de pago</h3>

            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <label>
                <input
                  type="radio"
                  value="debito"
                  checked={metodoPago === "debito"}
                  onChange={(e) => setMetodoPago(e.target.value)}
                />{" "}
                Tarjeta Débito
              </label>

              <label>
                <input
                  type="radio"
                  value="credito"
                  checked={metodoPago === "credito"}
                  onChange={(e) => setMetodoPago(e.target.value)}
                />{" "}
                Tarjeta Crédito
              </label>

              <label>
                <input
                  type="radio"
                  value="efectivo"
                  checked={metodoPago === "efectivo"}
                  onChange={(e) => setMetodoPago(e.target.value)}
                />{" "}
                Efectivo
              </label>
            </div>

            {(metodoPago === "debito" || metodoPago === "credito") && (
              <div style={{ marginBottom: 8 }}>
                Pagará con tarjeta{" "}
                <b>{metodoPago === "debito" ? "débito" : "crédito"}</b> por{" "}
                <b>${montoAPagar.toLocaleString("es-CL")}</b>.
              </div>
            )}

            {metodoPago === "efectivo" && (
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 6 }}>
                  <span>Monto a pagar: </span>
                  <strong>
                    ${montoAPagar.toLocaleString("es-CL")}
                  </strong>
                </div>

                <label style={{ display: "block", marginBottom: 6 }}>
                  ¿Con cuánto paga?
                  <input
                    type="number"
                    min="0"
                    value={montoEfectivo}
                    onChange={(e) => setMontoEfectivo(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                    }}
                  />
                </label>

                {efectivoNumber > 0 && (
                  <>
                    {falta > 0 ? (
                      <div style={{ color: "crimson", marginTop: 4 }}>
                        Falta por pagar:{" "}
                        <b>${falta.toLocaleString("es-CL")}</b>
                      </div>
                    ) : (
                      <div style={{ marginTop: 4 }}>
                        Cambio:{" "}
                        <b>${cambio.toLocaleString("es-CL")}</b>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                className="btn-reload"
                onClick={handlePagar}
                style={{
                  padding: "8px 14px",
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                ✅ Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "ok" && !comanda && !error && (
        <p style={{ padding: 20 }}>Selecciona una mesa para ver su detalle.</p>
      )}
    </div>
  );
}
