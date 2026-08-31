/** Shop grid paging — keep each page small so photos do not all race Odoo at once. */

export const SHOP_PAGE_SIZE = 30;
/** Eight pages of 30 (was five pages of 60). */
export const SHOP_CATALOG_FETCH_LIMIT = 240;
export const SHOP_EAGER_IMAGE_COUNT = 4;

export function parseShopPage(value: string | null | undefined) {
  const parsed = Number.parseInt(String(value ?? "1"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function shopPageCount(totalItems: number, pageSize = SHOP_PAGE_SIZE) {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

export function clampShopPage(page: number, totalItems: number, pageSize = SHOP_PAGE_SIZE) {
  return Math.min(Math.max(1, page), shopPageCount(totalItems, pageSize));
}

export function shopPageSlice<T>(items: T[], page: number, pageSize = SHOP_PAGE_SIZE) {
  const current = clampShopPage(page, items.length, pageSize);
  const start = (current - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function shopPageWindow(
  current: number,
  total: number,
  radius = 2
): Array<number | "ellipsis"> {
  if (total <= 0) return [];
  const safeCurrent = Math.min(Math.max(1, current), total);
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let page = safeCurrent - radius; page <= safeCurrent + radius; page += 1) {
    if (page >= 1 && page <= total) pages.add(page);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const window: Array<number | "ellipsis"> = [];
  for (const page of sorted) {
    const previous = window[window.length - 1];
    if (typeof previous === "number" && page - previous > 1) {
      window.push("ellipsis");
    }
    window.push(page);
  }
  return window;
}

export function isOdooProductImageUrl(imageUrl: string) {
  return imageUrl.includes("/api/products/images/");
}

/** Shop cards request the cheap primary thumb (`t=1`) instead of the full gallery fetch. */
export function shopListingImageSrc(imageUrl: string) {
  if (!isOdooProductImageUrl(imageUrl)) return imageUrl;
  if (/(?:^|[?&])t=1(?:&|$)/.test(imageUrl)) return imageUrl;
  return imageUrl.includes("?") ? `${imageUrl}&t=1` : `${imageUrl}?t=1`;
}
