/**
 * Shop page size + URL paging helpers.
 * Run: cd website && npx tsx scripts/test-shop-paging.ts
 */
import {
  SHOP_CATALOG_FETCH_LIMIT,
  SHOP_PAGE_SIZE,
  clampShopPage,
  parseShopPage,
  shopListingImageSrc,
  shopPageCount,
  shopPageSlice,
  shopPageWindow,
} from "../src/lib/ecommerce/shopPaging.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(SHOP_PAGE_SIZE === 30, "default shop page is half of the previous 60");
assert(SHOP_CATALOG_FETCH_LIMIT === 240, "client fetch covers eight pages of 30");
assert(SHOP_CATALOG_FETCH_LIMIT / SHOP_PAGE_SIZE === 8, "240 items is eight shop pages");

assert(parseShopPage(null) === 1, "missing page is 1");
assert(parseShopPage("") === 1, "empty page is 1");
assert(parseShopPage("0") === 1, "page 0 floors to 1");
assert(parseShopPage("-3") === 1, "negative page floors to 1");
assert(parseShopPage("4") === 4, "valid page is kept");
assert(parseShopPage("4.8") === 4, "page is an integer");

assert(shopPageCount(0) === 1, "empty catalog still has page 1");
assert(shopPageCount(30) === 1, "exactly one page");
assert(shopPageCount(31) === 2, "31 items need two pages");
assert(shopPageCount(60) === 2, "old single page of 60 is now two pages");
assert(shopPageCount(240) === 8, "full fetch is eight pages");

assert(clampShopPage(99, 75) === 3, "page clamps to last page");
assert(clampShopPage(0, 75) === 1, "page clamps to first page");

const items = Array.from({ length: 75 }, (_, index) => index);
assert(shopPageSlice(items, 1).length === 30, "page 1 has 30 items");
assert(shopPageSlice(items, 1)[0] === 0, "page 1 starts at 0");
assert(shopPageSlice(items, 2)[0] === 30, "page 2 starts at 30");
assert(shopPageSlice(items, 3).length === 15, "last page has the remainder");
assert(shopPageSlice(items, 99).length === 15, "oversize page uses the last slice");

const windowMid = shopPageWindow(5, 8);
assert(windowMid[0] === 1, "window always includes first page");
assert(windowMid[windowMid.length - 1] === 8, "window always includes last page");
assert(windowMid.includes(5), "window includes the current page");
assert(windowMid.includes("ellipsis") || windowMid.includes(2), "compact window or nearby pages");

assert(
  shopListingImageSrc("/api/products/images/12") === "/api/products/images/12?t=1",
  "shop cards append the thumb flag"
);
assert(
  shopListingImageSrc("/api/products/images/12?i=0") === "/api/products/images/12?i=0&t=1",
  "thumb flag is added beside an index"
);
assert(
  shopListingImageSrc("/api/products/images/12?t=1") === "/api/products/images/12?t=1",
  "thumb flag is not duplicated"
);
assert(shopListingImageSrc("/products/board.jpg") === "/products/board.jpg", "static photos stay as-is");

console.log("shop paging ok");
