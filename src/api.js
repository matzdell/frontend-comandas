export const API =
  process.env.REACT_APP_API ||
  "https://backend-comandas-j1k0.onrender.com"; // <-- TU BACKEND REAL EN RENDER

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(${API}${path}, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: Bearer ${token} } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) throw new Error(data?.error || "Error API");
  return data;
}
