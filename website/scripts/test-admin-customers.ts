import { PRIMARY_ADMIN_EMAIL, canAdminRemoveCustomer, defaultAdminEmails } from "../src/lib/ecommerce/adminAccess";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(PRIMARY_ADMIN_EMAIL === "tiagopaixaodomingues@gmail.com", "primary admin email is fixed");
assert(defaultAdminEmails().includes(PRIMARY_ADMIN_EMAIL), "default allowlist includes the store owner");

const protectedEmails = defaultAdminEmails();

assert(
  !canAdminRemoveCustomer({
    actorId: "admin-1",
    targetId: "admin-1",
    targetEmail: "other@example.com",
    protectedEmails,
  }).ok,
  "admin cannot delete their own account"
);

assert(
  !canAdminRemoveCustomer({
    actorId: "admin-1",
    targetId: "admin-2",
    targetEmail: PRIMARY_ADMIN_EMAIL,
    protectedEmails,
  }).ok,
  "store owner account cannot be deleted"
);

assert(
  canAdminRemoveCustomer({
    actorId: "admin-1",
    targetId: "cust-1",
    targetEmail: "cliente@example.com",
    protectedEmails,
  }).ok,
  "admin can delete a normal customer"
);

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const clientSource = readFileSync(resolve(__dirname, "../src/components/AdminCustomersClient.tsx"), "utf8");
assert(clientSource.includes('method: "DELETE"'), "admin client list can remove a customer");
assert(clientSource.includes("Remover cliente"), "admin UI has a remove-customer action");
assert(clientSource.includes("TrashIcon"), "admin UI has a bin button to remove a client");
assert(clientSource.includes("canRemoveCustomer"), "bin is gated to removable admin targets");
assert(clientSource.includes("/api/auth/me"), "bin visibility uses the signed-in admin");
assert(clientSource.includes("/api/admin/customers/purge"), "admin UI can purge all clients");
assert(!clientSource.includes("actor?.role !== \"CUSTOMER\""), "customers never unlock the bin");

console.log("admin customer access helpers ok");
