import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [err, setErr] = useState('');

  async function onSubmit(e) {
  e.preventDefault();
  setErr('');
  try {
    const user = await login(form.email, form.password); // ya viene con {id,email,role,token}
    const rol = user.role;

    if (rol === 'Cocinero' || rol === 'Jefe') {
      nav('/admin');
    } else if (rol === 'Mesero') {
      nav('/mesero');
    } else if (rol === 'Cajero') {
      nav('/caja');
    } else {
      setErr(`Rol no reconocido: ${rol ?? 'sin rol'}`);
    }
  } catch (e) {
    setErr(e.message || 'Error al iniciar sesión');
  }
}


  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: '60px auto', display: 'grid', gap: 10 }}>
      <h2>Iniciar sesión</h2>
      <input
        placeholder="Email"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Contraseña"
        type="password"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
      />
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <button type="submit">Entrar</button>
    </form>
  );
}
