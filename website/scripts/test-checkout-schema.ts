import { checkoutSchema, cartUpdateSchema } from "../src/lib/ecommerce/schemas";

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

const pickupNoNif = checkoutSchema.parse({
  ...base,
  fulfillmentMethod: "PICKUP_IN_STORE",
});
assert(!pickupNoNif.nif, "NIF is optional on pickup");

const nifDigits = checkoutSchema.parse({
  ...base,
  fulfillmentMethod: "PICKUP_IN_STORE",
  nif: "123456789",
});
assert(nifDigits.nif === "123456789", "9-digit NIF is accepted");

const nifVat = checkoutSchema.parse({
  ...base,
  fulfillmentMethod: "PICKUP_IN_STORE",
  nif: "pt 123 456 789",
});
assert(nifVat.nif === "pt 123 456 789", "formatted NIF is accepted at schema level");

const badNif = checkoutSchema.safeParse({
  ...base,
  fulfillmentMethod: "PICKUP_IN_STORE",
  nif: "ABC",
});
assert(!badNif.success, "invalid NIF is rejected");

const shortNif = checkoutSchema.safeParse({
  ...base,
  fulfillmentMethod: "PICKUP_IN_STORE",
  nif: "12345678",
});
assert(!shortNif.success, "8-digit NIF is rejected");

const qtyUpdate = cartUpdateSchema.parse({ itemId: "item_1", quantity: 2 });
assert(qtyUpdate.quantity === 2, "cart PATCH accepts a new quantity");
const qtyRemove = cartUpdateSchema.parse({ itemId: "item_1", quantity: 0 });
assert(qtyRemove.quantity === 0, "cart PATCH quantity 0 deletes the line");
const qtyOver = cartUpdateSchema.safeParse({ itemId: "item_1", quantity: 21 });
assert(!qtyOver.success, "cart PATCH rejects quantity over 20");

console.log("checkout address schema ok");
