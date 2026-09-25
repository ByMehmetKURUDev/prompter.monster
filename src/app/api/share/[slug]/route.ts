import { NextResponse } from "next/server";
import { getShared } from "@/lib/share";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

/** Public: the shared prompt + the Studio state behind it (used by "Studio'da çatalla"). */
export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const shared = await getShared(slug);
  if (!shared) return NextResponse.json({ error: "Paylaşım bulunamadı.", code: "not_found" }, { status: 404 });
  return NextResponse.json(
    {
      slug: shared.slug,
      name: shared.name,
      version: shared.version,
      format: shared.format,
      lang: shared.lang,
      experts: shared.experts,
      output: shared.output,
      state: shared.state,
      created_at: shared.created_at,
    },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
