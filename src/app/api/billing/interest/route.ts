import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * "Pro açılınca haber ver": marks the signed-in user's profile. Replaced by real checkout once a
 * payment provider is wired (see BILLING_PROVIDER in .env.example).
 */
export async function POST() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Hesap sistemi yapılandırılmamış.", code: "no_supabase" }, { status: 503 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Önce giriş yapın.", code: "unauthenticated" }, { status: 401 });

  const { data, error } = await supabase.rpc("mark_pro_interest");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, since: data });
}
