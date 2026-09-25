import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

async function requireUser() {
  if (!supabaseConfigured()) return { error: NextResponse.json({ error: "Hesap sistemi yapılandırılmamış.", code: "no_supabase" }, { status: 503 }) };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Giriş yapın.", code: "unauthenticated" }, { status: 401 }) };
  return { supabase, user };
}

/** Project state + its versions (newest first). `?version=n` returns that version's refined map too. */
export async function GET(req: Request, { params }: Ctx) {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;
  const { id } = await params;

  const { data: project, error } = await supabase.from("projects").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!project) return NextResponse.json({ error: "Proje bulunamadı.", code: "not_found" }, { status: 404 });

  const { data: versions } = await supabase
    .from("generations")
    .select("id,version,format,lang,experts,token_estimate,created_at")
    .eq("project_id", id)
    .order("version", { ascending: false });

  const wanted = Number(new URL(req.url).searchParams.get("version"));
  let generation = null;
  if (Number.isFinite(wanted) && wanted > 0) {
    const { data } = await supabase.from("generations").select("*").eq("project_id", id).eq("version", wanted).maybeSingle();
    generation = data;
  }

  return NextResponse.json({ project, versions: versions ?? [], generation }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;
  const { id } = await params;
  const { error } = await supabase.from("projects").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
