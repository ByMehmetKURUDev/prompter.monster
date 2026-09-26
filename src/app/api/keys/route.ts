import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_ACTIVE_KEYS, displayPrefix, generateApiKey, hashApiKey } from "@/lib/api-keys";
import { KEY_COLUMNS, keysUser, sameOrigin, type ApiKeyRow } from "@/lib/api-keys-server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/keys — my API keys (never the key itself). */
export async function GET(req: Request) {
  const ctx = await keysUser(req);
  if ("error" in ctx) return ctx.error;
  const { data, error } = await ctx.supabase.from("api_keys").select(KEY_COLUMNS).eq("owner_id", ctx.user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message, code: "db_error" }, { status: 500 });
  return NextResponse.json({ keys: (data ?? []) as ApiKeyRow[], max: MAX_ACTIVE_KEYS }, { headers: { "Cache-Control": "no-store" } });
}

const Body = z.object({ name: z.string().trim().max(60).optional() });

/** POST /api/keys — create a key. The full key is returned exactly once; only its hash is stored. */
export async function POST(req: Request) {
  const ctx = await keysUser(req);
  if ("error" in ctx) return ctx.error;
  const en = ctx.lang === "en";
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden", code: "bad_origin" }, { status: 403 });
  if (!adminConfigured()) {
    return NextResponse.json({ error: en ? "API keys are not available yet." : "API anahtarları henüz kullanılamıyor.", code: "no_admin" }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: en ? "Invalid request." : "Geçersiz istek.", code: "bad_request" }, { status: 400 });

  const { data: prof } = await ctx.supabase.from("profiles").select("banned_at").eq("id", ctx.user.id).maybeSingle<{ banned_at: string | null }>();
  if (prof?.banned_at) return NextResponse.json({ error: en ? "This account is suspended." : "Bu hesap askıya alınmış.", code: "banned" }, { status: 403 });

  const admin = createAdminClient();
  const { count } = await admin.from("api_keys").select("id", { count: "exact", head: true }).eq("owner_id", ctx.user.id).is("revoked_at", null);
  if ((count ?? 0) >= MAX_ACTIVE_KEYS) {
    return NextResponse.json(
      {
        error: en ? `You can have up to ${MAX_ACTIVE_KEYS} active keys. Revoke one first.` : `En fazla ${MAX_ACTIVE_KEYS} aktif anahtarın olabilir. Önce birini iptal et.`,
        code: "too_many_keys",
      },
      { status: 409 },
    );
  }

  const key = generateApiKey();
  const name = parsed.data.name || (en ? "API key" : "API anahtarı");
  const { data, error } = await admin
    .from("api_keys")
    .insert({ owner_id: ctx.user.id, name, prefix: displayPrefix(key), key_hash: await hashApiKey(key) })
    .select(KEY_COLUMNS)
    .single<ApiKeyRow>();
  if (error || !data) {
    console.error("[keys:create]", error);
    return NextResponse.json({ error: en ? "Could not create the key." : "Anahtar oluşturulamadı.", code: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ key, item: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
