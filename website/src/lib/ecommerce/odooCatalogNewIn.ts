export function normalizeAttributeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isNewInAttributeName(value: string) {
  const normalized = normalizeAttributeText(value);
  return (
    normalized.includes("new in") ||
    normalized.includes("new-in") ||
    normalized.includes("new_in") ||
    normalized.includes("newin") ||
    normalized.includes("new arrival") ||
    normalized.includes("newarrival") ||
    normalized.includes("novidade") ||
    normalized.includes("lancamento") ||
    normalized === "new" ||
    normalized === "novo" ||
    normalized === "novos"
  );
}

export function isNegativeNewInValue(value: string) {
  const normalized = normalizeAttributeText(value).trim();
  return (
    normalized === "nao" ||
    normalized === "nao." ||
    normalized === "no" ||
    normalized === "false" ||
    normalized === "0" ||
    normalized === "off" ||
    normalized.startsWith("nao ")
  );
}
