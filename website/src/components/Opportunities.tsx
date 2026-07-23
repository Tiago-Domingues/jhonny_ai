import Image from "next/image";
import Link from "next/link";
import { CurrencyPrice } from "@/components/CurrencyDisplay";
import { ProductCardsRail } from "@/components/ProductCardsRail";
import { displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
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
            {!hasDiscount && (
              <p className="text-xs text-muted">Opportunity price from Odoo</p>
            )}
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted">
            View
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              Odoo opportunities
            </p>
            <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-5xl">
              Opportunities
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Rolling selection of Odoo products tagged with the `Oportunidade` attribute.
            </p>
          </div>
          <Link href="/loja?stock=in" className="rounded-full border border-line bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink transition hover:bg-cream">
            Shop all
          </Link>
        </div>
      </div>

      {products.length ? (
        <ProductCardsRail label="Opportunity products">
          {products.map((product) => (
            <OpportunityCard key={product.id} product={product} />
          ))}
        </ProductCardsRail>
      ) : (
        <div className="mx-auto mt-10 max-w-7xl px-5 sm:px-8">
          <div className="rounded-3xl border border-dashed border-line bg-white p-6 text-sm text-muted sm:p-8">
            <p className="font-bold uppercase tracking-wide text-ink">Waiting for Odoo opportunities</p>
            <p className="mt-2 max-w-2xl">
              Add the `Oportunidade` product attribute in Odoo and sync the catalog. Products tagged there will appear here automatically with Odoo discount fields when available.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
