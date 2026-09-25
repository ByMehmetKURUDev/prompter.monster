import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets; run on pages and API routes.
  matcher: ["/((?!_next/static|_next/image|favicon\\.svg|robots\\.txt|sitemap\\.xml).*)"],
};
