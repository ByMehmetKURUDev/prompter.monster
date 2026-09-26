import { createClient as createAnon } from "@supabase/supabase-js";
import { createClient, supabaseConfigured } from "./supabase/server";
import { mergeSettings, publicSubset, type PublicSettings, type SettingsMap } from "./settings";

/** Server-only helpers around the `app_settings` table. */

/** Public settings (announcement, flags, limits) for anonymous readers — safe to cache briefly. */
export async function readPublicSettings(): Promise<PublicSettings> {
  const defaults = publicSubset(mergeSettings(null));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return defaults;
  try {
    const anon = createAnon(url, key, { auth: { persistSession: false } });
    const { data, error } = await anon.rpc("public_settings");
    if (error || !data) return defaults;
    return publicSubset(mergeSettings(data as Record<string, unknown>));
  } catch {
    return defaults;
  }
}

/** Every setting with overrides applied (admin only — RLS on app_settings enforces it). */
export async function readAllSettings(): Promise<{ values: SettingsMap; overrides: Record<string, { value: unknown; updated_at: string }> }> {
  const overrides: Record<string, { value: unknown; updated_at: string }> = {};
  if (!supabaseConfigured()) return { values: mergeSettings(null), overrides };
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("app_settings").select("key,value,updated_at");
    const raw: Record<string, unknown> = {};
    for (const row of data ?? []) {
      raw[row.key] = row.value;
      overrides[row.key] = { value: row.value, updated_at: row.updated_at };
    }
    return { values: mergeSettings(raw), overrides };
  } catch {
    return { values: mergeSettings(null), overrides };
  }
}

/** The model to call: admin override → env → default. */
export async function resolveModel(): Promise<string> {
  const s = await readPublicSettings();
  return (s.ai_model && s.ai_model.trim()) || process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
}
