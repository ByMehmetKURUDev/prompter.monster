import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Which of these slugs did I like? Logged out → empty list (not an error), so ExploreGrid can call this unconditionally. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const slugs = (u.searchParams.get("slugs") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);
  if (!supabaseConfigured() || slugs.length === 0) return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });

  const { data, error } = await supabase.rpc("shared_links_liked_by_me", { p_slugs: slugs });
  if (error || !data) return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
