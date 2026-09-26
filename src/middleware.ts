import type { NextRequest, NextResponse } from "next/server";
import { ATTR_CODE_COOKIE, ATTR_SOURCE_COOKIE, CODE_MAX_AGE, SOURCE_MAX_AGE, sanitizeCode, serializeSource, sourceFromRequest } from "@/lib/attribution";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  applyAttribution(request, response);
  return response;
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
