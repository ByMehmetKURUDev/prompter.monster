import { NextResponse } from "next/server";
import { z } from "zod";
import { billingConfigured, createCheckout } from "@/lib/billing/lemonsqueezy";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Body = z.object({ plan: z.enum(["monthly", "yearly"]).default("monthly") });
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";

/** Start a Pro checkout for the signed-in user → { url } (hosted Lemon Squeezy page). */
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Hesap sistemi yapılandırılmamış.", code: "no_supabase" }, { status: 503 });
  if (!billingConfigured()) return NextResponse.json({ error: "Ödeme sistemi henüz açık değil.", code: "billing_not_configured" }, { status: 503 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Önce giriş yapın.", code: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz plan.", code: "bad_request" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan === "pro") return NextResponse.json({ error: "Zaten Pro plandasın.", code: "already_pro" }, { status: 409 });

  try {
    const url = await createCheckout({ plan: parsed.data.plan, email: user.email, userId: user.id, redirectUrl: `${SITE}/studio?upgraded=1` });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("checkout", e);
    return NextResponse.json({ error: "Ödeme sayfası oluşturulamadı, biraz sonra tekrar deneyin.", code: "checkout_failed" }, { status: 502 });
  }
}
