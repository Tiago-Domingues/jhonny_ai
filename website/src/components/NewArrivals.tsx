import Image from "next/image";
import Link from "next/link";
import { CurrencyPrice } from "@/components/CurrencyDisplay";
import { displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
import { listNewArrivalProducts, type StoreProduct } from "@/lib/ecommerce/catalog";

function NewArrivalCard({ product }: { product: StoreProduct }) {
  return (
    <Link
      href={`/loja/${product.slug}`}
      className="group mx-2 flex w-72 shrink-0 flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:mx-3 sm:w-80"
    >
      <div className="relative h-44 bg-cream p-4 sm:h-52">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="320px"
          className="object-contain p-4 transition duration-500 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm">
          New
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">
          {displayOdooCategoryName(product.category)} · {product.brand || "Jhonny"}
        </p>
        <h3 className="font-display mt-2 line-clamp-2 text-lg font-extrabold uppercase tracking-tight text-ink">
          {product.name}
        </h3>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-extrabold text-ink">
              <CurrencyPrice cents={product.priceCents} />
            </p>
            <p className="text-xs text-muted">New arrival from Odoo</p>
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function NewArrivals() {
  const products = await listNewArrivalProducts(16);
  const loop = [...products, ...products];

  return (
    <section className="overflow-hidden bg-paper py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              Odoo new arrivals
            </p>
            <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-5xl">
              New Arrivals
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Fresh products from the Odoo `New Arrivals` category. Until that category is created,
              we show opportunity products as placeholders.
            </p>
          </div>
          <Link
            href="/loja?stock=in"
            className="rounded-full border border-line bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink transition hover:bg-cream"
          >
            Shop all
          </Link>
        </div>
      </div>

      {products.length ? (
        <div className="group relative mt-10 flex overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-paper to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-paper to-transparent sm:w-24" />
          <div className="flex w-max animate-[marquee_45s_linear_infinite] items-stretch group-hover:[animation-play-state:paused]">
            {loop.map((product, index) => (
              <NewArrivalCard key={`new-${product.id}-${index}`} product={product} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-7xl px-5 sm:px-8">
          <div className="rounded-3xl border border-dashed border-line bg-white p-6 text-sm text-muted sm:p-8">
            <p className="font-bold uppercase tracking-wide text-ink">Waiting for Odoo new arrivals</p>
            <p className="mt-2 max-w-2xl">
              Create a `New Arrivals` (or `Novidades`) product category in Odoo and sync the catalog.
              Products in that category will appear here automatically.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
