/** Server-only team helpers for the API key paths (/api/v1, /api/mcp): they run with the service role. */
import { adminConfigured, createAdminClient } from "./supabase/admin";
import type { TeamRules } from "./types";

/**
 * The team conventions (0021) that apply to an API key owner's generations: active team, switched on, not empty.
 * Best effort — returns null when there are none, before 0021 is applied, or if the lookup fails.
 */
export async function teamRulesFor(userId: string | null | undefined): Promise<TeamRules | null> {
  if (!userId || !adminConfigured()) return null;
  try {
    const { data, error } = await createAdminClient()
      .rpc("team_rules_for", { p_user: userId })
      .maybeSingle<{ team_name: string; stack: string; code: string; voice: string }>();
    if (error || !data) return null;
    return { name: data.team_name, stack: data.stack ?? "", code: data.code ?? "", voice: data.voice ?? "" };
  } catch {
    return null;
  }
}
