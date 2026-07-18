"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const copy = {
  pt: {
    title: "Avaliar este produto",
    yourRating: "A tua classificação",
    average: "média",
    ratings: "avaliações",
    noRatings: "Ainda sem avaliações — sê o primeiro!",
    saving: "A guardar…",
    saved: "Obrigado pela tua avaliação!",
    error: "Não foi possível guardar a avaliação. Tenta novamente.",
    clear: "Remover avaliação (0 estrelas)",
    rate: "Dar",
    stars: "estrelas",
  },
  en: {
    title: "Rate this product",
    yourRating: "Your rating",
    average: "average",
    ratings: "ratings",
    noRatings: "No ratings yet — be the first!",
    saving: "Saving…",
    saved: "Thanks for your rating!",
    error: "Could not save your rating. Please try again.",
    clear: "Clear rating (0 stars)",
    rate: "Rate",
    stars: "stars",
  },
  zh: {
    title: "为该商品评分",
    yourRating: "你的评分",
    average: "平均",
    ratings: "条评分",
    noRatings: "暂无评分——来做第一个吧！",
    saving: "保存中…",
    saved: "谢谢你的评分！",
    error: "无法保存评分，请重试。",
    clear: "清除评分（0 星）",
    rate: "评分",
    stars: "星",
  },
} as const;

type RatingSummary = {
  average: number;
  count: number;
  myRating: number | null;
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-8 w-8"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 5.9L12 17.3 6.7 20l1-5.9L3.4 9.9l6-.9L12 3.5Z"
      />
    </svg>
  );
}

export function ProductStarRating({ productId }: { productId: string }) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [summary, setSummary] = useState<RatingSummary>({
    average: 0,
    count: 0,
    myRating: null,
  });
  const [hover, setHover] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(productId)}/ratings`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as RatingSummary;
        if (!cancelled) {
          setSummary({
            average: Number(data.average) || 0,
            count: Number(data.count) || 0,
            myRating: typeof data.myRating === "number" ? data.myRating : null,
          });
        }
      } catch {
        // Keep empty state if ratings are unavailable.
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function rate(stars: number) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars }),
      });
      if (!response.ok) throw new Error("rate_failed");
      const data = (await response.json()) as RatingSummary;
      setSummary({
        average: Number(data.average) || 0,
        count: Number(data.count) || 0,
        myRating: typeof data.myRating === "number" ? data.myRating : stars,
      });
      setMessage(t.saved);
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  }

  const displayValue = hover ?? summary.myRating ?? 0;

  return (
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">
            {t.title}
          </p>
          {summary.count > 0 ? (
            <p className="mt-2 text-sm text-ink">
              <span className="font-display text-2xl font-extrabold">
                {summary.average.toFixed(1)}
              </span>
              <span className="ml-2 text-muted">
                {t.average} · {summary.count} {t.ratings}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">{t.noRatings}</p>
          )}
        </div>

        <div>
          <div
            className="flex items-center gap-0.5"
            onMouseLeave={() => setHover(null)}
          >
            {[1, 2, 3, 4, 5].map((stars) => {
              const filled = displayValue >= stars;
              return (
                <button
                  key={stars}
                  type="button"
                  disabled={saving}
                  aria-label={`${t.rate} ${stars} ${t.stars}`}
                  onMouseEnter={() => setHover(stars)}
                  onFocus={() => setHover(stars)}
                  onClick={() => void rate(stars)}
                  className={`rounded-md p-0.5 transition ${
                    filled ? "text-[#e3a008]" : "text-[#d5d0c6] hover:text-[#e3a008]"
                  } ${saving ? "opacity-60" : ""}`}
                >
                  <StarIcon filled={filled} />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={saving || summary.myRating === null}
            onClick={() => void rate(0)}
            className="mt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-muted underline-offset-2 transition hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.clear}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        {t.yourRating}:{" "}
        <span className="font-semibold text-ink">
          {summary.myRating === null ? "—" : `${summary.myRating}/5`}
        </span>
        {saving ? ` · ${t.saving}` : null}
      </p>
      {message && <p className="mt-2 text-xs font-semibold text-ink">{message}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
    </section>
  );
}
