export function normalizeNif(value?: string | null) {
  const raw = String(value || "").replace(/[\s.\-]/g, "").toUpperCase();
  if (!raw) return "";
  if (/^\d{9}$/.test(raw)) return `PT${raw}`;
  return raw;
}

export function isValidOptionalNif(value?: string | null) {
  const raw = String(value || "").replace(/[\s.\-]/g, "").toUpperCase();
  if (!raw) return true;
  if (/^\d{9}$/.test(raw)) return true;
  if (/^[A-Z]{2}[A-Z0-9]{8,12}$/.test(raw)) return true;
  return false;
}
