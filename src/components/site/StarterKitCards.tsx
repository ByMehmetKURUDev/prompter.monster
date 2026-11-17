/**
 * "Canlı başlangıç kitleri" — Keşfet galerisindeki gerçek, topluluğun beğendiği paylaşımları
 * doğrudan Studio'ya "çatalla" linkiyle sunan kart ızgarası. prompts.chat/Promptmasters analizinden
 * öneri #4 ("otomatik popüler başlangıç kitleri", bkz. claude/prompter-monster-plan.md, 17 Kas).
 * Statik/elle seçilmiş örnekler değil — supabase/migrations/0011_likes_leaderboard.sql'deki
 * explore_list_v2(sort:'liked') RPC'sinden canlı veri (src/lib/explore.ts#exploreList).
 * Kart stili ExploreGrid.tsx'teki paylaşım kartlarıyla kasıtlı olarak aynı (tutarlı görsel dil);
 * hedef linki `/p/[slug]` değil `/studio?fork=[slug]` — buradaki çerçeveleme "görüntüle" değil "bununla başla".
 */
import { GitFork, Heart } from "lucide-react";
import Link from "next/link";
import { ALL_PROJECT_TYPES } from "@/lib/data";
import type { ExploreItem } from "@/lib/explore";
import { lhref, type Locale } from "@/lib/i18n";

export function StarterKitCards({ items, locale }: { items: ExploreItem[]; locale: Locale }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => {
        const type = ALL_PROJECT_TYPES.find((p) => p.id === it.project_type);
        return (
          <Link
            key={it.slug}
            href={lhref(`/studio?fork=${encodeURIComponent(it.slug)}`, locale)}
            className="group rounded-2xl bg-ink-900 border border-ink-600 p-5 hover:border-lime/40 transition flex flex-col"
          >
            <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 mb-2">
              <span className="px-2 h-6 inline-flex items-center gap-1.5 rounded-full bg-ink-800 border border-ink-600">
                <span aria-hidden>{type?.icon ?? "✨"}</span> {type?.name ?? it.project_type}
              </span>
              {it.featured && (
                <span className="px-2 h-6 inline-flex items-center rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">★</span>
              )}
            </div>
            <h3 className="font-bold text-[15px] leading-snug group-hover:text-lime line-clamp-1">{it.name || "—"}</h3>
            {it.pitch && <p className="mt-1.5 text-[13px] text-zinc-400 line-clamp-2 leading-relaxed">{it.pitch}</p>}
            <div className="mt-auto pt-4 flex items-center gap-3 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3 h-3" aria-hidden /> {it.likes}
              </span>
              <span className="inline-flex items-center gap-1">
                <GitFork className="w-3 h-3" aria-hidden /> {it.forks}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
