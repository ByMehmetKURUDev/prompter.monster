/**
 * Cookie consent state (client-side helpers, safe to import anywhere — they no-op on the server).
 *
 * Categories:
 *  - necessary  : always on (session, language, consent choice, discount code) — no consent needed
 *  - analytics  : Google Analytics 4
 *  - marketing  : Google Ads conversion tag + Meta Pixel
 *
 * Stored in the first-party cookie `pm_consent` for 180 days as "v1.a1.m0".
 * Tags are only loaded after the matching consent (KVKK çerez rehberi / GDPR "prior consent").
 */

export const CONSENT_COOKIE = "pm_consent";
export const CONSENT_VERSION = "v1";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;
export const CONSENT_OPEN_EVENT = "pm:consent-open";
export const CONSENT_CHANGE_EVENT = "pm:consent-change";

export type Consent = { analytics: boolean; marketing: boolean };

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID || "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

/** True when at least one optional tag is configured at build time (otherwise no banner is needed). */
export function trackingConfigured(): boolean {
  return Boolean(GA_ID || GADS_ID || META_PIXEL_ID);
}

export function parseConsent(raw: string | null | undefined): Consent | null {
  if (!raw) return null;
  const m = /^v1\.a([01])\.m([01])$/.exec(raw.trim());
  if (!m) return null;
  return { analytics: m[1] === "1", marketing: m[2] === "1" };
}

export function serializeConsent(c: Consent): string {
  return `${CONSENT_VERSION}.a${c.analytics ? 1 : 0}.m${c.marketing ? 1 : 0}`;
}

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  try {
    const hit = document.cookie.split(/;\s*/).find((p) => p.startsWith(`${CONSENT_COOKIE}=`));
    return parseConsent(hit ? decodeURIComponent(hit.slice(CONSENT_COOKIE.length + 1)) : null);
  } catch {
    return null;
  }
}

export function writeConsent(c: Consent): void {
  if (typeof document === "undefined") return;
  try {
    const secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${serializeConsent(c)}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax${secure}`;
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: c }));
  } catch {
    /* storage blocked */
  }
}

export function hasConsent(kind: keyof Consent): boolean {
  return Boolean(readConsent()?.[kind]);
}

/** Opens the preferences dialog (used by "Çerez tercihleri" links). */
export function openConsentPreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/** Removes cookies set by the optional tags after consent is withdrawn (best effort, first-party only). */
export function clearTrackingCookies(): void {
  if (typeof document === "undefined") return;
  const names = document.cookie
    .split(/;\s*/)
    .map((p) => p.split("=")[0])
    .filter((n) => /^(_ga|_gid|_gat|_gcl_|_fbp|_fbc)/.test(n));
  const host = location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const n of names) for (const d of domains) document.cookie = `${n}=; path=/; max-age=0${d ? `; domain=${d}` : ""}`;
}
