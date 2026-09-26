"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function ShareAdminActions({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm(`/p/${slug} kaldırılsın mı? Bağlantı 404 döner.`)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/shares/${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" disabled={busy} onClick={remove} className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-600 grid place-items-center hover:border-red-500/50 text-zinc-400 hover:text-red-400 disabled:opacity-50" aria-label="Kaldır">
      <Trash2 className="w-4 h-4" aria-hidden />
    </button>
  );
}
