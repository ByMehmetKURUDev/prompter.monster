/**
 * Channel attribution (server + client safe, no Node APIs).
 *
 * - pm_code : discount code from a link like prompter.monster/?code=PH40 (30 days) → applied at checkout.
 * - pm_src  : first-touch campaign source (utm_source/ref/via, medium, campaign, external referrer host,
 *             landing path, date) — 90 days, no personal data. Stored on the profile at sign-up so the
 *             admin "Kanallar" page can show sign-ups and Pro conversions per channel.
 */

export const ATTR_CODE_COOKIE = "pm_code";
export const ATTR_SOURCE_COOKIE = "pm_src";
export const CODE_MAX_AGE = 60 * 60 * 24 * 30;
export const SOURCE_MAX_AGE = 60 * 60 * 24 * 90;

export interface SignupSource {
  /** utm_source / ref / via (e.g. producthunt, youtube-selma) */
  s?: string;
  /** utm_medium */
  m?: string;
  /** utm_campaign */
  c?: string;
  /** external referrer host (e.g. www.google.com) */
  r?: string;
  /** landing path */
  l?: string;
  /** first-touch date YYYY-MM-DD */
  t?: string;
  /** discount code, when one was used */
  code?: string;
}

export function sanitizeCode(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return /^[A-Za-z0-9_-]{2,32}$/.test(t) ? t.toUpperCase() : null;
}

function token(v: string | null | undefined, max = 60): string | undefined {
  if (!v) return undefined;
  const t = v
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._+\- ]/g, "")
    .slice(0, max);
  return t || undefined;
}

export function serializeSource(src: SignupSource): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(src)) if (v) p.set(k, String(v));
  return p.toString();
}

export function parseSourceCookie(raw: string | null | undefined): SignupSource | null {
  if (!raw) return null;
  try {
    const p = new URLSearchParams(decodeURIComponent(raw));
    const out: SignupSource = {};
    for (const k of ["s", "m", "c", "r", "l", "t", "code"] as const) {
      const v = p.get(k);
      if (v) out[k] = v.slice(0, 80);
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

/** First-touch source from the landing URL + Referer header. Returns null for direct/internal traffic. */
export function sourceFromRequest(url: URL, referer: string | null): SignupSource | null {
  const q = url.searchParams;
  const s = token(q.get("utm_source") || q.get("ref") || q.get("via") || q.get("source"));
  const m = token(q.get("utm_medium"));
  const c = token(q.get("utm_campaign"));
  let r: string | undefined;
  if (referer) {
    try {
      const host = new URL(referer).hostname.toLowerCase();
      const own = url.hostname.replace(/^www\./, "");
      if (host && host.replace(/^www\./, "") !== own && !host.endsWith(`.${own}`)) r = host.slice(0, 80);
    } catch {
      /* malformed referer */
    }
  }
  if (!s && !r) return null;
  return { s, m, c, r, l: url.pathname.slice(0, 80), t: new Date().toISOString().slice(0, 10) };
}

const REFERRER_CHANNELS: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)yandex\./, "yandex"],
  [/(^|\.)producthunt\.com$/, "producthunt"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/^news\.ycombinator\.com$/, "hackernews"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(facebook\.com|instagram\.com|fb\.com|l\.facebook\.com)$/, "meta"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)github\.com$/, "github"],
  [/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/, "ai-assistant"],
];

/** A short channel label for grouping (utm_source wins; otherwise the referrer family; otherwise "direct"). */
export function channelOf(src: SignupSource | null | undefined): string {
  if (!src) return "direct";
  if (src.s) return src.s;
  if (src.r) {
    for (const [re, name] of REFERRER_CHANNELS) if (re.test(src.r)) return name;
    return src.r.replace(/^www\./, "");
  }
  return src.code ? `code:${src.code}` : "direct";
}

/** Reads a cookie in the browser (client components). */
export function readClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split(/;\s*/).find((p) => p.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

/** Source + code for the sign-up metadata (client side). */
export function clientSignupSource(): SignupSource | null {
  const src = parseSourceCookie(readClientCookie(ATTR_SOURCE_COOKIE));
  const code = sanitizeCode(readClientCookie(ATTR_CODE_COOKIE));
  if (!src && !code) return null;
  return { ...(src ?? {}), ...(code ? { code } : {}) };
}
