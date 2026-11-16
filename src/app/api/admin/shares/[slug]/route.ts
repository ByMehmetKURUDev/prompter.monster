import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireAdminApi } from "@/lib/admin";
import { SLUG_RE } from "@/lib/share";

export const runtime = "nodejs";

const PatchBody = z
  .object({ featured: z.boolean().optional(), hidden: z.boolean().optional() })
  .refine((v) => v.featured !== undefined || v.hidden !== undefined, "empty");

/** PATCH /api/admin/shares/:slug — moderation: feature or hide a gallery entry. */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  const { slug } = await ctx.params;
  if (!SLUG_RE.test(slug)) return NextResponse.json({ error: "bad_slug" }, { status: 400 });
  const parsed = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const patch: Record<string, boolean> = {};
  if (parsed.data.featured !== undefined) patch.featured = parsed.data.featured;
  if (parsed.data.hidden !== undefined) patch.hidden = parsed.data.hidden;
  const { error } = await admin.supabase.from("shared_links").update(patch).eq("slug", slug);
  if (error) return NextResponse.json({ error: "db", message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

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
