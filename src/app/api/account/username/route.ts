import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Login required: giriş yapmış kullanıcı kendi profil adını (/u/<username>) belirler/değiştirir. */
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "no_supabase" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { username?: string };
  const username = typeof body.username === "string" ? body.username : "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated", code: "unauthenticated" }, { status: 401 });

  const { data, error } = await supabase.rpc("set_username", { p_username: username });
  if (error) {
    if (error.code === "23505" || /username_taken/i.test(error.message)) {
      return NextResponse.json({ error: "username_taken", code: "username_taken" }, { status: 409 });
    }
    if (error.code === "22023" || /invalid_username/i.test(error.message)) {
      return NextResponse.json({ error: "invalid_username", code: "invalid_username" }, { status: 400 });
    }
    if (error.code === "28000" || /auth_required/i.test(error.message)) {
      return NextResponse.json({ error: "unauthenticated", code: "unauthenticated" }, { status: 401 });
    }
    if (/function .*set_username.* does not exist/i.test(error.message)) {
      return NextResponse.json({ error: "not_ready", code: "not_ready" }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const uname = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ username: uname as string }, { headers: { "Cache-Control": "no-store" } });
}
