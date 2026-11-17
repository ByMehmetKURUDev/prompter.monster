"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, GitFork, Heart, Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ExploreItem } from "@/lib/explore";

const LABELS = {
  tr: { more: "Daha fazla yükle", loading: "Yükleniyor…", experts: (n: number) => `${n} uzman` },
  en: { more: "Load more", loading: "Loading…", experts: (n: number) => `${n} experts` },
} as const;

const PAGE_SIZE = 24;

/** Bir canavarın profil sayfasındaki paylaşım listesi — ExploreGrid'in sade/salt-okunur hali (filtre/beğeni yok, v1 kapsamı). */
export function ProfileShareGrid({ username, initialItems, locale }: { username: string; initialItems: ExploreItem[]; locale: Locale }) {
  const l = LABELS[locale];
  const [items, setItems] = useState(initialItems);
  const [done, setDone] = useState(initialItems.length < PAGE_SIZE);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const r = await fetch(`/api/u/${encodeURIComponent(username)}/shares?offset=${items.length}`);
      const data = (await r.json().catch(() => [])) as ExploreItem[];
      setItems((prev) => [...prev, ...data]);
      setDone(data.length < PAGE_SIZE);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <Link
            key={it.slug}
            href={`/p/${it.slug}`}
            className="group rounded-2xl bg-ink-900 border border-ink-600 p-5 hover:border-lime/40 transition flex flex-col"
          >
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mb-2">
              <span className="px-2 h-6 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{it.lang}</span>
              <span className="px-2 h-6 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{it.format}</span>
              {it.featured && (
                <span className="px-2 h-6 inline-flex items-center rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">★</span>
              )}
            </div>
            <h3 className="font-bold text-[15px] leading-snug group-hover:text-lime line-clamp-1">{it.name || "—"}</h3>
            {it.pitch && <p className="mt-1.5 text-[13px] text-zinc-400 line-clamp-2 leading-relaxed">{it.pitch}</p>}
            <div className="mt-auto pt-4 flex items-center gap-3 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3" aria-hidden /> {it.views}
              </span>
              <span className="inline-flex items-center gap-1">
                <GitFork className="w-3 h-3" aria-hidden /> {it.forks}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3 h-3" aria-hidden /> {it.likes}
              </span>
              <span className="ml-auto">{l.experts(it.experts.length)}</span>
            </div>
          </Link>
        ))}
      </div>

      {!done && items.length > 0 && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="h-10 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[13px] inline-flex items-center gap-2 disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null} {pending ? l.loading : l.more}
          </button>
        </div>
      )}
    </div>
  );
}
