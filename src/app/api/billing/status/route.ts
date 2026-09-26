import { NextResponse } from "next/server";
import { billingConfigured, variantFor } from "@/lib/billing/lemonsqueezy";
import { adminConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Setup diagnostics (no secrets, only booleans + variant ids): lets us confirm the Cloudflare
 * secrets and the store's variants are wired without reading any key.
 */
export async function GET() {
  const out: Record<string, unknown> = {
    provider: process.env.BILLING_PROVIDER ?? "none",
    has_api_key: Boolean(process.env.LEMONSQUEEZY_API_KEY),
    has_webhook_secret: Boolean(process.env.LEMONSQUEEZY_WEBHOOK_SECRET),
    has_service_role: adminConfigured(),
    has_anthropic_key: Boolean(process.env.ANTHROPIC_API_KEY),
    store_id: process.env.LEMONSQUEEZY_STORE_ID ?? null,
    configured: billingConfigured(),
  };
  if (billingConfigured()) {
    try {
      out.variant_monthly = (await variantFor("monthly")) ?? null;
      out.variant_yearly = (await variantFor("yearly")) ?? null;
    } catch (e) {
      out.variant_error = (e as Error).message.slice(0, 200);
    }
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
