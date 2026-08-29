import Image from "next/image";
import Link from "next/link";
import { CurrencyPrice } from "@/components/CurrencyDisplay";
import { ProductCardsRail } from "@/components/ProductCardsRail";
import {
  OpportunitiesEmpty,
  OpportunitiesHeader,
  OpportunitiesSaleNote,
} from "@/components/OpportunitiesHeader";
import { displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
import { UiText } from "@/components/UiText";
import { listOpportunityProducts, type StoreProduct } from "@/lib/ecommerce/catalog";

function OpportunityCard({ product }: { product: StoreProduct }) {
  const hasDiscount =
    Boolean(product.opportunityOriginalPriceCents && product.opportunityOriginalPriceCents > product.priceCents) ||
    Boolean(product.opportunityDiscountPercent);

  return (
    <Link
      href={`/loja/${product.slug}`}
      data-rail-card
      className="group mx-2 flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:mx-3 sm:w-80"
    >
      <div className="relative h-44 bg-cream p-4 sm:h-52">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="320px"
          className="media-vivid object-contain p-4 transition duration-500 group-hover:scale-105"
        />
        {product.opportunityDiscountPercent && (
          <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm">
            -{product.opportunityDiscountPercent}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">
          {displayOdooCategoryName(product.category)} · {product.brand || "Jhonny"}
        </p>
        <h3 className="font-display mt-2 line-clamp-2 text-lg font-extrabold tracking-tight text-ink">
          {product.name}
        </h3>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {product.opportunityOriginalPriceCents && product.opportunityOriginalPriceCents > product.priceCents && (
              <p className="text-sm font-extrabold text-red-600 line-through decoration-2">
                <CurrencyPrice cents={product.opportunityOriginalPriceCents} />
              </p>
            )}
            <p className={hasDiscount ? "font-display text-2xl font-extrabold text-red-600" : "font-display text-2xl font-extrabold text-ink"}>
              <CurrencyPrice cents={product.priceCents} />
            </p>
            {!hasDiscount && <OpportunitiesSaleNote />}
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted">
            <UiText k="view" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function Opportunities() {
  const products = await listOpportunityProducts(16);

  return (
    <section className="overflow-hidden bg-paper py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <OpportunitiesHeader />
      </div>

      {products.length ? (
        <ProductCardsRail labelKey="opportunityRail">
          {products.map((product) => (
            <OpportunityCard key={product.id} product={product} />
          ))}
        </ProductCardsRail>
      ) : (
        <OpportunitiesEmpty />
      )}
    </section>
  );
}
