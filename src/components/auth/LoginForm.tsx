"use client";

import { Mail, Sparkles } from "lucide-react";
import { track } from "@/lib/track";
import { clientSignupSource } from "@/lib/attribution";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Spinner, cx } from "@/components/studio/ui";
import { useLocale } from "@/components/site/LocaleProvider";
import { lhref, type Locale } from "@/lib/i18n";

type Mode = "signin" | "signup" | "magic" | "reset";

const COPY = {
  tr: {
    linkInvalid: "Bağlantı geçersiz veya süresi dolmuş. Yeniden deneyin.",
    notConfigured: "Hesap sistemi bu ortamda yapılandırılmamış (NEXT_PUBLIC_SUPABASE_URL eksik).",
    signupOk: "Kayıt alındı. E-postanızdaki doğrulama bağlantısına tıklayın; sonra otomatik giriş yapılır.",
    resetOk: "Şifre sıfırlama bağlantısı gönderildi. E-postandaki bağlantıya tıklayıp yeni şifreni belirle.",
    magicOk: "Sihirli bağlantı gönderildi. E-postanızı kontrol edin (spam klasörü dahil).",
    titleSignup: "Hesap oluştur",
    titleReset: "Şifreni sıfırla",
    titleSignin: "Giriş yap",
    subReset: "E-postana yeni şifre belirleme bağlantısı gönderelim.",
    sub: "Projelerini kaydet, versiyonları sakla, canavarı her yerden aç.",
    tabs: { signin: "Giriş", signup: "Kayıt", magic: "Sihirli bağlantı" },
    email: "E-POSTA",
    emailPh: "sen@ornek.com",
    password: "ŞİFRE",
    forgot: "Şifremi unuttum",
    passwordPh: "En az 8 karakter",
    submit: { signin: "Giriş yap", signup: "Hesap oluştur", reset: "Sıfırlama bağlantısı gönder", magic: "Bağlantı gönder" },
    back: "← Girişe dön",
    legal: ["Devam ederek ", "Kullanım Koşulları", "'nı kabul etmiş ve ", "Gizlilik Politikası ve KVKK Aydınlatma Metni", "'ni okumuş olursun. Kayıt olmadan da ", "Studio'yu kullanabilirsin", "; hesap yalnızca kaydetme ve versiyon geçmişi için gerekir."],
    errors: {
      credentials: "E-posta veya şifre hatalı.",
      notConfirmed: "E-posta henüz doğrulanmamış. Gelen kutunuzdaki bağlantıya tıklayın.",
      registered: "Bu e-posta zaten kayıtlı. Giriş sekmesini kullanın.",
      rate: "Çok fazla deneme. Birkaç dakika sonra tekrar deneyin.",
      short: "Şifre en az 8 karakter olmalı.",
      expired: "Bağlantı geçersiz ya da süresi dolmuş. Yeni bir bağlantı isteyin.",
    },
  },
  en: {
    linkInvalid: "The link is invalid or has expired. Please try again.",
    notConfigured: "Accounts are not configured in this environment (NEXT_PUBLIC_SUPABASE_URL missing).",
    signupOk: "You're signed up. Click the confirmation link in your email and you'll be signed in automatically.",
    resetOk: "Password reset link sent. Click the link in your email to set a new password.",
    magicOk: "Magic link sent. Check your inbox (and the spam folder).",
    titleSignup: "Create your account",
    titleReset: "Reset your password",
    titleSignin: "Sign in",
    subReset: "We'll email you a link to set a new password.",
    sub: "Save your projects, keep versions and open the monster from anywhere.",
    tabs: { signin: "Sign in", signup: "Sign up", magic: "Magic link" },
    email: "EMAIL",
    emailPh: "you@example.com",
    password: "PASSWORD",
    forgot: "Forgot password?",
    passwordPh: "At least 8 characters",
    submit: { signin: "Sign in", signup: "Create account", reset: "Send reset link", magic: "Send link" },
    back: "← Back to sign in",
    legal: ["By continuing you agree to the ", "Terms of Service", " and confirm you have read the ", "Privacy Policy", ". You can also ", "use the Studio without an account", "; an account is only needed to save projects and versions."],
    errors: {
      credentials: "Wrong email or password.",
      notConfirmed: "Your email isn't confirmed yet. Click the link in your inbox.",
      registered: "This email is already registered. Use the Sign in tab.",
      rate: "Too many attempts. Please try again in a few minutes.",
      short: "The password must be at least 8 characters.",
      expired: "The link is invalid or has expired. Request a new one.",
    },
  },
} as const;

export function LoginForm({ next, initialError, initialMessage }: { next: string; initialError?: string; initialMessage?: string }) {
  const locale = useLocale();
  const c = COPY[locale];
  const translate = (m: string) => translateError(m, locale);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    initialError === "link" ? { kind: "err", text: initialMessage ? translateError(initialMessage, locale) : COPY[locale].linkInvalid } : null,
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
      setMsg({ kind: "err", text: translateError(err, locale) });
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
          setMsg({ kind: "err", text: translateError(error.message, locale) });
          setBusy(false);
        } else window.location.assign(next);
      });
  }, [next, locale]);

  if (!supabaseConfigured()) {
    return <p className="text-[13px] text-zinc-400">{c.notConfigured}</p>;
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
        track("login", { method: "password" });
        window.location.assign(next);
        return;
      }
      if (mode === "signup") {
        const source = clientSignupSource();
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo(), data: { lang: locale, ...(source ? { signup_source: source } : {}) } },
        });
        if (error) throw error;
        track("sign_up", { method: "password" });
        if (data.session) {
          window.location.assign(next);
          return;
        }
        setMsg({ kind: "ok", text: c.signupOk });
        return;
      }
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(lhref("/account/password", locale))}`,
        });
        if (error) throw error;
        setMsg({ kind: "ok", text: c.resetOk });
        return;
      }
      const source = clientSignupSource();
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo(), data: { lang: locale, ...(source ? { signup_source: source } : {}) } } });
      if (error) throw error;
      setMsg({ kind: "ok", text: c.magicOk });
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
          <h1 className="text-[18px] font-bold">{mode === "signup" ? c.titleSignup : mode === "reset" ? c.titleReset : c.titleSignin}</h1>
          <p className="text-[12px] text-zinc-500">{mode === "reset" ? c.subReset : c.sub}</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-ink-800 border border-ink-600 mb-4">
        {(
          [
            ["signin", c.tabs.signin],
            ["signup", c.tabs.signup],
            ["magic", c.tabs.magic],
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
          <span className="text-[11px] font-semibold tracking-widest text-zinc-400">{c.email}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 rounded-xl bg-ink-950 border border-ink-600 px-4 text-[14px] focus:border-ink-400 focus:outline-none"
            placeholder={c.emailPh}
          />
        </label>
        {mode !== "magic" && mode !== "reset" && (
          <label className="block space-y-1.5">
            <span className="text-[11px] font-semibold tracking-widest text-zinc-400 flex items-center justify-between">
              {c.password}
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setMsg(null);
                  }}
                  className="font-medium tracking-normal normal-case text-zinc-500 hover:text-white"
                >
                  {c.forgot}
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
              placeholder={c.passwordPh}
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
          {c.submit[mode]}
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
            {c.back}
          </button>
        )}
      </form>

      <p className="mt-6 text-[11px] text-zinc-600 leading-relaxed">
        {c.legal[0]}
        <Link href={lhref("/legal/terms", locale)} className="text-zinc-400 underline">
          {c.legal[1]}
        </Link>
        {c.legal[2]}
        <Link href={lhref("/legal/privacy", locale)} className="text-zinc-400 underline">
          {c.legal[3]}
        </Link>
        {c.legal[4]}
        <Link href={lhref("/studio", locale)} className="text-zinc-400 underline">
          {c.legal[5]}
        </Link>
        {c.legal[6]}
      </p>
    </div>
  );
}

function translateError(m: string, locale: Locale): string {
  const e = COPY[locale].errors;
  const s = m.toLowerCase();
  if (s.includes("invalid login credentials")) return e.credentials;
  if (s.includes("email not confirmed")) return e.notConfirmed;
  if (s.includes("user already registered")) return e.registered;
  if (s.includes("rate limit") || s.includes("too many")) return e.rate;
  if (s.includes("password should be")) return e.short;
  if (s.includes("invalid or has expired") || s.includes("otp_expired")) return e.expired;
  return m;
}
