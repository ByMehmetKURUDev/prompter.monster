/**
 * Lemon Squeezy (Merchant of Record) — checkout, subscription lookup, webhook signature.
 * Config: BILLING_PROVIDER=lemonsqueezy, LEMONSQUEEZY_API_KEY (secret), LEMONSQUEEZY_STORE_ID,
 * LEMONSQUEEZY_VARIANT_PRO_MONTHLY / _YEARLY (vars), LEMONSQUEEZY_WEBHOOK_SECRET (secret).
 */

const API = "https://api.lemonsqueezy.com/v1";

export type Plan = "monthly" | "yearly";

export function billingConfigured(): boolean {
  return process.env.BILLING_PROVIDER === "lemonsqueezy" && Boolean(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID);
}

interface LsVariant {
  id: string;
  attributes: { name: string; is_subscription: boolean; interval: "day" | "week" | "month" | "year" | null; price: number; status: string; product_id: number };
}

let variantCache: { at: number; list: LsVariant[] } | null = null;

/**
 * Variant id for a plan: explicit env var if set, otherwise discovered from the store
 * (published subscription variants, monthly vs yearly interval) and cached for 10 minutes.
 */
export async function variantFor(plan: Plan): Promise<string | undefined> {
  const fromEnv = plan === "yearly" ? process.env.LEMONSQUEEZY_VARIANT_PRO_YEARLY : process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY;
  if (fromEnv) return fromEnv;

  if (!variantCache || Date.now() - variantCache.at > 10 * 60 * 1000) {
    // API keys are store-scoped, so this lists only our store's variants (store_id is not a valid filter here).
    const json = await ls<{ data: LsVariant[] }>(`/variants?page[size]=100`);
    variantCache = { at: Date.now(), list: json.data };
  }
  const wanted = plan === "yearly" ? "year" : "month";
  const candidates = variantCache.list.filter((v) => v.attributes.is_subscription && v.attributes.interval === wanted && v.attributes.status !== "draft");
  // Prefer the cheapest matching variant (the Pro plan) if several exist.
  candidates.sort((a, b) => a.attributes.price - b.attributes.price);
  return candidates[0]?.id ?? (plan === "yearly" ? variantFor("monthly") : undefined);
}

async function ls<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Lemon Squeezy ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/** Hosted checkout URL for the Pro plan; the user id travels in custom data and comes back in webhooks. */
export async function createCheckout(args: { plan: Plan; email: string; userId: string; redirectUrl: string }): Promise<string> {
  const variant = await variantFor(args.plan);
  if (!variant) throw new Error("No published subscription variant found in the store");
  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: { email: args.email, custom: { user_id: args.userId } },
        product_options: { redirect_url: args.redirectUrl, receipt_button_text: "Studio'ya dön", receipt_link_url: args.redirectUrl },
        checkout_options: { embed: false, dark: true },
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      relationships: {
        store: { data: { type: "stores", id: String(process.env.LEMONSQUEEZY_STORE_ID) } },
        variant: { data: { type: "variants", id: String(variant) } },
      },
    },
  };
  const json = await ls<{ data: { attributes: { url: string } } }>("/checkouts", { method: "POST", body: JSON.stringify(body) });
  return json.data.attributes.url;
}

export interface LsSubscription {
  id: string;
  status: string; // on_trial | active | paused | past_due | unpaid | cancelled | expired
  customer_id: number;
  variant_id: number;
  renews_at: string | null;
  ends_at: string | null;
  urls: { update_payment_method?: string; customer_portal?: string };
}

export async function getSubscription(id: string): Promise<LsSubscription> {
  const json = await ls<{ data: { id: string; attributes: Omit<LsSubscription, "id"> } }>(`/subscriptions/${id}`);
  return { id: json.data.id, ...json.data.attributes };
}

/** Constant-time HMAC-SHA256 check of the `X-Signature` header over the raw body. */
export async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

/** Statuses that keep the account on Pro. `past_due` keeps access briefly while LS retries the card. */
export function isProStatus(status: string): boolean {
  return status === "active" || status === "on_trial" || status === "past_due";
}
