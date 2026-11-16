"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Star, Trash2 } from "lucide-react";

export function ShareAdminActions({ slug, featured, hidden }: { slug: string; featured: boolean; hidden: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"star" | "hide" | "remove" | null>(null);

  async function patch(body: Record<string, boolean>, key: "star" | "hide") {
    setBusy(key);
    try {
      const r = await fetch(`/api/admin/shares/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(`/p/${slug} kaldırılsın mı? Bağlantı 404 döner.`)) return;
    setBusy("remove");
    try {
      const r = await fetch(`/api/admin/shares/${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => patch({ featured: !featured }, "star")}
        title={featured ? "Öne çıkarmayı kaldır" : "Galeride öne çıkar"}
        className={`w-8 h-8 rounded-lg border grid place-items-center disabled:opacity-50 ${
          featured ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-ink-800 border-ink-600 text-zinc-400 hover:text-amber-300"
        }`}
      >
        {busy === "star" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Star className="w-4 h-4" aria-hidden />}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => patch({ hidden: !hidden }, "hide")}
        title={hidden ? "Galeride tekrar göster" : "Galeriden gizle"}
        className={`w-8 h-8 rounded-lg border grid place-items-center disabled:opacity-50 ${
          hidden ? "bg-red-500/15 border-red-500/40 text-red-300" : "bg-ink-800 border-ink-600 text-zinc-400 hover:text-white"
        }`}
      >
        {busy === "hide" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : hidden ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={remove}
        className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-600 grid place-items-center hover:border-red-500/50 text-zinc-400 hover:text-red-400 disabled:opacity-50"
        aria-label="Kaldır"
      >
        {busy === "remove" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Trash2 className="w-4 h-4" aria-hidden />}
      </button>
    </div>
  );
}
