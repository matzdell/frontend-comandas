// src/pages/Cocina.jsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import '../App.css';

// HOST dinámico: local o IP según cómo abras el KDS
const HOST = window.location.hostname;
const SOCKET_URL = `http://${HOST}:3000`;

export default function Cocina() {
  const [comandas, setComandas] = useState([]);
  const [status, setStatus] = useState('desconectado');
  const [socket, setSocket] = useState(null);

  console.log('[KDS] HOST =', HOST);
  console.log('[KDS] SOCKET_URL =', SOCKET_URL);

  // Crear socket SIEMPRE basado en HOST/IP
  useEffect(() => {
    console.log('[KDS] Creando socket hacia:', SOCKET_URL);

    const s = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [SOCKET_URL]); // ← AHORA SÍ cambia cuando usas IP

  // Recibir eventos del socket
  useEffect(() => {
    if (!socket) return;

    function agregarComanda(data) {
      if (!data) return;
      console.log('[KDS] Comanda recibida:', data);

      setComandas(prev => {
        const existe = prev.some(c => c.id_comanda === data.id_comanda);
        if (existe) return prev;

        return [
          {
            ...data,
            llegada: new Date().toISOString(),
            estado: 'Preparando',
          },
          ...prev,
        ];
      });
    }

    socket.on('connect', () => {
      console.log('[KDS] conectado a', SOCKET_URL);
      setStatus('conectado');
    });

    socket.on('connect_error', (err) => {
      console.error('[KDS] connect_error:', err.message);
      setStatus('error');
    });

    socket.on('nueva_comanda', agregarComanda);

    socket.on('disconnect', () => {
      console.warn('[KDS] desconectado');
      setStatus('desconectado');
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('nueva_comanda');
      socket.off('disconnect');
    };
  }, [socket]);

  const statusLabel = socket?.connected ? 'conectado' : status;

  const formateaMinutos = (iso) => {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    return mins ? `${mins} min` : '<1 min';
  };

  function cambiarEstado(id) {
    setComandas(prev =>
      prev.map(c =>
        c.id_comanda === id
          ? { ...c, estado: c.estado === 'Preparando' ? 'Terminado' : 'Preparando' }
          : c
      )
    );
  }

  function editarComanda(id) {
    const nuevaNota = prompt('Nueva nota:');
    if (nuevaNota === null) return;
    setComandas(prev =>
      prev.map(c =>
        c.id_comanda === id
          ? { ...c, detalles: c.detalles.map(d => ({ ...d, notas: nuevaNota })) }
          : c
      )
    );
  }

  function eliminarComanda(id) {
    if (!window.confirm('¿Eliminar esta comanda?')) return;
    setComandas(prev => prev.filter(c => c.id_comanda !== id));
  }

  function limpiarPantalla() {
    if (!window.confirm('¿Limpiar todas las comandas?')) return;
    setComandas([]);
  }

  return (
    <div className="kds-container">
      <header className="kds-header">
        <h1>🍳 Pantalla de Cocina</h1>
        <div className="kds-sub">
          Estado: {statusLabel} | Servidor: {SOCKET_URL}
        </div>
        <button className="btn-reload" onClick={limpiarPantalla}>
          🔄 Limpiar pantalla
        </button>
      </header>

      <div className="kds-grid">
        {comandas.map(c => (
          <div className="kds-card" key={c.id_comanda}>
            <div className="kds-card-header">
              <span className="kds-mesa">Mesa {c.mesa}</span>
              <span className="kds-count">#{c.id_comanda}</span>
            </div>

            <div style={{ marginBottom: 8 }}>
                <span 
  className={`kds-estado ${c.estado === 'Preparando' ? 'kds-preparando' : 'kds-terminado'}`}
>
  {c.estado}
</span>
<span className="kds-tiempo">{formateaMinutos(c.llegada)}</span>
              <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.7 }}>
                Tiempo: {formateaMinutos(c.llegada)}
              </span>
            </div>

            <ul className="kds-items">
              {c.detalles?.map((p, i) => (
                <li key={i}>
                  <strong>{p.nombre}</strong> × {p.cantidad}
                  {p.notas && ` — ${p.notas}`}
                </li>
              ))}
            </ul>

            <div className="kds-actions">
              <button onClick={() => cambiarEstado(c.id_comanda)}>
                {c.estado === 'Preparando' ? 'Terminado' : 'Preparando'}
              </button>
              <button onClick={() => editarComanda(c.id_comanda)}>✏ Editar</button>
              <button onClick={() => eliminarComanda(c.id_comanda)}>🗑 Eliminar</button>
            </div>
          </div>
        ))}

        {comandas.length === 0 && (
          <p style={{ padding: 20 }}>No hay comandas aún…</p>
        )}
      </div>
    </div>
  );
}
