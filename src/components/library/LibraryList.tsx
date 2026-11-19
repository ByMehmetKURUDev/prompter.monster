"use client";

import { Check, FolderOpen, History, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProjectSummary } from "@/lib/db";
import { ALL_PROJECT_TYPES } from "@/lib/data";
import { cx } from "@/components/studio/ui";
import { useLocale } from "@/components/site/LocaleProvider";
import { lhref } from "@/lib/i18n";

const COPY = {
  tr: {
    emptyTitle: "Henüz kayıtlı canavar yok",
    emptyText: "Studio'da bir proje üretip \"Kaydet\" deyince burada görünür.",
    goStudio: "Studio'ya git",
    versions: (n: number) => `${n} versiyon`,
    open: "Aç",
    confirm: "Evet, sil",
    cancel: "Vazgeç",
    del: "Sil",
    share: "Takımla paylaş",
    shared: "Takımda",
    shareTitle: (team: string) => `"${team}" takımının kütüphanesine ekle — üyeler görür ve kendi kopyasını açabilir`,
    unshareTitle: (team: string) => `"${team}" takım kütüphanesinden kaldır`,
    shareFailed: "Takım paylaşımı değiştirilemedi.",
  },
  en: {
    emptyTitle: "No saved monsters yet",
    emptyText: "Generate a project in the Studio and hit \"Save\" — it will show up here.",
    goStudio: "Go to the Studio",
    versions: (n: number) => `${n} ${n === 1 ? "version" : "versions"}`,
    open: "Open",
    confirm: "Yes, delete",
    cancel: "Cancel",
    del: "Delete",
    share: "Share with team",
    shared: "In team",
    shareTitle: (team: string) => `Add to the "${team}" team library — members can see it and open their own copy`,
    unshareTitle: (team: string) => `Remove from the "${team}" team library`,
    shareFailed: "Couldn't change team sharing.",
  },
} as const;

export interface LibraryTeam {
  name: string;
  active: boolean;
  /** The team library RPCs exist (migration 0020 applied). */
  ready: boolean;
}

export function LibraryList({ initial, team = null, sharedIds = [] }: { initial: ProjectSummary[]; team?: LibraryTeam | null; sharedIds?: string[] }) {
  const locale = useLocale();
  const c = COPY[locale];
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [shared, setShared] = useState<Set<string>>(() => new Set(sharedIds));
  const [shareBusy, setShareBusy] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const canShare = Boolean(team?.active && team.ready);

  const toggleShare = async (id: string) => {
    const next = !shared.has(id);
    setShareBusy(id);
    setShareError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pm-locale": locale },
        body: JSON.stringify({ action: "share", projectId: id, share: next }),
      });
      const j = (await res.json().catch(() => ({}))) as { shared?: boolean; error?: string };
      if (!res.ok) throw new Error(j.error || c.shareFailed);
      setShared((prev) => {
        const s = new Set(prev);
        if (j.shared) s.add(id);
        else s.delete(id);
        return s;
      });
      router.refresh(); // re-renders the server-side team library section below
    } catch (e) {
      setShareError(e instanceof Error ? e.message : c.shareFailed);
    } finally {
      setShareBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id));
        if (shared.has(id)) router.refresh(); // a shared project also leaves the team library (FK cascade)
      }
    } finally {
      setBusy(null);
      setConfirmId(null);
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-2xl bg-ink-800 border border-ink-600 p-10 text-center">
        <div className="text-4xl mb-3">👹</div>
        <div className="text-[14px] font-bold">{c.emptyTitle}</div>
        <p className="text-[12px] text-zinc-500 mt-1">{c.emptyText}</p>
        <Link href={lhref("/studio", locale)} className="inline-flex mt-5 h-10 px-4 rounded-lg bg-lime text-black text-[13px] font-bold items-center">
          {c.goStudio}
        </Link>
      </div>
    );
  }

  return (
    <>
    {shareError && (
      <div role="alert" className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
        {shareError}
      </div>
    )}
    <div className="grid md:grid-cols-2 gap-3">
      {items.map((p) => {
        const type = ALL_PROJECT_TYPES.find((t) => t.id === p.project_type);
        const isShared = shared.has(p.id);
        return (
          <div key={p.id} className="rounded-2xl bg-ink-800 border border-ink-600 p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink-950 border border-ink-600 grid place-items-center text-lg">{type?.icon ?? "👹"}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold truncate">{p.name}</div>
                <div className="text-[11px] text-zinc-500">
                  {type?.name ?? p.project_type} • {new Date(p.updated_at).toLocaleString(locale === "en" ? "en-US" : "tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-ink-950 border border-ink-600 text-zinc-400 flex items-center gap-1 shrink-0">
                <History className="w-3 h-3" aria-hidden /> {c.versions(p.versions)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`${lhref("/studio", locale)}?project=${p.id}${p.latest_version ? `&version=${p.latest_version}` : ""}`}
                className="h-9 px-3 rounded-lg bg-white text-black text-[12px] font-bold flex items-center gap-1.5"
              >
                <FolderOpen className="w-3.5 h-3.5" aria-hidden /> {c.open}
              </Link>
              {canShare && team && (
                <button
                  type="button"
                  onClick={() => toggleShare(p.id)}
                  disabled={shareBusy === p.id}
                  aria-pressed={isShared}
                  title={isShared ? c.unshareTitle(team.name) : c.shareTitle(team.name)}
                  className={cx(
                    "h-9 px-3 rounded-lg border text-[12px] font-semibold flex items-center gap-1.5 disabled:opacity-60",
                    isShared ? "bg-violet/15 border-violet/50 text-white" : "bg-ink-950 border-ink-600 text-zinc-300 hover:border-ink-400",
                  )}
                >
                  {isShared ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Users className="w-3.5 h-3.5" aria-hidden />}
                  {isShared ? c.shared : c.share}
                </button>
              )}
              {confirmId === p.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    disabled={busy === p.id}
                    className="h-9 px-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[12px] font-semibold disabled:opacity-60"
                  >
                    {c.confirm}
                  </button>
                  <button type="button" onClick={() => setConfirmId(null)} className="h-9 px-3 rounded-lg bg-ink-950 border border-ink-600 text-[12px]">
                    {c.cancel}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(p.id)}
                  className={cx("ml-auto h-9 px-3 rounded-lg bg-ink-950 border border-ink-600 text-[12px] text-zinc-400 hover:text-red-300 flex items-center gap-1.5")}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden /> {c.del}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
