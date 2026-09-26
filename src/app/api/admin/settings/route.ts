import { NextResponse } from "next/server";
import { isResponse, requireAdminApi } from "@/lib/admin";
import { SETTINGS_BY_KEY, coerce } from "@/lib/settings";
import { invalidateServerSettings, readAllSettings } from "@/lib/settings-server";

export const runtime = "nodejs";

/** GET /api/admin/settings — every setting with overrides applied. */
export async function GET() {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  const all = await readAllSettings();
  return NextResponse.json(all, { headers: { "Cache-Control": "no-store" } });
}

/** PUT /api/admin/settings — { key: value, key2: null } (null = back to default). Unknown keys are rejected. */
export async function PUT(req: Request) {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "bad_request", message: "JSON gövde bekleniyor." }, { status: 400 });

  const saved: string[] = [];
  const removed: string[] = [];
  for (const [key, raw] of Object.entries(body)) {
    const def = SETTINGS_BY_KEY.get(key);
    if (!def) return NextResponse.json({ error: "unknown_key", message: `Bilinmeyen ayar: ${key}` }, { status: 400 });
    if (raw === null) {
      const { error } = await admin.supabase.from("app_settings").delete().eq("key", key);
      if (error) return NextResponse.json({ error: "db", message: error.message }, { status: 500 });
      removed.push(key);
      continue;
    }
    const value = coerce(def, raw);
    if (value === null) return NextResponse.json({ error: "bad_value", message: `${def.label}: geçersiz değer.` }, { status: 400 });
    const { error } = await admin.supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString(), updated_by: admin.user.id });
    if (error) return NextResponse.json({ error: "db", message: error.message }, { status: 500 });
    saved.push(key);
  }
  invalidateServerSettings();
  return NextResponse.json({ ok: true, saved, removed });
}
