import { cache } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import type { StudioState } from "@/lib/types";

/** Row returned by the `get_shared` RPC (see supabase/migrations/0002_share.sql + 0010_explore_feedback.sql). */
export interface SharedPrompt {
  slug: string;
  version: number;
  format: string;
  lang: "TR" | "EN";
  experts: string[];
  output: string;
  name: string;
  project_type: string;
  pitch: string;
  description: string;
  state: StudioState;
  views: number;
  forks: number;
  created_at: string;
}

export const SLUG_RE = /^[a-z0-9-]{3,64}$/;

/** PostgREST/Postgres error for an RPC that is not in the database yet (a migration not applied). */
export function isMissingFunction(message: string | null | undefined): boolean {
  return /function .* does not exist|could not find the function/i.test(message ?? "");
}

/** Public read of a shared prompt; cached per request so metadata + page share one query. */
export const getShared = cache(async (slug: string): Promise<SharedPrompt | null> => {
  if (!supabaseConfigured() || !SLUG_RE.test(slug)) return null;
  try {
    const supabase = await createClient();
    // get_shared_v2 (0019) adds the fork count; before 0019 is applied fall back to the original RPC.
    let { data, error } = await supabase.rpc("get_shared_v2", { p_slug: slug });
    if (error && isMissingFunction(error.message)) ({ data, error } = await supabase.rpc("get_shared", { p_slug: slug }));
    if (error || !data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as SharedPrompt | undefined;
    return row ? { ...row, forks: row.forks ?? 0 } : null;
  } catch {
    return null;
  }
});

/** Fire-and-forget view counter. */
export async function bumpViews(slug: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("bump_shared_views", { p_slug: slug });
  } catch {
    /* counter is best-effort */
  }
}

/** Fork counter — bumped whenever a share's state is loaded into Studio ("Studio'da çatalla"). */
export async function bumpForks(slug: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("bump_shared_forks", { p_slug: slug });
  } catch {
    /* counter is best-effort */
  }
}

/**
 * Owner-only lookup for the page's "Galeride göster" bar: is the signed-in visitor the owner,
 * and is this slug currently listed in Explore? RLS ("own shared links") already lets an owner
 * select their own row, so a plain client call is enough — no extra RPC needed.
 */
export async function ownerInfo(slug: string): Promise<{ isOwner: true; listed: boolean } | null> {
  if (!supabaseConfigured() || !SLUG_RE.test(slug)) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("shared_links").select("owner_id, listed").eq("slug", slug).maybeSingle<{ owner_id: string; listed: boolean }>();
    if (!data || data.owner_id !== user.id) return null;
    return { isOwner: true, listed: data.listed };
  } catch {
    return null;
  }
}
