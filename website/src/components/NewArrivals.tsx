import Image from "next/image";
import Link from "next/link";
import { CurrencyPrice } from "@/components/CurrencyDisplay";
import { NewArrivalsHeader } from "@/components/NewArrivalsHeader";
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
          className="media-vivid object-contain p-4 transition duration-500 group-hover:scale-105"
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
            <p className="text-xs text-muted">Picked by Jhonny</p>
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
    <section className="overflow-hidden bg-paper py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <NewArrivalsHeader />
      </div>

      {products.length ? (
        <div className="group relative mt-8 flex overflow-hidden">
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
            <p className="font-bold uppercase tracking-wide text-ink">New picks landing soon</p>
            <p className="mt-2 max-w-2xl">
              Jhonny is lining up the next drop. Swing by the shop or check back shortly for the
              latest gear he wants you on.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
