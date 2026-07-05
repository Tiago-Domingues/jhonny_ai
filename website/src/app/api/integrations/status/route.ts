import { integrationStatus } from "@/lib/ecommerce/integrations";

export async function GET() {
  return Response.json(integrationStatus());
}
