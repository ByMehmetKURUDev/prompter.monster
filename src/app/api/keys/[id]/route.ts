import { NextResponse } from "next/server";
import { KEY_COLUMNS, keysUser, sameOrigin, type ApiKeyRow } from "@/lib/api-keys-server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DELETE /api/keys/{id} — revoke one of my keys (kept for the usage history, never usable again). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await keysUser(req);
  if ("error" in ctx) return ctx.error;
  const en = ctx.lang === "en";
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden", code: "bad_origin" }, { status: 403 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: en ? "Key not found." : "Anahtar bulunamadı.", code: "not_found" }, { status: 404 });
  if (!adminConfigured()) return NextResponse.json({ error: "Unavailable", code: "no_admin" }, { status: 503 });

  const { data, error } = await createAdminClient()
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", ctx.user.id)
    .is("revoked_at", null)
    .select(KEY_COLUMNS)
    .maybeSingle<ApiKeyRow>();
  if (error) return NextResponse.json({ error: error.message, code: "db_error" }, { status: 500 });
  if (!data) return NextResponse.json({ error: en ? "Key not found or already revoked." : "Anahtar bulunamadı ya da zaten iptal edilmiş.", code: "not_found" }, { status: 404 });
  return NextResponse.json({ item: data });
}
