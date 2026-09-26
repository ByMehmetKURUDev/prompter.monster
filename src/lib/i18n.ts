/**
 * Locale basics shared by server and client code (no React, no "use client").
 *
 * URL strategy: Turkish lives at the root (/pricing), English under /en (/en/pricing).
 * Each English route is a thin wrapper that renders the same view with locale="en",
 * so pages stay static-friendly and every URL has exactly one language (good for SEO/hreflang).
 * The `pm_lang` cookie only remembers an explicit choice made with the language switch.
 */

export type Locale = "tr" | "en";

export const LOCALES: Locale[] = ["tr", "en"];
export const DEFAULT_LOCALE: Locale = "tr";
export const LOCALE_COOKIE = "pm_lang";

export function isLocale(v: unknown): v is Locale {
  return v === "tr" || v === "en";
}

/** "/pricing" + "en" → "/en/pricing"; "/" + "en" → "/en". Leaves absolute URLs, anchors and mailto alone. */
export function localePath(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const clean = stripLocale(path).path;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? "/en" : `/en${clean}`;
}

/** "/en/pricing?x=1" → { locale: "en", path: "/pricing?x=1" }. */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  if (pathname === "/en" || pathname.startsWith("/en/") || pathname.startsWith("/en?") || pathname.startsWith("/en#")) {
    const rest = pathname.slice(3);
    return { locale: "en", path: rest.startsWith("/") ? rest : `/${rest}` };
  }
  return { locale: "tr", path: pathname || "/" };
}

/**
 * English routes that exist (besides the home page "/"): each prefix has an /en wrapper route.
 * Links to anything else (admin, auth callbacks, shared /p pages) stay on the Turkish path.
 */
export const EN_READY_PREFIXES = ["/studio", "/pricing", "/docs", "/prompt", "/login", "/library", "/account", "/legal", "/developers"];

/** True when the English version of this (locale-free) path exists. */
export function enReady(path: string): boolean {
  const clean = stripLocale(path).path.split(/[?#]/)[0] || "/";
  if (clean === "/") return true;
  return EN_READY_PREFIXES.some((p) => clean === p || clean.startsWith(`${p}/`));
}

/** Like localePath, but only switches to /en when that English route exists. */
export function lhref(path: string, locale: Locale): string {
  if (locale === "tr") return localePath(path, "tr");
  const clean = stripLocale(path).path;
  return enReady(clean) ? localePath(clean, "en") : clean;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster").replace(/\/$/, "");

/** Metadata `alternates` (canonical + hreflang) for a page that exists in both languages. */
export function alternatesFor(path: string, locale: Locale) {
  const clean = stripLocale(path).path;
  const tr = `${SITE_URL}${clean === "/" ? "" : clean}` || SITE_URL;
  const en = `${SITE_URL}${localePath(clean, "en")}`;
  return { canonical: locale === "en" ? en : tr, languages: { tr, en, "x-default": tr } };
}

/** Pick the right string for a locale from a { tr, en } pair. */
export function t<T>(locale: Locale, pair: { tr: T; en: T }): T {
  return pair[locale];
}
