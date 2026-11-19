import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/api-keys-server";
import { isMissingFunction } from "@/lib/share";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z
  .object({ optOut: z.boolean().optional(), locale: z.enum(["tr", "en"]).optional() })
  .refine((b) => b.optOut !== undefined || b.locale !== undefined, { message: "nothing to change" });

/** POST /api/account/email-prefs — the signed-in user's welcome / reminder e-mail preference (migration 0023). */
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "no_supabase" }, { status: 503 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad_origin" }, { status: 403 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { error } = await supabase.rpc("set_my_email_prefs", { p_opt_out: parsed.data.optOut ?? null, p_locale: parsed.data.locale ?? null });
  if (error) return NextResponse.json({ error: isMissingFunction(error.message) ? "not_ready" : "failed" }, { status: isMissingFunction(error.message) ? 503 : 500 });
  const { data } = await supabase.rpc("my_email_prefs");
  return NextResponse.json({ prefs: data ?? null });
}
