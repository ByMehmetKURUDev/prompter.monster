import { NextResponse } from "next/server";
import { exploreList, type ExploreSort } from "@/lib/explore";

export const runtime = "nodejs";

const SORTS: ExploreSort[] = ["new", "popular", "forked", "liked"];

/** Public: paginated Explore gallery list, consumed by ExploreGrid's filters/"load more". */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const langParam = u.searchParams.get("lang");
  const type = u.searchParams.get("type") || undefined;
  const expert = u.searchParams.get("expert") || undefined;
  const format = u.searchParams.get("format") || undefined;
  const sortParam = u.searchParams.get("sort");
  const sort: ExploreSort = SORTS.includes(sortParam as ExploreSort) ? (sortParam as ExploreSort) : "new";
  const offset = Math.max(0, Number(u.searchParams.get("offset") ?? 0) || 0);
  const items = await exploreList({
    lang: langParam === "TR" || langParam === "EN" ? langParam : undefined,
    type,
    expert,
    format,
    sort,
    limit: 24,
    offset,
  });
  return NextResponse.json(items, { headers: { "Cache-Control": "public, max-age=30, s-maxage=120" } });
}
