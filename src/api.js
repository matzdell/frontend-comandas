// src/api.js
export const API = process.env.REACT_APP_API || 'http://localhost:3000';

// función helper para leer el token
function getToken() {
  if (typeof window === 'undefined') return null; // por si acaso
  return localStorage.getItem('token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API}${path}`, {
    credentials: 'include',   // puedes dejarlo, no molesta
    headers,
    ...options,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Error API');
  return data;
}
