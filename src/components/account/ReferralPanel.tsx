"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Users } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const COPY = {
  tr: {
    title: "Arkadaşını getir",
    desc: (n: number) => `Arkadaşın linkle gelip ilk AI eylemini (iyileştir/öner) kullandığında ikiniz de +${n} bonus AI kredisi kazanır.`,
    copy: "Kopyala",
    copied: "Kopyalandı",
    invited: (n: number) => `${n} kayıt`,
    confirmed: (n: number) => `${n} aktif`,
    bonus: (n: number) => `+${n} bonus kredi`,
  },
  en: {
    title: "Refer a friend",
    desc: (n: number) => `When a friend follows your link and uses their first AI action (refine/suggest), you both get +${n} bonus AI credits.`,
    copy: "Copy",
    copied: "Copied",
    invited: (n: number) => `${n} signed up`,
    confirmed: (n: number) => `${n} active`,
    bonus: (n: number) => `+${n} bonus credits`,
  },
} as const;

const FALLBACK_ORIGIN = "https://prompter.monster";

/** Hesap sayfasında referral linki + istatistik — UsernameEditor'ın busy/copy desenine yakın. */
export function ReferralPanel({
  locale,
  username,
  invitedSignups,
  invitedConfirmed,
  bonusCredits,
  bonusPerReferral,
}: {
  locale: Locale;
  username: string;
  invitedSignups: number;
  invitedConfirmed: number;
  bonusCredits: number;
  bonusPerReferral: number;
}) {
  const c = COPY[locale];
  const [origin, setOrigin] = useState(FALLBACK_ORIGIN);
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/?invite=${username}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (http veya izin yok) — sessizce yoksay */
    }
  }

  return (
    <section className="rounded-2xl bg-ink-800 border border-ink-600 p-5">
      <h2 className="text-[11px] tracking-widest text-zinc-500 font-semibold mb-1 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" aria-hidden /> {c.title.toUpperCase()}
      </h2>
      <p className="text-[12.5px] text-zinc-400 mb-3 max-w-[560px]">{c.desc(bonusPerReferral)}</p>
      <div className="flex items-center gap-1.5">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-lg bg-ink-950 border border-ink-600 px-2.5 text-[12.5px] text-zinc-300"
        />
        <button
          type="button"
          onClick={copy}
          className="h-9 px-3 rounded-lg bg-ink-950 border border-ink-600 text-[12px] font-semibold text-zinc-300 hover:text-white inline-flex items-center gap-1.5 shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-lime" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
          {copied ? c.copied : c.copy}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[12.5px] text-zinc-400">
        <span>{c.invited(invitedSignups)}</span>
        <span>{c.confirmed(invitedConfirmed)}</span>
        {bonusCredits > 0 && <span className="text-lime font-semibold">{c.bonus(bonusCredits)}</span>}
      </div>
    </section>
  );
}
