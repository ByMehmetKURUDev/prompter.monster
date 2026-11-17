"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { lhref, type Locale } from "@/lib/i18n";
import { isValidUsername, USERNAME_MAX, USERNAME_MIN } from "@/lib/profile";

const COPY = {
  tr: {
    placeholder: "kullanici-adi",
    save: "Kaydet",
    view: "Profili gör",
    invalid: `${USERNAME_MIN}-${USERNAME_MAX} karakter, yalnızca a-z, 0-9 ve tire`,
    taken: "Bu kullanıcı adı alınmış, başka bir ad dene.",
    notReady: "Profiller henüz açılmadı, az sonra tekrar deneyin.",
  },
  en: {
    placeholder: "your-username",
    save: "Save",
    view: "View profile",
    invalid: `${USERNAME_MIN}-${USERNAME_MAX} characters, only a-z, 0-9 and hyphens`,
    taken: "That username is taken, try another one.",
    notReady: "Profiles aren't live yet, try again shortly.",
  },
} as const;

/** Hesap sayfasında satır içi düzenleme — ShareOwnerBar'ın busy/error deseniyle aynı. */
export function UsernameEditor({ initialUsername, locale }: { initialUsername: string | null; locale: Locale }) {
  const c = COPY[locale];
  const [username, setUsername] = useState(initialUsername ?? "");
  const [saved, setSaved] = useState(initialUsername ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const v = username.trim().toLowerCase();
    if (!isValidUsername(v)) {
      setErr(c.invalid);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/account/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: v }),
      });
      const body = (await r.json().catch(() => ({}))) as { username?: string; code?: string };
      if (!r.ok) {
        setErr(body.code === "username_taken" ? c.taken : body.code === "not_ready" ? c.notReady : body.code === "invalid_username" ? c.invalid : "error");
        return;
      }
      const next = body.username ?? v;
      setUsername(next);
      setSaved(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-500 text-[13px]">@</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder={c.placeholder}
          maxLength={USERNAME_MAX}
          className="h-8 min-w-0 flex-1 rounded-lg bg-ink-950 border border-ink-600 px-2 text-[13px] font-bold"
        />
        <button
          type="button"
          onClick={save}
          disabled={busy || username.trim().toLowerCase() === saved}
          className="h-8 px-2.5 rounded-lg bg-ink-950 border border-ink-600 text-[11px] text-zinc-300 hover:text-white disabled:opacity-40 inline-flex items-center gap-1 shrink-0"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden /> : <Check className="w-3 h-3" aria-hidden />}
          {c.save}
        </button>
      </div>
      {err && <p className="mt-1 text-[11px] text-red-400">{err}</p>}
      {!err && saved && (
        <Link href={lhref(`/u/${saved}`, locale)} target="_blank" className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-lime">
          {c.view} <ExternalLink className="w-3 h-3" aria-hidden />
        </Link>
      )}
    </div>
  );
}
