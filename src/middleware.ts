import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, enReady, localePath, stripLocale } from "@/lib/i18n";
import { ATTR_CODE_COOKIE, ATTR_SOURCE_COOKIE, CODE_MAX_AGE, SOURCE_MAX_AGE, sanitizeCode, serializeSource, sourceFromRequest } from "@/lib/attribution";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Public API + MCP authenticate with API keys, never cookies: skip the session refresh entirely.
  const p = request.nextUrl.pathname;
  if (p.startsWith("/api/v1/") || p === "/api/mcp" || p === "/llms.txt") return NextResponse.next();
  const langRedirect = preferredLanguageRedirect(request);
  if (langRedirect) {
    applyAttribution(request, langRedirect);
    return langRedirect;
  }
  const response = await updateSession(request);
  applyAttribution(request, response);
  return response;
}

/**
 * Visitors who explicitly chose English (pm_lang=en, set by the language switch) are sent from a Turkish URL
 * to its /en twin. No cookie → no redirect (search engines always see the URL they asked for).
 */
function preferredLanguageRedirect(request: NextRequest): NextResponse | null {
  if (request.method !== "GET") return null;
  if (request.cookies.get(LOCALE_COOKIE)?.value !== "en") return null;
  const dest = request.headers.get("sec-fetch-dest");
  const isDocument = dest ? dest === "document" : (request.headers.get("accept") || "").includes("text/html");
  if (!isDocument) return null;
  const { locale, path } = stripLocale(request.nextUrl.pathname);
  if (locale === "en" || !enReady(path)) return null;
  const to = request.nextUrl.clone();
  to.pathname = localePath(path, "en");
  return NextResponse.redirect(to, 307);
}

/**
 * Discount links (?code=PH40) and first-touch campaign source (utm_source / ref / external referrer).
 * Page navigations only; API calls, assets and the admin area are ignored.
 */
function applyAttribution(request: NextRequest, response: NextResponse) {
  if (request.method !== "GET") return;
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api") || path.startsWith("/admin") || path.startsWith("/auth") || path.startsWith("/_next")) return;
  const dest = request.headers.get("sec-fetch-dest");
  const isDocument = dest ? dest === "document" : (request.headers.get("accept") || "").includes("text/html");
  if (!isDocument) return;

  const secure = request.nextUrl.protocol === "https:";
  const code = sanitizeCode(request.nextUrl.searchParams.get("code") || request.nextUrl.searchParams.get("promo"));
  if (code) response.cookies.set(ATTR_CODE_COOKIE, code, { path: "/", maxAge: CODE_MAX_AGE, sameSite: "lax", secure });

  if (!request.cookies.has(ATTR_SOURCE_COOKIE)) {
    const src = sourceFromRequest(request.nextUrl, request.headers.get("referer"));
    if (src) response.cookies.set(ATTR_SOURCE_COOKIE, serializeSource(src), { path: "/", maxAge: SOURCE_MAX_AGE, sameSite: "lax", secure });
  }
}

export const config = {
  // Skip static assets; run on pages and API routes.
  matcher: ["/((?!_next/static|_next/image|favicon\\.svg|robots\\.txt|sitemap\\.xml).*)"],
};
