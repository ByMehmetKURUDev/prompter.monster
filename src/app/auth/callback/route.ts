import { NextResponse } from "next/server";
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type: type as "email" | "signup" | "magiclink" | "recovery", token_hash: tokenHash });
    ok = !error;
  }

  const to = new URL(ok ? next : "/login?error=link", url.origin);
  return NextResponse.redirect(to);
}

function safeNext(v: string | null): string {
  if (!v || !v.startsWith("/") || v.startsWith("//")) return "/studio";
  return v;
}
