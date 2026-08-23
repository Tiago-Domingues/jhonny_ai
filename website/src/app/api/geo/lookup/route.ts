import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return NextResponse.json({
    country: request.headers.get("x-vercel-ip-country"),
    region: request.headers.get("x-vercel-ip-country-region"),
    city: request.headers.get("x-vercel-ip-city"),
  });
}
