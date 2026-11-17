import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { loadCatalog } from "@/lib/catalog-server";
import { ALL_PROJECT_TYPES, EXPERTS } from "@/lib/data";
import { TYPE_PAGES, TYPE_PAGES_EN } from "@/lib/seo-types";
import { LEGAL_SLUGS, LEGAL_UPDATED } from "@/lib/legal/types";
import { profileSitemapUsernames } from "@/lib/profile";

// Served on demand: the Workers deployment has no incremental cache, so ISR would freeze the list at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";
  const now = new Date();
  await loadCatalog();
  const visible = new Set(ALL_PROJECT_TYPES.map((t) => t.id));
  const entries: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/studio`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/prompt`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/docs`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site}/developers`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    ...TYPE_PAGES.filter((p) => visible.has(p.id)).map((p) => ({ url: `${site}/prompt/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    // English twins
    { url: `${site}/en`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site}/en/studio`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/en/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site}/en/prompt`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site}/en/docs`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site}/en/developers`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site}/en/explore`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    ...TYPE_PAGES_EN.filter((p) => visible.has(p.id)).map((p) => ({ url: `${site}/en/prompt/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    // Keşfet: tip/uzman filtre sayfaları (SEO) — ALL_PROJECT_TYPES ve EXPERTS loadCatalog() sonrası zaten güncel.
    ...ALL_PROJECT_TYPES.flatMap((t) => [
      { url: `${site}/explore/type/${t.id}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.5 },
      { url: `${site}/en/explore/type/${t.id}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.4 },
    ]),
    ...EXPERTS.flatMap((ex) => [
      { url: `${site}/explore/expert/${ex.id}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.5 },
      { url: `${site}/en/explore/expert/${ex.id}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.4 },
    ]),
    ...LEGAL_SLUGS.flatMap((slug) => [
      { url: `${site}/legal/${slug}`, lastModified: new Date(LEGAL_UPDATED), changeFrequency: "yearly" as const, priority: 0.2 },
      { url: `${site}/en/legal/${slug}`, lastModified: new Date(LEGAL_UPDATED), changeFrequency: "yearly" as const, priority: 0.2 },
    ]),
  ];

  // Public shared prompts (shared_links is readable with the anon key).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await supabase.from("shared_links").select("slug,created_at").eq("hidden", false).order("created_at", { ascending: false }).limit(2000);
      for (const row of data ?? []) {
        entries.push({ url: `${site}/p/${row.slug}`, lastModified: new Date(row.created_at), changeFrequency: "monthly", priority: 0.6 });
      }
    } catch {
      /* sitemap still works without the shared pages */
    }
  }

  // Herkese açık canavar profilleri (en az bir galeri paylaşımı olanlar) — TR + EN.
  try {
    const usernames = await profileSitemapUsernames(2000);
    for (const username of usernames) {
      entries.push({ url: `${site}/u/${username}`, lastModified: now, changeFrequency: "weekly", priority: 0.5 });
      entries.push({ url: `${site}/en/u/${username}`, lastModified: now, changeFrequency: "weekly", priority: 0.4 });
    }
  } catch {
    /* sitemap still works without profile pages */
  }

  return entries;
}
