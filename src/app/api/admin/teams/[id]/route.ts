import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireAdminApi } from "@/lib/admin";

export const runtime = "nodejs";

const Patch = z.object({
  status: z.enum(["pending", "active", "canceled"]).optional(),
  seats: z.number().int().min(1).max(1000).optional(),
  note: z.string().max(500).optional(),
});

const MESSAGES: Record<string, string> = {
  forbidden: "Bu işlem yalnız yöneticilere açık.",
  not_found: "Takım bulunamadı.",
  invalid_status: "Geçersiz durum.",
  invalid_seats: "Koltuk sayısı 1–1000 arasında olmalı.",
};

/** PATCH /api/admin/teams/:id — status (pending/active/canceled), seats, note. Activation = every member's plan becomes Pro. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "bad_request", message: "Geçersiz takım kimliği." }, { status: 400 });
  const body = Patch.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad_request", message: "Geçersiz istek." }, { status: 400 });
  const p = body.data;
  if (p.status === undefined && p.seats === undefined && p.note === undefined) return NextResponse.json({ ok: true });

  const { error } = await admin.supabase.rpc("admin_update_team", {
    p_team: id,
    p_status: p.status ?? null,
    p_seats: p.seats ?? null,
    p_note: p.note ?? null,
  });
  if (error) {
    const code = String(error.message ?? "").trim();
    const known = MESSAGES[code];
    return NextResponse.json({ error: code || "db", message: known ?? error.message }, { status: code === "not_found" ? 404 : code === "forbidden" ? 403 : known ? 400 : 500 });
  }
  return NextResponse.json({ ok: true });
}
