"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { CurrencyNote, CurrencyPrice, CurrencySelector } from "@/components/CurrencyDisplay";
import { useLanguage } from "@/components/LanguageProvider";
import type { StoreProduct } from "@/lib/ecommerce/catalog";
import { ODOO_CATEGORY_GROUPS, displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
import {
  DEFAULT_SHOP_FACET_FILTERS,
  applyShopFacetFilters,
  buildShopFacets,
  isValidShopSort,
  parseAvailabilityParam,
  parseListParam,
  sortShopProducts,
  toggleListValue,
  type FacetBucket,
  type ShopAvailability,
  type ShopFacetFilters,
  type ShopSortOption,
} from "@/lib/ecommerce/shopFilters";
import { MENU_CATEGORIES, type NavKey } from "@/lib/i18n";

type MenuCategory = {
  key: NavKey;
  anchor: string;
  items: string[];
};

const copy = {
  pt: {
    filterSort: "Filtros / Ordenar",
    filterBy: "Filtrar por",
    sortBy: "Ordenar por",
    search: "Pesquisar produtos",
    mainCategory: "Categoria principal",
    subcategory: "Subcategoria",
    availability: "Disponibilidade",
    inStock: "Em stock",
    outOfStock: "Esgotado",
    price: "Preço",
    from: "De",
    to: "Até",
    productType: "Tipo de produto",
    gender: "Género",
    brand: "Marca",
    size: "Tamanho",
    color: "Cor",
    clearAll: "Limpar tudo",
    reset: "Repor",
    apply: "Ver resultados",
    close: "Fechar",
    productsFound: "produtos encontrados",
    loadingCatalog: "A carregar catálogo",
    loadingSearch: "A procurar o melhor equipamento para ti...",
    searching: "A procurar produtos...",
    empty: "Nenhum produto encontrado com estes filtros.",
    loadMore: "Ver mais produtos",
    selected: "selecionados",
    sort: {
      featured: "Em destaque",
      relevance: "Mais relevantes",
      "best-selling": "Mais vendidos",
      "title-ascending": "Alfabeticamente, A-Z",
      "title-descending": "Alfabeticamente, Z-A",
      "price-ascending": "Preço, menor para maior",
      "price-descending": "Preço, maior para menor",
      "created-ascending": "Data, antigos para novos",
      "created-descending": "Data, novos para antigos",
    } satisfies Record<ShopSortOption, string>,
  },
  en: {
    filterSort: "Filter / Sort",
    filterBy: "Filter by",
    sortBy: "Sort by",
    search: "Search products",
    mainCategory: "Main category",
    subcategory: "Subcategory",
    availability: "Availability",
    inStock: "In stock",
    outOfStock: "Out of stock",
    price: "Price",
    from: "From",
    to: "To",
    productType: "Product type",
    gender: "Gender",
    brand: "Brand",
    size: "Size",
    color: "Color",
    clearAll: "Clear all",
    reset: "Reset",
    apply: "View results",
    close: "Close",
    productsFound: "products found",
    loadingCatalog: "Loading catalog",
    loadingSearch: "Searching the best gear for you...",
    searching: "Searching products...",
    empty: "No products found with these filters.",
    loadMore: "Show more products",
    selected: "selected",
    sort: {
      featured: "Featured",
      relevance: "Most relevant",
      "best-selling": "Best selling",
      "title-ascending": "Alphabetically, A-Z",
      "title-descending": "Alphabetically, Z-A",
      "price-ascending": "Price, low to high",
      "price-descending": "Price, high to low",
      "created-ascending": "Date, old to new",
      "created-descending": "Date, new to old",
    } satisfies Record<ShopSortOption, string>,
  },
  zh: {
    filterSort: "筛选 / 排序",
    filterBy: "筛选",
    sortBy: "排序",
    search: "搜索商品",
    mainCategory: "主分类",
    subcategory: "子分类",
    availability: "库存状态",
    inStock: "有货",
    outOfStock: "缺货",
    price: "价格",
    from: "从",
    to: "到",
    productType: "产品类型",
    gender: "性别",
    brand: "品牌",
    size: "尺码",
    color: "颜色",
    clearAll: "清除全部",
    reset: "重置",
    apply: "查看结果",
    close: "关闭",
    productsFound: "件商品",
    loadingCatalog: "正在加载目录",
    loadingSearch: "正在为你寻找最合适的装备...",
    searching: "正在搜索商品...",
    empty: "没有符合这些筛选条件的商品。",
    loadMore: "查看更多商品",
    selected: "已选",
    sort: {
      featured: "精选",
      relevance: "最相关",
      "best-selling": "最畅销",
      "title-ascending": "按名称 A-Z",
      "title-descending": "按名称 Z-A",
      "price-ascending": "价格从低到高",
      "price-descending": "价格从高到低",
      "created-ascending": "日期从旧到新",
      "created-descending": "日期从新到旧",
    } satisfies Record<ShopSortOption, string>,
  },
} as const;

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
          </div>
        </article>
      ))}
    </div>
  );
}

function FacetSection({
  title,
  selectedCount,
  onReset,
  resetLabel,
  children,
  defaultOpen = false,
}: {
  title: string;
  selectedCount: number;
  onReset: () => void;
  resetLabel: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || selectedCount > 0);

  return (
    <div className="border-b border-line py-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-bold uppercase tracking-wide text-ink">{title}</span>
        <span className="text-xs font-semibold text-muted">
          {selectedCount > 0 ? `${selectedCount}` : open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="mt-3">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="mb-2 text-[0.7rem] font-bold uppercase tracking-wide text-muted underline"
            >
              {resetLabel}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function CheckboxFacetList({
  items,
  selected,
  onToggle,
}: {
  items: FacetBucket[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (!items.length) {
    return <p className="text-xs text-muted">—</p>;
  }

  return (
    <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
      {items.map((item) => {
        const checked = selected.includes(item.value);
        return (
          <li key={item.value}>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-1 text-sm transition hover:bg-cream">
              <span className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.value)}
                  className="accent-ink"
                />
                <span className="truncate text-ink">{item.value}</span>
              </span>
              <span className="shrink-0 text-xs text-muted">({item.count})</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function filtersFromSearchParams(params: URLSearchParams): ShopFacetFilters {
  const sortParam = params.get("sort");
  return {
    query: params.get("q") || "",
    availability: parseAvailabilityParam(params.get("availability") || (params.get("stock") === "in" ? "in" : null)),
    minPriceEuros: params.get("minPrice") || "",
    maxPriceEuros: params.get("maxPrice") || "",
    productTypes: parseListParam(params.get("productType")),
    genders: parseListParam(params.get("gender")),
    brands: parseListParam(params.get("brand")),
    sizes: parseListParam(params.get("size")),
    colors: parseListParam(params.get("color")),
    sort: isValidShopSort(sortParam) ? sortParam : "featured",
  };
}

function writeFiltersToParams(
  base: URLSearchParams,
  filters: ShopFacetFilters,
  categoryGroup: string,
  subcategory: string
) {
  const params = new URLSearchParams();
  if (categoryGroup) params.set("categoryGroup", categoryGroup);
  if (subcategory) params.set("subcategory", subcategory);
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.availability.length) params.set("availability", filters.availability.join(","));
  if (filters.minPriceEuros.trim()) params.set("minPrice", filters.minPriceEuros.trim());
  if (filters.maxPriceEuros.trim()) params.set("maxPrice", filters.maxPriceEuros.trim());
  if (filters.productTypes.length) params.set("productType", filters.productTypes.join(","));
  if (filters.genders.length) params.set("gender", filters.genders.join(","));
  if (filters.brands.length) params.set("brand", filters.brands.join(","));
  if (filters.sizes.length) params.set("size", filters.sizes.join(","));
  if (filters.colors.length) params.set("color", filters.colors.join(","));
  if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);

  // Preserve unrelated params (e.g. currency) if present.
  for (const key of ["currency"]) {
    const value = base.get(key);
    if (value) params.set(key, value);
  }
  return params;
}

function countActiveFilters(filters: ShopFacetFilters) {
  return (
    filters.availability.length +
    filters.productTypes.length +
    filters.genders.length +
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.minPriceEuros.trim() ? 1 : 0) +
    (filters.maxPriceEuros.trim() ? 1 : 0) +
    (filters.query.trim() ? 1 : 0)
  );
}

export function ShopClient({
  products: initialProducts = [],
  catalogKey: initialCatalogKey = "||",
  menuCategories: initialMenuCategories,
}: {
  products?: StoreProduct[];
  catalogKey?: string;
  menuCategories?: MenuCategory[];
}) {
  const { locale, t: i18n } = useLanguage();
  const t = copy[locale];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(
    initialMenuCategories?.length ? initialMenuCategories : MENU_CATEGORIES
  );

  useEffect(() => {
    if (initialMenuCategories?.length) {
      setMenuCategories(initialMenuCategories);
      return;
    }
    let cancelled = false;
    fetch("/api/menu-categories")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.categories) && data.categories.length) {
          setMenuCategories(data.categories);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [initialMenuCategories]);
  const [loadingProducts, setLoadingProducts] = useState(initialProducts.length === 0);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(60);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Draft fields for typing; applied filters come from the URL (Pukas-style shareable state).
  const [draftQuery, setDraftQuery] = useState(searchParams.get("q") || "");
  const [draftMinPrice, setDraftMinPrice] = useState(searchParams.get("minPrice") || "");
  const [draftMaxPrice, setDraftMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const activeCategoryGroup = searchParams.get("categoryGroup") || "";
  const activeSubcategory = searchParams.get("subcategory") || "";
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const selectedCategoryGroup = ODOO_CATEGORY_GROUPS.find((group) => group.key === activeCategoryGroup);
  const selectedCategoryGroupLabel = selectedCategoryGroup
    ? locale === "pt"
      ? selectedCategoryGroup.labelPt
      : locale === "zh"
        ? selectedCategoryGroup.labelZh
        : selectedCategoryGroup.labelEn
    : null;
  const selectedSubcategoryLabel = activeSubcategory ? displayOdooCategoryName(activeSubcategory) : null;
  const selectedMenuCategory = menuCategories.find((entry) => entry.key === activeCategoryGroup);

  const facets = useMemo(() => buildShopFacets(products), [products]);
  const filteredProducts = useMemo(() => {
    const filtered = applyShopFacetFilters(products, filters);
    return sortShopProducts(filtered, filters.sort, filters.query);
  }, [filters, products]);
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const activeFilterCount = countActiveFilters(filters);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDraftQuery(filters.query);
      setDraftMinPrice(filters.minPriceEuros);
      setDraftMaxPrice(filters.maxPriceEuros);
    }, 0);
    return () => window.clearTimeout(id);
  }, [filters.query, filters.minPriceEuros, filters.maxPriceEuros]);

  const catalogKey = [
    searchParams.get("categoryGroup") || "",
    searchParams.get("subcategory") || "",
    searchParams.get("q") || "",
  ].join("|");

  useEffect(() => {
    let cancelled = false;
    const [group, sub, q] = catalogKey.split("|");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);

    async function loadProducts() {
      // Keep SSR products visible while the full lean catalog downloads.
      if (initialProducts.length === 0 || catalogKey !== initialCatalogKey) {
        setLoadingProducts(true);
      }
      try {
        // Fetch the category-scoped catalog; facet filters/sort apply client-side (Pukas-style facets).
        const requestParams = new URLSearchParams();
        if (group) requestParams.set("categoryGroup", group);
        if (sub) requestParams.set("subcategory", sub);
        if (q) requestParams.set("q", q);

        const response = await fetch(
          `/api/products${requestParams.toString() ? `?${requestParams.toString()}` : ""}`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (!response.ok) throw new Error("Product request failed.");
        const data = await response.json();
        if (!cancelled) {
          setProducts(Array.isArray(data.products) ? data.products : []);
          setVisibleCount(60);
          setMessage(null);
        }
      } catch {
        if (!cancelled) {
          // Keep any previously shown products instead of wiping the grid.
          setMessage(
            locale === "pt"
              ? "Não foi possível atualizar o catálogo. A mostrar os produtos já carregados."
              : locale === "zh"
                ? "无法更新目录。正在显示已加载的商品。"
                : "Could not refresh the catalog. Showing previously loaded products."
          );
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [catalogKey, initialCatalogKey, initialProducts.length, locale]);

  function pushFilters(
    next: ShopFacetFilters,
    nextGroup = activeCategoryGroup,
    nextSub = activeSubcategory
  ) {
    const params = writeFiltersToParams(searchParams, next, nextGroup, nextSub);
    setVisibleCount(60);
    router.push(`/loja${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  function navigateCategory(nextCategoryGroup: string, nextSubcategory = "") {
    setLoadingProducts(true);
    const nextFilters: ShopFacetFilters = {
      ...filters,
      query: draftQuery,
      // Keep sort/search; clear facet selections that often don't apply across collections.
      availability: [],
      minPriceEuros: "",
      maxPriceEuros: "",
      productTypes: [],
      genders: [],
      brands: [],
      sizes: [],
      colors: [],
    };
    pushFilters(nextFilters, nextCategoryGroup, nextSubcategory);
  }

  function clearAllFilters() {
    pushFilters({ ...DEFAULT_SHOP_FACET_FILTERS, sort: filters.sort }, "", "");
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
    setMessage(
      response.ok
        ? "Pedido registado. Avisamos quando voltar a estar disponível."
        : "Não foi possível registar o pedido."
    );
  }

  const filterPanel = (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3 lg:border-0 lg:pb-0">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted">{t.filterBy}</p>
          <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">{t.filterSort}</h2>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="rounded-full border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted lg:hidden"
        >
          {t.close}
        </button>
      </div>

      <div className="mb-4 grid gap-2">
        <input
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          onBlur={(event) => pushFilters({ ...filters, query: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              pushFilters({ ...filters, query: (event.target as HTMLInputElement).value });
            }
          }}
          placeholder={t.search}
          className="rounded-2xl border border-line px-4 py-3 text-sm"
        />
        <select
          value={activeCategoryGroup}
          onChange={(event) => navigateCategory(event.target.value)}
          className="rounded-2xl border border-line px-4 py-3 text-sm"
        >
          <option value="">{t.mainCategory}</option>
          {ODOO_CATEGORY_GROUPS.map((group) => (
            <option key={group.key} value={group.key}>
              {locale === "pt" ? group.labelPt : locale === "zh" ? group.labelZh : group.labelEn}
            </option>
          ))}
        </select>
        <select
          value={activeSubcategory}
          onChange={(event) => navigateCategory(activeCategoryGroup, event.target.value)}
          disabled={!selectedMenuCategory}
          className="rounded-2xl border border-line px-4 py-3 text-sm disabled:opacity-50"
        >
          <option value="">{t.subcategory}</option>
          {selectedMenuCategory?.items.map((item) => (
            <option key={item} value={item}>
              {i18n.menuItems[item] || displayOdooCategoryName(item)}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <FacetSection
          title={t.availability}
          selectedCount={filters.availability.length}
          onReset={() => pushFilters({ ...filters, availability: [] })}
          resetLabel={t.reset}
          defaultOpen
        >
          <ul className="space-y-1.5">
            {(
              [
                ["in", t.inStock, facets.availability.in],
                ["out", t.outOfStock, facets.availability.out],
              ] as const
            ).map(([value, label, count]) => (
              <li key={value}>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-1 text-sm hover:bg-cream">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes(value)}
                      onChange={() =>
                        pushFilters({
                          ...filters,
                          query: draftQuery,
                          minPriceEuros: draftMinPrice,
                          maxPriceEuros: draftMaxPrice,
                          availability: toggleListValue(filters.availability, value) as ShopAvailability[],
                        })
                      }
                      className="accent-ink"
                    />
                    {label}
                  </span>
                  <span className="text-xs text-muted">({count})</span>
                </label>
              </li>
            ))}
          </ul>
        </FacetSection>

        <FacetSection
          title={t.price}
          selectedCount={(filters.minPriceEuros ? 1 : 0) + (filters.maxPriceEuros ? 1 : 0)}
          onReset={() => pushFilters({ ...filters, minPriceEuros: "", maxPriceEuros: "" })}
          resetLabel={t.reset}
          defaultOpen
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">
              {t.from}
              <input
                type="number"
                min={0}
                step="1"
                inputMode="decimal"
                value={draftMinPrice}
                onChange={(event) => setDraftMinPrice(event.target.value)}
                onBlur={(event) =>
                  pushFilters({
                    ...filters,
                    query: draftQuery,
                    minPriceEuros: event.target.value,
                    maxPriceEuros: draftMaxPrice,
                  })
                }
                placeholder={
                  Number.isFinite(facets.priceBounds.min)
                    ? String(Math.floor(facets.priceBounds.min / 100))
                    : "0"
                }
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-muted">
              {t.to}
              <input
                type="number"
                min={0}
                step="1"
                inputMode="decimal"
                value={draftMaxPrice}
                onChange={(event) => setDraftMaxPrice(event.target.value)}
                onBlur={(event) =>
                  pushFilters({
                    ...filters,
                    query: draftQuery,
                    minPriceEuros: draftMinPrice,
                    maxPriceEuros: event.target.value,
                  })
                }
                placeholder={
                  Number.isFinite(facets.priceBounds.max) && facets.priceBounds.max > 0
                    ? String(Math.ceil(facets.priceBounds.max / 100))
                    : ""
                }
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm text-ink"
              />
            </label>
          </div>
        </FacetSection>

        <FacetSection
          title={t.productType}
          selectedCount={filters.productTypes.length}
          onReset={() => pushFilters({ ...filters, productTypes: [] })}
          resetLabel={t.reset}
        >
          <CheckboxFacetList
            items={facets.productTypes}
            selected={filters.productTypes}
            onToggle={(value) =>
              pushFilters({
                ...filters,
                query: draftQuery,
                minPriceEuros: draftMinPrice,
                maxPriceEuros: draftMaxPrice,
                productTypes: toggleListValue(filters.productTypes, value),
              })
            }
          />
        </FacetSection>

        {facets.genders.length > 0 && (
          <FacetSection
            title={t.gender}
            selectedCount={filters.genders.length}
            onReset={() => pushFilters({ ...filters, genders: [] })}
            resetLabel={t.reset}
          >
            <CheckboxFacetList
              items={facets.genders}
              selected={filters.genders}
              onToggle={(value) =>
                pushFilters({
                  ...filters,
                  query: draftQuery,
                  minPriceEuros: draftMinPrice,
                  maxPriceEuros: draftMaxPrice,
                  genders: toggleListValue(filters.genders, value),
                })
              }
            />
          </FacetSection>
        )}

        <FacetSection
          title={t.brand}
          selectedCount={filters.brands.length}
          onReset={() => pushFilters({ ...filters, brands: [] })}
          resetLabel={t.reset}
        >
          <CheckboxFacetList
            items={facets.brands}
            selected={filters.brands}
            onToggle={(value) =>
              pushFilters({
                ...filters,
                query: draftQuery,
                minPriceEuros: draftMinPrice,
                maxPriceEuros: draftMaxPrice,
                brands: toggleListValue(filters.brands, value),
              })
            }
          />
        </FacetSection>

        <FacetSection
          title={t.size}
          selectedCount={filters.sizes.length}
          onReset={() => pushFilters({ ...filters, sizes: [] })}
          resetLabel={t.reset}
        >
          <CheckboxFacetList
            items={facets.sizes}
            selected={filters.sizes}
            onToggle={(value) =>
              pushFilters({
                ...filters,
                query: draftQuery,
                minPriceEuros: draftMinPrice,
                maxPriceEuros: draftMaxPrice,
                sizes: toggleListValue(filters.sizes, value),
              })
            }
          />
        </FacetSection>

        <FacetSection
          title={t.color}
          selectedCount={filters.colors.length}
          onReset={() => pushFilters({ ...filters, colors: [] })}
          resetLabel={t.reset}
        >
          <CheckboxFacetList
            items={facets.colors}
            selected={filters.colors}
            onToggle={(value) =>
              pushFilters({
                ...filters,
                query: draftQuery,
                minPriceEuros: draftMinPrice,
                maxPriceEuros: draftMaxPrice,
                colors: toggleListValue(filters.colors, value),
              })
            }
          />
        </FacetSection>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={clearAllFilters}
          className="rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted transition hover:text-ink"
        >
          {t.clearAll}
        </button>
        <button
          type="button"
          onClick={() => {
            pushFilters({
              ...filters,
              query: draftQuery,
              minPriceEuros: draftMinPrice,
              maxPriceEuros: draftMaxPrice,
            });
            setFiltersOpen(false);
          }}
          className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-ink-soft lg:hidden"
        >
          {t.apply} ({filteredProducts.length})
        </button>
      </div>
    </div>
  );

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted">
              {selectedCategoryGroupLabel || "Jhonny Surf Store"}
            </p>
            <h1 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
              {selectedSubcategoryLabel ||
                selectedCategoryGroupLabel ||
                (locale === "pt" ? "Loja" : locale === "zh" ? "商店" : "Shop")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {loadingProducts ? (
                <span className="inline-flex items-center gap-2">
                  <span className="shop-loader-wave !h-7 !w-7 scale-75" aria-hidden />
                  {t.searching}
                </span>
              ) : (
                `${filteredProducts.length} ${t.productsFound}`
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-ink bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-ink transition hover:bg-ink hover:text-white lg:hidden"
            >
              {t.filterSort}
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <label className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-muted">
              <span className="uppercase tracking-wide">{t.sortBy}</span>
              <select
                value={filters.sort}
                onChange={(event) =>
                  pushFilters({
                    ...filters,
                    query: draftQuery,
                    minPriceEuros: draftMinPrice,
                    maxPriceEuros: draftMaxPrice,
                    sort: event.target.value as ShopSortOption,
                  })
                }
                className="border-0 bg-transparent text-sm font-bold text-ink outline-none"
              >
                {(Object.keys(t.sort) as ShopSortOption[]).map((key) => (
                  <option key={key} value={key}>
                    {t.sort[key]}
                  </option>
                ))}
              </select>
            </label>
            <CurrencySelector />
          </div>
        </div>

        {(selectedCategoryGroupLabel || selectedSubcategoryLabel || activeFilterCount > 0) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {selectedCategoryGroupLabel && (
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {selectedCategoryGroupLabel}
              </span>
            )}
            {selectedSubcategoryLabel && (
              <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted">
                {selectedSubcategoryLabel}
              </span>
            )}
            {activeFilterCount > 0 && (
              <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted">
                {activeFilterCount} {t.selected}
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-bold uppercase tracking-wide text-muted underline"
            >
              {t.clearAll}
            </button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden rounded-3xl border border-line bg-white p-5 shadow-sm lg:block">
            {filterPanel}
            <div className="mt-4 border-t border-line pt-4">
              <CurrencyNote />
            </div>
          </aside>

          <div>
            {loadingProducts ? (
              <div>
                <div className="mb-8 flex flex-col items-center gap-3 py-6">
                  <div className="shop-loader-wave" aria-hidden />
                  <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-ink">
                    {t.loadingCatalog}
                  </p>
                  <p className="text-sm text-muted">{t.loadingSearch}</p>
                </div>
                <ProductSkeletonGrid />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product) => (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm"
                    >
                      <Link href={`/loja/${product.slug}`} className="relative block h-44 bg-cream p-3 sm:h-52">
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
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.7rem] text-muted">
                          <div>
                            <dt className="font-bold uppercase">Ref</dt>
                            <dd className="truncate">
                              {product.refId || product.sku || product.odooProductId || "-"}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-bold uppercase">Stock</dt>
                            <dd>{product.stockQuantity > 0 ? `${product.stockQuantity}` : "0"}</dd>
                          </div>
                          {product.size && (
                            <div>
                              <dt className="font-bold uppercase">{t.size}</dt>
                              <dd>{product.size}</dd>
                            </div>
                          )}
                          {product.color && (
                            <div>
                              <dt className="font-bold uppercase">{t.color}</dt>
                              <dd>{product.color}</dd>
                            </div>
                          )}
                        </dl>
                        <div className="mt-4 flex flex-col gap-2">
                          <div className="min-w-0">
                            <p className="font-display text-xl font-extrabold">
                              <CurrencyPrice cents={product.priceCents} />
                            </p>
                            <p className="text-[0.7rem] text-muted">
                              {product.stockQuantity > 0
                                ? product.stockState || t.inStock
                                : t.outOfStock}
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
                            <Link
                              href={`/loja/${product.slug}`}
                              className="rounded-full border border-dashed border-ink/30 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-muted transition hover:bg-cream"
                            >
                              {t.outOfStock}
                            </Link>
                          )}
                        </div>
                        {!product.availableForSale && (
                          <form
                            onSubmit={(event) => askWhenAvailable(product, event)}
                            className="mt-4 grid gap-2 rounded-2xl bg-cream p-3"
                          >
                            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                              Avisar quando disponível
                            </p>
                            <input
                              name="email"
                              required
                              type="email"
                              placeholder="Email"
                              className="rounded-xl border border-line px-3 py-2 text-sm"
                            />
                            <div className="grid gap-2">
                              <input
                                name="name"
                                placeholder="Nome"
                                className="rounded-xl border border-line px-3 py-2 text-sm"
                              />
                              <div className="grid grid-cols-[0.5fr_1fr] gap-2">
                                <select
                                  name="phoneCountryCode"
                                  defaultValue="+351"
                                  className="rounded-xl border border-line px-2 py-2 text-sm"
                                >
                                  <option value="+351">+351</option>
                                  <option value="+34">+34</option>
                                  <option value="+33">+33</option>
                                  <option value="+44">+44</option>
                                  <option value="+49">+49</option>
                                  <option value="+1">+1</option>
                                </select>
                                <input
                                  name="phone"
                                  placeholder="Telefone"
                                  className="rounded-xl border border-line px-3 py-2 text-sm"
                                />
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
                  <p className="py-16 text-center text-sm font-semibold text-muted">{t.empty}</p>
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
                  {t.loadMore}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label={t.close}
            className="absolute inset-0 bg-ink/50"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white p-5 shadow-2xl">
            {filterPanel}
          </div>
        </div>
      )}
    </>
  );
}
