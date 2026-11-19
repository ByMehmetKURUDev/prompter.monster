import { NextResponse } from "next/server";
import { background } from "@/lib/background";
import { emailConfigFrom, runLifecycleEmails } from "@/lib/email/lifecycle";
import { stripLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Supabase Auth redirect target: e-posta doğrulama, sihirli bağlantı ve OAuth
 * buraya `?code=` ile döner; kodu oturuma çevirip `next` sayfasına yönlendiririz.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNext(url.searchParams.get("next"));

  const supabase = await createClient();
  let ok = false;
  let user: { id: string; created_at: string } | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    user = data?.user ?? null;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type: type as "email" | "signup" | "magiclink" | "recovery", token_hash: tokenHash });
    ok = !error;
    user = data?.user ?? null;
  }

  // Welcome e-mail (0023) right after the first sign-in instead of at the next hourly cron. The database decides
  // whether it is due (new, confirmed, not sent yet, not opted out); the language of this page becomes the default.
  if (ok && user && Date.now() - new Date(user.created_at).getTime() < 3 * 86_400_000) {
    const cfg = emailConfigFrom(process.env);
    if (cfg) background(runLifecycleEmails(cfg, { kinds: ["welcome"], userId: user.id, locale: stripLocale(next).locale, limit: 1 }));
  }

  // Error params (e.g. otp_expired) arrive as query or hash; the login page explains them.
  const errDesc = url.searchParams.get("error_description");
  const to = new URL(ok ? next : `/login?error=link${errDesc ? `&msg=${encodeURIComponent(errDesc)}` : ""}&next=${encodeURIComponent(next)}`, url.origin);
  return NextResponse.redirect(to);
}

function safeNext(v: string | null): string {
  if (!v || !v.startsWith("/") || v.startsWith("//")) return "/studio";
  return v;
}
