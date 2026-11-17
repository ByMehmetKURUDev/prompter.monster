import { NextResponse } from "next/server";
import { publicUsageStats } from "@/lib/stats";

export const runtime = "nodejs";

/**
 * Ana sayfadaki "canlı kullanım sayaçları" bölümü için — bkz. UsageStatsSection.tsx. Görev #65.
 * Ayrı, küçük bir rota: ana sayfayı statik tutabilmek için istemci tarafında (mount sonrası)
 * çağrılıyor — /api/explore/starter-kits'teki desenle aynı gerekçe (bkz. o dosyanın yorumu).
 */
export async function GET() {
  const stats = await publicUsageStats();
  return NextResponse.json(stats ?? {}, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
