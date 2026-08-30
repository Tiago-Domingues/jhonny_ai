import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { requireAdminSession } from "@/lib/ecommerce/admin";
import { listAllOrdersForAdminExport } from "@/lib/ecommerce/orders";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const orders = await listAllOrdersForAdminExport();
    const header = [
      "orderNumber",
      "createdAt",
      "paidAt",
      "status",
      "fulfillment",
      "customerName",
      "customerEmail",
      "customerPhone",
      "itemCount",
      "totalEuro",
      "currency",
      "hasFatura",
    ];
    const lines = [
      header.join(","),
      ...orders.map((order) =>
        [
          order.orderNumber,
          order.createdAt,
          order.paidAt || "",
          order.status,
          order.fulfillmentMethod,
          order.customerName,
          order.customerEmail,
          order.customerPhone || "",
          order.itemCount,
          (order.totalCents / 100).toFixed(2),
          order.currency,
          order.hasFaturaRecibo ? "yes" : "no",
        ]
          .map(csvCell)
          .join(",")
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jhonny-encomendas-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
