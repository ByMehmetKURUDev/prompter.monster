import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireAdminApi } from "@/lib/admin";

export const runtime = "nodejs";

const Patch = z.object({
  plan: z.enum(["free", "pro"]).optional(),
  role: z.enum(["user", "admin"]).optional(),
  plan_locked: z.boolean().optional(),
  banned: z.boolean().optional(),
  note: z.string().max(500).optional(),
});

/** PATCH /api/admin/users/:id — plan / role / lock / ban / note. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  const { id } = await ctx.params;
  const body = Patch.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad_request", message: "Geçersiz istek." }, { status: 400 });
  const p = body.data;
  if (id === admin.user.id && (p.role === "user" || p.banned)) {
    return NextResponse.json({ error: "self", message: "Kendi admin yetkini alamaz ya da kendini yasaklayamazsın." }, { status: 400 });
  }
  const update: Record<string, unknown> = {};
  if (p.plan) update.plan = p.plan;
  if (p.role) update.role = p.role;
  if (typeof p.plan_locked === "boolean") update.plan_locked = p.plan_locked;
  if (typeof p.banned === "boolean") update.banned_at = p.banned ? new Date().toISOString() : null;
  if (typeof p.note === "string") update.note = p.note.trim() || null;
  if (!Object.keys(update).length) return NextResponse.json({ ok: true });
  const { error } = await admin.supabase.from("profiles").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "db", message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, update });
}
