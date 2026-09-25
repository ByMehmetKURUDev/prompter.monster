import { NextResponse } from "next/server";
import type { MeResponse } from "@/lib/db";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Who am I + today's AI quota (for the sidebar). */
export async function GET() {
  const empty: MeResponse = { user: null, plan: null, usage: null };
  if (!supabaseConfigured()) return NextResponse.json(empty);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(empty);

    const { data } = await supabase.rpc("ai_usage_today").single<{ used: number; limit: number; plan: "free" | "pro" }>();
    const res: MeResponse = {
      user: { id: user.id, email: user.email ?? null },
      plan: data?.plan ?? "free",
      usage: data ? { used: data.used, limit: data.limit } : { used: 0, limit: 3 },
    };
    return NextResponse.json(res, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(empty);
  }
}
