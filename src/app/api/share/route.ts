import { NextResponse } from "next/server";
import { z } from "zod";
import { slugify } from "@/lib/prompt";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Body = z.object({
  project_id: z.string().uuid(),
  version: z.number().int().positive(),
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";

function randomSuffix(len = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function requireUser() {
  if (!supabaseConfigured()) return { error: NextResponse.json({ error: "Hesap sistemi yapılandırılmamış.", code: "no_supabase" }, { status: 503 }) };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Paylaşmak için giriş yapın.", code: "unauthenticated" }, { status: 401 }) };
  return { supabase, user };
}

/**
 * Create (or return the existing) public link for one of my generations.
 * Body: { project_id, version } → { slug, url, created }
 */
export async function POST(req: Request) {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek.", code: "bad_request" }, { status: 400 });
  const { project_id, version } = parsed.data;

  // RLS guarantees this only resolves for my own rows.
  const { data: gen } = await supabase
    .from("generations")
    .select("id, project_id, projects!inner(name)")
    .eq("project_id", project_id)
    .eq("version", version)
    .maybeSingle();
  if (!gen) return NextResponse.json({ error: "Versiyon bulunamadı.", code: "not_found" }, { status: 404 });

  const { data: existing } = await supabase.from("shared_links").select("slug").eq("generation_id", gen.id).maybeSingle();
  if (existing) return NextResponse.json({ slug: existing.slug, url: `${SITE}/p/${existing.slug}`, created: false });

  const projectName = (gen as unknown as { projects: { name: string } | { name: string }[] }).projects;
  const name = Array.isArray(projectName) ? projectName[0]?.name : projectName?.name;
  const base = slugify(name || "canavar").slice(0, 32).replace(/-$/, "");

  // Retry on the (very unlikely) slug collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = `${base}-${randomSuffix()}`;
    const { error } = await supabase.from("shared_links").insert({ slug, generation_id: gen.id, owner_id: user.id });
    if (!error) return NextResponse.json({ slug, url: `${SITE}/p/${slug}`, created: true });
    if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Bağlantı oluşturulamadı, tekrar deneyin." }, { status: 500 });
}

/** Revoke one of my links: DELETE /api/share?slug=... */
export async function DELETE(req: Request) {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ error: "slug gerekli.", code: "bad_request" }, { status: 400 });
  const { error } = await supabase.from("shared_links").delete().eq("slug", slug).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
