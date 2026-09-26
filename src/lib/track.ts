/**
 * Conversion events (client-side). No-ops unless the tag is loaded AND the visitor consented:
 * GA4 events need "analytics" consent; Google Ads conversions and Meta events need "marketing".
 * Google Ads conversion labels: NEXT_PUBLIC_GADS_LABEL_SIGNUP / _PURCHASE (e.g. "AbCdEfGh").
 */

import { hasConsent } from "./consent";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export type TrackEvent = "sign_up" | "login" | "generate" | "share" | "begin_checkout" | "purchase" | "view_pricing" | "quick_start";

const META_MAP: Record<TrackEvent, string> = {
  sign_up: "CompleteRegistration",
  login: "Login",
  generate: "GeneratePrompt",
  share: "Share",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  view_pricing: "ViewContent",
  quick_start: "QuickStart",
};

export function track(event: TrackEvent, params: Params = {}): void {
  if (typeof window === "undefined") return;
  try {
    const ga = process.env.NEXT_PUBLIC_GA_ID;
    if (ga && hasConsent("analytics")) window.gtag?.("event", event, { ...params, send_to: ga });

    if (!hasConsent("marketing")) return;
    const ads = process.env.NEXT_PUBLIC_GADS_ID;
    const label = event === "sign_up" ? process.env.NEXT_PUBLIC_GADS_LABEL_SIGNUP : event === "purchase" ? process.env.NEXT_PUBLIC_GADS_LABEL_PURCHASE : undefined;
    if (ads && label) window.gtag?.("event", "conversion", { send_to: `${ads}/${label}`, value: params.value, currency: params.currency ?? "USD" });
    const std = ["CompleteRegistration", "InitiateCheckout", "Purchase", "ViewContent"];
    const name = META_MAP[event];
    if (std.includes(name)) window.fbq?.("track", name, params);
    else window.fbq?.("trackCustom", name, params);
  } catch {
    /* analytics must never break the app */
  }
}
