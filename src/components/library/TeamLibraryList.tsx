"use client";

import { Copy, FolderOpen, History, Users } from "lucide-react";
import Link from "next/link";
import { ALL_PROJECT_TYPES } from "@/lib/data";
import { lhref } from "@/lib/i18n";
import type { TeamLibraryItem } from "@/lib/team";
import { useLocale } from "@/components/site/LocaleProvider";

const COPY = {
  tr: {
    title: "Takım kütüphanesi",
    text: (team: string) => `"${team}" üyelerinin paylaştığı projeler. Kopyasını açınca Studio'da senin projen olarak başlar; orijinali değişmez.`,
    empty: "Henüz paylaşılan proje yok. Yukarıdaki projelerinden birinde \"Takımla paylaş\"a bas.",
    by: (u: string | null) => (u ? `@${u}` : "takım üyesi"),
    you: "sen",
    versions: (n: number) => `${n} versiyon`,
    copy: "Kopyasını aç",
    open: "Aç",
  },
  en: {
    title: "Team library",
    text: (team: string) => `Projects shared by "${team}" members. Opening a copy starts it in the Studio as your own project; the original stays as it is.`,
    empty: "Nothing shared yet. Hit \"Share with team\" on one of your projects above.",
    by: (u: string | null) => (u ? `@${u}` : "a teammate"),
    you: "you",
    versions: (n: number) => `${n} ${n === 1 ? "version" : "versions"}`,
    copy: "Open a copy",
    open: "Open",
  },
} as const;

/** Team library (0020): projects shared with the signed-in user's active team, newest first. */
export function TeamLibraryList({ teamName, items }: { teamName: string; items: TeamLibraryItem[] }) {
  const locale = useLocale();
  const c = COPY[locale];
  const studio = lhref("/studio", locale);

  return (
    <section id="team-library" aria-labelledby="team-library-title" className="mt-10 scroll-mt-20">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-violet-400" aria-hidden />
        <h2 id="team-library-title" className="text-lg font-bold tracking-tight">
          {c.title}
        </h2>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-ink-800 border border-ink-600 text-zinc-400 tabular-nums">{items.length}</span>
      </div>
      <p className="text-[13px] text-zinc-500 mb-4">{c.text(teamName)}</p>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-ink-800 border border-dashed border-ink-600 p-6 text-center text-[12.5px] text-zinc-500">{c.empty}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((p) => {
            const type = ALL_PROJECT_TYPES.find((t) => t.id === p.project_type);
            const href = p.is_mine
              ? `${studio}?project=${p.project_id}${p.latest_version ? `&version=${p.latest_version}` : ""}`
              : `${studio}?teamProject=${p.project_id}`;
            return (
              <div key={p.project_id} className="rounded-2xl bg-ink-800 border border-ink-600 p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ink-950 border border-ink-600 grid place-items-center text-lg">{type?.icon ?? "👹"}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold truncate">{p.name}</div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {p.is_mine ? c.you : c.by(p.owner_username)} • {type?.name ?? p.project_type} •{" "}
                      {new Date(p.updated_at).toLocaleDateString(locale === "en" ? "en-US" : "tr-TR", { dateStyle: "medium" })}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-ink-950 border border-ink-600 text-zinc-400 flex items-center gap-1 shrink-0">
                    <History className="w-3 h-3" aria-hidden /> {c.versions(p.versions)}
                  </span>
                </div>
                <div>
                  <Link href={href} className="inline-flex h-9 px-3 rounded-lg bg-white text-black text-[12px] font-bold items-center gap-1.5">
                    {p.is_mine ? <FolderOpen className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
                    {p.is_mine ? c.open : c.copy}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
