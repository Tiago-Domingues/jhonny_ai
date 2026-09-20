export function normalizeAttributeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Phrase match for New In / Novidades — not a lone "new" / "novo" token. */
export function isNewInPhrase(value: string) {
  const normalized = normalizeAttributeText(value);
  return (
    normalized.includes("new in") ||
    normalized.includes("new-in") ||
    normalized.includes("new_in") ||
    normalized.includes("newin") ||
    normalized.includes("new arrival") ||
    normalized.includes("newarrival") ||
    normalized.includes("novidade") ||
    normalized.includes("lancamento")
  );
}

/** Odoo attribute names: phrases, or a dedicated New / Novo / Novos attribute. */
export function isNewInAttributeName(value: string) {
  const normalized = normalizeAttributeText(value);
  return isNewInPhrase(normalized) || normalized === "new" || normalized === "novo" || normalized === "novos";
}

export function isNegativeNewInValue(value: string) {
  const normalized = normalizeAttributeText(value);
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
