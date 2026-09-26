import { createClient as createAnon } from "@supabase/supabase-js";
import { adminConfigured, createAdminClient } from "./supabase/admin";
import { createClient, supabaseConfigured } from "./supabase/server";
import { mergeSettings, publicSubset, type PublicSettings, type SettingsMap } from "./settings";

/** Server-only helpers around the `app_settings` table. */

/** Public settings (announcement, flags, limits, legal info) for anonymous readers — safe to cache briefly. */
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

/* Per-isolate cache so AI routes don't hit the database for settings on every call. */
let serverCache: { at: number; values: SettingsMap } | null = null;
const SERVER_TTL_MS = 15_000;

/**
 * Every setting (public and server-only, e.g. model ids) for server code.
 * Uses the service role when available; otherwise falls back to the public subset + defaults.
 */
export async function readServerSettings(): Promise<SettingsMap> {
  if (serverCache && Date.now() - serverCache.at < SERVER_TTL_MS) return serverCache.values;
  let values: SettingsMap;
  if (adminConfigured()) {
    try {
      const { data, error } = await createAdminClient().from("app_settings").select("key,value");
      if (error) throw error;
      const raw: Record<string, unknown> = {};
      for (const row of data ?? []) raw[row.key as string] = row.value;
      values = mergeSettings(raw);
    } catch {
      values = { ...mergeSettings(null), ...(await readPublicSettings()) };
    }
  } else {
    values = { ...mergeSettings(null), ...(await readPublicSettings()) };
  }
  serverCache = { at: Date.now(), values };
  return values;
}

/** Drops the cache after an admin changes settings (same isolate only; others expire within 15 s). */
export function invalidateServerSettings(): void {
  serverCache = null;
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

/** Last-resort model when a configured one is missing or retired. */
export const FALLBACK_MODEL = "claude-sonnet-5";

/** The model to call for a plan: admin setting → ANTHROPIC_MODEL env → fallback. */
export async function resolveModel(plan: "anon" | "free" | "pro" = "pro"): Promise<string> {
  const s = await readServerSettings();
  const configured = String((plan === "pro" ? s.ai_model_pro : s.ai_model_free) ?? "").trim();
  return configured || process.env.ANTHROPIC_MODEL || FALLBACK_MODEL;
}
