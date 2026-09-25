"use client";

import { Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Spinner, cx } from "@/components/studio/ui";

type Mode = "signin" | "signup" | "magic" | "reset";

export function LoginForm({ next, initialError, initialMessage }: { next: string; initialError?: string; initialMessage?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    initialError === "link" ? { kind: "err", text: initialMessage ? translate(initialMessage) : "Bağlantı geçersiz veya süresi dolmuş. Yeniden deneyin." } : null,
  );

  // Implicit-flow links (e.g. magic links sent from the Supabase dashboard) land here with
  // `#access_token=...&refresh_token=...`; turn them into a cookie session and continue.
  useEffect(() => {
    if (!supabaseConfigured()) return;
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    if (!hash) return;
    const p = new URLSearchParams(hash);
    const err = p.get("error_description");
    if (err) {
      setMsg({ kind: "err", text: translate(err) });
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }
    const access_token = p.get("access_token");
    const refresh_token = p.get("refresh_token");
    if (!access_token || !refresh_token) return;
    setBusy(true);
    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          setMsg({ kind: "err", text: translate(error.message) });
          setBusy(false);
        } else window.location.assign(next);
      });
  }, [next]);

  if (!supabaseConfigured()) {
    return <p className="text-[13px] text-zinc-400">Hesap sistemi bu ortamda yapılandırılmamış (NEXT_PUBLIC_SUPABASE_URL eksik).</p>;
  }

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign(next);
        return;
      }
      if (mode === "signup") {
        const { error, data } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
        if (error) throw error;
        if (data.session) {
          window.location.assign(next);
          return;
        }
        setMsg({ kind: "ok", text: "Kayıt alındı. E-postanızdaki doğrulama bağlantısına tıklayın; sonra otomatik giriş yapılır." });
        return;
      }
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/account/password")}`,
        });
        if (error) throw error;
        setMsg({ kind: "ok", text: "Şifre sıfırlama bağlantısı gönderildi. E-postandaki bağlantıya tıklayıp yeni şifreni belirle." });
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
      if (error) throw error;
      setMsg({ kind: "ok", text: "Sihirli bağlantı gönderildi. E-postanızı kontrol edin (spam klasörü dahil)." });
    } catch (err) {
      setMsg({ kind: "err", text: translate((err as Error).message) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime to-violet grid place-items-center text-black text-xl">👹</div>
        <div>
          <h1 className="text-[18px] font-bold">{mode === "signup" ? "Hesap oluştur" : mode === "reset" ? "Şifreni sıfırla" : "Giriş yap"}</h1>
          <p className="text-[12px] text-zinc-500">
            {mode === "reset" ? "E-postana yeni şifre belirleme bağlantısı gönderelim." : "Projelerini kaydet, versiyonları sakla, canavarı her yerden aç."}
          </p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-ink-800 border border-ink-600 mb-4">
        {(
          [
            ["signin", "Giriş"],
            ["signup", "Kayıt"],
            ["magic", "Sihirli bağlantı"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setMsg(null);
            }}
            className={cx("flex-1 h-9 rounded-lg text-[12px] font-semibold transition", mode === m ? "bg-white text-black" : "text-zinc-400 hover:text-white")}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold tracking-widest text-zinc-400">E-POSTA</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 rounded-xl bg-ink-950 border border-ink-600 px-4 text-[14px] focus:border-ink-400 focus:outline-none"
            placeholder="sen@ornek.com"
          />
        </label>
        {mode !== "magic" && mode !== "reset" && (
          <label className="block space-y-1.5">
            <span className="text-[11px] font-semibold tracking-widest text-zinc-400 flex items-center justify-between">
              ŞİFRE
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setMsg(null);
                  }}
                  className="font-medium tracking-normal normal-case text-zinc-500 hover:text-white"
                >
                  Şifremi unuttum
                </button>
              )}
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl bg-ink-950 border border-ink-600 px-4 text-[14px] focus:border-ink-400 focus:outline-none"
              placeholder="En az 8 karakter"
            />
          </label>
        )}

        {msg && (
          <div
            role="status"
            className={cx(
              "rounded-lg px-3 py-2 text-[12px] border",
              msg.kind === "ok" ? "bg-lime/10 border-lime/30 text-lime" : "bg-red-500/10 border-red-500/30 text-red-300",
            )}
          >
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-lime to-violet text-black font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Spinner className="w-4 h-4" /> : mode === "magic" || mode === "reset" ? <Mail className="w-4 h-4" aria-hidden /> : <Sparkles className="w-4 h-4" aria-hidden />}
          {mode === "signin" ? "Giriş yap" : mode === "signup" ? "Hesap oluştur" : mode === "reset" ? "Sıfırlama bağlantısı gönder" : "Bağlantı gönder"}
        </button>
        {mode === "reset" && (
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setMsg(null);
            }}
            className="w-full text-[12px] text-zinc-500 hover:text-white"
          >
            ← Girişe dön
          </button>
        )}
      </form>

      <p className="mt-6 text-[11px] text-zinc-600 leading-relaxed">
        Devam ederek kullanım koşullarını kabul etmiş olursun. Kayıt olmadan da{" "}
        <Link href="/studio" className="text-zinc-400 underline">
          Studio&apos;yu kullanabilirsin
        </Link>
        ; hesap yalnızca kaydetme ve versiyon geçmişi için gerekir.
      </p>
    </div>
  );
}

function translate(m: string): string {
  const s = m.toLowerCase();
  if (s.includes("invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (s.includes("email not confirmed")) return "E-posta henüz doğrulanmamış. Gelen kutunuzdaki bağlantıya tıklayın.";
  if (s.includes("user already registered")) return "Bu e-posta zaten kayıtlı. Giriş sekmesini kullanın.";
  if (s.includes("rate limit") || s.includes("too many")) return "Çok fazla deneme. Birkaç dakika sonra tekrar deneyin.";
  if (s.includes("password should be")) return "Şifre en az 8 karakter olmalı.";
  if (s.includes("invalid or has expired") || s.includes("otp_expired")) return "Bağlantı geçersiz ya da süresi dolmuş. Yeni bir bağlantı isteyin.";
  return m;
}
