type NewInCandidate = {
  isNewIn?: boolean;
  category: string;
  createdAt?: string | null;
};

/** Match Odoo category paths like "New Arrivals", "Novidades", etc. */
export function isNewArrivalsCategory(category: string) {
  const normalized = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return (
    normalized.includes("NEW ARRIVAL") ||
    normalized.includes("NEWARRIVAL") ||
    normalized.includes("NOVIDADE") ||
    normalized.includes("NOVOS PRODUTOS") ||
    normalized.includes("NEW IN") ||
    normalized.includes("LANCAMENTO")
  );
}

function createdAtMs(product: { createdAt?: string | null }) {
  if (!product.createdAt) return 0;
  const value = Date.parse(product.createdAt);
  return Number.isFinite(value) ? value : 0;
}

/** Tagged New In first, then New In categories, then newest public products. */
export function selectNewArrivalProducts<T extends NewInCandidate>(products: T[], limit = 16): T[] {
  const tagged = products.filter((product) => product.isNewIn);
  if (tagged.length) return tagged.slice(0, limit);
  const byCategory = products.filter((product) => isNewArrivalsCategory(product.category));
  if (byCategory.length) return byCategory.slice(0, limit);
  return [...products]
    .sort((left, right) => createdAtMs(right) - createdAtMs(left))
    .slice(0, limit);
}
