import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { requireAdminSession } from "@/lib/ecommerce/admin";
import { getAnalyticsSummary } from "@/lib/ecommerce/analytics";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const days = Number(new URL(request.url).searchParams.get("days") || 90);
    const summary = await getAnalyticsSummary(Number.isFinite(days) ? days : 90);
    const header = [
      "kind",
      "date",
      "views",
      "newClients",
      "salesCount",
      "salesEuro",
      "label",
      "count",
      "path",
      "referrer",
      "country",
      "city",
      "createdAt",
    ];
    const lines = [header.join(",")];

    for (const row of summary.byDay) {
      lines.push(
        [
          "day",
          row.key,
          row.views,
          row.newClients,
          row.salesCount,
          (row.salesCents / 100).toFixed(2),
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]
          .map(csvCell)
          .join(",")
      );
    }

    const buckets: Array<[string, Array<{ key: string; count: number }>]> = [
      ["country", summary.byCountry],
      ["city", summary.byCity],
      ["path", summary.byPath],
      ["location", summary.byLocationSource || []],
      ["coupon", (summary.coupons || []).map((coupon) => ({ key: coupon.key, count: coupon.count }))],
    ];
    for (const [kind, rows] of buckets) {
      for (const row of rows) {
        lines.push(
          ["", "", "", "", "", "", row.key, row.count, "", "", "", "", ""]
            .map((value, index) => (index === 0 ? csvCell(kind) : csvCell(value)))
            .join(",")
        );
      }
    }

    for (const visit of summary.recent) {
      lines.push(
        [
          "visit",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          visit.path,
          visit.referrer || "",
          visit.country || "",
          visit.city || "",
          visit.createdAt,
        ]
          .map(csvCell)
          .join(",")
      );
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jhonny-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
