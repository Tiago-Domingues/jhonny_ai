type NewInCandidate = {
  isNewIn?: boolean;
  category: string;
  createdAt?: string | null;
};

function normalizeCategorySegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Match whole category path segments like "New In" or "Novidades", not "New Inventory". */
export function isNewArrivalsCategory(category: string) {
  const segments = category.split(/[/|>]+/).map(normalizeCategorySegment).filter(Boolean);
  return segments.some((segment) => {
    if (
      segment === "NEW IN" ||
      segment === "NEW ARRIVAL" ||
      segment === "NEW ARRIVALS" ||
      segment === "NEWARRIVAL" ||
      segment === "NEWARRIVALS" ||
      segment === "NOVIDADE" ||
      segment === "NOVIDADES"
    ) {
      return true;
    }
    return (
      segment.includes("NOVIDADE") ||
      segment.includes("NOVOS PRODUTOS") ||
      segment.includes("LANCAMENTO")
    );
  });
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
