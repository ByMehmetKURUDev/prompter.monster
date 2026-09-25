import { NextResponse } from "next/server";
import { billingConfigured, getSubscription } from "@/lib/billing/lemonsqueezy";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Redirects the signed-in Pro user to the Lemon Squeezy customer portal (cancel, update card, invoices). */
export async function GET(req: Request) {
  if (!supabaseConfigured() || !billingConfigured()) return NextResponse.redirect(new URL("/pricing", req.url));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/api/billing/portal", req.url));

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("provider_ref,portal_url,updated_at")
    .eq("owner_id", user.id)
    .eq("provider", "lemonsqueezy")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) return NextResponse.redirect(new URL("/pricing", req.url));

  // Portal links are signed and expire; fetch a fresh one from the API.
  try {
    const fresh = await getSubscription(sub.provider_ref);
    const url = fresh.urls.customer_portal ?? sub.portal_url;
    if (url) return NextResponse.redirect(url);
  } catch (e) {
    console.error("portal", e);
  }
  return NextResponse.redirect(new URL("/pricing?portal=unavailable", req.url));
}
