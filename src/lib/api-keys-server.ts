/** Session-side helpers for the key management routes (/api/keys) and the /account/api page. Server-only. */
import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "./supabase/server";

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  calls: number;
  revoked_at: string | null;
}

export const KEY_COLUMNS = "id,name,prefix,created_at,last_used_at,calls,revoked_at";

type Lang = "tr" | "en";
const lang = (req: Request): Lang => (req.headers.get("x-pm-locale") === "en" ? "en" : "tr");

/** Same-origin check for cookie-authenticated mutations (defence in depth on top of SameSite=Lax cookies). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers may omit it; cookies are SameSite=Lax anyway
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export async function keysUser(req: Request) {
  const l = lang(req);
  if (!supabaseConfigured()) {
    return { error: NextResponse.json({ error: l === "en" ? "Accounts are not configured." : "Hesap sistemi yapılandırılmamış.", code: "no_supabase" }, { status: 503 }) };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: l === "en" ? "Please sign in first." : "Önce giriş yap.", code: "unauthenticated" }, { status: 401 }) };
  }
  return { supabase, user, lang: l };
}
