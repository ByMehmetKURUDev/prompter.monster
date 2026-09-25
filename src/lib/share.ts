import { cache } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import type { StudioState } from "@/lib/types";

/** Row returned by the `get_shared` RPC (see supabase/migrations/0002_share.sql). */
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
  created_at: string;
}

export const SLUG_RE = /^[a-z0-9-]{3,64}$/;

/** Public read of a shared prompt; cached per request so metadata + page share one query. */
export const getShared = cache(async (slug: string): Promise<SharedPrompt | null> => {
  if (!supabaseConfigured() || !SLUG_RE.test(slug)) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_shared", { p_slug: slug });
    if (error || !data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as SharedPrompt | undefined;
    return row ?? null;
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
