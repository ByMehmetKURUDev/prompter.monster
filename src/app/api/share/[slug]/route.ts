import { NextResponse } from "next/server";
import { z } from "zod";
import { bumpForks, getShared } from "@/lib/share";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

/** Public: the shared prompt + the Studio state behind it. Used by "Studio'da çatalla" — each load counts as a fork. */
export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const shared = await getShared(slug);
  if (!shared) return NextResponse.json({ error: "Paylaşım bulunamadı.", code: "not_found" }, { status: 404 });
  await bumpForks(shared.slug);
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
    { headers: { "Cache-Control": "no-store" } },
  );
}

const PatchBody = z.object({ listed: z.boolean() });

/** Owner only: toggle Explore gallery visibility for my own share ("Galeride göster"). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "no_supabase" }, { status: 503 });
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const { error, data } = await supabase
    .from("shared_links")
    .update({ listed: parsed.data.listed })
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .select("slug")
    .maybeSingle();
  if (error) {
    if (/column .*listed.* does not exist/i.test(error.message)) return NextResponse.json({ error: "not_ready", code: "not_ready" }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, listed: parsed.data.listed });
}
