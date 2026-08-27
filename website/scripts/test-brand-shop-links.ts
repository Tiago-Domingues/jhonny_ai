import { BRANDS } from "../src/lib/i18n";
import {
  matchCarouselBrandToCatalog,
  normalizeBrandKey,
  shopBrandHref,
  visibleShopBrands,
} from "../src/lib/ecommerce/brandShopLinks";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(normalizeBrandKey("O'Neill") === "oneill", "O'Neill should drop apostrophe");
assert(normalizeBrandKey("Ocean & Earth") === "oceanandearth", "& should become and");
assert(normalizeBrandKey("Rip Curl") === "ripcurl", "spaces should collapse");

assert(
  matchCarouselBrandToCatalog("O'Neill", ["ONEILL", "Rip Curl"]) === "ONEILL",
  "should match catalog spelling"
);
assert(matchCarouselBrandToCatalog("Rip Curl", ["Rip Curl"]) === "Rip Curl", "exact name should win");
assert(matchCarouselBrandToCatalog("No Such Brand", ["Rip Curl"]) === null, "missing brand should be null");
assert(
  matchCarouselBrandToCatalog("Futures Fins", ["FUTURES", "FCS"]) === "FUTURES",
  "Futures Fins should match catalog FUTURES"
);
assert(matchCarouselBrandToCatalog("FCS", ["FCS", "FUTURES"]) === "FCS", "short brands stay exact-only");

const visible = visibleShopBrands(BRANDS, ["Rip Curl", "ONEILL", "YETI"]);
assert(
  visible.map((brand) => brand.slug).join(",") === "ripcurl,oneill,yeti",
  `unexpected visible slugs: ${visible.map((brand) => brand.slug).join(",")}`
);
assert(
  visible.find((brand) => brand.slug === "oneill")?.catalogBrand === "ONEILL",
  "O'Neill link must use catalog brand string"
);
assert(visible.every((brand) => !["volcom", "katin"].includes(brand.slug)), "brands without products must be hidden");

assert(shopBrandHref("Rip Curl") === "/loja?brand=Rip%20Curl", "shop URL must encode the catalog brand");
assert(shopBrandHref("YETI") === "/loja?brand=YETI", "plain brand names stay unescaped");

console.log("brand shop link tests passed");
