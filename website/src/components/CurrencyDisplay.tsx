"use client";

import { useEffect, useState } from "react";
import {
  ApproximateCurrency,
  approximateCurrencies,
  formatApproximateCurrency,
  formatEuro,
} from "@/lib/ecommerce/money";

const STORAGE_KEY = "jss-display-currency";
const currencies = Object.keys(approximateCurrencies) as ApproximateCurrency[];

function isApproximateCurrency(value: string | null): value is ApproximateCurrency {
  return Boolean(value && value in approximateCurrencies);
}

function storedCurrency() {
  if (typeof window === "undefined") return "EUR";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isApproximateCurrency(stored) ? stored : "EUR";
}

export function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<ApproximateCurrency>(storedCurrency);

  function updateCurrency(value: ApproximateCurrency) {
    setSelected(value);
    window.localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new CustomEvent("jss-currency-changed", { detail: value }));
  }

  return (
    <label className={`inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted ${compact ? "" : "shadow-sm"}`}>
      Display
      <select
        value={selected}
        onChange={(event) => updateCurrency(event.currentTarget.value as ApproximateCurrency)}
        className="bg-transparent text-ink outline-none"
      >
        {currencies.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CurrencyPrice({ cents, className = "" }: { cents: number; className?: string }) {
  const [selected, setSelected] = useState<ApproximateCurrency>(storedCurrency);

  useEffect(() => {
    function onCurrencyChanged(event: Event) {
      const next = (event as CustomEvent<string>).detail;
      if (isApproximateCurrency(next)) setSelected(next);
    }

    window.addEventListener("jss-currency-changed", onCurrencyChanged);
    return () => window.removeEventListener("jss-currency-changed", onCurrencyChanged);
  }, []);

  if (selected === "EUR") {
    return <span className={className}>{formatEuro(cents, "en-IE")}</span>;
  }

  return (
    <span className={className}>
      {formatEuro(cents, "en-IE")}
      <span className="ml-2 text-sm font-semibold text-muted">
        ≈ {formatApproximateCurrency(cents, selected)}
      </span>
    </span>
  );
}

export function CurrencyNote() {
  return (
    <p className="text-xs text-muted">
      Currency conversion is approximate. Checkout, payment, invoice, and Odoo order stay in EUR.
    </p>
  );
}
