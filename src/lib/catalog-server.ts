/** Server-side catalog loading (per-isolate cache, 60 s). Server-only. */
import { createClient as createAnon } from "@supabase/supabase-js";
import { applyCatalog, type CatalogRow } from "./catalog";

let cache: { at: number; rows: CatalogRow[] } | null = null;
const TTL_MS = 60_000;

/** All catalog rows (public data). Empty when Supabase is not configured or the table does not exist yet. */
export async function catalogRows(fresh = false): Promise<CatalogRow[]> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let rows: CatalogRow[] = cache?.rows ?? [];
  if (url && key) {
    try {
      const { data, error } = await createAnon(url, key, { auth: { persistSession: false } })
        .from("catalog_items")
        .select("kind,id,data,enabled,sort,updated_at")
        .order("sort", { ascending: true })
        .limit(500);
      if (!error && data) rows = data as CatalogRow[];
    } catch {
      /* keep the last known rows (or the built-ins) */
    }
  }
  cache = { at: Date.now(), rows };
  return rows;
}

/** Applies the current catalog to the shared data (EXPERTS, PROJECT_CATEGORIES, TYPE_PRESETS …). */
export async function loadCatalog(): Promise<void> {
  applyCatalog(await catalogRows());
}

export function invalidateCatalog(): void {
  cache = null;
}
