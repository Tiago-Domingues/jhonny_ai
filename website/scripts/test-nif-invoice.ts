import { isValidOptionalNif, normalizeNif } from "../src/lib/ecommerce/nif";
import { pdfBufferFromOdooResult } from "../src/lib/ecommerce/odooInvoice";
import { profileSchema } from "../src/lib/ecommerce/schemas";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(isValidOptionalNif(""), "empty NIF is valid");
assert(isValidOptionalNif(null), "missing NIF is valid");
assert(isValidOptionalNif("123456789"), "9-digit NIF is valid");
assert(isValidOptionalNif("PT123456789"), "PT-prefixed NIF is valid");
assert(isValidOptionalNif("ESB12345678"), "EU VAT-style NIF is valid");
assert(!isValidOptionalNif("12345678"), "8-digit NIF is invalid");
assert(!isValidOptionalNif("NIF"), "letters-only NIF is invalid");

assert(normalizeNif("123456789") === "PT123456789", "bare PT NIF gets PT prefix");
assert(normalizeNif(" 123 456 789 ") === "PT123456789", "spaces are stripped");
assert(normalizeNif("pt-123.456.789") === "PT123456789", "punctuation is stripped");
assert(normalizeNif("ESB12345678") === "ESB12345678", "EU VAT is left with country prefix");
assert(normalizeNif("") === "", "empty NIF stays empty");

const profile = profileSchema.parse({
  fullName: "Ana Silva",
  customerType: "SURFER",
  nif: "123456789",
});
assert(profile.nif === "123456789", "profile schema accepts optional NIF");

const badProfile = profileSchema.safeParse({
  fullName: "Ana Silva",
  customerType: "SURFER",
  nif: "xx",
});
assert(!badProfile.success, "profile schema rejects invalid NIF");

const pdfHeader = Buffer.from(`%PDF-1.4\n${"x".repeat(120)}`).toString("base64");
const pdf = pdfBufferFromOdooResult([pdfHeader, "filename.pdf"]);
assert(pdf && pdf.subarray(0, 4).toString() === "%PDF", "Odoo report tuple extracts a PDF buffer");
assert(pdfBufferFromOdooResult("short") === null, "short strings are not treated as PDFs");
assert(pdfBufferFromOdooResult(null) === null, "null Odoo result yields no PDF");

console.log("NIF + invoice PDF helpers ok");
