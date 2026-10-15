export const BASE_URL = process.env.REACT_APP_MOBILE_API_URL;
const TOKEN_KEY = "officina_token";
let token = localStorage.getItem(TOKEN_KEY);
let onUnauthorized = null;

export const getToken = () => token;
export const setToken = (t) => {
  token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function api(path, opts = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  let res;
  try {
    res = await fetch(`${BASE_URL}/api${path}`, { method: opts.method ?? "GET", headers, body });
  } catch {
    throw new Error("Connessione assente. Controlla la rete e riprova.");
  }
  if (res.status === 401 && path !== "/auth/login") onUnauthorized?.();
  if (!res.ok) {
    let msg = `Errore ${res.status}`;
    try {
      const j = await res.json();
      if (typeof j.detail === "string") msg = j.detail;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const fileUrl = (path) => `${BASE_URL}/api/files/${path}?token=${token ?? ""}`;
export const labelsUrl = (path) => `${BASE_URL}/api${path}${path.includes("?") ? "&" : "?"}token=${token ?? ""}`;
export const logoUrl = (v) => `${BASE_URL}/api/settings/logo?token=${token ?? ""}&v=${v}`;
export const reportUrl = (sheetId) => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome";
  return `${BASE_URL}/api/sheets/${sheetId}/report.pdf?token=${token ?? ""}&tz=${encodeURIComponent(tz)}`;
};
export const openPdf = (url) => window.open(url, "_blank");
