// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import '../App.css';

const ROLES = ['Mesero', 'Cocinero', 'Cajero', 'Jefe'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('usuarios');

  // --- USUARIOS ---
  const [userForm, setUserForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'Mesero',
  });
  const [userMsg, setUserMsg] = useState('');

  async function crearUsuario(e) {
    e.preventDefault();
    setUserMsg('');
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userForm),
      });
      setUserMsg('✅ Usuario creado correctamente');
      setUserForm({ nombre: '', email: '', password: '', rol: 'Mesero' });
    } catch (err) {
      console.error(err);
      setUserMsg('❌ Error al crear usuario: ' + (err.message || ''));
    }
  }

  // --- PRODUCTOS / PLATOS ---
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [prodForm, setProdForm] = useState({
    nombre: '',
    categoria: '',
    precio: '',
  });
  const [prodMsg, setProdMsg] = useState('');

  // Cargar categorías y productos al montar
  useEffect(() => {
    async function cargarDatos() {
      try {
        const cats = await apiFetch('/api/admin/categorias');
        setCategorias(cats);
        // si no hay categoría seleccionada, toma la primera
        setProdForm((prev) => ({
          ...prev,
          categoria: prev.categoria || (cats[0]?.nombre || ''),
        }));

        const prods = await apiFetch('/api/admin/productos');
        setProductos(prods);
      } catch (err) {
        console.error('Error cargando catálogo admin:', err);
      }
    }
    cargarDatos();
  }, []);

  async function recargarProductos() {
    try {
      const prods = await apiFetch('/api/admin/productos');
      setProductos(prods);
    } catch (err) {
      console.error('Error recargando productos:', err);
    }
  }

  async function crearProducto(e) {
    e.preventDefault();
    setProdMsg('');
    try {
      await apiFetch('/api/admin/productos', {
        method: 'POST',
        body: JSON.stringify({
          ...prodForm,
          precio: Number(prodForm.precio),
        }),
      });
      setProdMsg('✅ Producto creado correctamente');
      setProdForm((prev) => ({
        ...prev,
        nombre: '',
        precio: '',
      }));
      await recargarProductos();
    } catch (err) {
      console.error(err);
      setProdMsg('❌ Error al crear producto: ' + (err.message || ''));
    }
  }

  // Activar / desactivar producto (disponible)
  async function toggleDisponible(prod) {
    try {
      await apiFetch(`/api/admin/productos/${prod.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: prod.nombre,
          id_categoria: prod.id_categoria,
          precio: prod.precio,
          disponible: !prod.disponible,
        }),
      });
      await recargarProductos();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar disponibilidad: ' + (err.message || ''));
    }
  }

  // Eliminar producto
  async function eliminarProducto(prod) {
    if (!window.confirm(`¿Eliminar el producto "${prod.nombre}"?`)) return;

    try {
      await apiFetch(`/api/admin/productos/${prod.id}`, {
        method: 'DELETE',
      });
      await recargarProductos();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar producto: ' + (err.message || ''));
    }
  }

  return (
    <div className="kds-container">
      <header className="kds-header">
        <h1>📊 Dashboard Administrador</h1>
        <div className="kds-sub">Gestión de usuarios y carta del restaurante</div>
      </header>

      {/* Tabs */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <button
          onClick={() => setTab('usuarios')}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            background: tab === 'usuarios' ? '#2563eb' : '#e5e7eb',
            color: tab === 'usuarios' ? 'white' : '#111827',
          }}
        >
          👥 Crear usuarios
        </button>
        <button
          onClick={() => setTab('productos')}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            background: tab === 'productos' ? '#2563eb' : '#e5e7eb',
            color: tab === 'productos' ? 'white' : '#111827',
          }}
        >
          🍽️ Gestionar platos
        </button>
      </div>

      {/* TAB USUARIOS */}
      {tab === 'usuarios' && (
        <div className="kds-card" style={{ maxWidth: 500 }}>
          <h2>👥 Crear nuevo usuario</h2>
          <form
            onSubmit={crearUsuario}
            style={{ display: 'grid', gap: 10, marginTop: 10 }}
          >
            <input
              placeholder="Nombre"
              value={userForm.nombre}
              onChange={(e) =>
                setUserForm({ ...userForm, nombre: e.target.value })
              }
            />
            <input
              placeholder="Email"
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
            />
            <input
              placeholder="Contraseña"
              type="password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm({ ...userForm, password: e.target.value })
              }
            />
            <select
              value={userForm.rol}
              onChange={(e) =>
                setUserForm({ ...userForm, rol: e.target.value })
              }
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn-reload"
              style={{ width: '100%' }}
            >
              Crear usuario
            </button>
          </form>
          {userMsg && <p style={{ marginTop: 10 }}>{userMsg}</p>}
        </div>
      )}

      {/* TAB PRODUCTOS */}
      {tab === 'productos' && (
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="kds-card" style={{ maxWidth: 500 }}>
            <h2>🍽️ Crear nuevo producto</h2>
            <form
              onSubmit={crearProducto}
              style={{ display: 'grid', gap: 10, marginTop: 10 }}
            >
              <input
                placeholder="Nombre del plato"
                value={prodForm.nombre}
                onChange={(e) =>
                  setProdForm({ ...prodForm, nombre: e.target.value })
                }
              />
              <select
                value={prodForm.categoria}
                onChange={(e) =>
                  setProdForm({ ...prodForm, categoria: e.target.value })
                }
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <input
                placeholder="Precio"
                type="number"
                min="0"
                step="100"
                value={prodForm.precio}
                onChange={(e) =>
                  setProdForm({ ...prodForm, precio: e.target.value })
                }
              />
              <button
                type="submit"
                className="btn-reload"
                style={{ width: '100%' }}
              >
                Crear producto
              </button>
            </form>
            {prodMsg && <p style={{ marginTop: 10 }}>{prodMsg}</p>}
          </div>

          <div className="kds-card">
            <h2>📋 Platos existentes</h2>
            {productos.length === 0 && <p>No hay productos registrados.</p>}

            {productos.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          textAlign: 'left',
                          padding: 8,
                        }}
                      >
                        ID
                      </th>
                      <th
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          textAlign: 'left',
                          padding: 8,
                        }}
                      >
                        Nombre
                      </th>
                      <th
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          textAlign: 'left',
                          padding: 8,
                        }}
                      >
                        Categoría
                      </th>
                      <th
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          textAlign: 'right',
                          padding: 8,
                        }}
                      >
                        Precio
                      </th>
                      <th
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          textAlign: 'center',
                          padding: 8,
                        }}
                      >
                        Disponible
                      </th>
                      <th
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          textAlign: 'center',
                          padding: 8,
                        }}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id}>
                        <td
                          style={{
                            borderBottom: '1px solid #f3f4f6',
                            padding: 6,
                          }}
                        >
                          {p.id}
                        </td>
                        <td
                          style={{
                            borderBottom: '1px solid #f3f4f6',
                            padding: 6,
                          }}
                        >
                          {p.nombre}
                        </td>
                        <td
                          style={{
                            borderBottom: '1px solid #f3f4f6',
                            padding: 6,
                          }}
                        >
                          {p.categoria_nombre || `ID ${p.id_categoria}`}
                        </td>
                        <td
                          style={{
                            borderBottom: '1px solid #f3f4f6',
                            padding: 6,
                            textAlign: 'right',
                          }}
                        >
                          {p.precio ?? '-'}
                        </td>
                        <td
                          style={{
                            borderBottom: '1px solid #f3f4f6',
                            padding: 6,
                            textAlign: 'center',
                          }}
                        >
                          {p.disponible ? '✅' : '🚫'}
                        </td>
                        <td
                          style={{
                            borderBottom: '1px solid #f3f4f6',
                            padding: 6,
                            textAlign: 'center',
                          }}
                        >
                          <button
                            style={{ marginRight: 4 }}
                            onClick={() =>
                              navigate(`/admin/productos/${p.id}`)
                            }
                          >
                            ✏ Editar
                          </button>
                          <button
                            style={{ marginRight: 4 }}
                            onClick={() => toggleDisponible(p)}
                          >
                            {p.disponible ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            style={{ color: 'crimson' }}
                            onClick={() => eliminarProducto(p)}
                          >
                            🗑 Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
