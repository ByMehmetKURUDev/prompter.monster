"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

/** my_email_prefs() (migration 0023). */
export interface EmailPrefs {
  opt_out: boolean;
  opt_out_at?: string | null;
  locale: "tr" | "en" | null;
  sent: { kind: string; status: string; at: string }[];
}

const COPY = {
  tr: {
    title: "E-posta",
    toggle: "Karşılama ve başlangıç hatırlatması",
    hint: "Hesabını açtığında bir karşılama e-postası; henüz proje kaydetmediysen birkaç gün içinde tek bir hatırlatma. Kampanya ya da pazarlama e-postası göndermiyoruz. Giriş, şifre sıfırlama ve ödeme e-postaları bu ayardan etkilenmez.",
    lang: "E-posta dili",
    saved: "Kaydedildi.",
    failed: "Kaydedilemedi, tekrar dene.",
    history: "Gönderilenler",
    kinds: { welcome: "Karşılama", nudge: "Başlangıç hatırlatması" } as Record<string, string>,
    status: { pending: "sırada", failed: "gönderilemedi" } as Record<string, string>,
  },
  en: {
    title: "E-mail",
    toggle: "Welcome and getting-started reminder",
    hint: "A welcome e-mail when you open your account and, if you haven't saved a project yet, a single reminder a few days later. We don't send promotions or marketing e-mail. Sign-in, password reset and billing e-mails aren't affected by this setting.",
    lang: "E-mail language",
    saved: "Saved.",
    failed: "Couldn't save, please try again.",
    history: "Sent so far",
    kinds: { welcome: "Welcome", nudge: "Getting-started reminder" } as Record<string, string>,
    status: { pending: "queued", failed: "couldn't be delivered" } as Record<string, string>,
  },
} as const;

export function EmailPrefsPanel({ locale, initial }: { locale: Locale; initial: EmailPrefs }) {
  const c = COPY[locale];
  const [prefs, setPrefs] = useState<EmailPrefs>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (patch: { optOut?: boolean; locale?: "tr" | "en" }) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/account/email-prefs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const j = (await r.json().catch(() => ({}))) as { prefs?: EmailPrefs };
      if (!r.ok || !j.prefs) throw new Error("failed");
      setPrefs(j.prefs);
      setMsg({ ok: true, text: c.saved });
    } catch {
      setMsg({ ok: false, text: c.failed });
    } finally {
      setBusy(false);
    }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const emailLocale = prefs.locale ?? locale;

  return (
    <section className="rounded-2xl bg-ink-800 border border-ink-600 p-5" aria-labelledby="email-prefs-title">
      <h2 id="email-prefs-title" className="text-[11px] tracking-widest text-zinc-500 font-semibold mb-3">
        {c.title.toUpperCase()}
      </h2>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!prefs.opt_out}
          disabled={busy}
          onChange={(e) => save({ optOut: !e.target.checked })}
          className="mt-0.5 w-4 h-4 accent-lime shrink-0"
        />
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold">{c.toggle}</span>
          <span className="block mt-1 text-[12.5px] text-zinc-400 leading-relaxed">{c.hint}</span>
        </span>
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px]">
        <label htmlFor="email-locale" className="text-zinc-400">
          {c.lang}
        </label>
        <select
          id="email-locale"
          value={emailLocale}
          disabled={busy}
          onChange={(e) => save({ locale: e.target.value === "en" ? "en" : "tr" })}
          className="h-9 px-2 rounded-lg bg-ink-950 border border-ink-600 text-[13px]"
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
        {msg && (
          <span role="status" className={msg.ok ? "text-lime text-[12px]" : "text-red-400 text-[12px]"}>
            {msg.text}
          </span>
        )}
      </div>
      {prefs.sent.length > 0 && (
        <p className="mt-4 text-[12px] text-zinc-500">
          {c.history}:{" "}
          {prefs.sent
            .map((s) => `${c.kinds[s.kind] ?? s.kind} — ${s.status === "sent" ? fmt(s.at) : (c.status[s.status] ?? s.status)}`)
            .join(" · ")}
        </p>
      )}
    </section>
  );
}
