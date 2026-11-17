/**
 * Keşfet galerisi — herkese açık paylaşımların listesi (sahibi "Galeride göster"i açtıysa).
 * Anon anahtarla direkt Supabase istemcisi (RPC'ler security definer + kendi filtresiyle güvenli);
 * sunucu bileşenlerinde çağrılır — sitemap.ts'teki desenle aynı. supabase/migrations/0010_explore_feedback.sql,
 * 0011_likes_leaderboard.sql (beğeniler + "Usta Canavarlar" lider tablosu), 0012_public_profiles.sql (profil linki için username),
 * 0013_explore_filter_pages.sql (uzman filtresi + filtreli sayaç — /explore/type/[type], /explore/expert/[expert] SEO sayfaları için).
 */
import { createClient } from "@supabase/supabase-js";

export interface ExploreItem {
  slug: string;
  name: string;
  project_type: string;
  format: string;
  lang: "TR" | "EN";
  pitch: string;
  experts: string[];
  views: number;
  forks: number;
  likes: number;
  featured: boolean;
  created_at: string;
}

export interface ExploreStats {
  total: number;
  tr: number;
  en: number;
  total_forks: number;
  total_likes: number;
}

export type ExploreSort = "new" | "popular" | "forked" | "liked";

const EMPTY_STATS: ExploreStats = { total: 0, tr: 0, en: 0, total_forks: 0, total_likes: 0 };

export type LeaderboardWindow = "week" | "month" | "all";

export interface LeaderboardEntry {
  owner_id: string;
  username: string;
  display_name: string;
  window_likes: number;
  total_forks: number;
  share_count: number;
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface ExploreListOpts {
  lang?: "TR" | "EN";
  type?: string;
  expert?: string;
  sort?: ExploreSort;
  limit?: number;
  offset?: number;
}

export async function exploreList(opts: ExploreListOpts = {}): Promise<ExploreItem[]> {
  const supabase = anonClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("explore_list_v3", {
      p_lang: opts.lang ?? null,
      p_type: opts.type ?? null,
      p_expert: opts.expert ?? null,
      p_sort: opts.sort ?? "new",
      p_limit: opts.limit ?? 24,
      p_offset: opts.offset ?? 0,
    });
    if (error || !data) return [];
    return data as ExploreItem[];
  } catch {
    return [];
  }
}

export interface ExploreStatsOpts {
  type?: string;
  expert?: string;
}

/** Genel sayaçlar (varsayılan) veya tek bir tip/uzmana filtrelenmiş sayaç — filtre sayfası başlığı için. */
export async function exploreStats(opts: ExploreStatsOpts = {}): Promise<ExploreStats> {
  const supabase = anonClient();
  if (!supabase) return EMPTY_STATS;
  try {
    const { data, error } = await supabase.rpc("explore_stats_v3", {
      p_type: opts.type ?? null,
      p_expert: opts.expert ?? null,
    });
    if (error || !data) return EMPTY_STATS;
    const row = Array.isArray(data) ? data[0] : data;
    return (row as ExploreStats) ?? EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
}

/** "Usta Canavarlar" lider tablosu: pencere içinde ALINAN beğeniye göre katkıcı sırası. */
export async function leaderboardCreators(window: LeaderboardWindow = "all", limit = 20): Promise<LeaderboardEntry[]> {
  const supabase = anonClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("leaderboard_creators_v2", { p_window: window, p_limit: limit });
    if (error || !data) return [];
    return data as LeaderboardEntry[];
  } catch {
    return [];
  }
}

/** Sitemap için: galerideki tüm slug'lar (sayfalanarak), en yeniden eskiye. */
export async function exploreSlugs(limit = 500): Promise<Pick<ExploreItem, "slug" | "lang" | "created_at">[]> {
  const out: ExploreItem[] = [];
  let offset = 0;
  while (out.length < limit) {
    const page = await exploreList({ limit: 60, offset, sort: "new" });
    if (page.length === 0) break;
    out.push(...page);
    offset += page.length;
    if (page.length < 60) break;
  }
  return out.slice(0, limit).map((i) => ({ slug: i.slug, lang: i.lang, created_at: i.created_at }));
}
