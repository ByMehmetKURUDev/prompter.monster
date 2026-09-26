"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Spinner, cx } from "@/components/studio/ui";
import { useLocale } from "@/components/site/LocaleProvider";
import { lhref } from "@/lib/i18n";

const COPY = {
  tr: {
    notConfigured: "Hesap sistemi bu ortamda yapılandırılmamış.",
    short: "Şifre en az 8 karakter olmalı.",
    mismatch: "Şifreler birbiriyle eşleşmiyor.",
    ok: "Şifren güncellendi. Studio'ya yönlendiriliyorsun…",
    same: "Yeni şifre eskisiyle aynı olamaz.",
    session: "Oturum bulunamadı. Sıfırlama bağlantısını yeniden isteyin.",
    newPw: "YENİ ŞİFRE",
    newPwPh: "En az 8 karakter",
    again: "YENİ ŞİFRE (TEKRAR)",
    againPh: "Aynı şifreyi tekrar yaz",
    save: "Şifreyi kaydet",
  },
  en: {
    notConfigured: "Accounts are not configured in this environment.",
    short: "The password must be at least 8 characters.",
    mismatch: "The passwords don't match.",
    ok: "Password updated. Taking you to the Studio…",
    same: "The new password can't be the same as the old one.",
    session: "No session found. Please request a new reset link.",
    newPw: "NEW PASSWORD",
    newPwPh: "At least 8 characters",
    again: "NEW PASSWORD (AGAIN)",
    againPh: "Type the same password again",
    save: "Save password",
  },
} as const;

/** Set a new password for the signed-in user (reached from the reset e-mail or the account menu). */
export function PasswordForm({ next }: { next?: string }) {
  const locale = useLocale();
  const c = COPY[locale];
  const target = next ?? lhref("/studio", locale);
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  if (!supabaseConfigured()) return <p className="text-[13px] text-zinc-400">{c.notConfigured}</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return setMsg({ kind: "err", text: c.short });
    if (password !== again) return setMsg({ kind: "err", text: c.mismatch });
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      setMsg({ kind: "ok", text: c.ok });
      window.setTimeout(() => window.location.assign(target), 900);
    } catch (err) {
      const m = (err as Error).message.toLowerCase();
      setMsg({
        kind: "err",
        text: m.includes("same password")
          ? c.same
          : m.includes("session") || m.includes("not logged in")
            ? c.session
            : (err as Error).message,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold tracking-widest text-zinc-400">{c.newPw}</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-11 rounded-xl bg-ink-950 border border-ink-600 px-4 text-[14px] focus:border-ink-400 focus:outline-none"
          placeholder={c.newPwPh}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold tracking-widest text-zinc-400">{c.again}</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          className="w-full h-11 rounded-xl bg-ink-950 border border-ink-600 px-4 text-[14px] focus:border-ink-400 focus:outline-none"
          placeholder={c.againPh}
        />
      </label>
      {msg && (
        <div
          role="status"
          className={cx("rounded-lg px-3 py-2 text-[12px] border", msg.kind === "ok" ? "bg-lime/10 border-lime/30 text-lime" : "bg-red-500/10 border-red-500/30 text-red-300")}
        >
          {msg.text}
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full h-11 rounded-xl bg-gradient-to-r from-lime to-violet text-black font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {busy ? <Spinner className="w-4 h-4" /> : <KeyRound className="w-4 h-4" aria-hidden />} {c.save}
      </button>
    </form>
  );
}
