import { NextResponse } from "next/server";
import { KEY_COLUMNS } from "@/lib/api-keys-server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/account/export — everything we hold about the signed-in user as one JSON file
 * (KVKK md. 11 / GDPR art. 15 & 20). Reads with the user's own session, so RLS limits it to their rows.
 */
export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "no_supabase" }, { status: 503 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const uid = user.id;
  const [profile, projects, generations, shares, subscriptions, keys, usage, feedback] = await Promise.all([
    supabase.from("profiles").select("email,plan,created_at,signup_source,pro_interest_at").eq("id", uid).maybeSingle(),
    supabase.from("projects").select("id,name,project_type,state,created_at,updated_at").eq("owner_id", uid).order("created_at"),
    supabase.from("generations").select("id,project_id,version,format,lang,experts,output,refined,token_estimate,created_at").eq("owner_id", uid).order("created_at"),
    supabase.from("shared_links").select("*").eq("owner_id", uid).order("created_at"),
    supabase.from("subscriptions").select("provider,status,plan,current_period_end,created_at,updated_at").eq("owner_id", uid).order("created_at"),
    supabase.from("api_keys").select(KEY_COLUMNS).eq("owner_id", uid).order("created_at"),
    supabase.from("ai_usage").select("endpoint,credits,model,plan,status,source,input_tokens,output_tokens,created_at").eq("owner_id", uid).order("created_at").limit(20000),
    supabase.from("feedback").select("kind,rating,note,project_type,format,lang,created_at").eq("owner_id", uid).order("created_at"),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    service: "Prompt.Monster (https://prompter.monster)",
    note: "Your account data: profile, projects (Studio state), every generated version, share links, subscriptions, API keys (metadata only, never the secret) and AI usage records.",
    account: { id: uid, email: user.email ?? null, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at ?? null, ...(profile.data ?? {}) },
    projects: projects.data ?? [],
    generations: generations.data ?? [],
    share_links: (shares.data ?? []).map((s: Record<string, unknown>) => ({ ...s, url: `https://prompter.monster/p/${String(s.slug)}` })),
    subscriptions: subscriptions.data ?? [],
    api_keys: keys.data ?? [],
    ai_usage: usage.data ?? [],
    feedback: feedback.error ? [] : (feedback.data ?? []),
  };

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="prompt-monster-data-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
