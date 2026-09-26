import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireAdminApi } from "@/lib/admin";
import { BUILTIN_EXPERT_IDS, BUILTIN_TYPE_IDS, CATALOG_ID_RE, ExpertData, ProjectTypeData } from "@/lib/catalog";
import { invalidateCatalog } from "@/lib/catalog-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLS = "kind,id,data,enabled,sort,updated_at";

/** GET /api/admin/catalog — every catalog row. */
export async function GET() {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  const { data, error } = await admin.supabase.from("catalog_items").select(COLS).order("kind").order("sort").limit(1000);
  if (error) return NextResponse.json({ error: "db", message: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

const Body = z.object({
  kind: z.enum(["expert", "project_type"]),
  id: z.string().regex(CATALOG_ID_RE, "id: küçük harf, rakam ve tire (2–40 karakter)"),
  data: z.record(z.string(), z.unknown()).default({}),
  enabled: z.boolean().default(true),
  sort: z.number().int().min(-1000).max(1000).default(0),
});

/** PUT /api/admin/catalog — add a new item, override a built-in one, or hide one (enabled: false). */
export async function PUT(req: Request) {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request", message: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  const { kind, id, enabled, sort } = parsed.data;

  const schema = kind === "expert" ? ExpertData : ProjectTypeData;
  const d = schema.safeParse(parsed.data.data);
  if (!d.success) {
    return NextResponse.json({ error: "bad_data", message: d.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
  }
  // Drop empty strings / empty lists so an override only carries what was actually changed.
  const data = Object.fromEntries(
    Object.entries(d.data as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)),
  );

  const builtin = kind === "expert" ? BUILTIN_EXPERT_IDS.has(id) : BUILTIN_TYPE_IDS.has(id);
  if (!builtin && enabled) {
    if (kind === "expert" && (!data.role || !data.task)) {
      return NextResponse.json({ error: "bad_data", message: "Yeni uzman için en az rol ve görev (TR) gerekli." }, { status: 400 });
    }
    if (kind === "project_type" && !data.name) {
      return NextResponse.json({ error: "bad_data", message: "Yeni proje tipi için en az ad gerekli." }, { status: 400 });
    }
  }

  const { data: row, error } = await admin.supabase
    .from("catalog_items")
    .upsert({ kind, id, data, enabled, sort, updated_at: new Date().toISOString(), updated_by: admin.user.id })
    .select(COLS)
    .single();
  if (error) return NextResponse.json({ error: "db", message: error.message }, { status: 500 });
  invalidateCatalog();
  return NextResponse.json({ ok: true, row });
}

/** DELETE /api/admin/catalog?kind=expert&id=foo — remove a custom item, or reset a built-in one to its default. */
export async function DELETE(req: Request) {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  const u = new URL(req.url);
  const kind = u.searchParams.get("kind");
  const id = u.searchParams.get("id") || "";
  if ((kind !== "expert" && kind !== "project_type") || !CATALOG_ID_RE.test(id)) {
    return NextResponse.json({ error: "bad_request", message: "kind ve id gerekli." }, { status: 400 });
  }
  const { error } = await admin.supabase.from("catalog_items").delete().eq("kind", kind).eq("id", id);
  if (error) return NextResponse.json({ error: "db", message: error.message }, { status: 500 });
  invalidateCatalog();
  return NextResponse.json({ ok: true });
}
