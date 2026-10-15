const pad = (n) => String(n).padStart(2, "0");

export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
export function formatHours(seconds) {
  return `${Math.floor(seconds / 3600)}h ${pad(Math.floor((seconds % 3600) / 60))}m`;
}
export function toDateInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
export function toTimeInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const todayInput = () => toDateInput(new Date().toISOString());

// "GG/MM/AAAA" + "HH:MM" → ISO; null if empty time, undefined if invalid
export function buildIso(date, time) {
  if (!time.trim()) return null;
  const dm = date.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const tm = time.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!dm || !tm) return undefined;
  const d = new Date(+dm[3], +dm[2] - 1, +dm[1], +tm[1], +tm[2]);
  if (isNaN(d.getTime()) || +tm[1] > 23 || +tm[2] > 59) return undefined;
  return d.toISOString();
}
export function formatDateTime(iso) {
  if (!iso) return "—";
  return `${toDateInput(iso)} ${toTimeInput(iso)}`;
}
export const num = (v, d = 100) => (Math.round(v * d) / d).toString().replace(".", ",");
export const splitNames = (v) => (v ?? "").split(",").map((n) => n.trim()).filter(Boolean);
