// src/api.js

// URL FIJA DEL BACKEND EN RENDER (sin slash al final)
export const API = "https://backend-comandas-j1k0.onrender.com";

// apiFetch envía siempre el token almacenado en localStorage
export async function apiFetch(path, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(${API}${path}, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: Bearer ${token} } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || "Error API");
  }

  return data;
}
