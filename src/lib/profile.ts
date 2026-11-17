/**
 * Herkese açık canavar profilleri (/u/<username>) — profiles.username + güvenli RPC'ler.
 * supabase/migrations/0012_public_profiles.sql (prompts.chat/Promptmasters analizi, öneri #2).
 * Anon anahtarla direkt Supabase istemcisi (RPC'ler security definer + kendi filtresiyle güvenli) —
 * explore.ts'teki desenle aynı.
 */
import { createClient } from "@supabase/supabase-js";
import type { ExploreItem } from "./explore";

/** Sunucudaki _slugify/set_username ile aynı kural: 3-30 karakter, a-z0-9, iç tireler. */
export const USERNAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

export function isValidUsername(v: string): boolean {
  return v.length >= USERNAME_MIN && v.length <= USERNAME_MAX && USERNAME_RE.test(v);
}

export interface PublicProfile {
  username: string;
  display_name: string;
  member_since: string;
  share_count: number;
  total_views: number;
  total_forks: number;
  total_likes: number;
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function publicProfile(username: string): Promise<PublicProfile | null> {
  const supabase = anonClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("public_profile", { p_username: username });
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return (row as PublicProfile) ?? null;
  } catch {
    return null;
  }
}

export async function publicProfileShares(username: string, limit = 24, offset = 0): Promise<ExploreItem[]> {
  const supabase = anonClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("public_profile_shares", { p_username: username, p_limit: limit, p_offset: offset });
    if (error || !data) return [];
    return data as ExploreItem[];
  } catch {
    return [];
  }
}

/** Sitemap için: galeride görünen en az bir paylaşımı olan kullanıcı adları. */
export async function profileSitemapUsernames(limit = 2000): Promise<string[]> {
  const supabase = anonClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("sitemap_profile_usernames", { p_limit: limit });
    if (error || !data) return [];
    return data as string[];
  } catch {
    return [];
  }
}
