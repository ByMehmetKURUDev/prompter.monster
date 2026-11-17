import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

/** Login required: toggle my like on a shared prompt. Owner cannot like their own share (RPC-enforced). */
export async function POST(_req: Request, { params }: Ctx) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "no_supabase" }, { status: 503 });
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated", code: "unauthenticated" }, { status: 401 });

  const { data, error } = await supabase.rpc("toggle_shared_like", { p_slug: slug });
  if (error) {
    if (error.code === "42501" || /cannot_like_own_share/i.test(error.message)) {
      return NextResponse.json({ error: "cannot_like_own_share", code: "cannot_like_own_share" }, { status: 403 });
    }
    if (error.code === "P0002" || /not_found/i.test(error.message)) {
      return NextResponse.json({ error: "not_found", code: "not_found" }, { status: 404 });
    }
    if (/function .*toggle_shared_like.* does not exist/i.test(error.message)) {
      return NextResponse.json({ error: "not_ready", code: "not_ready" }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ liked: row.liked, likes: row.likes }, { headers: { "Cache-Control": "no-store" } });
}
