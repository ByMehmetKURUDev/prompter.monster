import Link from "next/link";
import { Trophy } from "lucide-react";
import { exploreList } from "@/lib/explore";
import { filterStats } from "@/lib/explore-server";
import { ALL_PROJECT_TYPES, EXPERTS } from "@/lib/data";
import { lhref, type Locale } from "@/lib/i18n";
import { PublicShell } from "./PublicShell";
import { ExploreGrid } from "./ExploreGrid";

const COPY = {
  tr: {
    title: "Keşfet",
    subtitle: "Topluluğun galeriye eklediği gerçek master build prompt'lar. Beğendiğini Studio'da aç, kendi projen için çatalla.",
    stat: (n: number) => `${n.toLocaleString("tr-TR")} paylaşım`,
    empty: "Henüz galeriye eklenmiş bir paylaşım yok. İlk sen ekle: Studio'da bir proje üret, paylaş ve paylaşım sayfasında \"Galeride göster\"i aç.",
    leaderboard: "Usta Canavarlar",
    byType: "Proje tipine göre gez",
    byExpert: "Uzmana göre gez",
    seeAll: "← Tüm Keşfet'e dön",
    filteredBy: { type: "Proje tipi", expert: "Uzman" },
  },
  en: {
    title: "Explore",
    subtitle: "Real master build prompts the community added to the gallery. Open one in Studio, fork it for your own project.",
    stat: (n: number) => `${n.toLocaleString("en-US")} shared`,
    empty: 'Nothing in the gallery yet. Be the first: generate a project in Studio, share it, and turn on "Show in Explore" on the share page.',
    leaderboard: "Master Monsters",
    byType: "Browse by project type",
    byExpert: "Browse by expert",
    seeAll: "← Back to all of Explore",
    filteredBy: { type: "Project type", expert: "Expert" },
  },
} as const;

export interface ExploreFilter {
  dimension: "type" | "expert";
  id: string;
  icon: string;
  name: string;
}

/**
 * Keşfet hub'ı VE tip/uzman bazlı SEO filtre sayfaları (/explore/type/[type], /explore/expert/[expert])
 * aynı bileşeni paylaşır — `filter` verilince ilgili RPC filtresi uygulanır ve başlık/İçerik buna göre
 * değişir. Filtre sayfaları bilerek "tipe/uzmana göre gez" çiplerini TEKRARLAMAZ (yalnız hub'da görünür):
 * her filtre sayfası kendi konusuna odaklı kalsın, hub'a dönüş linki yeterli.
 */
export async function ExploreView({ locale, filter }: { locale: Locale; filter?: ExploreFilter }) {
  const filterType = filter?.dimension === "type" ? filter.id : undefined;
  const filterExpert = filter?.dimension === "expert" ? filter.id : undefined;
  const [items, stats] = await Promise.all([
    exploreList({ limit: 24, type: filterType, expert: filterExpert }),
    filterStats(filterType ?? null, filterExpert ?? null),
  ]);
  const c = COPY[locale];
  const types = ALL_PROJECT_TYPES.map((t) => ({ id: t.id, name: t.name, icon: t.icon }));
  const experts = EXPERTS.map((e) => ({ id: e.id, name: e.role, icon: e.emoji }));

  return (
    <PublicShell locale={locale}>
      <main className="max-w-[1200px] mx-auto px-4 lg:px-8 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {filter ? (
              <>
                <Link href={lhref("/explore", locale)} className="text-[12px] text-zinc-500 hover:text-lime">
                  {c.seeAll}
                </Link>
                <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
                  {filter.icon} {filter.name}
                </h1>
                <p className="mt-2 text-[12px] text-zinc-500 uppercase tracking-wide">
                  {c.title} · {c.filteredBy[filter.dimension]}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{c.title}</h1>
                <p className="mt-3 text-[15px] text-zinc-400 max-w-[640px] leading-relaxed">{c.subtitle}</p>
              </>
            )}
          </div>
          <Link
            href={lhref("/explore/leaderboard", locale)}
            className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] font-bold text-amber-300 hover:border-amber-400/50 inline-flex items-center gap-2 shrink-0"
          >
            <Trophy className="w-4 h-4" aria-hidden /> {c.leaderboard}
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-zinc-500">
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{c.stat(stats.total)}</span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">
            TR {stats.tr} · EN {stats.en}
          </span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">🍴 {stats.total_forks}</span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">❤️ {stats.total_likes}</span>
        </div>

        {!filter && (
          <div className="mt-6 space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">{c.byType}</p>
              <div className="flex flex-wrap gap-1.5">
                {types.map((t) => (
                  <Link
                    key={t.id}
                    href={lhref(`/explore/type/${t.id}`, locale)}
                    className="h-7 px-2.5 inline-flex items-center gap-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400 hover:border-lime/40 hover:text-lime"
                  >
                    {t.icon} {t.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">{c.byExpert}</p>
              <div className="flex flex-wrap gap-1.5">
                {experts.map((ex) => (
                  <Link
                    key={ex.id}
                    href={lhref(`/explore/expert/${ex.id}`, locale)}
                    className="h-7 px-2.5 inline-flex items-center gap-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400 hover:border-lime/40 hover:text-lime"
                  >
                    {ex.icon} {ex.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <ExploreGrid
            initialItems={items}
            locale={locale}
            types={types}
            experts={experts}
            initialType={filterType ?? ""}
            initialExpert={filterExpert ?? ""}
            emptyText={c.empty}
          />
        </div>
      </main>
    </PublicShell>
  );
}
