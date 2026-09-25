import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// Served on demand: the Workers deployment has no incremental cache, so ISR would freeze the list at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/studio`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  // Public shared prompts (shared_links is readable with the anon key).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await supabase.from("shared_links").select("slug,created_at").order("created_at", { ascending: false }).limit(2000);
      for (const row of data ?? []) {
        entries.push({ url: `${site}/p/${row.slug}`, lastModified: new Date(row.created_at), changeFrequency: "monthly", priority: 0.6 });
      }
    } catch {
      /* sitemap still works without the shared pages */
    }
  }
  return entries;
}
