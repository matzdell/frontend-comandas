// src/pages/AdminKpi.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "../App.css";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AdminKpi() {
  const [dataKpi, setDataKpi] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarKpi() {
      try {
        setStatus("loading");
        setError("");

        const data = await apiFetch("/api/admin/kpi/ticket-promedio");
        console.log("[ADMIN-KPI] datos recibidos:", data);
        setDataKpi(data || []);
        setStatus("ok");
      } catch (err) {
        console.error("Error cargando KPI:", err);
        setError(err.message || "Error al cargar KPI");
        setStatus("error");
      }
    }

    cargarKpi();
  }, []);

  const labels = dataKpi.map((row) =>
    new Date(row.dia).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
    })
  );

  const ticketPromedio = dataKpi.map((row) => Number(row.ticket_promedio || 0));
  const ventasTotales = dataKpi.map((row) => Number(row.ventas_totales || 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Ticket promedio ($)",
        data: ticketPromedio,
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: "Ventas totales ($)",
        data: ventasTotales,
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y || 0;
            return `${label}: $${value.toLocaleString("es-CL")}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${Number(value).toLocaleString("es-CL")}`,
        },
      },
    },
  };

  const ultimoDia = dataKpi.length > 0 ? dataKpi[dataKpi.length - 1] : null;

  return (
    <div className="kds-container" style={{ padding: 20 }}>
      <header className="kds-header">
        <div>
          <h1>📊 Panel de KPIs</h1>
          <div className="kds-sub">
            Ticket promedio y ventas por día
          </div>
        </div>
      </header>

      {status === "loading" && (
        <p style={{ padding: 10 }}>Cargando datos de KPI...</p>
      )}

      {status === "error" && (
        <p style={{ padding: 10, color: "crimson" }}>{error}</p>
      )}

      {status === "ok" && (
        <>
          {/* DEBUG: ver crudo lo que viene del backend */}
          <pre
            style={{
              background: "#111827",
              color: "#e5e7eb",
              padding: 10,
              fontSize: 11,
              borderRadius: 8,
              overflowX: "auto",
              marginBottom: 16,
            }}
          >
            {JSON.stringify(dataKpi, null, 2)}
          </pre>

          {/* Tarjetas resumen */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 10,
            }}
          >
            <div
              className="kds-card"
              style={{ minWidth: 220, padding: 16, flex: "1 1 220px" }}
            >
              <h3>Ticket promedio (último día)</h3>
              <p style={{ fontSize: 24, fontWeight: "bold" }}>
                {ultimoDia
                  ? `$${Number(
                      ultimoDia.ticket_promedio
                    ).toLocaleString("es-CL")}`
                  : "—"}
              </p>
              {ultimoDia && (
                <p style={{ fontSize: 13, opacity: 0.8 }}>
                  Fecha:{" "}
                  {new Date(ultimoDia.dia).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div
              className="kds-card"
              style={{ minWidth: 220, padding: 16, flex: "1 1 220px" }}
            >
              <h3>Ventas totales (último día)</h3>
              <p style={{ fontSize: 24, fontWeight: "bold" }}>
                {ultimoDia
                  ? `$${Number(
                      ultimoDia.ventas_totales
                    ).toLocaleString("es-CL")}`
                  : "—"}
              </p>
              {ultimoDia && (
                <p style={{ fontSize: 13, opacity: 0.8 }}>
                  Comandas: {ultimoDia.num_comandas}
                </p>
              )}
            </div>
          </div>

          {/* Gráfico */}
          <div className="kds-card" style={{ marginTop: 24, padding: 16 }}>
            <h3 style={{ marginBottom: 12 }}>Evolución diaria</h3>
            {dataKpi.length === 0 ? (
              <p>No hay datos de pagos todavía. Registra algunos pagos en Caja.</p>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
