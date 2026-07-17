import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { CurrencyNote, CurrencyPrice, CurrencySelector } from "@/components/CurrencyDisplay";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
import { getProduct } from "@/lib/ecommerce/catalog";

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(decodeURIComponent(productId));
  if (!product) return { title: "Produto" };

  return {
    title: product.name,
    description: product.description || `${product.name} na Jhonny Surf Store.`,
  };
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3">
      <dt className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getProduct(decodeURIComponent(productId));
  if (!product) notFound();

  const availableForSale = Boolean(product.availableForSale && product.stockQuantity > 0);
  const category = displayOdooCategoryName(product.category);

  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-32">
        <section className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <Link href="/loja" className="text-xs font-bold uppercase tracking-[0.2em] text-muted underline">
              Voltar à loja
            </Link>
            <div className="relative mt-6 aspect-square overflow-hidden rounded-3xl border border-line bg-white p-6">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain p-6"
                priority
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
              {category} · {product.brand || "Jhonny Surf Store"}
            </p>
            <h1 className="font-display mt-3 text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-5xl">
              {product.name}
            </h1>
            <p className="font-display mt-5 text-4xl font-extrabold text-ink">
              <CurrencyPrice cents={product.priceCents} />
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <CurrencySelector compact />
              <CurrencyNote />
            </div>
            <p className={`mt-3 inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
              availableForSale ? "bg-ink text-white" : "border border-dashed border-ink/30 text-muted"
            }`}>
              {availableForSale ? `${product.stockQuantity} em stock` : "Esgotado"}
            </p>

            {product.description && (
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
                {product.description}
              </p>
            )}
            {product.marketingDescription && product.marketingDescription !== product.description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
                {product.marketingDescription}
              </p>
            )}
            {product.videoUrl && (
              <a
                href={product.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex rounded-full border border-line bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-cream"
              >
                Watch product video
              </a>
            )}
            {product.contentSourceUrl && (
              <p className="mt-3 text-xs text-muted">
                Product notes source:{" "}
                <a href={product.contentSourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                  {product.contentSourceName || "specialist surf source"}
                </a>
              </p>
            )}

            <ProductDetailActions
              productId={product.id}
              productName={product.name}
              availableForSale={availableForSale}
            />

            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              <DetailRow label="Referência" value={product.refId || product.sku} />
              <DetailRow label="SKU" value={product.sku} />
              <DetailRow label="Marca" value={product.brand} />
              <DetailRow label="Categoria Odoo" value={category} />
              <DetailRow label="Tamanho" value={product.size} />
              <DetailRow label="Cor" value={product.color} />
              <DetailRow label="Stock atual" value={product.stockQuantity} />
              <DetailRow label="Stock previsto" value={product.forecastQuantity} />
              <DetailRow label="Estado" value={product.stockState} />
              <DetailRow label="Odoo Product ID" value={product.odooProductId} />
            </dl>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
