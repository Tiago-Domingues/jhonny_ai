import "server-only";

import { NextResponse } from "next/server";
import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { fetchOdooInvoicePdf } from "@/lib/ecommerce/odooInvoice";

export const FATURA_UNAVAILABLE = "Fatura-recibo ainda não disponível";

export function faturaFilename(orderNumber: string) {
  return `fatura-recibo-${orderNumber}.pdf`;
}

export async function streamFaturaRecibo(order: {
  orderNumber: string;
  odooInvoiceId: number | null;
}) {
  if (!order.odooInvoiceId || !hasOdooConfig()) {
    return NextResponse.json({ error: "not_available", message: FATURA_UNAVAILABLE }, { status: 404 });
  }

  try {
    const pdf = await fetchOdooInvoicePdf(new OdooClient(), order.odooInvoiceId);
    if (!pdf) {
      return NextResponse.json({ error: "not_available", message: FATURA_UNAVAILABLE }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${faturaFilename(order.orderNumber)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "not_available", message: FATURA_UNAVAILABLE }, { status: 404 });
  }
}
