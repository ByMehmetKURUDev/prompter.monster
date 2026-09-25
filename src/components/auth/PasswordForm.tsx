"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Spinner, cx } from "@/components/studio/ui";

/** Set a new password for the signed-in user (reached from the reset e-mail or the account menu). */
export function PasswordForm({ next = "/studio" }: { next?: string }) {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  if (!supabaseConfigured()) return <p className="text-[13px] text-zinc-400">Hesap sistemi bu ortamda yapılandırılmamış.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return setMsg({ kind: "err", text: "Şifre en az 8 karakter olmalı." });
    if (password !== again) return setMsg({ kind: "err", text: "Şifreler birbiriyle eşleşmiyor." });
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      setMsg({ kind: "ok", text: "Şifren güncellendi. Studio'ya yönlendiriliyorsun…" });
      window.setTimeout(() => window.location.assign(next), 900);
    } catch (err) {
      const m = (err as Error).message.toLowerCase();
      setMsg({
        kind: "err",
        text: m.includes("same password")
          ? "Yeni şifre eskisiyle aynı olamaz."
          : m.includes("session") || m.includes("not logged in")
            ? "Oturum bulunamadı. Sıfırlama bağlantısını yeniden isteyin."
            : (err as Error).message,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold tracking-widest text-zinc-400">YENİ ŞİFRE</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-11 rounded-xl bg-ink-950 border border-ink-600 px-4 text-[14px] focus:border-ink-400 focus:outline-none"
          placeholder="En az 8 karakter"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold tracking-widest text-zinc-400">YENİ ŞİFRE (TEKRAR)</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          className="w-full h-11 rounded-xl bg-ink-950 border border-ink-600 px-4 text-[14px] focus:border-ink-400 focus:outline-none"
          placeholder="Aynı şifreyi tekrar yaz"
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
        {busy ? <Spinner className="w-4 h-4" /> : <KeyRound className="w-4 h-4" aria-hidden />} Şifreyi kaydet
      </button>
    </form>
  );
}
