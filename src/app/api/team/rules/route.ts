import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { isMissingFunction } from "@/lib/share";
import type { MyTeamRules } from "@/lib/team";
import type { TeamRules } from "@/lib/types";

export const runtime = "nodejs";

/**
 * GET /api/team/rules — the team conventions (0021) the Studio appends to the signed-in user's prompts:
 * { rules: { name, stack, code, voice } } when the user's team is active, the rules are switched on and not empty;
 * otherwise { rules: null }. Never errors for "no team" / "not signed in" / "0021 not applied yet".
 */
export async function GET() {
  const none = NextResponse.json({ rules: null }, { headers: { "Cache-Control": "no-store" } });
  if (!supabaseConfigured()) return none;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return none;

  const { data, error } = await supabase.rpc("my_team_rules").maybeSingle<MyTeamRules>();
  if (error) {
    if (!isMissingFunction(error.message)) console.error("[team:rules]", error.message);
    return none;
  }
  if (!data || data.team_status !== "active" || !data.enabled || !(data.stack.trim() || data.code.trim() || data.voice.trim())) return none;
  const rules: TeamRules = { name: data.team_name, stack: data.stack, code: data.code, voice: data.voice };
  return NextResponse.json({ rules }, { headers: { "Cache-Control": "no-store" } });
}
