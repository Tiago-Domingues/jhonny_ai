import type { Brand } from "@/lib/i18n";

/** Collapse brand labels so carousel names can match Odoo spellings. */
export function normalizeBrandKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[''`´]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function matchCarouselBrandToCatalog(carouselName: string, catalogBrands: string[]) {
  const key = normalizeBrandKey(carouselName);
  if (!key) return null;

  const exact = catalogBrands.filter((brand) => normalizeBrandKey(brand) === key);
  if (exact.length) {
    return exact.find((brand) => brand === carouselName) || exact.sort((a, b) => a.length - b.length)[0] || null;
  }

  // "Futures Fins" vs catalog "FUTURES": allow a shared prefix when both keys are long enough.
  if (key.length < 4) return null;
  const loose = catalogBrands.filter((brand) => {
    const catalogKey = normalizeBrandKey(brand);
    if (catalogKey.length < 4) return false;
    return catalogKey.startsWith(key) || key.startsWith(catalogKey);
  });
  if (!loose.length) return null;
  return (
    loose.sort(
      (a, b) =>
        Math.abs(normalizeBrandKey(a).length - key.length) - Math.abs(normalizeBrandKey(b).length - key.length)
    )[0] || null
  );
}

export function shopBrandHref(catalogBrand: string) {
  return `/loja?brand=${encodeURIComponent(catalogBrand)}`;
}

export type ShopBrandLink = Brand & { catalogBrand: string };

export function visibleShopBrands(carousel: Brand[], catalogBrands: string[]): ShopBrandLink[] {
  return carousel.flatMap((brand) => {
    const catalogBrand = matchCarouselBrandToCatalog(brand.name, catalogBrands);
    return catalogBrand ? [{ ...brand, catalogBrand }] : [];
  });
}
