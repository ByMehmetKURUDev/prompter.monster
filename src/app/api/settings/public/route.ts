import { NextResponse } from "next/server";
import { readPublicSettings } from "@/lib/settings-server";

export const runtime = "nodejs";

/** Public flags for the site shell (announcement, maintenance, coupon…). Cached 60s at the edge. */
export async function GET() {
  const s = await readPublicSettings();
  return NextResponse.json(s, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } });
}
