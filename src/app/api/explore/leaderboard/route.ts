import { NextResponse } from "next/server";
import { leaderboardCreators, type LeaderboardWindow } from "@/lib/explore";

export const runtime = "nodejs";

const WINDOWS: LeaderboardWindow[] = ["week", "month", "all"];

/** Public: "Usta Canavarlar" lider tablosu, pencereye göre (hafta/ay/tüm zamanlar). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const windowParam = u.searchParams.get("window");
  const window: LeaderboardWindow = WINDOWS.includes(windowParam as LeaderboardWindow) ? (windowParam as LeaderboardWindow) : "all";
  const limit = Math.min(Math.max(1, Number(u.searchParams.get("limit") ?? 20) || 20), 50);
  const entries = await leaderboardCreators(window, limit);
  return NextResponse.json(entries, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
