export const CHECKOUT_PAYMENT_METHODS = [
  {
    id: "MBWAY",
    label: "MB WAY",
    hint: "Vais receber um pedido MB WAY no telemóvel para aprovar o pagamento.",
    live: true,
    provider: "ifthenpay",
  },
  {
    id: "MULTIBANCO",
    label: "Multibanco",
    hint: "Depois da encomenda mostramos a entidade e a referência Multibanco.",
    live: true,
    provider: "ifthenpay",
  },
  {
    id: "CARD",
    label: "Cartão",
    hint: "Visa, Mastercard e Amex — em breve. Não passa pela Stripe.",
    live: false,
    provider: "placeholder",
  },
  {
    id: "PAYPAL",
    label: "PayPal",
    hint: "PayPal — em breve, quando a conta de comerciante estiver ligada.",
    live: false,
    provider: "placeholder",
  },
  {
    id: "PAYSHOP",
    label: "Payshop",
    hint: "Payshop — em breve.",
    live: false,
    provider: "placeholder",
  },
  {
    id: "KLARNA",
    label: "Klarna",
    hint: "Avanças para a Stripe para pagar com Klarna (prestações / pagar mais tarde).",
    live: true,
    provider: "stripe",
  },
  {
    id: "GOOGLE_PAY",
    label: "Google Pay",
    hint: "Avanças para a Stripe para pagar com Google Pay.",
    live: true,
    provider: "stripe",
  },
  {
    id: "APPLE_PAY",
    label: "Apple Pay",
    hint: "Apple Pay — em breve.",
    live: false,
    provider: "placeholder",
  },
  {
    id: "REVOLUT_PAY",
    label: "Revolut Pay",
    hint: "Avanças para a Stripe para pagar com Revolut Pay.",
    live: true,
    provider: "stripe",
  },
] as const;

export type CheckoutPaymentMethodId = (typeof CHECKOUT_PAYMENT_METHODS)[number]["id"];

export const CHECKOUT_PAYMENT_METHOD_IDS = CHECKOUT_PAYMENT_METHODS.map((method) => method.id);

export function getCheckoutPaymentMethod(id: string) {
  return CHECKOUT_PAYMENT_METHODS.find((method) => method.id === id);
}

export function isLiveCheckoutPaymentMethod(id: string) {
  return getCheckoutPaymentMethod(id)?.live === true;
}

export function isStripeCheckoutMethod(id: string) {
  return getCheckoutPaymentMethod(id)?.provider === "stripe";
}
