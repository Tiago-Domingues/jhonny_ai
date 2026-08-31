export const MAX_PRODUCT_IMAGES = 6;

export function productImageApiUrl(odooProductId: number, index = 0) {
  const safeIndex = Math.max(0, Math.min(MAX_PRODUCT_IMAGES - 1, Math.floor(index)));
  return safeIndex === 0
    ? `/api/products/images/${odooProductId}`
    : `/api/products/images/${odooProductId}?i=${safeIndex}`;
}

export function productImageUrls(odooProductId: number, count: number) {
  const slots = Math.max(0, Math.min(MAX_PRODUCT_IMAGES, Math.floor(count)));
  if (slots <= 0) return ["/brand/logo-stacked.svg"];
  return Array.from({ length: slots }, (_, index) => productImageApiUrl(odooProductId, index));
}

export function parseImageIndex(value: string | null) {
  if (value == null || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(MAX_PRODUCT_IMAGES - 1, Math.floor(parsed)));
}
