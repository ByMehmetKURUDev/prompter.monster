"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, GitFork, Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ExploreItem, ExploreSort } from "@/lib/explore";

const LABELS = {
  tr: { all: "Tümü", lang: "Dil", type: "Tip", new: "Yeni", popular: "Popüler", forked: "Çok çatallanan", more: "Daha fazla yükle", loading: "Yükleniyor…", experts: (n: number) => `${n} uzman` },
  en: { all: "All", lang: "Language", type: "Type", new: "Newest", popular: "Popular", forked: "Most forked", more: "Load more", loading: "Loading…", experts: (n: number) => `${n} experts` },
} as const;

const PAGE_SIZE = 24;

export function ExploreGrid({
  initialItems,
  locale,
  types,
  emptyText,
}: {
  initialItems: ExploreItem[];
  locale: Locale;
  types: { id: string; name: string; icon: string }[];
  emptyText: string;
}) {
  const l = LABELS[locale];
  const [items, setItems] = useState(initialItems);
  const [lang, setLang] = useState<"" | "TR" | "EN">("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState<ExploreSort>("new");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(initialItems.length < PAGE_SIZE);

  function query(extra: Record<string, string>) {
    const qs = new URLSearchParams();
    const nextLang = extra.lang ?? lang;
    const nextType = extra.type ?? type;
    const nextSort = extra.sort ?? sort;
    if (nextLang) qs.set("lang", nextLang);
    if (nextType) qs.set("type", nextType);
    qs.set("sort", nextSort);
    if (extra.offset) qs.set("offset", extra.offset);
    return qs;
  }

  function refetch(extra: Record<string, string> = {}) {
    startTransition(async () => {
      const r = await fetch(`/api/explore?${query(extra).toString()}`);
      const data = (await r.json().catch(() => [])) as ExploreItem[];
      setItems(data);
      setDone(data.length < PAGE_SIZE);
    });
  }

  function loadMore() {
    startTransition(async () => {
      const r = await fetch(`/api/explore?${query({ offset: String(items.length) }).toString()}`);
      const data = (await r.json().catch(() => [])) as ExploreItem[];
      setItems((prev) => [...prev, ...data]);
      setDone(data.length < PAGE_SIZE);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select
          value={lang}
          onChange={(e) => {
            const v = e.target.value as "" | "TR" | "EN";
            setLang(v);
            refetch({ lang: v });
          }}
          className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[13px]"
        >
          <option value="">
            {l.lang}: {l.all}
          </option>
          <option value="TR">TR</option>
          <option value="EN">EN</option>
        </select>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            refetch({ type: e.target.value });
          }}
          className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[13px] max-w-[220px]"
        >
          <option value="">
            {l.type}: {l.all}
          </option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.icon} {t.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1 ml-auto">
          {(["new", "popular", "forked"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSort(s);
                refetch({ sort: s });
              }}
              className={`h-9 px-3 rounded-lg text-[13px] border ${
                sort === s ? "bg-lime text-black border-lime font-bold" : "bg-ink-800 border-ink-600 text-zinc-300"
              }`}
            >
              {l[s]}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-[14px] text-zinc-500 py-12 text-center max-w-[480px] mx-auto">{emptyText}</p>
      ) : (
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
                <span className="ml-auto">{l.experts(it.experts.length)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

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
