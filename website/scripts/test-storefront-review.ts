import { readFileSync } from "node:fs";
import path from "node:path";
import { ATHLETES, athleteCouponCode } from "../src/lib/athletes";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const root = path.resolve(__dirname, "..");
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

const diogo = ATHLETES.find((athlete) => athlete.handle === "diogoomota");
assert(diogo, "Local Heroes includes Diogo Mota");
assert(diogo?.couponCode === "DIOGOOMOTA", "Diogo coupon is DIOGOOMOTA");
assert(athleteCouponCode("Diogo Mota") === "DIOGOMOTA", "name helper strips spaces; the shop coupon keeps the Instagram double-O");
assert(diogo?.url.includes("instagram.com/diogoomota"), "Diogo card links to Instagram");

const services = read("src/components/Services.tsx");
assert(services.includes("underdogzexplore"), "Travel chip uses @underdogzexplore");
assert(services.includes("instagram.com/underdogzexplore"), "Travel chip links to underdogzexplore");
assert(!services.includes("instagram.com/underdogz/"), "old @underdogz Travel link is gone");
assert(!services.includes('label: "@underdogz"'), "old @underdogz label is gone");

const seed = read("scripts/seed-athlete-coupons.mjs");
assert(seed.includes("DIOGOOMOTA"), "athlete coupon seed registers DIOGOOMOTA");

const ptCopy = read("src/lib/storefrontCopy.ts");
assert(ptCopy.includes('joinTitle: "Entra na família"'), "PT account title uses tu");
assert(ptCopy.includes("Entra na Jhonny Surf Store"), "Google consent title uses tu");
assert(ptCopy.includes("sobre ti"), "Google consent body uses ti, not si");
assert(!ptCopy.includes("Inicie sessão"), "formal Inicie sessão is gone");
assert(!ptCopy.includes("sobre si"), "formal sobre si is gone");

const i18n = read("src/lib/i18n.ts");
assert(i18n.includes('essentials: "Surf Essenciais"'), "PT nav uses Essenciais");
assert(i18n.includes('bubble: "Olá Lenda. Como posso ajudar?"'), "PT WhatsApp bubble uses Lenda");

const email = read("src/lib/ecommerce/email.ts");
assert(email.includes("LEVANTAMENTO NA LOJA"), "Jhonny email has pickup banner");
assert(email.includes("ENVIO PARA MORADA"), "Jhonny email has shipping banner");
assert(!email.includes("<strong>Pickup:</strong>"), "English Pickup label is gone from order mail");
assert(!email.includes("<strong>Delivery:</strong>"), "English Delivery label is gone from order mail");
assert(email.includes("Olá ${escapeHtml(input.fullName || \"Lenda\")}"), "PT mail greets Olá Lenda");
assert(!email.includes("Hi ${escapeHtml(input.fullName || \"Legend\")}"), "Hi Legend leftover is gone");

const auth = read("src/lib/ecommerce/auth.ts");
assert(auth.includes("Este email ou username já está registado."), "register duplicate error is tu-PT");
assert(auth.includes("Email, username ou password inválidos."), "login error is tu-PT");
assert(!auth.includes("Email or username is already registered."), "English register error is gone");

const api = read("src/lib/ecommerce/api.ts");
assert(api.includes("Confirma os campos que enviaste."), "Zod errors surface in tu-PT");
assert(!api.includes("Please check the submitted fields."), "English Zod message is gone");

const rails = read("src/app/globals.css");
assert(rails.includes("scroll-snap-type: x mandatory"), "mobile rails use native snap swipe");
assert(rails.includes("(hover: hover) and (pointer: fine) and (min-width: 768px)"), "desktop keeps the marquee");

console.log("storefront 20-day review checks ok");
