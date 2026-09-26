import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { MeResponse } from "@/lib/db";
import { billingConfigured } from "@/lib/billing/lemonsqueezy";
import { ATTR_CODE_COOKIE, ATTR_SOURCE_COOKIE, parseSourceCookie, sanitizeCode } from "@/lib/attribution";
import { clientKey, peek } from "@/lib/ratelimit";
import { creditCosts } from "@/lib/settings";
import { readServerSettings } from "@/lib/settings-server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Who am I + today's AI credits (for the Studio sidebar) + credit costs. */
export async function GET(req: Request) {
  const billing = billingConfigured() ? "lemonsqueezy" : null;
  const s = await readServerSettings();
  const costs = creditCosts(s as unknown as Parameters<typeof creditCosts>[0]);
  const visitor = async (): Promise<MeResponse> => ({
    user: null,
    plan: null,
    usage: { used: await peek(clientKey(req)).catch(() => 0), limit: Number(s.anon_credits_per_day) },
    costs,
    billing,
  });
  if (!supabaseConfigured()) return NextResponse.json(await visitor(), { headers: { "Cache-Control": "no-store" } });
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(await visitor(), { headers: { "Cache-Control": "no-store" } });

    const { data } = await supabase
      .rpc("ai_usage_today")
      .single<{ used: number; limit: number; plan: "free" | "pro"; month_used: number | null; month_limit: number | null }>();
    const plan = data?.plan ?? "free";
    const res: MeResponse = {
      user: { id: user.id, email: user.email ?? null },
      plan,
      usage: data
        ? { used: data.used, limit: data.limit, monthUsed: plan === "pro" ? (data.month_used ?? 0) : null, monthLimit: plan === "pro" ? (data.month_limit ?? null) : null }
        : { used: 0, limit: Number(s.free_credits_per_day) },
      costs,
      billing,
    };
    await backfillSignupSource(user.id, user.created_at);
    return NextResponse.json(res, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(await visitor(), { headers: { "Cache-Control": "no-store" } });
  }
}

/**
 * Attribution fallback: sign-ups normally carry the campaign source in their metadata (LoginForm);
 * if that was lost (e.g. the confirmation link opened in another browser), fill it from the cookies
 * during the first day of the account. Never overwrites an existing value.
 */
async function backfillSignupSource(userId: string, createdAt: string | undefined) {
  try {
    const jar = await cookies();
    const src = parseSourceCookie(jar.get(ATTR_SOURCE_COOKIE)?.value);
    const code = sanitizeCode(jar.get(ATTR_CODE_COOKIE)?.value);
    if (!src && !code) return;
    if (!createdAt || Date.now() - new Date(createdAt).getTime() > 24 * 3600 * 1000) return;
    if (!adminConfigured()) return;
    const admin = createAdminClient();
    const { data: prof } = await admin.from("profiles").select("signup_source").eq("id", userId).maybeSingle<{ signup_source: unknown }>();
    if (!prof || prof.signup_source) return;
    await admin.from("profiles").update({ signup_source: { ...(src ?? {}), ...(code ? { code } : {}), via: "cookie" } }).eq("id", userId);
  } catch {
    /* attribution is best effort */
  }
}
