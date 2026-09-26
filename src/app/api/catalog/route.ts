import { NextResponse } from "next/server";
import { catalogRows } from "@/lib/catalog-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/catalog — admin-managed experts / project types (applied on top of the built-ins by the Studio). */
export async function GET() {
  const rows = await catalogRows();
  return NextResponse.json({ rows }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
