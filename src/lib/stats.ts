/**
 * Herkese açık, hafif kullanım sayaçları — ana sayfadaki "canlı kullanım sayaçları" bölümü için
 * (prompts.chat/Promptmasters analizi, öneri #7, görev #65). supabase/migrations/0015_public_usage_stats.sql.
 * admin_stats() (admin paneli, authenticated + is_admin() gerektirir, çok daha fazla hassas alan
 * döndürür) ile AYNI sayım mantığını kullanır ama yalnız dört toplam sayıyı döndürür — hiçbir
 * kullanıcıya özel veri yok. Anon anahtarla direkt Supabase istemcisi (RPC security definer ile
 * güvenli) — explore.ts / profile.ts'teki desenle aynı.
 */
import { createClient } from "@supabase/supabase-js";

export interface PublicUsageStats {
  generations_total: number;
  projects_total: number;
  shares_total: number;
  tokens_total: number;
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function publicUsageStats(): Promise<PublicUsageStats | null> {
  const supabase = anonClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("public_usage_stats");
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return (row as PublicUsageStats) ?? null;
  } catch {
    return null;
  }
}
