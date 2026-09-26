import { NextResponse } from "next/server";
import { isResponse, requireAdminApi } from "@/lib/admin";
import { SLUG_RE } from "@/lib/share";

export const runtime = "nodejs";

/** DELETE /api/admin/shares/:slug — moderation: removes a public share page. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  const { slug } = await ctx.params;
  if (!SLUG_RE.test(slug)) return NextResponse.json({ error: "bad_slug" }, { status: 400 });
  const { error } = await admin.supabase.from("shared_links").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: "db", message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
