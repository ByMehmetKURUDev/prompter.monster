import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ATTR_CODE_COOKIE, ATTR_SOURCE_COOKIE, channelOf, parseSourceCookie, sanitizeCode } from "@/lib/attribution";
import { readPublicSettings } from "@/lib/settings-server";
import { z } from "zod";
import { billingConfigured, createCheckout } from "@/lib/billing/lemonsqueezy";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Body = z.object({ plan: z.enum(["monthly", "yearly"]).default("monthly"), code: z.string().max(40).optional() });
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";

/** Start a Pro checkout for the signed-in user → { url } (hosted Lemon Squeezy page). */
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Hesap sistemi yapılandırılmamış.", code: "no_supabase" }, { status: 503 });
  if (!billingConfigured()) return NextResponse.json({ error: "Ödeme sistemi henüz açık değil.", code: "billing_not_configured" }, { status: 503 });
  const flags = await readPublicSettings();
  if (flags.maintenance_mode || !flags.checkout_enabled) return NextResponse.json({ error: "Pro satın alma şu anda geçici olarak kapalı. Kısa süre sonra tekrar deneyin.", code: "checkout_disabled" }, { status: 503 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Önce giriş yapın.", code: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz plan.", code: "bad_request" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan === "pro") return NextResponse.json({ error: "Zaten Pro plandasın.", code: "already_pro" }, { status: 409 });

  // Discount code: explicit request body > ?code= link cookie > admin launch coupon.
  const jar = await cookies();
  const code = sanitizeCode(parsed.data.code) || sanitizeCode(jar.get(ATTR_CODE_COOKIE)?.value) || sanitizeCode(flags.launch_coupon);
  const src = parseSourceCookie(jar.get(ATTR_SOURCE_COOKIE)?.value);
  const custom: Record<string, string> = { channel: channelOf(src) };
  if (code) custom.code = code;
  const base = { plan: parsed.data.plan, email: user.email, userId: user.id, redirectUrl: `${SITE}/studio?upgraded=1&plan=${parsed.data.plan}`, custom };

  try {
    let url: string;
    try {
      url = await createCheckout({ ...base, discountCode: code });
    } catch (e) {
      // An unknown/expired code must never block the purchase — retry without it.
      if (!code) throw e;
      console.warn("checkout: retrying without discount code", code, e instanceof Error ? e.message : e);
      url = await createCheckout(base);
    }
    return NextResponse.json({ url, code: code ?? null });
  } catch (e) {
    console.error("checkout", e);
    return NextResponse.json({ error: "Ödeme sayfası oluşturulamadı, biraz sonra tekrar deneyin.", code: "checkout_failed" }, { status: 502 });
  }
}
