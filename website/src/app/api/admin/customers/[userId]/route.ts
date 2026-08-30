import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { requireAdminSession } from "@/lib/ecommerce/admin";
import { deleteCustomerForAdmin, updateCustomerForAdmin } from "@/lib/ecommerce/customers";

const patchSchema = z.object({
  marketingOptIn: z.boolean().optional(),
  fullName: z.string().min(2).max(120).optional(),
  phoneCountryCode: z.string().min(2).max(8).optional(),
  phone: z.string().max(40).nullable().optional(),
  customerType: z
    .enum([
      "PROFESSIONAL",
      "SURFER",
      "BEGINNER",
      "TOURIST",
      "ERASMUS_STUDENT",
      "SURF_PARENT",
      "LOCAL_CUSTOMER",
      "OTHER",
      "BODYBOARDER",
      "LONGBOARDER",
    ])
    .optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await context.params;
    const data = patchSchema.parse(await readJson(request));
    const customer = await updateCustomerForAdmin(userId, data);
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ customer });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await context.params;
    const result = await deleteCustomerForAdmin(userId, { id: session.id, email: session.email });
    if (!result) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, email: result.email });
  } catch (error) {
    return apiError(error);
  }
}
