"use client";

import { FolderOpen, History, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ProjectSummary } from "@/lib/db";
import { ALL_PROJECT_TYPES } from "@/lib/data";
import { cx } from "@/components/studio/ui";

export function LibraryList({ initial }: { initial: ProjectSummary[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const remove = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setBusy(null);
      setConfirmId(null);
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-2xl bg-ink-800 border border-ink-600 p-10 text-center">
        <div className="text-4xl mb-3">👹</div>
        <div className="text-[14px] font-bold">Henüz kayıtlı canavar yok</div>
        <p className="text-[12px] text-zinc-500 mt-1">Studio&apos;da bir proje üretip &quot;Kaydet&quot; deyince burada görünür.</p>
        <Link href="/studio" className="inline-flex mt-5 h-10 px-4 rounded-lg bg-lime text-black text-[13px] font-bold items-center">
          Studio&apos;ya git
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {items.map((p) => {
        const type = ALL_PROJECT_TYPES.find((t) => t.id === p.project_type);
        return (
          <div key={p.id} className="rounded-2xl bg-ink-800 border border-ink-600 p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink-950 border border-ink-600 grid place-items-center text-lg">{type?.icon ?? "👹"}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold truncate">{p.name}</div>
                <div className="text-[11px] text-zinc-500">
                  {type?.name ?? p.project_type} • {new Date(p.updated_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-ink-950 border border-ink-600 text-zinc-400 flex items-center gap-1 shrink-0">
                <History className="w-3 h-3" aria-hidden /> {p.versions} versiyon
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/studio?project=${p.id}${p.latest_version ? `&version=${p.latest_version}` : ""}`}
                className="h-9 px-3 rounded-lg bg-white text-black text-[12px] font-bold flex items-center gap-1.5"
              >
                <FolderOpen className="w-3.5 h-3.5" aria-hidden /> Aç
              </Link>
              {confirmId === p.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    disabled={busy === p.id}
                    className="h-9 px-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[12px] font-semibold disabled:opacity-60"
                  >
                    Evet, sil
                  </button>
                  <button type="button" onClick={() => setConfirmId(null)} className="h-9 px-3 rounded-lg bg-ink-950 border border-ink-600 text-[12px]">
                    Vazgeç
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(p.id)}
                  className={cx("ml-auto h-9 px-3 rounded-lg bg-ink-950 border border-ink-600 text-[12px] text-zinc-400 hover:text-red-300 flex items-center gap-1.5")}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden /> Sil
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
