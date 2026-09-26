import { NextResponse } from "next/server";
import { isProStatus, verifySignature } from "@/lib/billing/lemonsqueezy";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface LsEvent {
  meta: { event_name: string; custom_data?: { user_id?: string } };
  data: {
    id: string;
    type: string;
    attributes: {
      status?: string;
      customer_id?: number;
      variant_id?: number;
      variant_name?: string;
      user_email?: string;
      renews_at?: string | null;
      ends_at?: string | null;
      urls?: { customer_portal?: string; update_payment_method?: string };
    };
  };
}

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
  "subscription_payment_failed",
  "subscription_payment_recovered",
]);

/**
 * Lemon Squeezy → us. Verifies the HMAC signature, upserts `subscriptions`, and flips `profiles.plan`.
 * Idempotent: every event re-derives the plan from the subscription status it carries.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!(await verifySignature(raw, req.headers.get("x-signature")))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  if (!adminConfigured()) return NextResponse.json({ error: "admin client not configured" }, { status: 503 });

  let event: LsEvent;
  try {
    event = JSON.parse(raw) as LsEvent;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const name = event.meta?.event_name ?? "";
  if (!SUBSCRIPTION_EVENTS.has(name)) return NextResponse.json({ ok: true, ignored: name });

  // Payment events carry the subscription id in relationships, not as data.id; we only need status changes,
  // and LS also sends subscription_updated for those, so skip invoice-shaped payloads.
  if (event.data?.type !== "subscriptions") return NextResponse.json({ ok: true, ignored: `${name}:${event.data?.type}` });

  const userId = event.meta.custom_data?.user_id;
  const a = event.data.attributes;
  const admin = createAdminClient();

  // Resolve the owner: custom_data (set at checkout) first, else an existing row for this subscription.
  let ownerId = userId;
  if (!ownerId) {
    const { data: existing } = await admin.from("subscriptions").select("owner_id").eq("provider", "lemonsqueezy").eq("provider_ref", event.data.id).maybeSingle();
    ownerId = existing?.owner_id;
  }
  if (!ownerId) return NextResponse.json({ error: "owner not found" }, { status: 202 });

  const status = a.status ?? "unknown";
  const plan = /y[ıi]ll[ıi]k|year/i.test(a.variant_name ?? "") ? "yearly" : "monthly";

  const { error: subErr } = await admin.from("subscriptions").upsert(
    {
      owner_id: ownerId,
      provider: "lemonsqueezy",
      provider_ref: event.data.id,
      status,
      plan,
      customer_ref: a.customer_id ? String(a.customer_id) : null,
      current_period_end: a.renews_at ?? a.ends_at ?? null,
      portal_url: a.urls?.customer_portal ?? null,
      raw: event as unknown as Record<string, unknown>,
    },
    { onConflict: "provider,provider_ref" },
  );
  if (subErr) {
    console.error("subscriptions upsert", subErr);
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  // A user could in theory hold several subscriptions; Pro if any of them is live.
  const { data: live } = await admin.from("subscriptions").select("status").eq("owner_id", ownerId).eq("provider", "lemonsqueezy");
  const pro = (live ?? []).some((s) => isProStatus(s.status));
  // Admin-locked plans (manual Pro / comps) are never overwritten by billing events.
  const { data: prof } = await admin.from("profiles").select("plan_locked").eq("id", ownerId).maybeSingle<{ plan_locked: boolean }>();
  if (prof?.plan_locked) return NextResponse.json({ ok: true, event: name, plan: "locked" });
  const { error: profErr } = await admin.from("profiles").update({ plan: pro ? "pro" : "free" }).eq("id", ownerId);
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, event: name, plan: pro ? "pro" : "free" });
}
