const API = "http://localhost:5179/api/auth";
const TOKEN_KEY = "mpn_token_v1";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRegister(email: string, password: string) {
  const r = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

export async function apiLogin(email: string, password: string) {
  const r = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

export async function apiMe() {
  const token = getToken();
  const r = await fetch(`${API}/me`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  return r.json();
}

export async function apiLogout() {
  const token = getToken();
  await fetch(`${API}/logout`, {
    method: "POST",
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  clearToken();
}
