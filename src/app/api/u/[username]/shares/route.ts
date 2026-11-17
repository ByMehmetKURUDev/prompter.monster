import { NextResponse } from "next/server";
import { publicProfileShares } from "@/lib/profile";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ username: string }> };

/** Public: bir canavarın galeride görünen paylaşımları, sayfalanarak ("daha fazla yükle"). */
export async function GET(req: Request, { params }: Ctx) {
  const { username } = await params;
  const u = new URL(req.url);
  const offset = Math.max(0, Number(u.searchParams.get("offset") ?? 0) || 0);
  const items = await publicProfileShares(username, 24, offset);
  return NextResponse.json(items, { headers: { "Cache-Control": "public, max-age=30, s-maxage=120" } });
}
