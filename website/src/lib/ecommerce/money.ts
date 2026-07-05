export const currency = "EUR";

export const approximateCurrencies = {
  EUR: { label: "EUR", rate: 1, locale: "en-IE", symbol: "EUR" },
  USD: { label: "USD", rate: 1.08, locale: "en-US", symbol: "USD" },
  GBP: { label: "GBP", rate: 0.86, locale: "en-GB", symbol: "GBP" },
  BRL: { label: "BRL", rate: 5.9, locale: "pt-BR", symbol: "BRL" },
  CHF: { label: "CHF", rate: 0.96, locale: "de-CH", symbol: "CHF" },
} as const;

export type ApproximateCurrency = keyof typeof approximateCurrencies;

export function eurosToCents(value: number) {
  return Math.round(value * 100);
}

export function centsToEuros(cents: number) {
  return cents / 100;
}

export function formatEuro(cents: number, locale = "pt-PT") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(centsToEuros(cents));
}

export function formatApproximateCurrency(cents: number, targetCurrency: ApproximateCurrency) {
  const target = approximateCurrencies[targetCurrency];
  return new Intl.NumberFormat(target.locale, {
    style: "currency",
    currency: target.symbol,
  }).format(centsToEuros(cents) * target.rate);
}
