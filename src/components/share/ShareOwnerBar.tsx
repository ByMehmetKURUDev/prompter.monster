"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const COPY = {
  tr: {
    listedOn: "Galeride görünüyor",
    listedOff: "Galeride görünmüyor",
    show: "Galeride göster",
    hide: "Galeriden kaldır",
    remove: "Paylaşımı sil",
    removeConfirm: "Bu paylaşım bağlantısı tamamen silinsin mi? Bağlantı 404 döner; projen silinmez.",
    notReady: "Galeri henüz açılmadı, az sonra tekrar deneyin.",
  },
  en: {
    listedOn: "Visible in Explore",
    listedOff: "Not in Explore",
    show: "Show in Explore",
    hide: "Remove from Explore",
    remove: "Delete share",
    removeConfirm: "Delete this share link entirely? The link will 404; your project stays.",
    notReady: "Gallery isn't live yet, try again shortly.",
  },
} as const;

export function ShareOwnerBar({ slug, listed: initialListed, locale }: { slug: string; listed: boolean; locale: Locale }) {
  const c = COPY[locale];
  const router = useRouter();
  const [listed, setListed] = useState(initialListed);
  const [busy, setBusy] = useState<"toggle" | "remove" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    setBusy("toggle");
    setErr(null);
    try {
      const r = await fetch(`/api/share/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listed: !listed }),
      });
      const body = (await r.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!r.ok) {
        setErr(body.code === "not_ready" ? c.notReady : body.error || `HTTP ${r.status}`);
        return;
      }
      setListed(!listed);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(c.removeConfirm)) return;
    setBusy("remove");
    setErr(null);
    try {
      const r = await fetch(`/api/share?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.push(locale === "en" ? "/en/account" : "/account");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
      setBusy(null);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-violet/30 bg-violet/5 p-4 flex flex-wrap items-center gap-3">
      <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${listed ? "text-lime" : "text-zinc-500"}`}>
        {listed ? <Check className="w-3.5 h-3.5" aria-hidden /> : <EyeOff className="w-3.5 h-3.5" aria-hidden />}
        {listed ? c.listedOn : c.listedOff}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={busy !== null}
        className="h-9 px-3.5 rounded-lg bg-ink-800 border border-ink-600 text-[12.5px] text-zinc-200 hover:text-white flex items-center gap-1.5 disabled:opacity-50"
      >
        {busy === "toggle" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
        ) : listed ? (
          <EyeOff className="w-3.5 h-3.5" aria-hidden />
        ) : (
          <Eye className="w-3.5 h-3.5" aria-hidden />
        )}
        {listed ? c.hide : c.show}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy !== null}
        className="h-9 px-3.5 rounded-lg bg-ink-800 border border-ink-600 text-[12.5px] text-zinc-400 hover:text-red-400 hover:border-red-500/40 flex items-center gap-1.5 disabled:opacity-50 ml-auto"
      >
        {busy === "remove" ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Trash2 className="w-3.5 h-3.5" aria-hidden />}
        {c.remove}
      </button>
      {err && <p className="w-full text-[12px] text-red-400">{err}</p>}
    </div>
  );
}
