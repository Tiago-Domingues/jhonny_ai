import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";

export async function GET() {
  if (!hasOdooConfig()) {
    return Response.json({
      configured: false,
      authenticated: false,
      message: "Odoo credentials are not configured.",
    });
  }

  try {
    const uid = await new OdooClient().authenticate();
    return Response.json({ configured: true, authenticated: true, uid });
  } catch (error) {
    return Response.json(
      {
        configured: true,
        authenticated: false,
        message: error instanceof Error ? error.message : "Odoo authentication failed.",
      },
      { status: 503 }
    );
  }
}
