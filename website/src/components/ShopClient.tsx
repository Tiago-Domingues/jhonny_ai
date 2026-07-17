"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CurrencyNote, CurrencyPrice, CurrencySelector } from "@/components/CurrencyDisplay";
import { useLanguage } from "@/components/LanguageProvider";
import type { StoreProduct } from "@/lib/ecommerce/catalog";
import { ODOO_CATEGORY_GROUPS, displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
import { getCategoryHero } from "@/lib/ecommerce/categoryHeroes";
import { MENU_CATEGORIES, STORE } from "@/lib/i18n";

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="shop-skeleton h-44 w-full" />
          <div className="space-y-3 p-4">
            <div className="shop-skeleton h-3 w-1/3 rounded-full" />
            <div className="shop-skeleton h-5 w-4/5 rounded-full" />
            <div className="shop-skeleton h-3 w-full rounded-full" />
            <div className="shop-skeleton h-3 w-2/3 rounded-full" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="shop-skeleton h-6 w-16 rounded-full" />
              <div className="shop-skeleton h-8 w-20 rounded-full" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ShopClient({ products: initialProducts = [] }: { products?: StoreProduct[] }) {
  const { locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts);
  const [loadingProducts, setLoadingProducts] = useState(initialProducts.length === 0);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(60);
  const [query, setQuery] = useState("");
  const [categoryGroup, setCategoryGroup] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const activeCategoryGroup = searchParams.get("categoryGroup") || categoryGroup;
  const activeSubcategory = searchParams.get("subcategory") || subcategory;
  const categoryHero = getCategoryHero(activeCategoryGroup);
  const heroTitle = locale === "pt" ? categoryHero.labelPt : categoryHero.labelEn;
  const heroSubtitle = locale === "pt" ? categoryHero.subtitlePt : categoryHero.subtitleEn;

  const facets = useMemo(
    () => ({
      categories: Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort(),
      brands: Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort(),
      sizes: Array.from(new Set(products.map((product) => product.size).filter(Boolean))).sort(),
      colors: Array.from(new Set(products.map((product) => product.color).filter(Boolean))).sort(),
    }),
    [products]
  );
  const selectedCategoryGroup = ODOO_CATEGORY_GROUPS.find((group) => group.key === activeCategoryGroup);
  const selectedCategoryGroupLabel = selectedCategoryGroup
    ? locale === "pt"
      ? selectedCategoryGroup.labelPt
      : selectedCategoryGroup.labelEn
    : null;
  const selectedSubcategoryLabel = activeSubcategory ? displayOdooCategoryName(activeSubcategory) : null;
  const selectedMenuCategory = MENU_CATEGORIES.find((entry) => entry.key === activeCategoryGroup);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (category && product.category !== category) return false;
      if (brand && product.brand !== brand) return false;
      if (size && product.size !== size) return false;
      if (color && product.color !== color) return false;
      if (inStockOnly && product.stockQuantity <= 0) return false;
      if (!q) return true;
      return [
        product.name,
        product.description,
        product.category,
        product.brand,
        product.sku,
        product.refId,
        product.size,
        product.color,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [brand, category, color, inStockOnly, products, query, size]);
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  useEffect(() => {
    if (initialProducts.length > 0) return;
    let cancelled = false;
    const params = searchParams.toString();

    async function loadProducts() {
      setLoadingProducts(true);
      setCategoryGroup(searchParams.get("categoryGroup") || "");
      setSubcategory(searchParams.get("subcategory") || "");
      try {
        const requestParams = new URLSearchParams(params);
        const response = await fetch(`/api/products${requestParams.toString() ? `?${requestParams.toString()}` : ""}`);
        if (!response.ok) throw new Error("Product request failed.");
        let data = await response.json();
        let relaxedStockFilter = false;

        // Category navigation should never land on a blank shop just because
        // the previous URL kept the in-stock filter around.
        if (
          (data.products || []).length === 0 &&
          requestParams.get("stock") === "in" &&
          (requestParams.has("categoryGroup") || requestParams.has("subcategory") || requestParams.has("category"))
        ) {
          requestParams.delete("stock");
          const relaxedResponse = await fetch(`/api/products${requestParams.toString() ? `?${requestParams.toString()}` : ""}`);
          if (relaxedResponse.ok) {
            const relaxedData = await relaxedResponse.json();
            if ((relaxedData.products || []).length > 0) {
              data = relaxedData;
              relaxedStockFilter = true;
            }
          }
        }

        if (!cancelled) {
          setProducts(data.products || []);
          setQuery(searchParams.get("q") || "");
          setCategory(searchParams.get("category") || "");
          setBrand(searchParams.get("brand") || "");
          setSize(searchParams.get("size") || "");
          setColor(searchParams.get("color") || "");
          setInStockOnly(relaxedStockFilter ? false : searchParams.get("stock") === "in");
          setVisibleCount(60);
          if (relaxedStockFilter) {
            setMessage("Mostramos todos os produtos desta categoria porque não havia resultados em stock.");
          }
        }
      } catch {
        if (!cancelled) setMessage("Não foi possível carregar o catálogo Odoo.");
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [initialProducts.length, searchParams]);

  function resetVisibleCount() {
    setVisibleCount(60);
  }

  function navigateCategory(nextCategoryGroup: string, nextSubcategory = "") {
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategoryGroup) {
      params.set("categoryGroup", nextCategoryGroup);
    } else {
      params.delete("categoryGroup");
    }
    if (nextSubcategory) {
      params.set("subcategory", nextSubcategory);
    } else {
      params.delete("subcategory");
    }
    params.delete("category");
    setCategoryGroup(nextCategoryGroup);
    setSubcategory(nextSubcategory);
    setCategory("");
    setLoadingProducts(true);
    resetVisibleCount();
    router.push(`/loja${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async function addToCart(productId: string) {
    setAdding(productId);
    setMessage(null);
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await response.json();
    setAdding(null);
    if (!response.ok) {
      setMessage(data.message || "Configura a base de dados para ativar o carrinho.");
      return;
    }
    setMessage("Produto adicionado ao carrinho.");
    window.dispatchEvent(new Event("jss-cart-updated"));
  }

  async function askWhenAvailable(product: StoreProduct, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        email: form.get("email"),
        name: form.get("name"),
        phoneCountryCode: form.get("phoneCountryCode"),
        phone: form.get("phone"),
        message: `Notify me when ${product.name} is available.`,
      }),
    });
    setMessage(response.ok ? "Pedido registado. Avisamos quando voltar a estar disponível." : "Não foi possível registar o pedido.");
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink pt-28 text-white sm:pt-32">
        <div className="absolute inset-0">
          <Image
            key={categoryHero.image}
            src={categoryHero.image}
            alt={heroTitle}
            fill
            priority
            sizes="100vw"
            className="shop-hero-media object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[42vw] max-w-7xl flex-col justify-end px-5 pb-12 pt-16 sm:min-h-[320px] sm:px-8 sm:pb-14">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/75">
            {STORE.name}
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-5xl font-extrabold uppercase tracking-tight sm:text-6xl">
            {heroTitle}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
            {heroSubtitle}
          </p>
          {selectedSubcategoryLabel && (
            <p className="mt-5 inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-sm">
              {selectedSubcategoryLabel}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <div className="mb-8 rounded-3xl border border-line bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-7">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetVisibleCount();
              }}
              placeholder="Pesquisar produtos"
              className="rounded-2xl border border-line px-4 py-3 text-sm md:col-span-3 lg:col-span-2"
            />
            <select
              value={activeCategoryGroup}
              onChange={(event) => navigateCategory(event.target.value)}
              className="rounded-2xl border border-line px-4 py-3 text-sm"
            >
              <option value="">Main category</option>
              {ODOO_CATEGORY_GROUPS.map((group) => (
                <option key={group.key} value={group.key}>
                  {locale === "pt" ? group.labelPt : group.labelEn}
                </option>
              ))}
            </select>
            <select
              value={activeSubcategory}
              onChange={(event) => navigateCategory(activeCategoryGroup, event.target.value)}
              disabled={!selectedMenuCategory}
              className="rounded-2xl border border-line px-4 py-3 text-sm disabled:opacity-50"
            >
              <option value="">Subcategory</option>
              {selectedMenuCategory?.items.map((item) => (
                <option key={item} value={item}>
                  {displayOdooCategoryName(item)}
                </option>
              ))}
            </select>
            <select value={category} onChange={(event) => { setCategory(event.target.value); resetVisibleCount(); }} className="rounded-2xl border border-line px-4 py-3 text-sm">
              <option value="">Odoo category</option>
              {facets.categories.map((item) => <option key={item} value={item}>{displayOdooCategoryName(item)}</option>)}
            </select>
            <select value={brand} onChange={(event) => { setBrand(event.target.value); resetVisibleCount(); }} className="rounded-2xl border border-line px-4 py-3 text-sm">
              <option value="">Brand</option>
              {facets.brands.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={size} onChange={(event) => { setSize(event.target.value); resetVisibleCount(); }} className="rounded-2xl border border-line px-4 py-3 text-sm">
              <option value="">Size</option>
              {facets.sizes.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={color} onChange={(event) => { setColor(event.target.value); resetVisibleCount(); }} className="rounded-2xl border border-line px-4 py-3 text-sm">
              <option value="">Color</option>
              {facets.colors.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-muted">
            <input type="checkbox" checked={inStockOnly} onChange={(event) => { setInStockOnly(event.target.checked); resetVisibleCount(); }} />
            Mostrar só produtos em stock
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
            {loadingProducts ? (
              <span className="inline-flex items-center gap-2">
                <span className="shop-loader-wave !h-7 !w-7 scale-75" aria-hidden />
                A procurar produtos...
              </span>
            ) : (
              <span>{filteredProducts.length} produtos encontrados</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <CurrencySelector />
            <CurrencyNote />
          </div>
          {(selectedCategoryGroupLabel || selectedSubcategoryLabel) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {selectedCategoryGroupLabel && (
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Categoria: {selectedCategoryGroupLabel}
                </span>
              )}
              {selectedSubcategoryLabel && (
                <span className="rounded-full border border-line px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted">
                  Subcategoria: {selectedSubcategoryLabel}
                </span>
              )}
              <Link href="/loja" className="text-xs font-bold uppercase tracking-wide text-muted underline">
                Limpar filtros
              </Link>
            </div>
          )}
        </div>

        {loadingProducts ? (
          <div>
            <div className="mb-8 flex flex-col items-center gap-3 py-6">
              <div className="shop-loader-wave" aria-hidden />
              <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-ink">
                A carregar catálogo
              </p>
              <p className="text-sm text-muted">
                {locale === "pt" ? "A procurar o melhor equipamento para ti..." : "Searching the best gear for you..."}
              </p>
            </div>
            <ProductSkeletonGrid />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product) => (
                <article key={product.id} className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
                  <Link href={`/loja/${product.slug}`} className="relative block h-44 bg-cream p-3 sm:h-48">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="object-contain p-3"
                    />
                  </Link>
                  <div className="p-4">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
                      {displayOdooCategoryName(product.category)} · {product.brand}
                    </p>
                    <Link href={`/loja/${product.slug}`} className="group">
                      <h2 className="font-display mt-2 line-clamp-2 text-base font-extrabold uppercase tracking-tight transition group-hover:text-muted sm:text-lg">
                        {product.name}
                      </h2>
                    </Link>
                    <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-relaxed text-muted sm:text-sm">{product.description}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.7rem] text-muted">
                      <div><dt className="font-bold uppercase">Ref</dt><dd className="truncate">{product.refId || product.sku || product.odooProductId || "-"}</dd></div>
                      <div><dt className="font-bold uppercase">Stock</dt><dd>{product.stockQuantity > 0 ? `${product.stockQuantity}` : "0"}</dd></div>
                      {product.size && <div><dt className="font-bold uppercase">Tamanho</dt><dd>{product.size}</dd></div>}
                      {product.color && <div><dt className="font-bold uppercase">Cor</dt><dd>{product.color}</dd></div>}
                    </dl>
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-xl font-extrabold"><CurrencyPrice cents={product.priceCents} /></p>
                        <p className="text-[0.7rem] text-muted">
                          {product.stockQuantity > 0 ? product.stockState || "Disponível" : "Esgotado"}
                        </p>
                      </div>
                      {product.availableForSale ? (
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/loja/${product.slug}`}
                            className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-cream"
                          >
                            Detalhes
                          </Link>
                          <button
                            type="button"
                            onClick={() => addToCart(product.id)}
                            disabled={adding === product.id}
                            className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white transition hover:bg-ink-soft disabled:opacity-60"
                          >
                            {adding === product.id ? "..." : "Adicionar"}
                          </button>
                        </div>
                      ) : (
                        <Link href={`/loja/${product.slug}`} className="rounded-full border border-dashed border-ink/30 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-muted transition hover:bg-cream">
                          Esgotado
                        </Link>
                      )}
                    </div>
                    {!product.availableForSale && (
                      <form onSubmit={(event) => askWhenAvailable(product, event)} className="mt-4 grid gap-2 rounded-2xl bg-cream p-3">
                        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">Avisar quando disponível</p>
                        <input name="email" required type="email" placeholder="Email" className="rounded-xl border border-line px-3 py-2 text-sm" />
                        <div className="grid gap-2">
                          <input name="name" placeholder="Nome" className="rounded-xl border border-line px-3 py-2 text-sm" />
                          <div className="grid grid-cols-[0.5fr_1fr] gap-2">
                            <select name="phoneCountryCode" defaultValue="+351" className="rounded-xl border border-line px-2 py-2 text-sm">
                              <option value="+351">+351</option>
                              <option value="+34">+34</option>
                              <option value="+33">+33</option>
                              <option value="+44">+44</option>
                              <option value="+49">+49</option>
                              <option value="+1">+1</option>
                            </select>
                            <input name="phone" placeholder="Telefone" className="rounded-xl border border-line px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <button className="rounded-full bg-ink px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wide text-white">
                          Pedir aviso
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {visibleProducts.length === 0 && (
              <p className="py-16 text-center text-sm font-semibold text-muted">
                {locale === "pt" ? "Nenhum produto encontrado nesta categoria." : "No products found in this category."}
              </p>
            )}
          </>
        )}

        {message && (
          <div className="fixed bottom-24 right-5 z-[60] rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-xl">
            {message}
          </div>
        )}

        {!loadingProducts && visibleProducts.length < filteredProducts.length && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 60)}
              className="rounded-full border border-ink px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-ink hover:text-white"
            >
              Ver mais produtos
            </button>
          </div>
        )}
      </section>
    </>
  );
}
