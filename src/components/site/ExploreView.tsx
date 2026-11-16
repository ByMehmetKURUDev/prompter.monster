import { exploreList, exploreStats } from "@/lib/explore";
import { ALL_PROJECT_TYPES } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { PublicShell } from "./PublicShell";
import { ExploreGrid } from "./ExploreGrid";

const COPY = {
  tr: {
    title: "Keşfet",
    subtitle: "Topluluğun galeriye eklediği gerçek master build prompt'lar. Beğendiğini Studio'da aç, kendi projen için çatalla.",
    stat: (n: number) => `${n.toLocaleString("tr-TR")} paylaşım`,
    empty: "Henüz galeriye eklenmiş bir paylaşım yok. İlk sen ekle: Studio'da bir proje üret, paylaş ve paylaşım sayfasında \"Galeride göster\"i aç.",
  },
  en: {
    title: "Explore",
    subtitle: "Real master build prompts the community added to the gallery. Open one in Studio, fork it for your own project.",
    stat: (n: number) => `${n.toLocaleString("en-US")} shared`,
    empty: 'Nothing in the gallery yet. Be the first: generate a project in Studio, share it, and turn on "Show in Explore" on the share page.',
  },
} as const;

export async function ExploreView({ locale }: { locale: Locale }) {
  const [items, stats] = await Promise.all([exploreList({ limit: 24 }), exploreStats()]);
  const c = COPY[locale];
  const types = ALL_PROJECT_TYPES.map((t) => ({ id: t.id, name: t.name, icon: t.icon }));

  return (
    <PublicShell locale={locale}>
      <main className="max-w-[1200px] mx-auto px-4 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">{c.title}</h1>
        <p className="mt-3 text-[15px] text-zinc-400 max-w-[640px] leading-relaxed">{c.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-zinc-500">
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{c.stat(stats.total)}</span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">
            TR {stats.tr} · EN {stats.en}
          </span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">🍴 {stats.total_forks}</span>
        </div>

        <div className="mt-8">
          <ExploreGrid initialItems={items} locale={locale} types={types} emptyText={c.empty} />
        </div>
      </main>
    </PublicShell>
  );
}
