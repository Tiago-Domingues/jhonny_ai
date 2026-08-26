"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import { CurrencyNote, CurrencyPrice, CurrencySelector } from "@/components/CurrencyDisplay";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { useLanguage } from "@/components/LanguageProvider";
import type { StoreProduct } from "@/lib/ecommerce/catalog";
import { storefrontText } from "@/lib/storefrontCopy";
import {
  buildVariantAxes,
  deriveTemplateDisplayName,
  findVariantByAttributes,
  variantAttributesForProduct,
  type VariantAttributeMap,
} from "@/lib/ecommerce/productVariants";

type ProductDetailClientProps = {
  initialProduct: StoreProduct;
  variants: StoreProduct[];
  categoryLabel: string;
  extras?: ReactNode;
};

export function ProductDetailClient({
  initialProduct,
  variants,
  categoryLabel,
  extras,
}: ProductDetailClientProps) {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).product;
  const hasMultipleVariants = variants.length > 1;
  const templateName = hasMultipleVariants ? deriveTemplateDisplayName(variants) : initialProduct.name;
  const axes = useMemo(() => (hasMultipleVariants ? buildVariantAxes(variants) : []), [hasMultipleVariants, variants]);

  const initialSelection = useMemo(() => {
    const match = variants.find((variant) => variant.id === initialProduct.id) || variants[0]!;
    return variantAttributesForProduct(match);
  }, [initialProduct.id, variants]);

  const [selection, setSelection] = useState<VariantAttributeMap>(initialSelection);

  const selectedVariant = useMemo(
    () => findVariantByAttributes(variants, selection),
    [selection, variants]
  );

  const availableForSale = Boolean(selectedVariant.availableForSale && selectedVariant.stockQuantity > 0);

  function selectAxisValue(axisKey: string, value: string) {
    setSelection((current) => {
      const next = { ...current, [axisKey]: value };
      const candidate = findVariantByAttributes(variants, next);
      return variantAttributesForProduct(candidate);
    });
  }

  function isAxisValueAvailable(axisKey: string, value: string) {
    const candidateSelection = { ...selection, [axisKey]: value };
    const candidate = findVariantByAttributes(variants, candidateSelection);
    return Boolean(candidate.availableForSale && candidate.stockQuantity > 0);
  }

  return (
    <>
      <div className="relative mt-6 aspect-square overflow-hidden rounded-3xl border border-line bg-white p-6">
        <Image
          key={selectedVariant.id}
          src={selectedVariant.imageUrl}
          alt={templateName}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-6"
          priority
        />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
          {categoryLabel} · {selectedVariant.brand || "Jhonny Surf Store"}
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          {templateName}
        </h1>
        <p className="font-display mt-5 text-4xl font-extrabold text-ink">
          <CurrencyPrice cents={selectedVariant.priceCents} />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <CurrencySelector compact />
          <CurrencyNote />
        </div>
        <p
          className={`mt-3 inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
            availableForSale ? "bg-ink text-white" : "border border-dashed border-ink/30 text-muted"
          }`}
        >
          {availableForSale
            ? copy.inStockCount.replace("{n}", String(selectedVariant.stockQuantity))
            : copy.outOfStock}
        </p>

        {hasMultipleVariants && axes.length > 0 && (
          <div className="mt-8 space-y-5">
            {axes.map((axis) => (
              <div key={axis.key}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{axis.label}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {axis.values.map((value) => {
                    const selected = selection[axis.key] === value;
                    const inStock = isAxisValueAvailable(axis.key, value);
                    return (
                      <button
                        key={`${axis.key}-${value}`}
                        type="button"
                        onClick={() => selectAxisValue(axis.key, value)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          selected
                            ? "border-ink bg-ink text-white"
                            : inStock
                              ? "border-line bg-white text-ink hover:border-ink"
                              : "border-dashed border-line text-muted hover:border-ink/40"
                        }`}
                        aria-pressed={selected}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedVariant.description && (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">{selectedVariant.description}</p>
        )}

        {extras}

        <ProductDetailActions
          productId={selectedVariant.id}
          productName={templateName}
          availableForSale={availableForSale}
        />
      </div>
    </>
  );
}
