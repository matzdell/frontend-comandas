// src/pages/EditProducto.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api';
import '../App.css';

export default function EditProducto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState([]);

  const [form, setForm] = useState({
    nombre: '',
    id_categoria: '',
    precio: '',
    disponible: true,
  });

  // Cargar categorías + producto
  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setError('');

        const [cats, prod] = await Promise.all([
          apiFetch('/api/admin/categorias'),
          apiFetch(`/api/admin/productos/${id}`),
        ]);

        setCategorias(cats);
        setForm({
          nombre: prod.nombre,
          id_categoria: prod.id_categoria,
          precio: prod.precio ?? '',
          disponible: prod.disponible,
        });
      } catch (err) {
        console.error('Error cargando producto:', err);
        setError(err.message || 'Error al cargar producto');
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      await apiFetch(`/api/admin/productos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: form.nombre,
          id_categoria: Number(form.id_categoria),
          precio: Number(form.precio),
          disponible: form.disponible,
        }),
      });

      // volver al dashboard de admin
      navigate('/admin');
    } catch (err) {
      console.error('Error guardando producto:', err);
      setError(err.message || 'Error al guardar cambios');
    }
  }

  if (cargando) {
    return (
      <div className="kds-container">
        <header className="kds-header">
          <h1>🍽️ Editar producto</h1>
        </header>
        <p style={{ padding: 20 }}>Cargando datos...</p>
      </div>
    );
  }

  if (error && !form.nombre) {
    return (
      <div className="kds-container">
        <header className="kds-header">
          <h1>🍽️ Editar producto</h1>
        </header>
        <p style={{ padding: 20, color: 'crimson' }}>{error}</p>
        <button className="btn-reload" onClick={() => navigate('/admin')}>
          ⬅ Volver al panel
        </button>
      </div>
    );
  }

  return (
    <div className="kds-container">
      <header className="kds-header">
        <h1>🍽️ Editar producto</h1>
        <div className="kds-sub">ID #{id}</div>
      </header>

      <div className="kds-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Nombre del plato</span>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            <span>Categoría</span>
            <select
              value={form.id_categoria}
              onChange={(e) =>
                setForm({ ...form, id_categoria: e.target.value })
              }
              required
            >
              <option value="">Seleccione categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            <span>Precio</span>
            <input
              type="number"
              min="0"
              step="100"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
              required
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.disponible}
              onChange={(e) =>
                setForm({ ...form, disponible: e.target.checked })
              }
            />
            <span>Disponible en carta</span>
          </label>

          {error && (
            <p style={{ color: 'crimson', fontSize: 13 }}>{error}</p>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              marginTop: 10,
            }}
          >
            <Link to="/admin" style={{ textDecoration: 'none', flex: 1 }}>
              <button
                type="button"
                className="btn-reload"
                style={{ width: '100%', background: '#6b7280' }}
              >
                ⬅ Volver
              </button>
            </Link>
            <button
              type="submit"
              className="btn-reload"
              style={{ width: '100%' }}
            >
              💾 Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
