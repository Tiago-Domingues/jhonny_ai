/**
 * Offline check: Odoo template variants collapse to one shop listing.
 * Run: cd website && npx tsx scripts/test-product-variants.mjs
 */
import {
  buildTemplateListingProduct,
  cleanProductDisplayName,
  deriveTemplateDisplayName,
  groupStoreProductsForListing,
} from "../src/lib/ecommerce/productVariants.ts";

function variant(id, templateId, name, color, priceCents, stock) {
  return {
    id,
    slug: id,
    name,
    description: "",
    category: "essentials",
    brand: "JSS",
    color,
    size: null,
    variantAttributesJson: JSON.stringify({ Color: color }),
    imageUrl: "/brand/logo-stacked.svg",
    priceCents,
    currency: "EUR",
    stockQuantity: stock,
    saleable: true,
    availableForSale: stock > 0,
    odooProductId: Number(id.replace(/\D/g, "")) || 1,
    odooProductTemplateId: templateId,
    refId: "AIR-FRESH",
  };
}

const airFreshVariants = [
  variant("v1", 9001, "Air Fresh Blue", "Blue", 1299, 2),
  variant("v2", 9001, "Air Fresh Red", "Red", 1299, 1),
  variant("v3", 9001, "Air Fresh Green", "Green", 1299, 0),
  variant("v4", 9001, "Air Fresh Black", "Black", 1399, 3),
];

const grouped = groupStoreProductsForListing(airFreshVariants);
if (grouped.length !== 1) {
  throw new Error(`Expected 1 listing, got ${grouped.length}`);
}

const listing = grouped[0];
if (!listing.hasVariants || listing.variantCount !== 4) {
  throw new Error(`Expected grouped listing with 4 variants, got ${listing.variantCount}`);
}

const displayName = deriveTemplateDisplayName(airFreshVariants);
if (!displayName.toLowerCase().includes("air fresh")) {
  throw new Error(`Unexpected display name: ${displayName}`);
}

const toteVariants = [
  variant("t1", 9002, "TOTE PACK PATAGONIA TERRAVIA (Black)", "Black", 4999, 2),
  variant("t2", 9002, "TOTE PACK PATAGONIA TERRAVIA (White)", "White", 4999, 1),
];
toteVariants.forEach((item) => {
  item.refId = "TERRAVIA";
});
const toteName = deriveTemplateDisplayName(toteVariants);
if (toteName !== "TOTE PACK PATAGONIA TERRAVIA") {
  throw new Error(`Tote display name should drop leftover parens, got: ${toteName}`);
}

const emptyParenName = cleanProductDisplayName("TOTE PACK PATAGONIA TERRAVIA ( )");
if (emptyParenName !== "TOTE PACK PATAGONIA TERRAVIA") {
  throw new Error(`Empty parens should be stripped, got: ${emptyParenName}`);
}

if (cleanProductDisplayName("Board 8'2") !== "Board 8'2") {
  throw new Error("surfboard length must stay intact");
}
if (cleanProductDisplayName("Wax (Tropical)") !== "Wax (Tropical)") {
  throw new Error("meaningful parentheticals must stay");
}
if (cleanProductDisplayName("NAME -") !== "NAME") {
  throw new Error("trailing dash should be stripped");
}
if (cleanProductDisplayName("Air Fresh") !== "Air Fresh") {
  throw new Error("clean names should stay unchanged");
}

if (listing.stockQuantity !== 6) {
  throw new Error(`Expected total stock 6, got ${listing.stockQuantity}`);
}

if (listing.minPriceCents !== 1299 || listing.maxPriceCents !== 1399) {
  throw new Error(`Unexpected price range ${listing.minPriceCents}-${listing.maxPriceCents}`);
}

const templateListing = buildTemplateListingProduct(airFreshVariants);
if (templateListing.variantColors?.length !== 4) {
  throw new Error(`Expected 4 colors on listing, got ${templateListing.variantColors?.length}`);
}

console.log("product variant grouping OK:", {
  displayName,
  variantCount: listing.variantCount,
  stockQuantity: listing.stockQuantity,
  minPriceCents: listing.minPriceCents,
  maxPriceCents: listing.maxPriceCents,
  colors: listing.variantColors,
});
