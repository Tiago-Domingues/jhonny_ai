"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { CurrencyPrice } from "@/components/CurrencyDisplay";

type SearchHit = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  priceCents: number;
  brand?: string;
};

type HeaderSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  placeholder: string;
  emptyLabel: string;
  searchingLabel: string;
};

export function HeaderSearchOverlay({
  open,
  onClose,
  placeholder,
  emptyLabel,
  searchingLabel,
}: HeaderSearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=8`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search failed");
        const data = await response.json();
        const products = Array.isArray(data.products) ? data.products : [];
        setHits(
          products.slice(0, 8).map((product: SearchHit) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            imageUrl: product.imageUrl,
            priceCents: product.priceCents,
            brand: product.brand,
          }))
        );
      } catch {
        if (!controller.signal.aborted) setHits([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  function submitSearch(event?: FormEvent) {
    event?.preventDefault();
    const q = query.trim();
    onClose();
    if (!q) {
      router.push("/loja");
      return;
    }
    router.push(`/loja?q=${encodeURIComponent(q)}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 top-0 border-b border-line bg-paper shadow-xl">
        <form
          onSubmit={submitSearch}
          className="mx-auto flex max-w-[96rem] items-center gap-3 px-4 py-4 sm:px-6 lg:px-8"
        >
          <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-muted sm:text-lg"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition hover:bg-cream"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </form>

        <div className="mx-auto max-h-[min(60vh,28rem)] max-w-[96rem] overflow-y-auto px-4 pb-5 sm:px-6 lg:px-8">
          {loading && <p className="py-3 text-sm text-muted">{searchingLabel}</p>}
          {!loading && query.trim().length >= 2 && hits.length === 0 && (
            <p className="py-3 text-sm text-muted">{emptyLabel}</p>
          )}
          <ul className="divide-y divide-line">
            {hits.map((hit) => (
              <li key={hit.id}>
                <Link
                  href={`/loja/${hit.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 py-3 transition hover:bg-cream/60"
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                    <Image src={hit.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{hit.name}</span>
                    {hit.brand ? (
                      <span className="mt-0.5 block truncate text-xs text-muted">{hit.brand}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    <CurrencyPrice cents={hit.priceCents} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
