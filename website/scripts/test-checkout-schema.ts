import { checkoutSchema } from "../src/lib/ecommerce/schemas";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const base = {
  email: "ana@example.com",
  fullName: "Ana Silva",
  phone: "912345678",
  paymentMethod: "MBWAY" as const,
};

const pickup = checkoutSchema.parse({
  ...base,
  fulfillmentMethod: "PICKUP_IN_STORE",
});
assert(pickup.fulfillmentMethod === "PICKUP_IN_STORE", "pickup checkout is valid without an address");
assert(!pickup.addressLine1, "pickup does not require a street");

const shipMissing = checkoutSchema.safeParse({
  ...base,
  fulfillmentMethod: "SHIP_TO_ADDRESS",
});
assert(!shipMissing.success, "ship-to-home without address is rejected");

const shipOk = checkoutSchema.parse({
  ...base,
  fulfillmentMethod: "SHIP_TO_ADDRESS",
  addressLine1: "Rua de Gaza 16",
  postalCode: "2775-597",
  city: "Carcavelos",
  country: "pt",
});
assert(shipOk.country === "PT", "country is normalized to ISO-2");
assert(shipOk.city === "Carcavelos", "city is kept");

const billingMissing = checkoutSchema.safeParse({
  ...base,
  fulfillmentMethod: "SHIP_TO_ADDRESS",
  addressLine1: "Rua de Gaza 16",
  postalCode: "2775-597",
  city: "Carcavelos",
  billingSameAsShipping: false,
});
assert(!billingMissing.success, "separate billing without address is rejected");

const billingOk = checkoutSchema.parse({
  ...base,
  fulfillmentMethod: "SHIP_TO_ADDRESS",
  addressLine1: "Rua de Gaza 16",
  postalCode: "2775-597",
  city: "Carcavelos",
  billingSameAsShipping: false,
  billingAddressLine1: "Av. da República 1",
  billingPostalCode: "1050-001",
  billingCity: "Lisboa",
  billingCountry: "PT",
});
assert(billingOk.billingCity === "Lisboa", "separate billing address is accepted");

console.log("checkout address schema ok");
