"use client";

import { Bell, Check, Crown, ExternalLink } from "lucide-react";
import { track } from "@/lib/track";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MeResponse } from "@/lib/db";
import { Spinner, cx } from "@/components/studio/ui";

type Plan = "monthly" | "yearly";

/**
 * Pro plan call-to-action.
 * - payment provider wired  → "Pro'ya geç" opens the hosted checkout (monthly / yearly)
 * - not wired yet           → "Pro açılınca haber ver" records interest on the profile
 */
export function ProCta({ className, next = "/pricing" }: { className?: string; next?: string }) {
  const [me, setMe] = useState<MeResponse | null | undefined>(undefined);
  const [busy, setBusy] = useState<Plan | "interest" | null>(null);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setMe(j as MeResponse | null))
      .catch(() => setMe(null));
  }, []);

  const base = cx("h-11 px-5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition", className);

  if (me === undefined) {
    return (
      <div className={cx(base, "bg-ink-800 border border-ink-600 text-zinc-500")}>
        <Spinner className="w-4 h-4" />
      </div>
    );
  }

  const billing = Boolean(me?.billing);

  if (!me?.user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(next)}`} className={cx(base, "bg-white text-black hover:bg-zinc-200")}>
        <Crown className="w-4 h-4" aria-hidden /> {billing ? "Giriş yap ve Pro'ya geç" : "Giriş yap, Pro açılınca haber al"}
      </Link>
    );
  }

  if (me.plan === "pro") {
    return (
      <div className="space-y-2">
        <div className={cx(base, "bg-lime/15 border border-lime/40 text-lime")}>
          <Check className="w-4 h-4" aria-hidden /> Planın: Monster Pro
        </div>
        {billing && (
          <a href="/api/billing/portal" className="block text-center text-[12px] text-zinc-400 hover:text-white underline">
            Aboneliği yönet (fatura, kart, iptal)
          </a>
        )}
      </div>
    );
  }

  const checkout = async (plan: Plan) => {
    setBusy(plan);
    setErr(null);
    try {
      const r = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!r.ok || !j.url) throw new Error(j.error ?? "Ödeme sayfası açılamadı.");
      track("begin_checkout", { plan, value: plan === "yearly" ? 290 : 29, currency: "USD" });
      window.location.assign(j.url);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };

  if (billing) {
    return (
      <div className="space-y-2">
        <button type="button" disabled={busy !== null} onClick={() => checkout("monthly")} className={cx(base, "w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-60")}>
          {busy === "monthly" ? <Spinner className="w-4 h-4" /> : <Crown className="w-4 h-4" aria-hidden />} Pro&apos;ya geç — $29/ay
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => checkout("yearly")}
          className={cx(base, "w-full bg-ink-950 border border-lime/40 text-lime hover:bg-ink-900 disabled:opacity-60")}
        >
          {busy === "yearly" ? <Spinner className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" aria-hidden />} Yıllık — $290 (2 ay bedava)
        </button>
        <p className="text-[11px] text-zinc-500 text-center">Ödeme Lemon Squeezy güvencesiyle; kart bilgin bize ulaşmaz. İstediğin an iptal.</p>
        {err && <p className="text-[12px] text-red-300">{err}</p>}
      </div>
    );
  }

  if (done) {
    return (
      <div className={cx(base, "bg-lime/15 border border-lime/40 text-lime")}>
        <Check className="w-4 h-4" aria-hidden /> Listedesin — lansmanda ilk sen öğreneceksin
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={async () => {
          setBusy("interest");
          setErr(null);
          try {
            const r = await fetch("/api/billing/interest", { method: "POST" });
            if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Kaydedilemedi.");
            setDone(true);
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(null);
          }
        }}
        className={cx(base, "w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-60")}
      >
        {busy === "interest" ? <Spinner className="w-4 h-4" /> : <Bell className="w-4 h-4" aria-hidden />} Pro açılınca haber ver
      </button>
      {err && <p className="text-[12px] text-red-300">{err}</p>}
    </div>
  );
}
