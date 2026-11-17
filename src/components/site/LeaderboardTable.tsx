"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { GitFork, Heart, Loader2, Share2, Trophy } from "lucide-react";
import { lhref, type Locale } from "@/lib/i18n";
import type { LeaderboardEntry, LeaderboardWindow } from "@/lib/explore";

const LABELS = {
  tr: {
    week: "Bu hafta",
    month: "Bu ay",
    all: "Tüm zamanlar",
    loading: "Yükleniyor…",
    empty: "Bu pencerede henüz beğeni alan bir paylaşım yok.",
    shares: (n: number) => `${n} paylaşım`,
  },
  en: {
    week: "This week",
    month: "This month",
    all: "All time",
    loading: "Loading…",
    empty: "No shares have picked up likes in this window yet.",
    shares: (n: number) => `${n} shared`,
  },
} as const;

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardTable({ initialEntries, locale }: { initialEntries: LeaderboardEntry[]; locale: Locale }) {
  const l = LABELS[locale];
  const [window_, setWindow] = useState<LeaderboardWindow>("all");
  const [entries, setEntries] = useState(initialEntries);
  const [pending, startTransition] = useTransition();

  function select(w: LeaderboardWindow) {
    setWindow(w);
    startTransition(async () => {
      const r = await fetch(`/api/explore/leaderboard?window=${w}&limit=20`);
      const data = (await r.json().catch(() => [])) as LeaderboardEntry[];
      setEntries(data);
    });
  }

  return (
    <div>
      <div className="flex gap-1">
        {(["week", "month", "all"] as const).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => select(w)}
            className={`h-9 px-4 rounded-lg text-[13px] border ${
              window_ === w ? "bg-lime text-black border-lime font-bold" : "bg-ink-800 border-ink-600 text-zinc-300"
            }`}
          >
            {l[w]}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-ink-900 border border-ink-600 overflow-hidden">
        {pending ? (
          <div className="py-16 flex items-center justify-center text-zinc-500 text-[13px] gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> {l.loading}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-zinc-500">{l.empty}</p>
        ) : (
          <ul className="divide-y divide-ink-600">
            {entries.map((e, i) => (
              <li key={e.owner_id} className="flex items-center gap-4 px-5 py-4">
                <span className="w-8 text-center text-[15px] font-bold text-zinc-500 shrink-0">{MEDALS[i] ?? `#${i + 1}`}</span>
                <Link href={lhref(`/u/${e.username}`, locale)} className="font-bold text-[14px] truncate flex-1 hover:text-lime">
                  {e.display_name}
                </Link>
                <span className="text-[12px] text-zinc-500 inline-flex items-center gap-1 shrink-0">
                  <Share2 className="w-3 h-3" aria-hidden /> {l.shares(e.share_count)}
                </span>
                <span className="text-[13px] text-zinc-400 inline-flex items-center gap-1 shrink-0">
                  <GitFork className="w-3.5 h-3.5" aria-hidden /> {e.total_forks}
                </span>
                <span className="text-[13px] font-bold text-rose-400 inline-flex items-center gap-1 shrink-0 w-14 justify-end">
                  <Heart className="w-3.5 h-3.5" fill="currentColor" aria-hidden /> {e.window_likes}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4 text-[11px] text-zinc-600 inline-flex items-center gap-1.5">
        <Trophy className="w-3 h-3" aria-hidden />
        {locale === "tr"
          ? "Sıralama, seçilen pencere içinde alınan beğeni sayısına göre belirlenir."
          : "Ranking is based on likes received within the selected window."}
      </p>
    </div>
  );
}
