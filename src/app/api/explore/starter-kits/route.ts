import { NextResponse } from "next/server";
import { exploreList } from "@/lib/explore";

export const runtime = "nodejs";

/**
 * Ana sayfadaki "canlı başlangıç kitleri" bölümü için — bkz. StarterKitsSection.tsx.
 * Ayrı, küçük bir rota olarak tutuldu (ana /api/explore'u değiştirmek yerine) çünkü: sabit
 * sort="liked" + limit=6, ve ana sayfayı statik tutabilmek için istemci tarafında (mount sonrası)
 * çağrılıyor — bkz. src/app/page.tsx / src/app/en/page.tsx: Cloudflare/OpenNext tarafında ISR
 * incremental-cache yapılandırılı olmadığından server-side revalidate burada işe yaramazdı.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const langParam = u.searchParams.get("lang");
  const items = await exploreList({
    lang: langParam === "TR" || langParam === "EN" ? langParam : undefined,
    sort: "liked",
    limit: 6,
  });
  return NextResponse.json(items, { headers: { "Cache-Control": "public, max-age=30, s-maxage=120" } });
}
