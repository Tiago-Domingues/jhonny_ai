import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { ProductStarRating } from "@/components/ProductStarRating";
import { ProductVideoPreview } from "@/components/ProductVideoPreview";
import { displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
import { getProduct, listProductVariants } from "@/lib/ecommerce/catalog";
import { deriveTemplateDisplayName } from "@/lib/ecommerce/productVariants";

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(decodeURIComponent(productId));
  if (!product) return { title: "Produto" };

  const variants = await listProductVariants(product);
  const displayName = variants.length > 1 ? deriveTemplateDisplayName(variants) : product.name;

  return {
    title: displayName,
    description: product.description || `${displayName} na Jhonny Surf Store.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getProduct(decodeURIComponent(productId));
  if (!product) notFound();

  const variants = await listProductVariants(product);
  const category = displayOdooCategoryName(product.category);
  const displayName = variants.length > 1 ? deriveTemplateDisplayName(variants) : product.name;

  const marketingExtras = (
    <>
      <ProductStarRating productId={product.id} />
      {product.marketingDescription && product.marketingDescription !== product.description && (
        <div className="mt-4 max-w-2xl space-y-3 text-base leading-relaxed text-muted">
          {product.marketingDescription
            .split(/(?<=\.)\s+/)
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={`desc-${index}`}>{paragraph}</p>
            ))}
        </div>
      )}
      <ProductVideoPreview videoUrl={product.videoUrl} title={displayName} />
      {product.contentSourceUrl && (
        <p className="mt-3 text-xs text-muted">
          Model notes & video source:{" "}
          <a href={product.contentSourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">
            {product.contentSourceName || "specialist surf source"}
          </a>
        </p>
      )}
    </>
  );

  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-7xl px-5 sm:px-8">
          <Link href="/loja" className="text-xs font-bold uppercase tracking-[0.2em] text-muted underline">
            Voltar à loja
          </Link>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_0.95fr]">
            <ProductDetailClient
              initialProduct={product}
              variants={variants}
              categoryLabel={category}
              extras={marketingExtras}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
