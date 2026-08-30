import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { PRIMARY_ADMIN_EMAIL, requireAdminSession } from "@/lib/ecommerce/admin";
import { purgeCustomersKeeping } from "@/lib/ecommerce/customers";

const schema = z.object({
  confirmEmail: z.string().email(),
});

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = schema.parse(await readJson(request));
    if (payload.confirmEmail.trim().toLowerCase() !== PRIMARY_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "confirmation_required", message: `Type ${PRIMARY_ADMIN_EMAIL} to confirm the purge.` },
        { status: 400 }
      );
    }
    const result = await purgeCustomersKeeping(PRIMARY_ADMIN_EMAIL);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return apiError(error);
  }
}
